'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Volume2, VolumeX } from 'lucide-react';
import notificationService from '../services/notificationService';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPermission(notificationService.getPermission());
      // Load sound preference from localStorage
      const savedSoundPref = localStorage.getItem('notificationSound');
      setSoundEnabled(savedSoundPref !== 'false');
    }
  }, [isOpen]);

  const requestPermission = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('notificationSound', newSoundEnabled.toString());
  };

  const testNotification = () => {
    notificationService.testNotification();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className={`w-5 h-5 ${permission === 'granted' ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Browser Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified even when the tab is not active
                  </p>
                </div>
              </div>
              
              {permission === 'default' && (
                <button
                  onClick={requestPermission}
                  className="px-3 py-1 bg-ig-blue text-white text-sm rounded-md hover:bg-ig-blue-hover transition-colors"
                >
                  Enable
                </button>
              )}
            </div>

            {permission === 'denied' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            {permission === 'granted' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Browser notifications are enabled
                </p>
              </div>
            )}
          </div>

          {/* Sound Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Notification Sound
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Play sound when receiving notifications
                  </p>
                </div>
              </div>
              
              <button
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-ig-blue' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Button */}
          {(permission === 'granted' || soundEnabled) && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={testNotification}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Test Notification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}