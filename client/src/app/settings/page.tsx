'use client';

import { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

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
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar || 'https://picsum.photos/60/60?random=user'}
              alt={user.username}
              className="w-16 h-16 rounded-full"
            />
            <button className="btn-secondary text-sm">
              Change Photo
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                defaultValue={user.username}
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
                defaultValue={user.fullName}
                className="input"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                className="input"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                defaultValue={user.bio}
                className="input resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Password & Security
        </h3>
        
        <div className="space-y-4">
          <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
            <span className="text-gray-900 dark:text-white">Change Password</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
            <span className="text-gray-900 dark:text-white">Two-Factor Authentication</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
            <span className="text-gray-900 dark:text-white">Login Activity</span>
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
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden"
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
                    
                    <button className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {activeSection === 'account' && renderAccountSettings()}
                {activeSection === 'appearance' && renderAppearanceSettings()}
                {activeSection !== 'account' && activeSection !== 'appearance' && (
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
    </div>
  );
}