'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, UserPlus, UserCheck } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProfilePictureUrl } from '@/utils/urls';

interface UserCardProps {
  user: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    followersCount: number;
    postsCount?: number;
    isVerified: boolean;
  };
  onFollow?: (userId: string, isFollowing: boolean) => void;
}

export function UserCard({ user, onFollow }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await usersApi.follow(user.username);
      const newFollowingState = response.data.isFollowing;
      
      setIsFollowing(newFollowingState);
      onFollow?.(user._id, newFollowingState);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentUser = currentUser?.id === user._id;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center justify-between">
        <Link 
          href={`/${user.username}`}
          className="flex items-center space-x-3 flex-1"
        >
          <div className="relative w-12 h-12 flex-shrink-0">
            {getProfilePictureUrl(user.profilePicture, user.username) ? (
              <img
                src={getProfilePictureUrl(user.profilePicture, user.username)!}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {user.username}
              </span>
              {user.isVerified && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.fullName}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>{user.followersCount.toLocaleString()} followers</span>
              {user.postsCount !== undefined && (
                <span>{user.postsCount} posts</span>
              )}
            </div>
          </div>
        </Link>

        {!isCurrentUser && (
          <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isFollowing
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-ig-blue text-white hover:bg-ig-blue-hover'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isFollowing ? (
              <>
                <UserCheck size={16} />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Follow</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}