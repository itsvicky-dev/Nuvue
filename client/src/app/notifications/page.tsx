'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocket } from '@/components/providers/SocketProvider';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { Heart, MessageCircle, User, UserPlus, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NotificationSettings from '@/components/NotificationSettings';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'follow_request';
  user: {
    username: string;
    avatar: string;
    fullName: string;
  };
  content?: string;
  postImage?: string;
  timestamp: string;
  isRead: boolean;
  isFollowedBack?: boolean; // Track if user has been followed back
  isAccepted?: boolean; // Track if follow request has been accepted
  isRejected?: boolean; // Track if follow request has been rejected
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'you'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const { user } = useAuth();
  const { socket } = useSocket();

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notificationData: any) => {
      console.log('New notification received:', notificationData);
      const formattedNotification: Notification = {
        id: notificationData._id,
        type: notificationData.type,
        user: {
          username: notificationData.from?.username || 'unknown',
          avatar: notificationData.from?.profilePicture || '',
          fullName: notificationData.from?.fullName || notificationData.from?.username || 'Unknown User'
        },
        content: notificationData.message || '',
        postImage: notificationData.post?.media?.[0]?.url || '',
        timestamp: formatDistanceToNow(new Date(notificationData.createdAt), { addSuffix: true }),
        isRead: false,
        isFollowedBack: false,
        isAccepted: false,
        isRejected: false
      };

      // For follow requests, check if we already have one from this user
      if (formattedNotification.type === 'follow_request') {
        setNotifications(prev => {
          // Remove any existing follow request notifications from this user first
          const filtered = prev.filter(notif => !(
            notif.type === 'follow_request' && 
            notif.user.username === formattedNotification.user.username
          ));
          // Then add the new one
          return [formattedNotification, ...filtered];
        });
      } else {
        setNotifications(prev => [formattedNotification, ...prev]);
      }
    };

    const handleNotificationRemoved = (data: { type: string; senderId: string; senderUsername: string }) => {
      console.log('Notification removal received:', data);
      
      // Remove all notifications of the specified type from the specified sender
      setNotifications(prev => 
        prev.filter(notif => !(
          notif.type === data.type && 
          notif.user.username === data.senderUsername
        ))
      );
    };

    socket.on('notification', handleNewNotification);
    socket.on('notificationRemoved', handleNotificationRemoved);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('notificationRemoved', handleNotificationRemoved);
    };
  }, [socket, user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching notifications...');
      
      const response = await api.get('/notifications');
      console.log('✅ Notifications API response:', response.data);
      
      const notificationsData = response.data.notifications || [];
      console.log('📧 Notifications data:', notificationsData);
      
      const formattedNotifications: Notification[] = notificationsData.map((notif: any) => {
        console.log('🔄 Processing notification:', notif);
        return {
          id: notif._id,
          type: notif.type,
          user: {
            username: notif.from?.username || 'unknown',
            avatar: notif.from?.profilePicture || '/assets/images/default-avatar.png',
            fullName: notif.from?.fullName || notif.from?.username || 'Unknown User'
          },
          content: notif.message || '',
          postImage: notif.post?.media?.[0]?.url || '',
          timestamp: formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }),
          isRead: notif.isRead || false,
          isFollowedBack: false,
          isAccepted: false,
          isRejected: false
        };
      });
      
      console.log('✅ Formatted notifications:', formattedNotifications);
      
      // Remove duplicate follow request notifications (keep only the latest one per user)
      const cleanedNotifications = formattedNotifications.reduce((acc: Notification[], current: Notification) => {
        if (current.type === 'follow_request') {
          // Check if we already have a follow request from this user
          const existingIndex = acc.findIndex(notif => 
            notif.type === 'follow_request' && 
            notif.user.username === current.user.username
          );
          
          if (existingIndex >= 0) {
            // Replace with the newer one (current is newer since array is sorted by createdAt desc)
            acc[existingIndex] = current;
          } else {
            acc.push(current);
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setNotifications(cleanedNotifications);
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ Failed to fetch notifications:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('🔐 Authentication failed - redirecting to login');
        // The API client should handle this automatically, but let's be explicit
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to load notifications';
      setToast({ message: errorMessage, type: 'error' });
      
      setNotifications([]);
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleFollowBack = async (username: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    
    try {
      const response = await api.post(`/users/${username}/follow`);
      console.log('Successfully followed user:', username, response.data);
      
      // Update the notification to show it's been followed back
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId 
            ? { ...notif, isFollowedBack: true }
            : notif
        )
      );
      
      // Also mark the notification as read since user interacted with it
      await markAsRead(notificationId);
      
      // Show success toast
      setToast({ message: `Now following @${username}`, type: 'success' });
      
    } catch (error) {
      console.error('Failed to follow user:', error);
      setToast({ message: 'Failed to follow user. Please try again.', type: 'error' });
    }
  };

  const handleAcceptFollowRequest = async (username: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await api.post(`/users/follow-requests/username/${username}/accept`);
      console.log('Successfully accepted follow request:', username, response.data);
      
      // Remove all follow request notifications from this user
      setNotifications(prev =>
        prev.filter(notif => !(
          notif.type === 'follow_request' && 
          notif.user.username === username
        ))
      );
      
      // Show success toast
      setToast({ message: `Accepted follow request from @${username}`, type: 'success' });
      
    } catch (error) {
      console.error('Failed to accept follow request:', error);
      setToast({ message: 'Failed to accept follow request. Please try again.', type: 'error' });
    }
  };

  const handleRejectFollowRequest = async (username: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await api.post(`/users/follow-requests/username/${username}/reject`);
      console.log('Successfully rejected follow request:', username, response.data);
      
      // Remove all follow request notifications from this user
      setNotifications(prev =>
        prev.filter(notif => !(
          notif.type === 'follow_request' && 
          notif.user.username === username
        ))
      );
      
      // Show success toast
      setToast({ message: `Rejected follow request from @${username}`, type: 'success' });
      
    } catch (error) {
      console.error('Failed to reject follow request:', error);
      setToast({ message: 'Failed to reject follow request. Please try again.', type: 'error' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={20} className="text-green-500" />;
      case 'follow_request':
        return <UserPlus size={20} className="text-orange-500" />;
      case 'mention':
        return <User size={20} className="text-purple-500" />;
      default:
        return <Heart size={20} className="text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'follow_request':
        return 'requested to follow you';
      case 'mention':
        return 'mentioned you in a comment';
      default:
        return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="flex">
        {/* Sidebar for desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-2xl mx-auto py-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-ig-blue hover:text-ig-blue-hover"
                  >
                    Mark all as read
                  </button>
                )}
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-white dark:bg-dark-surface rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('following')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    filter === 'following'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Following
                </button>
                <button
                  onClick={() => setFilter('you')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    filter === 'you'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  You
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ig-blue mx-auto"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* User Avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={notification.user.avatar || '/assets/images/default-avatar.png'}
                            alt={notification.user.username}
                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/default-avatar.png';
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-dark-surface rounded-full p-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">
                                <span className="font-semibold">
                                  {notification.user.username}
                                </span>{' '}
                                <span className="text-gray-600 dark:text-gray-400">
                                  {notification.content ? 
                                    // Use the message from backend if available
                                    notification.content.replace(notification.user.username + ' ', '') 
                                    : 
                                    // Fallback to generated text
                                    getNotificationText(notification)
                                  }
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 ml-4">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.timestamp}
                              </span>
                              
                              {notification.postImage && (
                                <img
                                  src={notification.postImage}
                                  alt="Post"
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-ig-blue rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Follow Button for follow notifications */}
                      {notification.type === 'follow' && (
                        <div className="mt-3 ml-13">
                          <button 
                            onClick={(e) => handleFollowBack(notification.user.username, notification.id, e)}
                            className={`px-4 py-1 text-sm transition-colors rounded-md ${
                              notification.isFollowedBack
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                                : 'btn-primary hover:bg-ig-blue-hover'
                            }`}
                            disabled={notification.isFollowedBack}
                          >
                            {notification.isFollowedBack ? 'Following' : 'Follow Back'}
                          </button>
                        </div>
                      )}

                      {/* Accept/Reject Buttons for follow request notifications */}
                      {notification.type === 'follow_request' && !notification.isAccepted && !notification.isRejected && (
                        <div className="mt-3 ml-13 flex space-x-2">
                          <button 
                            onClick={(e) => handleAcceptFollowRequest(notification.user.username, notification.id, e)}
                            className="px-4 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={(e) => handleRejectFollowRequest(notification.user.username, notification.id, e)}
                            className="px-4 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Status message for processed follow requests */}
                      {notification.type === 'follow_request' && (notification.isAccepted || notification.isRejected) && (
                        <div className="mt-3 ml-13">
                          <span className={`px-4 py-1 text-sm rounded-md ${
                            notification.isAccepted 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {notification.isAccepted ? 'Accepted' : 'Rejected'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">When people interact with your posts, you'll see it here</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}