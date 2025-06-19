'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSocket } from '@/components/providers/SocketProvider';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Home,
  Search,
  Compass,
  Heart,
  PlusSquare,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Play
} from 'lucide-react';

const navigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/reels', icon: Play, label: 'Reels' },
  { href: '/notifications', icon: Heart, label: 'Notifications' },
  { href: '/create', icon: PlusSquare, label: 'Create' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    socket.on('notification', handleNotification);
    socket.on('unreadCount', handleUnreadCount);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('unreadCount', handleUnreadCount);
    };
  }, [socket, user]);

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-gradient">
            Nuvue
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors relative
                      ${isActive 
                        ? 'bg-gray-100 dark:bg-gray-800 font-semibold' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <div className="relative">
                      <item.icon 
                        size={24} 
                        className={isActive ? 'fill-current' : ''} 
                      />
                      {item.href === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}

            {/* Profile Link */}
            <li>
              <Link
                href={`/${user?.username}`}
                className={`
                  flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors
                  ${pathname === `/${user?.username}`
                    ? 'bg-gray-100 dark:bg-gray-800 font-semibold' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <User size={24} />
                <span className="text-gray-900 dark:text-white">Profile</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 dark:border-dark-border">
          <div className="space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex items-center space-x-3 px-3 py-3 w-full rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-gray-900 dark:text-white">
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Settings size={24} />
              <span className="text-gray-900 dark:text-white">Settings</span>
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-3 py-3 w-full rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut size={24} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}