const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const query = { userId: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('data.jobId', 'title')
    .populate('data.fromUserId', 'name');

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ 
    userId: req.user._id, 
    isRead: false 
  });

  res.json({
    notifications,
    unreadCount,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

router.get('/unread-count', auth, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ 
    userId: req.user._id, 
    isRead: false 
  });

  res.json({ count });
}));

router.put('/:id/read', auth, asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({ message: 'Notification marked as read', notification });
}));

router.put('/read-all', auth, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({ message: 'All notifications marked as read' });
}));

router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ message: 'Notification deleted' });
}));

router.delete('/', auth, asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });

  res.json({ message: 'All notifications deleted' });
}));

const createNotification = async (io, userId, type, title, message, data = {}) => {
  const notification = new Notification({
    userId,
    type,
    title,
    message,
    data
  });

  await notification.save();

  io.to(userId.toString()).emit('notification', {
    id: notification._id,
    type,
    title,
    message,
    data,
    createdAt: notification.createdAt
  });

  return notification;
};

module.exports = router;
module.exports.createNotification = createNotification;
