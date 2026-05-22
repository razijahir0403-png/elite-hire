const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { paymentTrackerValidators } = require('../utils/validators');
const {
  getPaymentTrackers,
  getPaymentSummary,
  getPaymentTracker,
  createPaymentTracker,
  updatePaymentTracker,
  recordPayment,
  deletePaymentTracker,
  getPaymentHistory,
} = require('../controllers/paymentTrackerController');

router.use(protect);

router.get('/summary', paymentTrackerValidators.listQuery, validate, getPaymentSummary);
router.get('/history/:id', paymentTrackerValidators.idParam, validate, getPaymentHistory);
router.post(
  '/:id/payments',
  paymentTrackerValidators.recordPayment,
  validate,
  recordPayment
);

router.route('/')
  .get(paymentTrackerValidators.listQuery, validate, getPaymentTrackers)
  .post(paymentTrackerValidators.create, validate, createPaymentTracker);

router.route('/:id')
  .get(paymentTrackerValidators.idParam, validate, getPaymentTracker)
  .put(paymentTrackerValidators.updateDetails, validate, updatePaymentTracker)
  .delete(paymentTrackerValidators.idParam, validate, deletePaymentTracker);

module.exports = router;
