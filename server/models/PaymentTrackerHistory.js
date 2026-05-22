const mongoose = require('mongoose');

const paymentTrackerHistorySchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTracker',
      required: true,
      index: true,
    },
    previousReceivedAmount: {
      type: Number,
      required: true,
    },
    newReceivedAmount: {
      type: Number,
      required: true,
    },
    previousDueAmount: {
      type: Number,
      required: true,
    },
    newDueAmount: {
      type: Number,
      required: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'paymenttrackerhistories',
  }
);

module.exports = mongoose.model('PaymentTrackerHistory', paymentTrackerHistorySchema);
