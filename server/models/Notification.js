import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'follow_request', 'follow_accept', 'mention'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  comment: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // Auto-delete after 90 days
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    
    // Populate sender info for real-time emission
    await notification.populate('sender', 'username fullName profilePicture isVerified');
    if (notification.post) {
      await notification.populate('post', 'media');
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to clean up duplicate follow request notifications
notificationSchema.statics.cleanupDuplicateFollowRequests = async function(recipientId, senderId) {
  try {
    // Find all follow request notifications from this sender to this recipient
    const notifications = await this.find({
      recipient: recipientId,
      sender: senderId,
      type: 'follow_request'
    }).sort({ createdAt: -1 });

    // If there are multiple notifications, keep only the latest one
    if (notifications.length > 1) {
      const notificationsToDelete = notifications.slice(1); // Keep the first (latest) one
      const idsToDelete = notificationsToDelete.map(n => n._id);
      
      await this.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Cleaned up ${idsToDelete.length} duplicate follow request notifications`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate notifications:', error);
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;