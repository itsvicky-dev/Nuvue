'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSocket } from './SocketProvider';
import { useInAppNotifications } from '../../hooks/useInAppNotifications';
import InAppNotificationContainer from '../InAppNotification';
import notificationService from '../../services/notificationService';

interface NotificationContextType {
  addInAppNotification: (data: {
    type: string;
    message: string;
    username?: string;
    avatar?: string;
    postImage?: string;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { notifications, addNotification, removeNotification } = useInAppNotifications();

  useEffect(() => {
    // Set the in-app notification callback in the notification service
    notificationService.setInAppNotificationCallback(addNotification);
  }, [addNotification]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notificationData: any) => {
      console.log('Global notification received:', notificationData);
      
      // Show notification (will automatically choose between browser and in-app)
      notificationService.showNotification({
        type: notificationData.type,
        message: notificationData.message,
        username: notificationData.from?.username,
        avatar: notificationData.from?.profilePicture,
        postImage: notificationData.post?.media?.[0]?.url
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const value = {
    addInAppNotification: addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <InAppNotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
}