const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { Stream } = require('stream');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload file to Cloudinary
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `amdox/${folder}`,
        public_id: publicId,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    const readableStream = new Stream();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// @route   GET /api/profile/:userId
// @desc    Get user profile
// @access  Private
router.get('/:userId', auth, asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.params.userId })
    .populate('userId', 'name email role');
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(profile);
}));

// @route   PUT /api/profile
// @desc    Update current user's profile
// @access  Private
router.put('/', auth, [
  body('bio').optional().isLength({ max: 2000 }),
  body('skills').optional().isArray(),
  body('companyName').optional().isString(),
  body('companyDescription').optional().isLength({ max: 2000 }),
  body('location').optional().isString(),
  body('phone').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let profile = await Profile.findOne({ userId: req.user._id });

  if (!profile) {
    profile = new Profile({ userId: req.user._id });
  }

  const allowedFields = [
    'bio', 'skills', 'experience', 'companyName', 'companyDescription',
    'location', 'phone', 'website'
  ];

  // Seeker fields
  if (req.user.role === 'seeker') {
    const seekerFields = ['bio', 'skills', 'experience'];
    seekerFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });
  }

  // Employer fields
  if (req.user.role === 'employer') {
    const employerFields = ['companyName', 'companyLogo', 'companyDescription', 'website'];
    employerFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });
  }

  // Shared fields
  sharedFields = ['location', 'phone'];
  sharedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      profile[field] = req.body[field];
    }
  });

  await profile.save();

  res.json({ message: 'Profile updated successfully', profile });
}));

// @route   POST /api/profile/resume
// @desc    Upload resume (seeker only)
// @access  Private
router.post('/resume', auth, requireRole('seeker'), upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Delete old resume if exists
  if (profile.resumePublicId) {
    try {
      await cloudinary.uploader.destroy(profile.resumePublicId);
    } catch (error) {
      console.error('Error deleting old resume:', error);
    }
  }

  // Upload new resume
  const publicId = `resume_${req.user._id}_${Date.now()}`;
  const result = await uploadToCloudinary(req.file.buffer, 'resumes', publicId);

  profile.resumeURL = result.secure_url;
  profile.resumePublicId = result.public_id;
  await profile.save();

  res.json({ 
    message: 'Resume uploaded successfully',
    resumeURL: result.secure_url
  });
}));

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', auth, asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(profile);
}));

module.exports = router;
