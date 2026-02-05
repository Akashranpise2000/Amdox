const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/', auth, requireRole('seeker'), [
  body('jobId').notEmpty().withMessage('Job ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { jobId, coverLetter } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (!job.isActive) {
    return res.status(400).json({ error: 'This job is no longer accepting applications' });
  }

  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.status(400).json({ error: 'Application deadline has passed' });
  }

  const existingApplication = await Application.findOne({
    jobId,
    seekerId: req.user._id
  });

  if (existingApplication) {
    return res.status(400).json({ error: 'You have already applied for this job' });
  }

  const profile = await Profile.findOne({ userId: req.user._id });

  const application = new Application({
    jobId,
    seekerId: req.user._id,
    coverLetter,
    resumeURL: profile?.resumeURL,
    statusHistory: [{
      status: 'pending',
      changedBy: req.user._id
    }]
  });

  await application.save();

  job.applicationCount += 1;
  await job.save();

  const io = req.app.get('io');
  
  const notification = new Notification({
    userId: job.employerId,
    type: 'application_received',
    title: 'New Application Received',
    message: `${req.user.name} applied for ${job.title}`,
    data: {
      jobId: job._id,
      applicationId: application._id,
      fromUserId: req.user._id
    }
  });
  await notification.save();

  io.to(job.employerId.toString()).emit('notification', {
    id: notification._id,
    type: 'application_received',
    title: notification.title,
    message: notification.message,
    data: notification.data,
    createdAt: notification.createdAt
  });

  res.status(201).json({ message: 'Application submitted successfully', application });
}));

router.get('/seeker', auth, requireRole('seeker'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = { seekerId: req.user._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const applications = await Application.find(query)
    .populate({
      path: 'jobId',
      select: 'title description location salaryRange jobType companyName companyLogo createdAt isActive'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Application.countDocuments(query);

  res.json({
    applications,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

router.get('/seeker/stats', auth, requireRole('seeker'), asyncHandler(async (req, res) => {
  const stats = await Application.aggregate([
    { $match: { seekerId: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const result = {
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  res.json(result);
}));

router.get('/job/:jobId', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to view applications for this job' });
  }

  const { status, page = 1, limit = 10 } = req.query;
  
  const query = { jobId: req.params.jobId };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const applications = await Application.find(query)
    .populate('seekerId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const applicationsWithProfiles = await Promise.all(
    applications.map(async (app) => {
      const profile = await Profile.findOne({ userId: app.seekerId._id });
      return {
        ...app.toObject(),
        seekerProfile: profile
      };
    })
  );

  const total = await Application.countDocuments(query);

  res.json({
    applications: applicationsWithProfiles,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

router.put('/:id/status', auth, requireRole('employer'), [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status, notes, interviewDate } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('jobId', 'employerId title');

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.jobId.employerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to update this application' });
  }

  application.status = status;
  application.statusHistory.push({
    status,
    changedBy: req.user._id,
    notes
  });

  if (interviewDate) {
    application.interviewDate = interviewDate;
  }

  await application.save();

  const io = req.app.get('io');
  
  const statusMessages = {
    reviewed: 'Your application has been reviewed',
    shortlisted: 'Congratulations! You have been shortlisted',
    interview: `You have been invited for an interview${interviewDate ? ` on ${new Date(interviewDate).toLocaleDateString()}` : ''}`,
    hired: 'Congratulations! You have been hired',
    rejected: 'Your application was not selected'
  };

  const notification = new Notification({
    userId: application.seekerId,
    type: status === 'interview' ? 'interview_request' : 'application_status',
    title: 'Application Status Update',
    message: statusMessages[status] || `Your application status has been updated to: ${status}`,
    data: {
      jobId: application.jobId._id,
      applicationId: application._id
    }
  });
  await notification.save();

  io.to(application.seekerId.toString()).emit('notification', {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    createdAt: notification.createdAt
  });

  res.json({ message: 'Status updated successfully', application });
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId', 'title description location salaryRange jobType employerId companyName')
    .populate('seekerId', 'name email');

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const isSeeker = application.seekerId._id.toString() === req.user._id.toString();
  const isEmployer = application.jobId.employerId.toString() === req.user._id.toString();

  if (!isSeeker && !isEmployer && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to view this application' });
  }

  let seekerProfile = null;
  if (isEmployer || req.user.role === 'admin') {
    seekerProfile = await Profile.findOne({ userId: application.seekerId._id });
  }

  res.json({ application, seekerProfile });
}));

router.delete('/:id', auth, requireRole('seeker'), asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    seekerId: req.user._id
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot withdraw application after it has been reviewed' });
  }

  const job = await Job.findById(application.jobId);
  if (job) {
    job.applicationCount = Math.max(0, job.applicationCount - 1);
    await job.save();
  }

  await Application.findByIdAndDelete(req.params.id);

  res.json({ message: 'Application withdrawn successfully' });
}));

module.exports = router;
