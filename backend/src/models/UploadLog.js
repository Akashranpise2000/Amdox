const mongoose = require('mongoose');

const uploadLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  totalRows: {
    type: Number,
    required: true
  },
  successRows: {
    type: Number,
    required: true
  },
  failedRows: {
    type: Number,
    required: true
  },
  errors: [{
    row: Number,
    reason: String,
    data: mongoose.Schema.Types.Mixed
  }],
  certificateIds: [{
    type: String
  }]
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

uploadLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('UploadLog', uploadLogSchema);
