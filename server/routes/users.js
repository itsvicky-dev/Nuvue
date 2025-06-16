import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Search users - Must be before /:username route
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .select('username fullName profilePicture isVerified followersCount')
    .sort({ followersCount: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get suggested users - Must be before /:username route
router.get('/suggestions', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const currentUser = await User.findById(req.userId);
    
    // Find users not followed by current user
    const suggestions = await User.find({
      _id: { 
        $nin: [...currentUser.following, req.userId] 
      },
      isActive: true
    })
    .select('username fullName profilePicture isVerified followersCount')
    .sort({ followersCount: -1 })
    .limit(limit);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user follows this user
    const isFollowing = req.userId ? user.followers.some(
      follower => follower._id.toString() === req.userId
    ) : false;

    // Check if this user follows current user
    const followsYou = req.userId ? user.following.some(
      following => following._id.toString() === req.userId
    ) : false;

    // Hide sensitive info for other users
    const userProfile = {
      ...user.toJSON(),
      isFollowing,
      followsYou
    };

    if (req.userId !== user._id.toString()) {
      delete userProfile.email;
      delete userProfile.preferences;
    }

    res.json({ user: userProfile });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, upload.single('profilePicture'), [
  body('fullName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('bio').optional().isLength({ max: 150 }).trim(),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const { fullName, bio, website } = req.body;

    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (req.file) updates.profilePicture = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.userId, 
      updates, 
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow/Unfollow user
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(req.userId);

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(req.userId);
      currentUser.followingCount -= 1;
      targetUser.followersCount -= 1;
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(req.userId);
      currentUser.followingCount += 1;
      targetUser.followersCount += 1;
    }

    await currentUser.save();
    await targetUser.save();

    // Create and emit notification
    const io = req.app.get('io');
    if (!isFollowing) {
      await createNotification(io, {
        recipient: targetUser._id,
        sender: req.userId,
        type: 'follow',
        message: `${currentUser.username} started following you`
      });
    }

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });

  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's followers
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy settings
    if (user.isPrivate && req.userId !== user._id.toString()) {
      const isFollowing = user.followers.includes(req.userId);
      if (!isFollowing) {
        return res.status(403).json({ message: 'Private account' });
      }
    }

    const skip = (page - 1) * limit;
    
    const followers = await User.find({
      _id: { $in: user.followers }
    })
    .select('username fullName profilePicture isVerified')
    .skip(skip)
    .limit(limit);

    res.json({ followers });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's following
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy settings
    if (user.isPrivate && req.userId !== user._id.toString()) {
      const isFollowing = user.followers.includes(req.userId);
      if (!isFollowing) {
        return res.status(403).json({ message: 'Private account' });
      }
    }

    const skip = (page - 1) * limit;
    
    const following = await User.find({
      _id: { $in: user.following }
    })
    .select('username fullName profilePicture isVerified')
    .skip(skip)
    .limit(limit);

    res.json({ following });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/Unblock user
router.post('/:username/block', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(req.userId);
    const isBlocked = currentUser.blocked.includes(targetUser._id);

    if (isBlocked) {
      // Unblock
      currentUser.blocked.pull(targetUser._id);
    } else {
      // Block
      currentUser.blocked.push(targetUser._id);
      
      // Remove from followers/following
      currentUser.following.pull(targetUser._id);
      currentUser.followers.pull(targetUser._id);
      targetUser.following.pull(req.userId);
      targetUser.followers.pull(req.userId);
      
      await targetUser.save();
    }

    await currentUser.save();

    res.json({
      message: isBlocked ? 'User unblocked' : 'User blocked',
      isBlocked: !isBlocked
    });

  } catch (error) {
    console.error('Block/unblock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;