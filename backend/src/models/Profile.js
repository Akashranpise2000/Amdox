const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String }
});

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Seeker fields
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [experienceSchema],
  resumeURL: {
    type: String
  },
  resumePublicId: {
    type: String
  },
  // Employer fields
  companyName: {
    type: String
  },
  companyLogo: {
    type: String
  },
  companyLogoPublicId: {
    type: String
  },
  website: {
    type: String,
    match: [/^https?:\/\//, 'Website must start with http:// or https://']
  },
  companyDescription: {
    type: String,
    maxlength: [2000, 'Company description cannot exceed 2000 characters']
  },
  // Shared fields
  location: {
    type: String
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-]+$/, 'Please enter a valid phone number']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
