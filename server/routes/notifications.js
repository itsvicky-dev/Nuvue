import express from 'express';
import { auth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'username fullName profilePicture isVerified')
      .populate('post', 'media')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.userId);

    res.json({ 
      notifications: notifications.map(notif => ({
        _id: notif._id,
        id: notif._id,
        type: notif.type,
        message: notif.message,
        from: notif.sender,
        post: notif.post,
        comment: notif.comment,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
        timestamp: notif.createdAt
      })),
      unreadCount,
      hasMore: notifications.length === limit
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.userId);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    // Get updated unread count
    const unreadCount = await Notification.getUnreadCount(req.userId);

    res.json({ 
      message: 'Notification marked as read',
      unreadCount 
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      recipient: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to create and emit notification
export const createNotification = async (io, data) => {
  try {
    // Create notification in database
    const notification = await Notification.createNotification(data);
    
    // Emit real-time notification
    if (io) {
      io.to(`user_${data.recipient}`).emit('notification', {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        from: notification.sender,
        post: notification.post,
        comment: notification.comment,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        timestamp: notification.createdAt
      });
      
      // Emit unread count update
      const unreadCount = await Notification.getUnreadCount(data.recipient);
      io.to(`user_${data.recipient}`).emit('unreadCount', { count: unreadCount });
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export default router;