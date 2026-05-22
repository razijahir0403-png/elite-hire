const paymentTrackerService = require('../services/paymentTrackerService');
const asyncHandler = require('../utils/asyncHandler');

const getPaymentTrackers = asyncHandler(async (req, res) => {
  const result = await paymentTrackerService.getPaymentTrackers(req.query);
  res.json(result);
});

const getPaymentSummary = asyncHandler(async (req, res) => {
  const summary = await paymentTrackerService.getPaymentSummary(req.query);
  res.json(summary);
});

const getPaymentTracker = asyncHandler(async (req, res) => {
  const record = await paymentTrackerService.getPaymentTrackerById(req.params.id);
  res.json(record);
});

const createPaymentTracker = asyncHandler(async (req, res) => {
  const record = await paymentTrackerService.createPaymentTracker(req.body, req.user.name);
  res.status(201).json(record);
});

const updatePaymentTracker = asyncHandler(async (req, res) => {
  const record = await paymentTrackerService.updatePaymentTrackerDetails(
    req.params.id,
    req.body,
    req.user.name
  );
  res.json(record);
});

const recordPayment = asyncHandler(async (req, res) => {
  const record = await paymentTrackerService.recordPaymentInstallment(
    req.params.id,
    req.body,
    req.user.name
  );
  res.json(record);
});

const deletePaymentTracker = asyncHandler(async (req, res) => {
  const result = await paymentTrackerService.softDeletePaymentTracker(
    req.params.id,
    req.user.name
  );
  res.json(result);
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const history = await paymentTrackerService.getPaymentHistory(req.params.id);
  res.json(history);
});

module.exports = {
  getPaymentTrackers,
  getPaymentSummary,
  getPaymentTracker,
  createPaymentTracker,
  updatePaymentTracker,
  recordPayment,
  deletePaymentTracker,
  getPaymentHistory,
};
