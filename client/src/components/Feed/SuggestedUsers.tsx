'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProfilePictureUrl } from '@/utils/urls';
import { User, UserPlus, X } from 'lucide-react';

interface SuggestedUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  followersCount: number;
  isVerified: boolean;
}

interface SuggestedUsersProps {
  variant?: 'compact' | 'full' | 'sidebar';
  showTitle?: boolean;
  maxUsers?: number;
}

export function SuggestedUsers({ 
  variant = 'full', 
  showTitle = true, 
  maxUsers = 5 
}: SuggestedUsersProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await usersApi.getSuggestions(maxUsers);
      setSuggestions(response.data.suggestions || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setIsLoading(false);
    }
  };

  const handleFollow = async (username: string, userId: string) => {
    try {
      await usersApi.follow(username);
      setFollowingUsers(prev => new Set([...Array.from(prev), userId]));
      
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(user => user._id !== userId));
  };

  if (!user || isLoading) {
    if (variant === 'compact') {
      return (
        <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Compact horizontal scrolling design
  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm my-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Suggested for you
            </h3>
            <Link 
              href="/suggested-users" 
              className="text-sm text-ig-blue hover:text-ig-blue-hover font-medium"
            >
              See All
            </Link>
          </div>
        )}
        
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {suggestions.map((suggestedUser) => (
            <div key={suggestedUser._id} className="flex-shrink-0 text-center relative group">
              <button
                onClick={() => handleDismiss(suggestedUser._id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 hover:bg-gray-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
              >
                <X size={12} />
              </button>
              
              <Link href={`/${suggestedUser.username}`} className="block">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  {getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username) ? (
                    <img
                      src={getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username)!}
                      alt={suggestedUser.username}
                      className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-ig-blue to-purple-500 rounded-full flex items-center justify-center">
                      <User size={24} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="w-20">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="font-medium text-xs text-gray-900 dark:text-white truncate">
                      {suggestedUser.username}
                    </span>
                    {suggestedUser.isVerified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestedUser.followersCount} followers
                  </p>
                </div>
              </Link>
              
              <button
                onClick={() => handleFollow(suggestedUser.username, suggestedUser._id)}
                disabled={followingUsers.has(suggestedUser._id)}
                className="mt-2 w-full px-2 py-1 bg-ig-blue text-white text-xs font-medium rounded-lg hover:bg-ig-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {followingUsers.has(suggestedUser._id) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sidebar compact design
  if (variant === 'sidebar') {
    return (
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center justify-between">
            <Link 
              href={`/${suggestedUser.username}`}
              className="flex items-center space-x-3 flex-1 min-w-0"
            >
              <div className="relative w-8 h-8 flex-shrink-0">
                {getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username) ? (
                  <img
                    src={getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username)!}
                    alt={suggestedUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ig-blue to-purple-500 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {suggestedUser.username}
                  </span>
                  {suggestedUser.isVerified && (
                    <span className="text-blue-500 text-xs">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {suggestedUser.fullName}
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleFollow(suggestedUser.username, suggestedUser._id)}
              disabled={followingUsers.has(suggestedUser._id)}
              className="text-xs text-ig-blue hover:text-ig-blue-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {followingUsers.has(suggestedUser._id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Full design (original enhanced)
  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Suggested for you
          </h3>
          <Link 
            href="/suggested-users" 
            className="text-sm text-ig-blue hover:text-ig-blue-hover font-medium"
          >
            See All
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center justify-between group">
            <Link 
              href={`/${suggestedUser.username}`}
              className="flex items-center space-x-3 flex-1 min-w-0"
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                {getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username) ? (
                  <img
                    src={getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username)!}
                    alt={suggestedUser.username}
                    className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-ig-blue transition-colors"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ig-blue to-purple-500 rounded-full flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {suggestedUser.username}
                  </span>
                  {suggestedUser.isVerified && (
                    <span className="text-blue-500 text-xs">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {suggestedUser.fullName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {suggestedUser.followersCount} followers
                </p>
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDismiss(suggestedUser._id)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <button
                onClick={() => handleFollow(suggestedUser.username, suggestedUser._id)}
                disabled={followingUsers.has(suggestedUser._id)}
                className="flex items-center space-x-1 px-3 py-1 bg-ig-blue text-white text-xs font-medium rounded-lg hover:bg-ig-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={12} />
                <span>{followingUsers.has(suggestedUser._id) ? 'Following' : 'Follow'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}