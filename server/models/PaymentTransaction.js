const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTracker',
      required: true,
      index: true,
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0.01, 'Paid amount must be greater than zero'],
    },
    previousTotalPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedTotalPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    previousDue: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedDue: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'paymenttransactions',
  }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
