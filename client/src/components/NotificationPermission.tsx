'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2 } from 'lucide-react';
import notificationService from '../services/notificationService';
import { useNotifications } from './providers/NotificationProvider';

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { addInAppNotification } = useNotifications();

  useEffect(() => {
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermission());
  }, []);

  const requestPermission = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
  };

  const testNotification = () => {
    // Test both browser and in-app notifications
    notificationService.showNotification({
      type: 'like',
      message: 'This is a test notification with sound!',
      username: 'test_user'
    });
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {permission === 'granted' ? (
            <Bell className="w-5 h-5 text-green-500" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Browser Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {permission === 'granted' 
                ? 'You\'ll receive browser notifications with sound when the tab is not active, and in-app notifications when active'
                : permission === 'denied'
                ? 'Browser notifications are blocked. You\'ll still get in-app notifications with sound when the tab is active.'
                : 'Enable browser notifications to get alerts even when the tab is not active. You\'ll always get in-app notifications with sound.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={testNotification}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test</span>
          </button>
          
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-ig-blue text-white rounded-md hover:bg-ig-blue-hover transition-colors"
            >
              Enable Browser Notifications
            </button>
          )}
        </div>
      </div>
      
      {permission === 'denied' && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            To enable notifications:
          </p>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 ml-4 list-decimal">
            <li>Click the lock icon in your browser's address bar</li>
            <li>Set "Notifications" to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  );
}