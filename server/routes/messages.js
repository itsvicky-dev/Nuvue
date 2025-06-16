import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get user conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation messages
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const participantIds = [req.userId, userId];
    const messages = await Message.getConversationMessages(participantIds, page, limit);

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/send', auth, upload.array('media', 5), [
  body('recipientId').notEmpty().withMessage('Recipient is required'),
  body('text').optional().isLength({ max: 2000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, text, messageType, replyTo } = req.body;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if user is blocked
    if (recipient.blocked.includes(req.userId)) {
      return res.status(403).json({ message: 'Cannot send message to this user' });
    }

    const media = req.files?.map(file => ({
      url: file.path,
      type: file.mimetype.startsWith('video') ? 'video' : 
            file.mimetype.startsWith('audio') ? 'audio' : 'image',
      filename: file.originalname,
      size: file.size
    })) || [];

    if (!text && media.length === 0) {
      return res.status(400).json({ message: 'Message must have text or media content' });
    }

    const message = new Message({
      participants: [req.userId, recipientId],
      sender: req.userId,
      text,
      media,
      messageType: messageType || 'text',
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username fullName profilePicture');

    // Emit real-time message
    const io = req.app.get('io');
    io.to(`user_${recipientId}`).emit('new_message', {
      message,
      conversationId: [req.userId, recipientId].sort().join('_')
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/read', auth, [
  body('messageIds').isArray().withMessage('Message IDs must be an array'),
  body('conversationId').notEmpty().withMessage('Conversation ID is required')
], async (req, res) => {
  try {
    const { messageIds, conversationId } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        participants: req.userId,
        sender: { $ne: req.userId }
      },
      {
        $addToSet: {
          readBy: { user: req.userId, readAt: new Date() }
        }
      }
    );

    // Emit real-time read receipt
    const io = req.app.get('io');
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      userId: req.userId,
      messageIds
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// React to message
router.post('/:messageId/react', auth, [
  body('emoji').notEmpty().withMessage('Emoji is required')
], async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant
    if (!message.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.addReaction(req.userId, emoji);
    await message.save();

    // Emit real-time reaction
    const io = req.app.get('io');
    const conversationId = message.participants.sort().join('_');
    io.to(`conversation_${conversationId}`).emit('message_reaction', {
      messageId,
      reactions: message.reactions,
      userId: req.userId,
      emoji
    });

    res.json({
      message: 'Reaction added',
      reactions: message.reactions
    });

  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' or 'everyone'

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant
    if (!message.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (deleteFor === 'everyone') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== req.userId) {
        return res.status(403).json({ message: 'Can only delete your own messages for everyone' });
      }
      message.isDeleted = true;
    } else {
      // Delete for current user only
      if (!message.deletedFor.includes(req.userId)) {
        message.deletedFor.push(req.userId);
      }
    }

    await message.save();

    // Emit real-time deletion
    const io = req.app.get('io');
    const conversationId = message.participants.sort().join('_');
    io.to(`conversation_${conversationId}`).emit('message_deleted', {
      messageId,
      deletedBy: req.userId,
      deleteFor
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;