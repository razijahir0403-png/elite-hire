const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDeletePlugin');

const paymentTrackerSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      unique: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be positive'],
    },
    totalPaidAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    courseDetail: {
      type: String,
      required: [true, 'Course detail is required'],
      trim: true,
    },
    status: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },
    lastPaymentDate: {
      type: Date,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Legacy field — read-only fallback for older records
    receivedAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'paymenttrackers',
  }
);

paymentTrackerSchema.plugin(softDeletePlugin);

paymentTrackerSchema.pre('save', function (next) {
  const { syncPaymentTotals } = require('../utils/paymentHelpers');
  const synced = syncPaymentTotals(this);
  this.totalAmount = synced.totalAmount;
  this.totalPaidAmount = synced.totalPaidAmount;
  this.dueAmount = synced.dueAmount;
  this.status = synced.status;
  next();
});

module.exports = mongoose.model('PaymentTracker', paymentTrackerSchema);
