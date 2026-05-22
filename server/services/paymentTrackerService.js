const PaymentTracker = require('../models/PaymentTracker');
const PaymentTransaction = require('../models/PaymentTransaction');
const AppError = require('../utils/AppError');
const {
  calculateDueAmount,
  calculatePaymentStatus,
  getTotalPaidAmount,
  syncPaymentTotals,
  roundMoney,
  validateContactNumber,
  validateNewPaymentAmount,
  validateInitialPaymentAmount,
} = require('../utils/paymentHelpers');
const { toPaymentStatusCode } = require('../utils/statusMaster');

const normalizePaymentRecord = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const synced = syncPaymentTotals(obj);
  Object.assign(obj, synced);
  obj.status = synced.status;
  return obj;
};

const persistSyncedTotalsIfStale = async (doc, normalized) => {
  const id = doc._id;
  if (!id) return;

  const storedStatus = doc.status;
  const storedDue = roundMoney(doc.dueAmount);
  const storedPaid = getTotalPaidAmount(doc);

  if (
    storedStatus !== normalized.status ||
    storedDue !== normalized.dueAmount ||
    storedPaid !== normalized.totalPaidAmount
  ) {
    await PaymentTracker.updateOne(
      { _id: id },
      {
        $set: {
          status: normalized.status,
          dueAmount: normalized.dueAmount,
          totalPaidAmount: normalized.totalPaidAmount,
        },
      }
    );
  }
};

const buildListQuery = ({
  search = '',
  searchCandidate = '',
  searchIdNumber = '',
  status = '',
  dateFrom = '',
  dateTo = '',
}) => {
  const query = { isDeleted: { $ne: true } };

  const candidateTerm = searchCandidate || search;
  const idTerm = searchIdNumber;

  if (candidateTerm && idTerm) {
    query.$and = [
      { candidateName: { $regex: candidateTerm, $options: 'i' } },
      { idNumber: { $regex: idTerm, $options: 'i' } },
    ];
  } else if (candidateTerm) {
    query.candidateName = { $regex: candidateTerm, $options: 'i' };
  } else if (idTerm) {
    query.idNumber = { $regex: idTerm, $options: 'i' };
  } else if (search) {
    query.$or = [
      { candidateName: { $regex: search, $options: 'i' } },
      { idNumber: { $regex: search, $options: 'i' } },
      { contactNumber: { $regex: search, $options: 'i' } },
      { courseDetail: { $regex: search, $options: 'i' } },
    ];
  }

  if (status !== '' && status !== undefined && status !== null) {
    query.status = toPaymentStatusCode(status);
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  return query;
};

const applyTotals = (record) => {
  const synced = syncPaymentTotals(record);
  Object.assign(record, synced);
  return record;
};

const recordPaymentTransaction = async (record, paidAmount, editorName, remarks = '') => {
  const previousTotalPaid = getTotalPaidAmount(record);
  const previousDue = calculateDueAmount(record.totalAmount, previousTotalPaid);
  const updatedTotalPaid = roundMoney(previousTotalPaid + paidAmount);
  const updatedDue = calculateDueAmount(record.totalAmount, updatedTotalPaid);

  await PaymentTransaction.create({
    paymentId: record._id,
    paidAmount,
    previousTotalPaid,
    updatedTotalPaid,
    previousDue,
    updatedDue,
    paymentDate: new Date(),
    remarks: remarks || '',
    createdBy: editorName,
  });

  record.totalPaidAmount = updatedTotalPaid;
  record.dueAmount = updatedDue;
  record.status = calculatePaymentStatus(record.totalAmount, updatedTotalPaid);
  record.lastPaymentDate = new Date();
  record.updatedBy = editorName;

  await record.save();
  return normalizePaymentRecord(record);
};

const getPaymentTrackers = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    searchCandidate = '',
    searchIdNumber = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const query = buildListQuery({
    search,
    searchCandidate,
    searchIdNumber,
    status,
    dateFrom,
    dateTo,
  });

  const allowedSortFields = [
    'createdAt',
    'lastPaymentDate',
    'candidateName',
    'idNumber',
    'totalAmount',
    'totalPaidAmount',
    'dueAmount',
    'status',
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

  const [records, totalRecords] = await Promise.all([
    PaymentTracker.find(query).sort(sort).skip(skip).limit(limitNum),
    PaymentTracker.countDocuments(query),
  ]);

  const normalizedRecords = [];
  for (const doc of records) {
    const normalized = normalizePaymentRecord(doc);
    await persistSyncedTotalsIfStale(doc, normalized);
    normalizedRecords.push(normalized);
  }

  return {
    records: normalizedRecords,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRecords / limitNum) || 1,
      totalRecords,
    },
  };
};

