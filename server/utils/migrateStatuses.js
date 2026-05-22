/**
 * Migrate text statuses to numeric INT storage.
 * Run: node server/utils/migrateStatuses.js
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const PaymentTracker = require('../models/PaymentTracker');
const RequestInfo = require('../models/RequestInfo');
const {
  PAYMENT_TEXT_TO_CODE,
  RECRUITMENT_TEXT_TO_CODE,
  PAYMENT_STATUS,
  RECRUITMENT_STATUS,
} = require('./statusMaster');
const { syncPaymentTotals } = require('./paymentHelpers');

const migratePaymentTrackers = async () => {
  const records = await PaymentTracker.find({}).setOptions({ includeDeleted: true });
  let updated = 0;

  for (const doc of records) {
    let code = doc.status;
    if (typeof code === 'string') {
      code = PAYMENT_TEXT_TO_CODE[code] ?? PAYMENT_STATUS.PENDING;
    }
    code = Number(code);
    if (Number.isNaN(code)) code = PAYMENT_STATUS.PENDING;

    const synced = syncPaymentTotals({ ...doc.toObject(), status: code });
    doc.status = synced.status;
    doc.totalPaidAmount = synced.totalPaidAmount;
    doc.dueAmount = synced.dueAmount;
    await doc.save();
    updated += 1;
  }

  return updated;
};

const migrateRequestInfos = async () => {
  const records = await RequestInfo.find({}).setOptions({ includeDeleted: true });
  let updated = 0;

  for (const doc of records) {
    let changed = false;

    if (typeof doc.status === 'string') {
      doc.status = RECRUITMENT_TEXT_TO_CODE[doc.status] ?? RECRUITMENT_STATUS.VERIFIED;
      changed = true;
    } else {
      doc.status = Number(doc.status);
    }

    if (Array.isArray(doc.statusHistory)) {
      doc.statusHistory = doc.statusHistory.map((item) => {
        const entry = item.toObject ? item.toObject() : { ...item };
        if (typeof entry.status === 'string') {
          entry.status = RECRUITMENT_TEXT_TO_CODE[entry.status] ?? RECRUITMENT_STATUS.VERIFIED;
          changed = true;
        } else {
          entry.status = Number(entry.status);
        }
        return entry;
      });
    }

    if (changed || typeof doc.status === 'string') {
      await doc.save();
      updated += 1;
    }
  }

  return updated;
};

const run = async () => {
  try {
    await connectDB();
    const payments = await migratePaymentTrackers();
    const requestInfos = await migrateRequestInfos();
    process.stderr.write(
      `Status migration complete. PaymentTracker: ${payments}, RequestInfo: ${requestInfos}\n`
    );
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Status migration failed: ${error.message}\n`);
    process.exit(1);
  }
};

run();
