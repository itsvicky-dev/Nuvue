'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InAppNotificationData {
  id: string;
  type: string;
  message: string;
  username?: string;
  avatar?: string;
  postImage?: string;
  timestamp: Date;
}

interface InAppNotificationProps {
  notification: InAppNotificationData;
  onClose: (id: string) => void;
}

function InAppNotificationItem({ notification, onClose }: InAppNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'like':
        return 'New Like';
      case 'comment':
        return 'New Comment';
      case 'follow':
        return 'New Follower';
      case 'follow_request':
        return 'Follow Request';
      case 'follow_accept':
        return 'Follow Request Accepted';
      case 'mention':
        return 'You were mentioned';
      default:
        return 'New Notification';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className="bg-white dark:bg-dark-surface shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow">
        <div className="flex items-start space-x-3">
          {/* Avatar or Icon */}
          <div className="flex-shrink-0">
            {notification.avatar ? (
              <img
                src={notification.avatar}
                alt={notification.username}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/default-avatar.png';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {getIcon()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getTitle()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post image if available */}
            {notification.postImage && (
              <div className="mt-2">
                <img
                  src={notification.postImage}
                  alt="Post"
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface InAppNotificationContainerProps {
  notifications: InAppNotificationData[];
  onRemoveNotification: (id: string) => void;
}

export default function InAppNotificationContainer({ 
  notifications, 
  onRemoveNotification 
}: InAppNotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {notifications.map((notification) => (
        <InAppNotificationItem
          key={notification.id}
          notification={notification}
          onClose={onRemoveNotification}
        />
      ))}
    </div>
  );
}

export type { InAppNotificationData };