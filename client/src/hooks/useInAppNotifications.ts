'use client';

import { useState, useCallback } from 'react';
import { InAppNotificationData } from '../components/InAppNotification';

export function useInAppNotifications() {
  const [notifications, setNotifications] = useState<InAppNotificationData[]>([]);

  const addNotification = useCallback((notificationData: {
    type: string;
    message: string;
    username?: string;
    avatar?: string;
    postImage?: string;
  }) => {
    const notification: InAppNotificationData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: notificationData.type,
      message: notificationData.message,
      username: notificationData.username,
      avatar: notificationData.avatar,
      postImage: notificationData.postImage,
      timestamp: new Date(),
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
}