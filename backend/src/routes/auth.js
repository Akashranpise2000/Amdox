const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['employer', 'seeker']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role
  });

  await user.save();

  const profile = new Profile({ userId: user._id });
  await profile.save();

  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
}));

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
}));

router.post('/logout', auth, asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profile = await Profile.findOne({ userId: req.user._id });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedJobs: user.savedJobs
    },
    profile
  });
}));

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ message: 'If an account exists, a password reset link has been sent' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  console.log('Password reset URL:', resetURL);

  res.json({ 
    message: 'If an account exists, a password reset link has been sent',
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
}));

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ error: 'Token is invalid or has expired' });
  }

  user.passwordHash = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ 
    message: 'Password reset successful',
    token
  });
}));

router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  user.passwordHash = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
}));

router.post('/saved-jobs/:jobId', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user.savedJobs.includes(req.params.jobId)) {
    return res.status(400).json({ error: 'Job already saved' });
  }

  user.savedJobs.push(req.params.jobId);
  await user.save();

  res.json({ message: 'Job saved successfully', savedJobs: user.savedJobs });
}));

router.delete('/saved-jobs/:jobId', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.savedJobs = user.savedJobs.filter(
    jobId => jobId.toString() !== req.params.jobId
  );
  await user.save();

  res.json({ message: 'Job removed from saved', savedJobs: user.savedJobs });
}));

router.get('/saved-jobs', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedJobs',
    populate: {
      path: 'employerId',
      select: 'name email'
    }
  });

  res.json(user.savedJobs);
}));

router.post('/admin-seed', asyncHandler(async (req, res) => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  
  if (existingAdmin) {
    return res.status(400).json({ error: 'Admin user already exists' });
  }

  const admin = new User({
    name: 'Admin',
    email: 'admin@amdox.com',
    passwordHash: 'admin123',
    role: 'admin'
  });

  await admin.save();

  const profile = new Profile({ userId: admin._id });
  await profile.save();

  res.status(201).json({ message: 'Admin user created', email: 'admin@amdox.com', password: 'admin123' });
}));

module.exports = router;
