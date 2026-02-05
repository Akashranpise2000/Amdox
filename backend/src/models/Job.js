const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  qualifications: {
    type: String,
    required: [true, 'Qualifications are required'],
    maxlength: [3000, 'Qualifications cannot exceed 3000 characters']
  },
  responsibilities: {
    type: String,
    required: [true, 'Responsibilities are required'],
    maxlength: [3000, 'Responsibilities cannot exceed 3000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  salaryRange: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    default: 'full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'entry'
  },
  industry: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  companyName: {
    type: String,
    trim: true
  },
  companyLogo: {
    type: String
  },
  applicationDeadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

jobSchema.index({ employerId: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ industry: 1 });
jobSchema.index({ isFeatured: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
