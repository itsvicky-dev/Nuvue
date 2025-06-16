'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocket } from '@/components/providers/SocketProvider';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  User
} from 'lucide-react';

const navigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/create', icon: PlusSquare, label: 'Create' },
  { href: '/notifications', icon: Heart, label: 'Notifications' },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border">
      <nav className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center p-2 rounded-lg transition-colors relative
                ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}
              `}
            >
              <div className="relative">
                <item.icon 
                  size={24} 
                  className={isActive ? 'fill-current' : ''} 
                />
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile Link */}
        <Link
          href={`/${user?.username}`}
          className={`
            flex flex-col items-center p-2 rounded-lg transition-colors
            ${pathname === `/${user?.username}` 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-600 dark:text-gray-400'
            }
          `}
        >
          <User size={24} />
          <span className="text-xs mt-1 font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}