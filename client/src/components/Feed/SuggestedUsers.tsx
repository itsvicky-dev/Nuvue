'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProfilePictureUrl } from '@/utils/urls';
import { User, UserPlus } from 'lucide-react';

interface SuggestedUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  followersCount: number;
  isVerified: boolean;
}

export function SuggestedUsers() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await usersApi.getSuggestions(5);
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

  if (!user || isLoading) {
    return (
      <div className="card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
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

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Suggested for you
        </h3>
        <Link 
          href="/search" 
          className="text-sm text-ig-blue hover:text-ig-blue-hover font-medium"
        >
          See All
        </Link>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center justify-between">
            <Link 
              href={`/${suggestedUser.username}`}
              className="flex items-center space-x-3 flex-1"
            >
              <div className="relative w-8 h-8 flex-shrink-0">
                {getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username) ? (
                  <img
                    src={getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username)!}
                    alt={suggestedUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-500 dark:text-gray-400" />
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestedUser.fullName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {suggestedUser.followersCount} followers
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleFollow(suggestedUser.username, suggestedUser._id)}
              disabled={followingUsers.has(suggestedUser._id)}
              className="flex items-center space-x-1 px-3 py-1 bg-ig-blue text-white text-xs font-medium rounded-lg hover:bg-ig-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus size={14} />
              <span>{followingUsers.has(suggestedUser._id) ? 'Following' : 'Follow'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}