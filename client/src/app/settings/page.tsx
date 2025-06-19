'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Moon, 
  Sun, 
  Globe, 
  Smartphone,
  HelpCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Camera,
  Lock,
  Trash2,
  AlertTriangle,
  Save,
  X,
  Heart,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { authApi, usersApi, uploadApi } from '@/lib/api';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileForm {
  fullName: string;
  bio: string;
  website: string;
}

interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  posts: boolean;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: '',
    bio: '',
    website: ''
  });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    posts: true
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [deleteStep, setDeleteStep] = useState(1); // 1: reason, 2: confirmation
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const deleteReasons = [
    'I don\'t find it useful anymore',
    'I\'m concerned about my privacy',
    'I\'m spending too much time on social media',
    'I\'m switching to another platform',
    'I\'m having technical issues',
    'I don\'t like the recent changes',
    'I\'m taking a break from social media',
    'Other (please specify)'
  ];

  // Initialize form data when user is available
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        website: user.website || ''
      });
      setNotificationSettings(user.preferences?.notifications || {
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        posts: true
      });
      setIsPrivate(user.isPrivate || false);
    }
  }, [user]);

  const settingSections = [
    {
      id: 'account',
      title: 'Account',
      icon: User,
      description: 'Edit profile, change password, account privacy'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Push notifications, email notifications, SMS'
    },
    {
      id: 'privacy',
      title: 'Privacy and Security',
      icon: Shield,
      description: 'Account privacy, data usage, security settings'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: resolvedTheme === 'dark' ? Moon : Sun,
      description: 'Theme, display preferences'
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: Eye,
      description: 'Screen reader, alt text, captions'
    },
    {
      id: 'language',
      title: 'Language and Region',
      icon: Globe,
      description: 'App language, date format, time zone'
    },
    {
      id: 'devices',
      title: 'Linked Accounts',
      icon: Smartphone,
      description: 'Connected apps, devices, sessions'
    },
    {
      id: 'help',
      title: 'Help and Support',
      icon: HelpCircle,
      description: 'Help center, contact us, report a problem'
    }
  ];

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        type: 'error'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('fullName', profileForm.fullName);
      formData.append('bio', profileForm.bio);
      formData.append('website', profileForm.website);

      const response = await usersApi.updateProfile(formData);
      updateUser(response.data.user);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile picture has been updated successfully.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update profile picture.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', profileForm.fullName);
      formData.append('bio', profileForm.bio);
      formData.append('website', profileForm.website);

      const response = await usersApi.updateProfile(formData);
      updateUser(response.data.user);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update profile.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New passwords do not match.',
        type: 'error'
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Password change failed',
        description: error.response?.data?.message || 'Failed to change password.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);

    try {
      await authApi.updatePreferences({ notifications: newSettings });
      toast({
        title: 'Notifications updated',
        description: 'Your notification preferences have been saved.',
        type: 'success'
      });
    } catch (error: any) {
      // Revert on error
      setNotificationSettings(notificationSettings);
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update notifications.',
        type: 'error'
      });
    }
  };

  const handlePrivacyUpdate = async (newPrivacy: boolean) => {
    try {
      await usersApi.updatePrivacy(newPrivacy);
      setIsPrivate(newPrivacy);
      toast({
        title: 'Privacy updated',
        description: `Your account is now ${newPrivacy ? 'private' : 'public'}.`,
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update privacy settings.',
        type: 'error'
      });
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to deactivate your account.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.deactivateAccount(deactivatePassword);
      toast({
        title: 'Account deactivated',
        description: 'Your account has been deactivated.',
        type: 'success'
      });
      logout();
    } catch (error: any) {
      toast({
        title: 'Deactivation failed',
        description: error.response?.data?.message || 'Failed to deactivate account.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
      setDeactivatePassword('');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const finalReason = deleteReason === 'Other (please specify)' ? customReason : deleteReason;
      
      await authApi.deleteAccount({
        password: deactivatePassword,
        confirmation: deleteConfirmation,
        reason: finalReason
      });
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
        type: 'success'
      });
      logout();
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.response?.data?.message || 'Failed to delete account.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setDeactivatePassword('');
      setDeleteReason('');
      setCustomReason('');
      setDeleteStep(1);
    }
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteReason('');
    setCustomReason('');
    setDeleteConfirmation('');
    setDeactivatePassword('');
  };

  const handleDeleteNext = () => {
    if (!deleteReason) {
      toast({
        title: 'Please select a reason',
        description: 'We\'d love to know why you\'re leaving us.',
        type: 'error'
      });
      return;
    }
    
    if (deleteReason === 'Other (please specify)' && !customReason.trim()) {
      toast({
        title: 'Please specify your reason',
        description: 'Help us understand how we can improve.',
        type: 'error'
      });
      return;
    }
    
    setDeleteStep(2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message,
        type: 'error'
      });
    }
  };

  if (!user) {
    return null;
  }

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h3>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.profilePicture || '/assets/images/default-avatar.png'}
                alt={user.username}
                className="w-16 h-16 rounded-full"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1 bg-ig-blue text-white rounded-full hover:bg-blue-600 transition-colors"
                disabled={loading}
              >
                <Camera size={12} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click the camera icon to change your photo
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={user.username}
                className="input"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="input"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                className="input"
                disabled
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={profileForm.website}
                onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                className="input"
                placeholder="https://example.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                className="input resize-none"
                placeholder="Tell us about yourself..."
                maxLength={150}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {profileForm.bio.length}/150 characters
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Password & Security
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="input"
              minLength={6}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="input"
              minLength={6}
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Push Notifications
        </h3>
        
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive notifications for {key.toLowerCase()}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationUpdate(key as keyof NotificationSettings, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Privacy
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Private Account
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When your account is private, only people you approve can see your photos and videos
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => handlePrivacyUpdate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blocked Accounts
        </h3>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
            <span className="text-gray-900 dark:text-white">Manage Blocked Accounts</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Theme
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="text-ig-blue focus:ring-ig-blue"
            />
            <div className="flex items-center space-x-2">
              <Sun size={20} className="text-yellow-500" />
              <span className="text-gray-900 dark:text-white">Light Mode</span>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="text-ig-blue focus:ring-ig-blue"
            />
            <div className="flex items-center space-x-2">
              <Moon size={20} className="text-blue-500" />
              <span className="text-gray-900 dark:text-white">Dark Mode</span>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === 'system'}
              onChange={() => setTheme('system')}
              className="text-ig-blue focus:ring-ig-blue"
            />
            <div className="flex items-center space-x-2">
              <Smartphone size={20} className="text-gray-500" />
              <span className="text-gray-900 dark:text-white">System Default</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="flex">
        {/* Sidebar for desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-4xl mx-auto py-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {activeSection && (
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSection ? settingSections.find(s => s.id === activeSection)?.title : 'Settings'}
                </h1>
              </div>
            </div>

            {/* Content */}
            {!activeSection ? (
              <div className="space-y-4">
                {/* Settings Sections */}
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full bg-white dark:bg-dark-surface rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <section.icon size={20} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </button>
                ))}

                {/* Danger Zone */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-red-600 dark:text-red-400">
                      Danger Zone
                    </h3>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowDeactivateModal(true)}
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Lock size={16} />
                      <span>Deactivate Account</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {activeSection === 'account' && renderAccountSettings()}
                {activeSection === 'notifications' && renderNotificationSettings()}
                {activeSection === 'privacy' && renderPrivacySettings()}
                {activeSection === 'appearance' && renderAppearanceSettings()}
                {(activeSection !== 'account' && activeSection !== 'notifications' && 
                  activeSection !== 'privacy' && activeSection !== 'appearance') && (
                  <div className="bg-white dark:bg-dark-surface rounded-lg p-8 shadow-sm text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        {React.createElement(settingSections.find(s => s.id === activeSection)?.icon || User, { size: 24 })}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {settingSections.find(s => s.id === activeSection)?.title}
                      </h3>
                      <p>This section is coming soon!</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deactivate Account
              </h3>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 mb-2">
                <AlertTriangle size={20} />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deactivating your account will hide your profile and content from other users. 
                You can reactivate it anytime by logging in again.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                className="input"
                placeholder="Password"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {deleteStep === 1 ? (
              <>
                {/* Step 1: Cute message and reason collection */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Heart className="h-16 w-16 text-red-400 animate-pulse" fill="currentColor" />
                      <div className="absolute -top-1 -right-1 text-2xl">💔</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    We'll miss you! 😢
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Before you go, could you give us another chance? We're constantly improving and would love to keep you around! 
                  </p>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      💡 <strong>Did you know?</strong> You can always deactivate your account temporarily instead of deleting it permanently!
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Help us improve - Why are you leaving? 🤔
                  </h4>
                  <div className="space-y-2">
                    {deleteReasons.map((reason, index) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <input
                          type="radio"
                          name="deleteReason"
                          value={reason}
                          checked={deleteReason === reason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          className="text-ig-blue focus:ring-ig-blue"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                      </label>
                    ))}
                  </div>
                  
                  {deleteReason === 'Other (please specify)' && (
                    <div className="mt-3">
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                        rows={3}
                        placeholder="Please tell us more... Your feedback helps us improve! 💝"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteModalClose}
                    className="flex-1 btn-secondary"
                  >
                    Stay with us! 🥺
                  </button>
                  <button
                    onClick={handleDeleteNext}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Continue to Delete 😔
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Final confirmation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Final Confirmation
                  </h3>
                  <button
                    onClick={handleDeleteModalClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">💔</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Last chance to stay!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    We're really sad to see you go. This action cannot be undone and will permanently delete your account and all your precious memories.
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-2">
                      <AlertTriangle size={20} />
                      <span className="font-medium">This will permanently delete:</span>
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 text-left space-y-1">
                      <li>• All your posts and photos</li>
                      <li>• Your followers and following</li>
                      <li>• All your messages and conversations</li>
                      <li>• Your profile and account data</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    className="input"
                    placeholder="Password"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="input"
                    placeholder="DELETE"
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteModalClose}
                    className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-700 hover:text-white transition-colors"
                  >
                    Keep My Account! 🎉
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Deleting... 💔' : 'Delete Forever 🙁'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}