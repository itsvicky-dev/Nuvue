import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Reel from '../models/Reel.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Helper function to convert local paths to full URLs
const fixMediaUrl = (url, req) => {
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
  
  console.log('URL Transformation:', { original: url, fixed: fullUrl });
  
  return fullUrl;
};

// Helper function to fix all media URLs in a post
const fixPostMediaUrls = (post, req) => {
  if (!post.media || !Array.isArray(post.media)) {
    return post;
  }
  
  return {
    ...post,
    media: post.media.map(mediaItem => ({
      ...mediaItem,
      url: fixMediaUrl(mediaItem.url, req)
    }))
  };
};

// Create a new post
router.post('/', auth, upload.array('media', 10), handleUploadError, [
  body('caption').optional().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    console.log('Post creation request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Files count:', req.files?.length || 0);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { caption, location } = req.body;
    const media = req.files?.map(file => {
      console.log('Processing file:', file);
      
      // Convert local file path to URL
      let url = file.path;
      if (!url.startsWith('http')) {
        // For local storage, convert path to URL
        url = url.replace(/\\/g, '/'); // Convert Windows paths to URL format
        // Remove leading slash if present to avoid double slashes
        url = url.replace(/^\/+/, '');
        url = `${req.protocol}://${req.get('host')}/${url}`;
      }
      
      console.log('Original file path:', file.path);
      console.log('Generated URL:', url);
      
      return {
        url,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        width: file.width || 0,
        height: file.height || 0,
        size: file.size || 0
      };
    }) || [];

    if (media.length === 0) {
      return res.status(400).json({ message: 'At least one media file is required' });
    }

    const post = new Post({
      author: req.userId,
      caption,
      media,
      location: location ? JSON.parse(location) : undefined
    });

    await post.save();
    await post.populate('author', 'username fullName profilePicture isVerified');

    // Update user's posts count
    await User.findByIdAndUpdate(req.userId, { $inc: { postsCount: 1 } });

    res.status(201).json({
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    console.error('Create post error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Get feed posts
router.get('/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(req.userId);
    const posts = await Post.getFeedPosts(req.userId, user.following, page, limit);

    // Debug logging
    console.log('Feed posts sample:', posts.slice(0, 1).map(p => ({
      id: p._id,
      isLikedBy: p.isLikedBy,
      isSaved: p.isSaved,
      author: p.author?.username
    })));

    res.json({ posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get combined feed (posts and reels)
router.get('/combined-feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.userId);
    
    // Get posts
    const posts = await Post.getFeedPosts(req.userId, user.following, page, Math.ceil(limit * 0.7));
    
    // Get reels
    const reels = await Reel.aggregate([
      {
        $match: {
          $or: [
            { author: { $in: user.following.map(id => new mongoose.Types.ObjectId(id)) } },
            { author: new mongoose.Types.ObjectId(req.userId) }
          ],
          isDeleted: false,
          isArchived: false,
          publishedAt: { $lte: new Date() }
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
            { 'author': new mongoose.Types.ObjectId(req.userId) }, // Own reels
            { 
              $and: [
                { 'authorInfo.isPrivate': true },
                { 'authorInfo.followers': { $in: [new mongoose.Types.ObjectId(req.userId)] } }
              ]
            } // Private reels from followed users
          ]
        }
      },
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
      { $unwind: '$author' },
      { $sort: { createdAt: -1 } },
      { $limit: Math.ceil(limit * 0.3) },
      {
        $addFields: {
          type: 'reel',
          isLikedBy: { $in: [new mongoose.Types.ObjectId(req.userId), '$likes.user'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { reelId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', new mongoose.Types.ObjectId(req.userId)] },
                    { $in: ['$$reelId', '$savedReels'] }
                  ]
                }
              }
            }
          ],
          as: 'savedByUser'
        }
      },
      {
        $addFields: {
          isSaved: { $gt: [{ $size: '$savedByUser' }, 0] }
        }
      }
    ]);

    // Add type field to posts while preserving all calculated fields and fix URLs
    const postsWithType = posts.map(post => {
      // Convert to plain object to ensure all fields are preserved
      const postObj = post.toObject ? post.toObject() : post;
      
      // Fix media URLs
      const fixedMedia = postObj.media?.map(mediaItem => ({
        ...mediaItem,
        url: fixMediaUrl(mediaItem.url, req)
      })) || [];
      
      return {
        ...postObj,
        media: fixedMedia,
        type: 'post'
      };
    });

    // Fix reel video URLs
    const reelsWithFixedUrls = reels.map(reel => ({
      ...reel,
      video: {
        ...reel.video,
        url: fixMediaUrl(reel.video.url, req)
      }
    }));

    // Combine and sort by creation date
    const combinedFeed = [...postsWithType, ...reelsWithFixedUrls].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Debug logging
    console.log('Combined feed sample:', combinedFeed.slice(0, 2).map(item => ({
      id: item._id,
      type: item.type,
      isLikedBy: item.isLikedBy,
      isSaved: item.isSaved,
      savedByUser: item.savedByUser?.length || 0,
      author: item.author?.username
    })));
    
    // Debug user's saved items
    console.log('User saved items:', {
      userId: req.userId,
      savedPosts: user.savedPosts?.length || 0,
      savedReels: user.savedReels?.length || 0,
      savedPostIds: user.savedPosts?.slice(0, 3) || [],
      savedReelIds: user.savedReels?.slice(0, 3) || []
    });

    res.json({ 
      posts: combinedFeed.slice(0, limit),
      hasMore: combinedFeed.length === limit
    });
  } catch (error) {
    console.error('Get combined feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get explore posts
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.getExplorePosts(req.userId, page, limit);

    res.json({ posts });
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending posts
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Get trending posts using aggregation pipeline
    const posts = await Post.aggregate([
      { $match: { isDeleted: false } },
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          // Calculate engagement score
          engagementScore: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] },
              // Boost recent posts (within last 7 days)
              {
                $cond: {
                  if: { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                  then: 10,
                  else: 0
                }
              }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
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

    // Transform posts to match expected format
    const transformedPosts = posts.map(post => {
      // Fix URLs for media files
      const fixedMedia = post.media.map(mediaItem => ({
        ...mediaItem,
        url: fixMediaUrl(mediaItem.url, req)
      }));

      return {
        id: post._id,
        imageUrl: fixedMedia[0]?.url || '',
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        type: fixedMedia[0]?.type === 'video' ? 'video' : (fixedMedia.length > 1 ? 'carousel' : 'image'),
        author: post.author,
        caption: post.caption,
        createdAt: post.createdAt,
        media: fixedMedia
      };
    });

    // Check if there are more posts
    const totalPosts = await Post.countDocuments({ isDeleted: false });
    const hasMore = skip + limit < totalPosts;

    res.json({ 
      posts: transformedPosts,
      hasMore,
      page,
      totalPages: Math.ceil(totalPosts / limit)
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts from followed users
router.get('/following', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get the current user to access their following list
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get posts from users that the current user follows
    const posts = await Post.find({ 
      author: { $in: user.following },
      isDeleted: false 
    })
      .populate('author', 'username fullName profilePicture isVerified')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Transform posts to match the expected format
    const transformedPosts = posts.map(post => {
      // Fix URLs for media files
      const fixedMedia = post.media.map(mediaItem => ({
        ...mediaItem,
        url: fixMediaUrl(mediaItem.url, req)
      }));

      return {
        id: post._id,
        imageUrl: fixedMedia[0]?.url || '',
        likes: post.likes.length,
        comments: post.comments.length,
        type: fixedMedia[0]?.type === 'video' ? 'video' : (fixedMedia.length > 1 ? 'carousel' : 'image'),
        author: post.author,
        caption: post.caption,
        createdAt: post.createdAt,
        media: fixedMedia
      };
    });

    // Check if there are more posts
    const totalPosts = await Post.countDocuments({ 
      author: { $in: user.following },
      isDeleted: false 
    });
    const hasMore = skip + limit < totalPosts;

    res.json({ 
      posts: transformedPosts,
      hasMore,
      page,
      totalPages: Math.ceil(totalPosts / limit)
    });
  } catch (error) {
    console.error('Get following posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved posts
router.get('/saved', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId).populate({
      path: 'savedPosts',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username fullName profilePicture isVerified'
      },
      options: {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fix URLs for all posts
    const postsWithFixedUrls = user.savedPosts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      return fixPostMediaUrls(postObj, req);
    });

    res.json({ 
      posts: postsWithFixedUrls,
      hasMore: user.savedPosts.length === limit
    });

  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username profilePicture')
      .populate('comments.replies.user', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    console.log('Like post request:', { postId: req.params.id, userId: req.userId });
    
    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Post found, current likes:', post.likes.length);
    
    const isLiked = post.toggleLike(req.userId);
    console.log('Toggle like result:', { isLiked, newLikesCount: post.likes.length });
    
    await post.save();
    console.log('Post saved successfully');

    // Create and emit notification
    try {
      const io = req.app.get('io');
      if (isLiked && post.author.toString() !== req.userId) {
        console.log('Creating like notification...');
        const user = await User.findById(req.userId).select('username fullName profilePicture');
        if (user) {
          await createNotification(io, {
            recipient: post.author,
            sender: req.userId,
            type: 'like',
            message: `${user.username} liked your post`,
            post: post._id
          });
          console.log('Notification created successfully');
        } else {
          console.log('User not found for notification');
        }
      }
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: isLiked ? 'Post liked' : 'Post unliked',
      likesCount: post.likes.length,
      isLiked
    });

  } catch (error) {
    console.error('Like post error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Save/Unsave post
router.post('/:id/save', auth, async (req, res) => {
  try {
    console.log('Save post request:', { postId: req.params.id, userId: req.userId });
    
    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSaved = user.savedPosts.includes(req.params.id);
    
    if (isSaved) {
      // Unsave
      user.savedPosts.pull(req.params.id);
      console.log('Post unsaved');
    } else {
      // Save
      user.savedPosts.push(req.params.id);
      console.log('Post saved');
    }

    await user.save();

    console.log('Save operation completed:', {
      postId: req.params.id,
      userId: req.userId,
      wasSaved: isSaved,
      nowSaved: !isSaved,
      savedPostsCount: user.savedPosts.length
    });

    res.json({
      message: isSaved ? 'Post unsaved' : 'Post saved',
      isSaved: !isSaved
    });

  } catch (error) {
    console.error('Save post error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});


// Add comment
router.post('/:id/comments', auth, [
  body('text').notEmpty().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.userId,
      text,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'username profilePicture');

    // Create and emit notification
    const io = req.app.get('io');
    if (post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId).select('username fullName profilePicture');
      await createNotification(io, {
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        message: `${user.username} commented on your post`,
        post: post._id,
        comment: text
      });
    }

    res.status(201).json({
      message: 'Comment added',
      comment: post.comments[post.comments.length - 1]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ 
      author: user._id,
      isDeleted: false 
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Fix URLs for all posts
    const postsWithFixedUrls = posts.map(post => fixPostMediaUrls(post.toObject(), req));

    res.json({ posts: postsWithFixedUrls });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit post
router.put('/:id', auth, [
  body('caption').optional().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { caption } = req.body;
    
    if (caption !== undefined) {
      post.caption = caption;
    }

    await post.save();
    
    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('likes', 'username fullName profilePicture')
      .populate('comments.author', 'username fullName profilePicture');

    res.json({ 
      message: 'Post updated successfully',
      post: updatedPost 
    });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.isDeleted = true;
    await post.save();

    // Update user's posts count
    await User.findByIdAndUpdate(req.userId, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/Unsave post
router.post('/:id/save', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.userId);
    const postId = post._id;
    
    // Check if post is already saved
    const isSaved = user.savedPosts.includes(postId);
    
    if (isSaved) {
      // Unsave the post
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId.toString());
      await user.save();
      
      res.json({ 
        message: 'Post unsaved',
        isSaved: false
      });
    } else {
      // Save the post
      user.savedPosts.push(postId);
      await user.save();
      
      res.json({ 
        message: 'Post saved',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Save/unsave post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.toggleLike(req.userId);
    await post.save();

    // Create notification if liked (not if unliked)
    if (isLiked && post.author.toString() !== req.userId) {
      await createNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'like',
        postId: post._id
      });
    }

    res.json({ 
      message: isLiked ? 'Post liked' : 'Post unliked',
      isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Like/unlike post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/:id/comment', auth, [
  body('text').notEmpty().isLength({ max: 2200 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.userId,
      text: req.body.text
    };

    post.comments.push(comment);
    await post.save();

    // Populate the comment with user info
    await post.populate({
      path: 'comments.user',
      select: 'username fullName profilePicture',
      match: { _id: req.userId }
    });

    // Create notification if commenting on someone else's post
    if (post.author.toString() !== req.userId) {
      await createNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        postId: post._id
      });
    }

    const newComment = post.comments[post.comments.length - 1];

    res.json({ 
      message: 'Comment added',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts with privacy checks
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

    // Check if the requesting user can view this user's posts
    const canViewPosts = !user.isPrivate || 
                        req.userId === user._id.toString() || 
                        (req.userId && user.followers.some(followerId => 
                          followerId.toString() === req.userId
                        ));

    if (!canViewPosts) {
      return res.status(403).json({ 
        message: 'This account is private',
        isPrivate: true 
      });
    }

    // Get posts
    const posts = await Post.find({
      author: user._id,
      isDeleted: false,
      isArchived: false
    })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Fix media URLs
    const postsWithFixedUrls = posts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      return fixPostMediaUrls(postObj, req);
    });

    // Check if there are more posts
    const totalPosts = await Post.countDocuments({
      author: user._id,
      isDeleted: false,
      isArchived: false
    });
    const hasMore = skip + limit < totalPosts;

    res.json({
      posts: postsWithFixedUrls,
      hasMore,
      page,
      totalPages: Math.ceil(totalPosts / limit)
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;