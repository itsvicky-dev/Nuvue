import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

// Store active users
const activeUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

export const handleSocketConnection = (socket, io) => {
  // Check if user is authenticated
  if (!socket.user || !socket.userId) {
    console.log(`Unauthenticated user connected: ${socket.id}`);
    // For unauthenticated users, we can still allow basic connection
    // but they won't be able to use features that require authentication
    return;
  }

  console.log(`User ${socket.userId} connected`);
  
  // Add user to active users
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    lastSeen: new Date()
  });

  // Broadcast user online status
  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    username: socket.user.username
  });

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Handle joining conversation rooms
  socket.on('join_conversation', async (data) => {
    try {
      const { conversationId, participantIds } = data;
      
      // Verify user is part of this conversation
      if (!participantIds.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized to join this conversation' });
        return;
      }

      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle leaving conversation rooms
  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} left conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, participants, text, media, messageType, replyTo } = data;

      // Validate participants
      if (!participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized to send message' });
        return;
      }

      // Create new message
      const message = new Message({
        participants,
        sender: socket.userId,
        text,
        media,
        messageType: messageType || 'text',
        replyTo
      });

      await message.save();
      await message.populate('sender', 'username fullName profilePicture');

      // Send message to all participants
      participants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('new_message', {
          conversationId,
          message
        });
      });

      // Send delivery confirmation to sender
      socket.emit('message_sent', {
        tempId: data.tempId,
        message
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message reactions
  socket.on('react_to_message', async (data) => {
    try {
      const { messageId, emoji, conversationId } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user is participant
      if (!message.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      if (emoji) {
        message.addReaction(socket.userId, emoji);
      } else {
        message.removeReaction(socket.userId);
      }

      await message.save();

      // Broadcast reaction update
      io.to(`conversation_${conversationId}`).emit('message_reaction', {
        messageId,
        reactions: message.reactions,
        userId: socket.userId,
        emoji
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to react to message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId
    });
  });

  // Handle message read receipts
  socket.on('mark_messages_read', async (data) => {
    try {
      const { conversationId, messageIds } = data;

      await Message.updateMany(
        {
          _id: { $in: messageIds },
          participants: socket.userId,
          sender: { $ne: socket.userId }
        },
        {
          $addToSet: {
            readBy: { user: socket.userId, readAt: new Date() }
          }
        }
      );

      // Notify other participants
      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        userId: socket.userId,
        messageIds
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Handle live video/audio calls (basic structure)
  socket.on('call_user', (data) => {
    const { targetUserId, offer, callType } = data;
    
    io.to(`user_${targetUserId}`).emit('incoming_call', {
      from: socket.userId,
      fromUser: socket.user,
      offer,
      callType
    });
  });

  socket.on('answer_call', (data) => {
    const { targetUserId, answer } = data;
    
    io.to(`user_${targetUserId}`).emit('call_answered', {
      from: socket.userId,
      answer
    });
  });

  socket.on('ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    
    io.to(`user_${targetUserId}`).emit('ice_candidate', {
      from: socket.userId,
      candidate
    });
  });

  socket.on('end_call', (data) => {
    const { targetUserId } = data;
    
    io.to(`user_${targetUserId}`).emit('call_ended', {
      from: socket.userId
    });
  });

  // Handle story views
  socket.on('view_story', async (data) => {
    try {
      const { storyId, authorId } = data;
      
      // Emit story view to story author
      io.to(`user_${authorId}`).emit('story_viewed', {
        storyId,
        viewerId: socket.userId,
        viewer: socket.user
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to record story view' });
    }
  });

  // Handle live streaming (basic structure)
  socket.on('start_live_stream', (data) => {
    const { streamId, title } = data;
    
    socket.join(`stream_${streamId}`);
    
    // Notify followers
    socket.broadcast.emit('live_stream_started', {
      streamId,
      streamer: socket.user,
      title
    });
  });

  socket.on('join_live_stream', (data) => {
    const { streamId } = data;
    socket.join(`stream_${streamId}`);
    
    socket.to(`stream_${streamId}`).emit('viewer_joined', {
      viewer: socket.user
    });
  });

  socket.on('live_stream_comment', (data) => {
    const { streamId, comment } = data;
    
    io.to(`stream_${streamId}`).emit('live_comment', {
      user: socket.user,
      comment,
      timestamp: new Date()
    });
  });

  // Handle notifications
  socket.on('send_notification', (data) => {
    const { targetUserId, type, data: notificationData } = data;
    
    io.to(`user_${targetUserId}`).emit('notification', {
      type,
      from: socket.user,
      data: notificationData,
      timestamp: new Date()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Update last seen
      User.findByIdAndUpdate(socket.userId, { 
        lastSeen: new Date() 
      }).exec();
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        lastSeen: new Date()
      });
    } else {
      console.log(`Unauthenticated user ${socket.id} disconnected`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

// Helper function to get active users
export const getActiveUsers = () => {
  return Array.from(activeUsers.values());
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};