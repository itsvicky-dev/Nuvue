import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Conversation participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Message content
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  text: {
    type: String,
    trim: true
  },
  
  // Media attachments
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file'],
      required: true
    },
    thumbnail: String,
    filename: String,
    size: Number,
    duration: Number // For audio/video
  }],
  
  // Message types
  messageType: {
    type: String,
    enum: ['text', 'media', 'post_share', 'story_share', 'voice', 'location', 'contact', 'system'],
    default: 'text'
  },
  
  // Shared content
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  sharedStory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  },
  
  // Location sharing
  location: {
    name: String,
    lat: Number,
    lng: Number,
    address: String
  },
  
  // Contact sharing
  contact: {
    name: String,
    phone: String,
    email: String
  },
  
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply to message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Forward from
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivery receipts
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message editing
  editedAt: Date,
  originalText: String,
  
  // Message deletion
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{ // User-specific deletion
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // System messages
  systemMessage: {
    type: {
      type: String,
      enum: ['user_joined', 'user_left', 'group_created', 'group_renamed', 'admin_changed']
    },
    data: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ participants: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for conversation ID (sorted participant IDs)
messageSchema.virtual('conversationId').get(function() {
  return this.participants.sort().join('_');
});

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    return true;
  }
  return false;
};

// Instance method to mark as delivered to user
messageSchema.methods.markAsDelivered = function(userId) {
  const alreadyDelivered = this.deliveredTo.some(delivery => delivery.user.toString() === userId.toString());
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({ user: userId });
    return true;
  }
  return false;
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(participantIds, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: { $all: participantIds },
    isDeleted: false
  })
  .populate('sender', 'username fullName profilePicture')
  .populate('replyTo', 'text sender')
  .populate('sharedPost', 'media caption author')
  .populate('reactions.user', 'username')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get user conversations
messageSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        participants: userId,
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: [{ $size: '$participants' }, 2] },
            { $arrayElemAt: [{ $filter: { input: '$participants', cond: { $ne: ['$$this', userId] } } }, 0] },
            '$participants'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender', userId] },
                  { $not: { $in: [userId, '$readBy.user'] } }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'participant',
        pipeline: [
          { $project: { username: 1, fullName: 1, profilePicture: 1, isVerified: 1 } }
        ]
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

export default mongoose.model('Message', messageSchema);