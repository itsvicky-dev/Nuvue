import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Reel from '../models/Reel.js';
import User from '../models/User.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Get all reels (for reels feed)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get user's following list if authenticated
    let followingIds = [];
    if (req.userId) {
      const user = await User.findById(req.userId).select('following');
      followingIds = user ? user.following : [];
    }

    const reels = await Reel.aggregate([
      {
        $match: { 
          isDeleted: { $ne: true },
          isArchived: { $ne: true }
        }
      },
      // Join with users to check privacy settings
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: '$authorInfo' },
      // Filter based on privacy settings
      {
        $match: {
          $or: [
            { 'authorInfo.isPrivate': false }, // Public reels
            { 'author': new mongoose.Types.ObjectId(req.userId || '000000000000000000000000') }, // Own reels
            { 
              $and: [
                { 'authorInfo.isPrivate': true },
                { 'authorInfo.followers': { $in: [new mongoose.Types.ObjectId(req.userId || '000000000000000000000000')] } }
              ]
            } // Private reels from followed users
          ]
        }
      },
      { $sort: { createdAt: -1 } },
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

    // Transform reels to include like status and fix video URLs
    const transformedReels = reels.map(reel => {
      const reelObj = reel.toObject();
      return {
        ...reelObj,
        video: {
          ...reelObj.video,
          url: fixVideoUrl(reelObj.video.url, req)
        },
        isLikedBy: req.userId ? reel.isLikedBy(req.userId) : false,
        isSaved: req.userId ? false : false // Will be handled by checking user's savedReels
      };
    });

    // If user is authenticated, check which reels are saved
    if (req.userId) {
      const user = await User.findById(req.userId).select('savedReels');
      if (user) {
        transformedReels.forEach(reel => {
          reel.isSaved = user.savedReels.includes(reel._id);
        });
      }
    }

    res.json({ 
      reels: transformedReels,
      hasMore: reels.length === limit,
      page,
      totalPages: Math.ceil(await Reel.countDocuments({ isDeleted: { $ne: true } }) / limit)
    });
  } catch (error) {
    console.error('Get all reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to convert local paths to full URLs
const fixVideoUrl = (url, req) => {
  if (!url) return '';
  
  // If URL already starts with http, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Convert Windows paths to URL format
  let fixedUrl = url.replace(/\\/g, '/');
  
  // Remove leading slash if present to avoid double slashes
  fixedUrl = fixedUrl.replace(/^\/+/, '');
  
  // Create full URL - use localhost:5000 as fallback
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';
  const fullUrl = `${baseUrl}/${fixedUrl}`;
  
  console.log('Video URL Transformation:', { original: url, fixed: fullUrl });
  
  return fullUrl;
};

// Create a new reel
router.post('/', auth, upload.single('video'), handleUploadError, [
  body('caption').optional().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    console.log('Reel creation request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required for reels' });
    }

    // Check if file is a video
    if (!req.file.mimetype.startsWith('video')) {
      return res.status(400).json({ message: 'Only video files are allowed for reels' });
    }

    const { caption, location, audio } = req.body;
    
    // Convert local file path to URL
    let videoUrl = req.file.path;
    if (!videoUrl.startsWith('http')) {
      videoUrl = videoUrl.replace(/\\/g, '/');
      videoUrl = videoUrl.replace(/^\/+/, '');
      videoUrl = `${req.protocol}://${req.get('host')}/${videoUrl}`;
    }

    const reel = new Reel({
      author: req.userId,
      caption,
      video: {
        url: videoUrl,
        width: req.file.width || 0,
        height: req.file.height || 0,
        size: req.file.size || 0,
        duration: req.file.duration || 0
      },
      location: location ? JSON.parse(location) : undefined,
      audio: audio ? JSON.parse(audio) : undefined
    });

    await reel.save();
    await reel.populate('author', 'username fullName profilePicture isVerified');

    // Update user's reels count (we'll add this field later)
    await User.findByIdAndUpdate(req.userId, { $inc: { reelsCount: 1 } });

    res.status(201).json({
      message: 'Reel created successfully',
      reel
    });

  } catch (error) {
    console.error('Create reel error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Get explore reels
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const reels = await Reel.getExploreReels(req.userId, page, limit);

    // Transform reels to fix video URLs
    const transformedReels = reels.map(reel => ({
      ...reel,
      video: {
        ...reel.video,
        url: fixVideoUrl(reel.video.url, req)
      }
    }));

    res.json({ reels: transformedReels });
  } catch (error) {
    console.error('Get explore reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved reels
router.get('/saved', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId).populate({
      path: 'savedReels',
      populate: { path: 'author', select: 'username fullName profilePicture isVerified' },
      options: {
        skip,
        limit,
        sort: { createdAt: -1 }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform reels to fix video URLs
    const reelsWithFixedUrls = user.savedReels.map(reel => {
      const reelObj = reel.toObject ? reel.toObject() : reel;
      return {
        ...reelObj,
        video: {
          ...reelObj.video,
          url: fixVideoUrl(reelObj.video.url, req)
        },
        isLikedBy: reelObj.likes?.some(like => like.user?.toString() === req.userId) || false,
        isSaved: true // These are saved reels, so they're all saved
      };
    });

    res.json({ 
      reels: reelsWithFixedUrls,
      hasMore: user.savedReels.length === limit
    });
  } catch (error) {
    console.error('Get saved reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single reel
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username profilePicture')
      .populate('comments.replies.user', 'username profilePicture');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Increment views
    reel.views += 1;
    await reel.save();

    // Fix video URL
    const transformedReel = {
      ...reel.toObject(),
      video: {
        ...reel.video,
        url: fixVideoUrl(reel.video.url, req)
      },
      isLikedBy: req.userId ? reel.isLikedBy(req.userId) : false
    };

    res.json({ reel: transformedReel });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike reel
router.post('/:id/like', auth, async (req, res) => {
  try {
    console.log('Like reel request:', { reelId: req.params.id, userId: req.userId });
    
    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid reel ID format' });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      console.log('Reel not found:', req.params.id);
      return res.status(404).json({ message: 'Reel not found' });
    }

    console.log('Reel found, current likes:', reel.likes.length);
    
    const isLiked = reel.toggleLike(req.userId);
    console.log('Toggle like result:', { isLiked, newLikesCount: reel.likes.length });
    
    await reel.save();
    console.log('Reel saved successfully');

    // Create and emit notification
    try {
      const io = req.app.get('io');
      if (isLiked && reel.author.toString() !== req.userId) {
        console.log('Creating reel like notification...');
        const user = await User.findById(req.userId).select('username fullName profilePicture');
        if (user) {
          await createNotification(io, {
            recipient: reel.author,
            sender: req.userId,
            type: 'like',
            message: `${user.username} liked your reel`,
            reel: reel._id
          });
          console.log('Notification created successfully');
        }
      }
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
    }

    res.json({
      message: isLiked ? 'Reel liked' : 'Reel unliked',
      likesCount: reel.likes.length,
      isLiked
    });

  } catch (error) {
    console.error('Like reel error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Add comment to reel
router.post('/:id/comments', auth, [
  body('text').notEmpty().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const comment = {
      user: req.userId,
      text: req.body.text
    };

    reel.comments.push(comment);
    await reel.save();

    // Populate the comment user info
    await reel.populate('comments.user', 'username profilePicture');

    // Create notification
    try {
      const io = req.app.get('io');
      if (reel.author.toString() !== req.userId) {
        const user = await User.findById(req.userId).select('username fullName profilePicture');
        if (user) {
          await createNotification(io, {
            recipient: reel.author,
            sender: req.userId,
            type: 'comment',
            message: `${user.username} commented on your reel`,
            reel: reel._id
          });
        }
      }
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
    }

    const newComment = reel.comments[reel.comments.length - 1];
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user reels
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Find user by username
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reels = await Reel.getUserReels(user._id, page, limit, req.userId);

    // Transform reels to fix video URLs
    const transformedReels = reels.map(reel => ({
      ...reel,
      video: {
        ...reel.video,
        url: fixVideoUrl(reel.video.url, req)
      }
    }));

    res.json({ reels: transformedReels });
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete reel
router.delete('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (reel.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    reel.isDeleted = true;
    await reel.save();

    // Update user's reels count
    await User.findByIdAndUpdate(req.userId, { $inc: { reelsCount: -1 } });

    res.json({ message: 'Reel deleted successfully' });

  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/unsave reel
router.post('/:id/save', auth, async (req, res) => {
  try {
    console.log('Save/unsave reel request:', { reelId: req.params.id, userId: req.userId });
    
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const user = await User.findById(req.userId);
    
    const isSaved = user.savedReels.includes(req.params.id);
    
    if (isSaved) {
      user.savedReels.pull(req.params.id);
      console.log('Reel unsaved');
    } else {
      user.savedReels.push(req.params.id);
      console.log('Reel saved');
    }
    
    await user.save();
    console.log('Reel saved successfully');

    res.json({
      message: isSaved ? 'Reel unsaved' : 'Reel saved',
      isSaved: !isSaved
    });

  } catch (error) {
    console.error('Save reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Edit reel caption
router.put('/:id', auth, [
  body('caption').optional().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (reel.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this reel' });
    }

    reel.caption = req.body.caption;
    await reel.save();

    res.json({
      message: 'Reel updated successfully',
      reel
    });

  } catch (error) {
    console.error('Edit reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reels with privacy checks
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the requesting user can view this user's reels
    const canViewReels = !user.isPrivate || 
                        req.userId === user._id.toString() || 
                        (req.userId && user.followers.some(followerId => 
                          followerId.toString() === req.userId
                        ));

    if (!canViewReels) {
      return res.status(403).json({ 
        message: 'This account is private',
        isPrivate: true 
      });
    }

    // Get reels using the existing getUserReels method
    const reels = await Reel.getUserReels(user._id, page, limit, req.userId);

    // Fix video URLs
    const reelsWithFixedUrls = reels.map(reel => ({
      ...reel,
      video: {
        ...reel.video,
        url: fixVideoUrl(reel.video.url, req)
      }
    }));

    // Check if there are more reels
    const totalReels = await Reel.countDocuments({
      author: user._id,
      isDeleted: false,
      isArchived: false
    });
    const hasMore = skip + limit < totalReels;

    res.json({
      reels: reelsWithFixedUrls,
      hasMore,
      page,
      totalPages: Math.ceil(totalReels / limit)
    });

  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;