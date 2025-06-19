import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
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
console.log('Retrieved user data:', req.userId);
console.log('Retrieved user:', user);
    // Check if current user follows this user
    const isFollowing = req.userId ? user.followers.some(
      follower => {
        const followerId = follower._id ? follower._id.toString() : follower.toString();
        return followerId === req.userId.toString();
      }
    ) : false;

    // Check if this user follows current user
    const followsYou = req.userId ? user.following.some(
      following => {
        const followingId = following._id ? following._id.toString() : following.toString();
        return followingId === req.userId.toString();
      }
    ) : false;

    // Check if current user has requested to follow this user
    const hasRequestedFollow = req.userId ? user.followRequests.some(
      request => request.toString() === req.userId.toString()
    ) : false;

    // Hide sensitive info for other users
    const userProfile = {
      ...user.toJSON(),
      isFollowing,
      followsYou,
      isRequested: hasRequestedFollow
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
  body('website').optional().isURL().withMessage('Please enter a valid URL')
], async (req, res) => {
  try {
    console.log('Profile update request:', { userId: req.userId, body: req.body, file: req.file?.filename });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const { fullName, bio, website } = req.body;

    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (req.file) {
      // Convert file path to URL format
      let profilePictureUrl = req.file.path;
      if (!profilePictureUrl.startsWith('http')) {
        profilePictureUrl = profilePictureUrl.replace(/\\/g, '/');
        profilePictureUrl = profilePictureUrl.replace(/^\/+/, '');
        profilePictureUrl = `${req.protocol}://${req.get('host')}/${profilePictureUrl}`;
      }
      updates.profilePicture = profilePictureUrl;
    }

    console.log('Updates to apply:', updates);

    const user = await User.findByIdAndUpdate(
      req.userId, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully for user:', user.username);

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
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
    const hasRequestedFollow = targetUser.followRequests.some(requestId => 
      requestId.toString() === req.userId.toString()
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(req.userId);
      currentUser.followingCount -= 1;
      targetUser.followersCount -= 1;
      
      await currentUser.save();
      await targetUser.save();

      res.json({
        message: 'Unfollowed successfully',
        isFollowing: false,
        isRequested: false
      });
    } else if (hasRequestedFollow) {
      // Cancel follow request
      targetUser.followRequests.pull(req.userId);
      await targetUser.save();

      // Remove all follow request notifications from this sender to this recipient
      await Notification.deleteMany({
        recipient: targetUser._id,
        sender: req.userId,
        type: 'follow_request'
      });

      // Emit real-time notification removal
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${targetUser._id}`).emit('notificationRemoved', {
          type: 'follow_request',
          senderId: req.userId,
          senderUsername: currentUser.username
        });
      }

      res.json({
        message: 'Follow request cancelled',
        isFollowing: false,
        isRequested: false
      });
    } else {
      // Check if target user is private
      if (targetUser.isPrivate) {
        // Send follow request
        targetUser.followRequests.push(req.userId);
        await targetUser.save();

        // Clean up any duplicate follow request notifications first
        await Notification.cleanupDuplicateFollowRequests(targetUser._id, req.userId);

        // Check if a follow request notification already exists from this sender
        const existingNotification = await Notification.findOne({
          recipient: targetUser._id,
          sender: req.userId,
          type: 'follow_request'
        });

        // Only create notification if one doesn't already exist
        if (!existingNotification) {
          // Create and emit notification for follow request
          const io = req.app.get('io');
          await createNotification(io, {
            recipient: targetUser._id,
            sender: req.userId,
            type: 'follow_request',
            message: `${currentUser.username} requested to follow you`
          });
        }

        res.json({
          message: 'Follow request sent',
          isFollowing: false,
          isRequested: true
        });
      } else {
        // Follow immediately (public account)
        currentUser.following.push(targetUser._id);
        targetUser.followers.push(req.userId);
        currentUser.followingCount += 1;
        targetUser.followersCount += 1;

        await currentUser.save();
        await targetUser.save();

        // Create and emit notification
        const io = req.app.get('io');
        await createNotification(io, {
          recipient: targetUser._id,
          sender: req.userId,
          type: 'follow',
          message: `${currentUser.username} started following you`
        });

        res.json({
          message: 'Followed successfully',
          isFollowing: true,
          isRequested: false
        });
      }
    }

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
      const isFollowing = user.followers.some(followerId => 
        followerId.toString() === req.userId
      );
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
      const isFollowing = user.followers.some(followerId => 
        followerId.toString() === req.userId
      );
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

// Update privacy settings
router.put('/privacy', auth, async (req, res) => {
  try {
    const { isPrivate } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (typeof isPrivate === 'boolean') {
      user.isPrivate = isPrivate;
      await user.save();
    }

    res.json({
      message: 'Privacy settings updated successfully',
      isPrivate: user.isPrivate
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blocked users
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('blocked', 'username fullName profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ blockedUsers: user.blocked });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get follow requests
router.get('/follow-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('followRequests', 'username fullName profilePicture isVerified');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ followRequests: user.followRequests });

  } catch (error) {
    console.error('Get follow requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept follow request
router.post('/follow-requests/:userId/accept', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.userId);
    const requesterUser = await User.findById(userId);
    
    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if follow request exists
    if (!currentUser.followRequests.some(requestId => requestId.toString() === userId)) {
      return res.status(400).json({ message: 'Follow request not found' });
    }

    // Remove from follow requests
    currentUser.followRequests.pull(userId);
    
    // Add to followers/following only if not already following
    if (!currentUser.followers.some(followerId => followerId.toString() === userId)) {
      currentUser.followers.push(userId);
      currentUser.followersCount += 1;
    }
    
    if (!requesterUser.following.some(followingId => followingId.toString() === req.userId.toString())) {
      requesterUser.following.push(req.userId);
      requesterUser.followingCount += 1;
    }

    await currentUser.save();
    await requesterUser.save();

    // Create and emit notification
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: userId,
      sender: req.userId,
      type: 'follow_accept',
      message: `${currentUser.username} accepted your follow request`
    });

    res.json({
      message: 'Follow request accepted',
      success: true
    });

  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject follow request
router.post('/follow-requests/:userId/reject', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if follow request exists
    if (!currentUser.followRequests.some(requestId => requestId.toString() === userId)) {
      return res.status(400).json({ message: 'Follow request not found' });
    }

    // Remove from follow requests
    currentUser.followRequests.pull(userId);
    await currentUser.save();

    res.json({
      message: 'Follow request rejected',
      success: true
    });

  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept follow request by username
router.post('/follow-requests/username/:username/accept', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const currentUser = await User.findById(req.userId);
    const requesterUser = await User.findOne({ username });
    
    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if follow request exists
    console.log('Accept - Current user follow requests:', currentUser.followRequests);
    console.log('Accept - Requester user ID:', requesterUser._id);
    console.log('Accept - Follow request exists:', currentUser.followRequests.includes(requesterUser._id));
    
    if (!currentUser.followRequests.includes(requesterUser._id)) {
      return res.status(400).json({ 
        message: 'Follow request not found',
        debug: {
          currentUserRequests: currentUser.followRequests,
          requesterUserId: requesterUser._id,
          currentUserId: req.userId,
          currentUserUsername: currentUser.username,
          requesterUsername: requesterUser.username
        }
      });
    }

    // Remove from follow requests
    currentUser.followRequests.pull(requesterUser._id);
    
    // Add to followers/following only if not already following
    if (!currentUser.followers.includes(requesterUser._id)) {
      currentUser.followers.push(requesterUser._id);
      currentUser.followersCount += 1;
    }
    
    if (!requesterUser.following.some(followingId => followingId.toString() === req.userId)) {
      requesterUser.following.push(req.userId);
      requesterUser.followingCount += 1;
    }

    await currentUser.save();
    await requesterUser.save();

    // Remove all follow request notifications from this sender
    await Notification.deleteMany({
      recipient: req.userId,
      sender: requesterUser._id,
      type: 'follow_request'
    });

    // Create and emit notification
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: requesterUser._id,
      sender: req.userId,
      type: 'follow_accept',
      message: `${currentUser.username} accepted your follow request`
    });

    // Emit real-time notification removal for follow requests
    if (io) {
      io.to(`user_${req.userId}`).emit('notificationRemoved', {
        type: 'follow_request',
        senderId: requesterUser._id,
        senderUsername: requesterUser.username
      });
    }

    res.json({
      message: 'Follow request accepted',
      success: true
    });

  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject follow request by username
router.post('/follow-requests/username/:username/reject', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const currentUser = await User.findById(req.userId);
    const requesterUser = await User.findOne({ username });
    
    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if follow request exists
    console.log('Reject - Current user follow requests:', currentUser.followRequests);
    console.log('Reject - Requester user ID:', requesterUser._id);
    console.log('Reject - Follow request exists:', currentUser.followRequests.includes(requesterUser._id));
    
    if (!currentUser.followRequests.includes(requesterUser._id)) {
      return res.status(400).json({ 
        message: 'Follow request not found',
        debug: {
          currentUserRequests: currentUser.followRequests,
          requesterUserId: requesterUser._id,
          currentUserId: req.userId,
          currentUserUsername: currentUser.username,
          requesterUsername: requesterUser.username
        }
      });
    }

    // Remove from follow requests
    currentUser.followRequests.pull(requesterUser._id);
    await currentUser.save();

    // Remove all follow request notifications from this sender
    await Notification.deleteMany({
      recipient: req.userId,
      sender: requesterUser._id,
      type: 'follow_request'
    });

    // Emit real-time notification removal for follow requests
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.userId}`).emit('notificationRemoved', {
        type: 'follow_request',
        senderId: requesterUser._id,
        senderUsername: requesterUser.username
      });
    }

    res.json({
      message: 'Follow request rejected',
      success: true
    });

  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup data inconsistencies (remove users from followRequests if they're already followers)
router.post('/cleanup-follow-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove users from followRequests if they're already in followers
    const followersIds = user.followers.map(f => f.toString());
    const cleanedFollowRequests = user.followRequests.filter(
      requestId => !followersIds.includes(requestId.toString())
    );

    user.followRequests = cleanedFollowRequests;
    await user.save();

    res.json({
      message: 'Follow data cleaned up successfully',
      removedRequests: user.followRequests.length !== cleanedFollowRequests.length
    });

  } catch (error) {
    console.error('Cleanup follow data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;