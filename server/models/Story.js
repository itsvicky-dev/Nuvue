import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Media (optional for text-only stories)
  media: {
    url: String,
    type: {
      type: String,
      enum: ['image', 'video']
    },
    thumbnail: String, // For videos
    duration: Number, // For videos in seconds
    width: Number,
    height: Number,
    size: Number
  },
  
  // Content
  text: String,
  
  // Styling (for text stories or overlays)
  textStyle: {
    color: String,
    backgroundColor: String,
    fontSize: String,
    fontFamily: String,
    position: {
      x: Number,
      y: Number
    },
    rotation: Number
  },
  
  // Interactive Elements
  polls: [{
    question: String,
    options: [String],
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      option: Number,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  questions: [{
    question: String,
    answers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      answer: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  music: {
    title: String,
    artist: String,
    url: String,
    startTime: Number,
    duration: Number
  },
  
  // Location
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  
  // Mentions
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      x: Number,
      y: Number
    }
  }],
  
  // Hashtags
  hashtags: [{
    tag: String,
    position: {
      x: Number,
      y: Number
    }
  }],
  
  // Interactions
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
  
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    media: {
      url: String,
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Privacy Settings
  visibility: {
    type: String,
    enum: ['public', 'close_friends', 'custom'],
    default: 'public'
  },
  
  allowedViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Story Highlights
  isHighlight: {
    type: Boolean,
    default: false
  },
  highlightCategory: String,
  
  // Expiration
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  
  // Status
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save validation
storySchema.pre('save', function(next) {
  // Ensure either media or text is present
  if (!this.media?.url && !this.text) {
    return next(new Error('Story must have either media or text content'));
  }
  next();
});

// Indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ isDeleted: 1, expiresAt: 1 });

// Virtual for views count
storySchema.virtual('viewsCount').get(function() {
  return this.views.length;
});

// Virtual for likes count
storySchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for replies count
storySchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Instance method to check if user has viewed the story
storySchema.methods.isViewedBy = function(userId) {
  return this.views.some(view => view.user.toString() === userId.toString());
};

// Instance method to add view
storySchema.methods.addView = function(userId) {
  if (!this.isViewedBy(userId)) {
    this.views.push({ user: userId });
    return true;
  }
  return false;
};

// Instance method to check if user liked the story
storySchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to toggle like
storySchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return false;
  } else {
    this.likes.push({ user: userId });
    return true;
  }
};

// Static method to get stories for feed
storySchema.statics.getFeedStories = function(userId, followingIds) {
  // Include the current user's own stories along with followed users' stories
  const authorIds = [...followingIds];
  if (!authorIds.includes(userId)) {
    authorIds.push(userId);
  }
  
  return this.aggregate([
    {
      $match: {
        author: { $in: authorIds },
        isDeleted: false,
        expiresAt: { $gt: new Date() }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$author',
        stories: { $push: '$$ROOT' },
        latestStory: { $first: '$$ROOT' },
        totalStories: { $sum: 1 },
        hasUnseenStories: {
          $sum: {
            $cond: [
              { $not: { $in: [userId, '$views.user'] } },
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
        as: 'author',
        pipeline: [
          { $project: { username: 1, fullName: 1, profilePicture: 1, isVerified: 1 } }
        ]
      }
    },
    { $unwind: '$author' },
    {
      $addFields: {
        // Use the author info and story info for the preview
        username: '$author.username',
        profilePicture: '$author.profilePicture',
        isVerified: '$author.isVerified',
        fullName: '$author.fullName',
        // Add a flag to indicate if this user has unseen stories
        hasUnseen: { $gt: ['$hasUnseenStories', 0] }
      }
    },
    {
      $sort: { hasUnseen: -1, 'latestStory.createdAt': -1 }
    }
  ]);
};

// Static method to get user's own stories
storySchema.statics.getUserStories = function(userId) {
  return this.find({
    author: userId,
    isDeleted: false,
    expiresAt: { $gt: new Date() }
  })
  .populate('views.user', 'username profilePicture')
  .populate('likes.user', 'username profilePicture')
  .populate('replies.user', 'username profilePicture')
  .sort({ createdAt: -1 });
};

export default mongoose.model('Story', storySchema);