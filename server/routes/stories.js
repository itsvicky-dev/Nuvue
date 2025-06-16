import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Story from '../models/Story.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Create a new story
router.post('/', auth, upload.single('media'), [
  body('text').optional().isLength({ max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file && !req.body.text) {
      return res.status(400).json({ message: 'Story must have media or text content' });
    }

    const { text, textStyle, location, mentions, hashtags, visibility } = req.body;

    const story = new Story({
      author: req.userId,
      media: req.file ? {
        url: req.file.path,
        type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
        width: req.file.width,
        height: req.file.height,
        size: req.file.size
      } : undefined,
      text,
      textStyle: textStyle ? JSON.parse(textStyle) : undefined,
      location: location ? JSON.parse(location) : undefined,
      mentions: mentions ? JSON.parse(mentions) : [],
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      visibility: visibility || 'public'
    });

    await story.save();
    await story.populate('author', 'username fullName profilePicture isVerified');

    // Emit real-time notification to followers
    const io = req.app.get('io');
    const user = await User.findById(req.userId).populate('followers', '_id');
    
    user.followers.forEach(follower => {
      io.to(`user_${follower._id}`).emit('new_story', {
        story,
        author: req.user
      });
    });

    res.status(201).json({
      message: 'Story created successfully',
      story
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stories feed
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const stories = await Story.getFeedStories(req.userId, user.following);

    res.json({ stories });
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's stories
router.get('/user/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stories = await Story.getUserStories(user._id);

    res.json({ stories });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View story
router.post('/:id/view', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }
    
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const isNewView = story.addView(req.userId);
    if (isNewView) {
      await story.save();

      // Emit real-time notification to story author
      const io = req.app.get('io');
      if (story.author.toString() !== req.userId) {
        io.to(`user_${story.author}`).emit('story_viewed', {
          storyId: story._id,
          viewer: req.user
        });
      }
    }

    res.json({ message: 'Story viewed' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike story
router.post('/:id/like', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const isLiked = story.toggleLike(req.userId);
    await story.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (isLiked && story.author.toString() !== req.userId) {
      io.to(`user_${story.author}`).emit('notification', {
        type: 'story_like',
        from: req.user,
        story: story._id,
        timestamp: new Date()
      });
    }

    res.json({
      message: isLiked ? 'Story liked' : 'Story unliked',
      likesCount: story.likes.length,
      isLiked
    });

  } catch (error) {
    console.error('Like story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to story
router.post('/:id/reply', auth, [
  body('message').notEmpty().isLength({ max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const reply = {
      user: req.userId,
      message,
      createdAt: new Date()
    };

    story.replies.push(reply);
    await story.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (story.author.toString() !== req.userId) {
      io.to(`user_${story.author}`).emit('story_reply', {
        storyId: story._id,
        reply: {
          ...reply,
          user: req.user
        }
      });
    }

    res.status(201).json({
      message: 'Reply sent successfully',
      reply
    });

  } catch (error) {
    console.error('Reply to story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    story.isDeleted = true;
    await story.save();

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;