const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDeletePlugin');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: Number,
      required: true,
      min: 0,
      max: 16,
    },
    description: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const requestInfoSchema = new mongoose.Schema(
  {
    idnumber: {
      type: String,
      required: [true, 'Please provide an ID number'],
      unique: true,
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Please provide a domain'],
      trim: true,
    },
    salaryPackage: {
      type: String,
      required: [true, 'Please provide a salary package'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Please provide a contact number'],
      trim: true,
    },
    resourcePerson: {
      type: String,
      required: [true, 'Please provide a resource person name'],
      trim: true,
    },
    portalLink: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      required: [true, 'Please choose a status'],
      default: 0,
      min: 0,
      max: 16,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    collection: 'requestinfos',
  }
);

requestInfoSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('RequestInfo', requestInfoSchema);
