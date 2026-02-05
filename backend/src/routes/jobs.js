const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const { auth, requireRole, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', optionalAuth, [
  query('keyword').optional().isString(),
  query('type').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'remote']),
  query('location').optional().isString(),
  query('minSalary').optional().isNumeric(),
  query('maxSalary').optional().isNumeric(),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']),
  query('industry').optional().isString(),
  query('skills').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['createdAt', 'salaryRange.min', 'applicationCount']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    keyword, type, location, minSalary, maxSalary, 
    experienceLevel, industry, skills,
    page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' 
  } = req.query;

  const queryObj = { isActive: true };

  if (keyword) {
    queryObj.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { skills: { $regex: keyword, $options: 'i' } }
    ];
  }

  if (type) queryObj.jobType = type;
  if (location) queryObj.location = { $regex: location, $options: 'i' };
  if (experienceLevel) queryObj.experienceLevel = experienceLevel;
  if (industry) queryObj.industry = { $regex: industry, $options: 'i' };

  if (skills) {
    const skillsArray = skills.split(',').map(s => s.trim());
    queryObj.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
  }

  if (minSalary) queryObj['salaryRange.min'] = { $gte: parseInt(minSalary) };
  if (maxSalary) queryObj['salaryRange.max'] = { $lte: parseInt(maxSalary) };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const jobs = await Job.find(queryObj)
    .populate('employerId', 'name email')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Job.countDocuments(queryObj);

  res.json({
    jobs,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isActive: true, isFeatured: true })
    .populate('employerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(6);

  res.json(jobs);
}));

router.get('/recent', asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isActive: true })
    .populate('employerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(jobs);
}));

router.get('/my-listings', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employerId: req.user._id })
    .sort({ createdAt: -1 });

  res.json(jobs);
}));

router.get('/stats', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const totalJobs = await Job.countDocuments({ employerId: req.user._id });
  const activeJobs = await Job.countDocuments({ employerId: req.user._id, isActive: true });
  const totalApplications = await Job.aggregate([
    { $match: { employerId: req.user._id } },
    { $group: { _id: null, total: { $sum: '$applicationCount' } } }
  ]);
  const totalViews = await Job.aggregate([
    { $match: { employerId: req.user._id } },
    { $group: { _id: null, total: { $sum: '$viewCount' } } }
  ]);

  res.json({
    totalJobs,
    activeJobs,
    totalApplications: totalApplications[0]?.total || 0,
    totalViews: totalViews[0]?.total || 0
  });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('employerId', 'name email');

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  job.viewCount += 1;
  await job.save();

  const profile = await Profile.findOne({ userId: job.employerId._id });

  res.json({ job, employerProfile: profile });
}));

router.post('/', auth, requireRole('employer'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('qualifications').trim().notEmpty().withMessage('Qualifications are required'),
  body('responsibilities').trim().notEmpty().withMessage('Responsibilities are required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'remote']).withMessage('Invalid job type'),
  body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']),
  body('salaryRange.min').optional().isNumeric(),
  body('salaryRange.max').optional().isNumeric(),
  body('skills').optional().isArray(),
  body('benefits').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const profile = await Profile.findOne({ userId: req.user._id });

  const job = new Job({
    ...req.body,
    employerId: req.user._id,
    companyName: profile?.companyName || req.user.name,
    companyLogo: profile?.companyLogo
  });

  await job.save();

  res.status(201).json({ message: 'Job created successfully', job });
}));

router.put('/:id', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to edit this job' });
  }

  const allowedUpdates = [
    'title', 'description', 'qualifications', 'responsibilities',
    'location', 'salaryRange', 'jobType', 'experienceLevel',
    'industry', 'skills', 'benefits', 'applicationDeadline', 'isActive'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();

  res.json({ message: 'Job updated successfully', job });
}));

router.delete('/:id', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to delete this job' });
  }

  job.isActive = false;
  await job.save();

  res.json({ message: 'Job deleted successfully' });
}));

module.exports = router;