const getPaymentSummary = async (filterParams) => {
  const query = buildListQuery(filterParams);
  const result = await PaymentTracker.aggregate([
    { $match: query },
    {
      $addFields: {
        effectivePaid: { $ifNull: ['$totalPaidAmount', { $ifNull: ['$receivedAmount', 0] }] },
        effectiveDue: {
          $max: [
            0,
            { $subtract: ['$totalAmount', { $ifNull: ['$totalPaidAmount', { $ifNull: ['$receivedAmount', 0] }] }] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCandidates: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalReceived: { $sum: '$effectivePaid' },
        totalDue: { $sum: '$effectiveDue' },
      },
    },
  ]);

  const summary = result[0] || {
    totalCandidates: 0,
    totalAmount: 0,
    totalReceived: 0,
    totalDue: 0,
  };

  return {
    totalCandidates: summary.totalCandidates,
    totalAmount: summary.totalAmount,
    totalReceived: summary.totalReceived,
    totalDue: summary.totalDue,
  };
};

const getPaymentTrackerById = async (id) => {
  const record = await PaymentTracker.findById(id);
  if (!record) {
    throw new AppError('Payment record not found', 404);
  }
  return normalizePaymentRecord(record);
};

const ensureUniqueIdNumber = async (idNumber, excludeId = null) => {
  const query = { idNumber: idNumber.trim(), isDeleted: { $ne: true } };
  if (excludeId) query._id = { $ne: excludeId };
  const exists = await PaymentTracker.findOne(query);
  if (exists) {
    throw new AppError('ID number already exists', 400);
  }
};

const createPaymentTracker = async (body, editorName) => {
  const contactError = validateContactNumber(body.contactNumber);
  if (contactError) throw new AppError(contactError, 400);

  const initialPaymentAmount = Number(body.initialPaymentAmount) || 0;
  const amountError = validateInitialPaymentAmount(body.totalAmount, initialPaymentAmount);
  if (amountError) throw new AppError(amountError, 400);

  if (initialPaymentAmount > 0) {
    const dueBeforeFirst = Number(body.totalAmount);
    const newPayError = validateNewPaymentAmount(initialPaymentAmount, dueBeforeFirst);
    if (newPayError) throw new AppError(newPayError, 400);
  }

  await ensureUniqueIdNumber(body.idNumber);

  const totalAmount = Number(body.totalAmount);
  const totalPaidAmount = initialPaymentAmount;
  const dueAmount = calculateDueAmount(totalAmount, totalPaidAmount);
  const status = calculatePaymentStatus(totalAmount, totalPaidAmount);

  const record = await PaymentTracker.create({
    candidateName: body.candidateName.trim(),
    idNumber: body.idNumber.trim(),
    contactNumber: String(body.contactNumber).replace(/\D/g, ''),
    courseDetail: body.courseDetail.trim(),
    totalAmount,
    totalPaidAmount,
    dueAmount,
    status,
    lastPaymentDate: initialPaymentAmount > 0 ? new Date() : undefined,
    createdBy: editorName,
    updatedBy: editorName,
    isActive: true,
  });

  if (initialPaymentAmount > 0) {
    await PaymentTransaction.create({
      paymentId: record._id,
      paidAmount: initialPaymentAmount,
      previousTotalPaid: 0,
      updatedTotalPaid: initialPaymentAmount,
      previousDue: totalAmount,
      updatedDue: dueAmount,
      paymentDate: new Date(),
      remarks: body.remarks || 'Initial payment',
      createdBy: editorName,
    });
  }

  return normalizePaymentRecord(record);
};

const updatePaymentTrackerDetails = async (id, body, editorName) => {
  const record = await PaymentTracker.findById(id);
  if (!record) {
    throw new AppError('Payment record not found', 404);
  }

  if (body.idNumber && body.idNumber.trim() !== record.idNumber) {
    await ensureUniqueIdNumber(body.idNumber, id);
    record.idNumber = body.idNumber.trim();
  }

  if (body.candidateName) record.candidateName = body.candidateName.trim();
  if (body.contactNumber) {
    const contactError = validateContactNumber(body.contactNumber);
    if (contactError) throw new AppError(contactError, 400);
    record.contactNumber = String(body.contactNumber).replace(/\D/g, '');
  }
  if (body.courseDetail) record.courseDetail = body.courseDetail.trim();

  record.updatedBy = editorName;
  applyTotals(record);
  await record.save();

  return normalizePaymentRecord(record);
};

const recordPaymentInstallment = async (id, body, editorName) => {
  const record = await PaymentTracker.findById(id);
  if (!record) {
    throw new AppError('Payment record not found', 404);
  }

  applyTotals(record);
  const currentDue = record.dueAmount;

  if (currentDue <= 0) {
    throw new AppError('Payment is already fully paid. No due amount remaining.', 400);
  }

  const newPaymentAmount = Number(body.newPaymentAmount);
  const paymentError = validateNewPaymentAmount(newPaymentAmount, currentDue);
  if (paymentError) throw new AppError(paymentError, 400);

  return recordPaymentTransaction(record, newPaymentAmount, editorName, body.remarks || '');
};

const softDeletePaymentTracker = async (id, editorName) => {
  const record = await PaymentTracker.findById(id);
  if (!record) {
    throw new AppError('Payment record not found', 404);
  }
  record.isActive = false;
  record.updatedBy = editorName;
  await record.softDelete();
  return { message: 'Payment record archived successfully (soft delete)' };
};

const getPaymentHistory = async (id) => {
  const record = await PaymentTracker.findById(id);
  if (!record) {
    throw new AppError('Payment record not found', 404);
  }

  const transactions = await PaymentTransaction.find({ paymentId: id }).sort({ paymentDate: -1 });

  return transactions.map((tx) => ({
    _id: tx._id,
    paymentDate: tx.paymentDate,
    paidAmount: tx.paidAmount,
    paidNow: tx.paidAmount,
    totalPaid: tx.updatedTotalPaid,
    previousTotalPaid: tx.previousTotalPaid,
    updatedTotalPaid: tx.updatedTotalPaid,
    due: tx.updatedDue,
    previousDue: tx.previousDue,
    updatedDue: tx.updatedDue,
    remarks: tx.remarks,
    createdBy: tx.createdBy,
    createdAt: tx.createdAt,
  }));
};

module.exports = {
  getPaymentTrackers,
  getPaymentSummary,
  getPaymentTrackerById,
  createPaymentTracker,
  updatePaymentTrackerDetails,
  recordPaymentInstallment,
  softDeletePaymentTracker,
  getPaymentHistory,
};
