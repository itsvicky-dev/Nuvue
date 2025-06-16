'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, User, UserPlus, UserCheck } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProfilePictureUrl } from '@/utils/urls';

interface User {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  isVerified: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  title: string;
  type: 'followers' | 'following';
}

export function FollowersModal({ isOpen, onClose, username, title, type }: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1);
    }
  }, [isOpen, username, type]);

  const fetchUsers = async (pageNum: number) => {
    try {
      setIsLoading(true);
      
      const response = type === 'followers' 
        ? await usersApi.getFollowers(username, pageNum)
        : await usersApi.getFollowing(username, pageNum);
        
      const newUsers = response.data[type] || [];
      
      if (pageNum === 1) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }
      
      setHasMore(newUsers.length === 20); // Assuming 20 is the limit
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage);
    }
  };

  const handleFollow = async (targetUsername: string, userId: string) => {
    try {
      await usersApi.follow(targetUsername);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const isCurrentUser = (userId: string) => currentUser?.id === userId;
  const isProfileOwner = currentUser?.username === username;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface rounded-lg w-full max-w-md max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ig-blue mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <div key={user._id} className="p-4 flex items-center justify-between">
                  <Link 
                    href={`/${user.username}`}
                    className="flex items-center space-x-3 flex-1"
                    onClick={onClose}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {getProfilePictureUrl(user.profilePicture, user.username) ? (
                        <img
                          src={getProfilePictureUrl(user.profilePicture, user.username)!}
                          alt={user.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {user.username}
                        </span>
                        {user.isVerified && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.fullName}
                      </p>
                    </div>
                  </Link>

                  {!isCurrentUser(user._id) && (
                    <button
                      onClick={() => handleFollow(user.username, user._id)}
                      className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        followingUsers.has(user._id)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-ig-blue text-white hover:bg-ig-blue-hover'
                      }`}
                    >
                      {followingUsers.has(user._id) ? (
                        <>
                          <UserCheck size={12} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="text-ig-blue hover:text-ig-blue-hover font-medium text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}