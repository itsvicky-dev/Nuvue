import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  caption: {
    type: String,
    maxlength: 2200,
    trim: true
  },
  
  // Media
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    thumbnail: String, // For videos
    duration: Number, // For videos in seconds
    width: Number,
    height: Number,
    size: Number // File size in bytes
  }],
  
  // Location
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  
  // Hashtags and Mentions
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Interactions
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 2200,
      trim: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: true,
        maxlength: 2200,
        trim: true
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  reach: {
    type: Number,
    default: 0
  },
  
  // Settings
  commentsDisabled: {
    type: Boolean,
    default: false
  },
  hideLikeCount: {
    type: Boolean,
    default: false
  },
  
  // Status
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  scheduledFor: Date,
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ location: '2dsphere' });
postSchema.index({ publishedAt: -1 });
postSchema.index({ caption: 'text' });

// Virtual for like count
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Pre-save middleware to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('caption') && this.caption) {
    // Extract hashtags
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [...this.caption.matchAll(hashtagRegex)].map(match => match[1].toLowerCase());
    this.hashtags = [...new Set(hashtags)]; // Remove duplicates
    
    // Extract mentions (you might want to validate these exist)
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const mentionUsernames = [...this.caption.matchAll(mentionRegex)].map(match => match[1].toLowerCase());
    // Note: You'd need to resolve these usernames to user IDs in the controller
  }
  next();
});

// Instance method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to add/remove like
postSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    // Unlike
    this.likes.splice(likeIndex, 1);
    return false;
  } else {
    // Like
    this.likes.push({ user: userId });
    return true;
  }
};

// Static method to get feed posts
postSchema.statics.getFeedPosts = function(userId, followingIds, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    author: { $in: [userId, ...followingIds] },
    isDeleted: false,
    isArchived: false,
    publishedAt: { $lte: new Date() }
  })
  .populate('author', 'username fullName profilePicture isVerified')
  .populate('likes.user', 'username')
  .populate('comments.user', 'username profilePicture')
  .sort({ publishedAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get explore posts
postSchema.statics.getExplorePosts = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.aggregate([
    {
      $match: {
        author: { $ne: userId },
        isDeleted: false,
        isArchived: false,
        publishedAt: { $lte: new Date() }
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $size: '$likes' },
            { $multiply: [{ $size: '$comments' }, 2] },
            { $divide: ['$views', 100] }
          ]
        }
      }
    },
    { $sort: { score: -1, publishedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          { $project: { username: 1, fullName: 1, profilePicture: 1, isVerified: 1 } }
        ]
      }
    },
    { $unwind: '$author' }
  ]);
};

export default mongoose.model('Post', postSchema);