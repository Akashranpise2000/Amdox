const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/seeker', auth, requireRole('seeker'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profile = await Profile.findOne({ userId: req.user._id });

  const applicationStats = await Application.aggregate([
    { $match: { seekerId: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const stats = {
    totalApplications: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0
  };

  applicationStats.forEach(s => {
    stats[s._id] = s.count;
    stats.totalApplications += s.count;
  });

  stats.savedJobs = user.savedJobs?.length || 0;

  const recentApplications = await Application.find({ seekerId: req.user._id })
    .populate('jobId', 'title companyName location')
    .sort({ createdAt: -1 })
    .limit(5);

  const unreadNotifications = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false
  });

  const profileCompletion = calculateProfileCompletion(profile, 'seeker');

  res.json({
    stats,
    recentApplications,
    unreadNotifications,
    profileCompletion,
    profile
  });
}));

router.get('/employer', auth, requireRole('employer'), asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });

  const jobStats = await Job.aggregate([
    { $match: { employerId: req.user._id } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        activeJobs: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalApplications: { $sum: '$applicationCount' },
        totalViews: { $sum: '$viewCount' }
      }
    }
  ]);

  const stats = jobStats[0] || {
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalViews: 0
  };

  const applicationsByStatus = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    { $match: { 'job.employerId': req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  stats.applicationsByStatus = {};
  applicationsByStatus.forEach(s => {
    stats.applicationsByStatus[s._id] = s.count;
  });

  const recentJobs = await Job.find({ employerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  const recentApplications = await Application.find()
    .populate({
      path: 'jobId',
      match: { employerId: req.user._id },
      select: 'title'
    })
    .populate('seekerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  const filteredApplications = recentApplications.filter(app => app.jobId);

  const unreadNotifications = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false
  });

  const profileCompletion = calculateProfileCompletion(profile, 'employer');

  res.json({
    stats,
    recentJobs,
    recentApplications: filteredApplications,
    unreadNotifications,
    profileCompletion,
    profile
  });
}));

router.get('/admin', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalSeekers = await User.countDocuments({ role: 'seeker' });
  const totalEmployers = await User.countDocuments({ role: 'employer' });
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ isActive: true });
  const totalApplications = await Application.countDocuments();

  const recentUsers = await User.find()
    .select('name email role createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentJobs = await Job.find()
    .populate('employerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  const applicationsByStatus = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 30 }
  ]);

  res.json({
    stats: {
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalJobs,
      activeJobs,
      totalApplications
    },
    applicationsByStatus,
    recentUsers,
    recentJobs,
    userGrowth
  });
}));

router.get('/activity', auth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let activity = [];

  if (req.user.role === 'seeker') {
    const applications = await Application.find({ seekerId: req.user._id })
      .populate('jobId', 'title companyName')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    activity = applications.map(app => ({
      type: 'application',
      action: app.status === 'pending' ? 'applied' : `status_${app.status}`,
      job: app.jobId,
      date: app.updatedAt
    }));
  } else if (req.user.role === 'employer') {
    const jobs = await Job.find({ employerId: req.user._id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    activity = jobs.map(job => ({
      type: 'job',
      action: 'posted',
      job: { title: job.title, _id: job._id },
      applicationCount: job.applicationCount,
      date: job.createdAt
    }));
  }

  res.json({ activity });
}));

function calculateProfileCompletion(profile, role) {
  if (!profile) return 0;

  let fields = [];
  let completed = 0;

  if (role === 'seeker') {
    fields = ['bio', 'skills', 'experience', 'resumeURL', 'location', 'phone'];
  } else if (role === 'employer') {
    fields = ['companyName', 'companyDescription', 'companyLogo', 'website', 'location', 'phone'];
  }

  fields.forEach(field => {
    if (profile[field]) {
      if (Array.isArray(profile[field])) {
        if (profile[field].length > 0) completed++;
      } else {
        completed++;
      }
    }
  });

  return Math.round((completed / fields.length) * 100);
}

module.exports = router;
