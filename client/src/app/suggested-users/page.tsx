'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { usersApi } from '@/lib/api';
import { getProfilePictureUrl } from '@/utils/urls';
import { User, UserPlus, ArrowLeft, Search, X } from 'lucide-react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';

interface SuggestedUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  followersCount: number;
  isVerified: boolean;
  bio?: string;
  mutualFollowersCount?: number;
}

export default function SuggestedUsersPage() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuggestions(suggestions);
    } else {
      const filtered = suggestions.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [searchQuery, suggestions]);

  const fetchSuggestions = async () => {
    try {
      const response = await usersApi.getSuggestions(20);
      const users = response.data.suggestions || [];
      
      // Add mock data for better display
      const enhancedUsers = users.map((user: any) => ({
        ...user,
        bio: user.bio || 'Love sharing moments and connecting with friends',
        mutualFollowersCount: Math.floor(Math.random() * 10)
      }));
      
      setSuggestions(enhancedUsers);
      setFilteredSuggestions(enhancedUsers);
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
      setFilteredSuggestions(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(user => user._id !== userId));
    setFilteredSuggestions(prev => prev.filter(user => user._id !== userId));
  };

  if (!user) {
    return null;
  }

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
                <Link 
                  href="/"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Suggested for you
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Discover accounts you might like
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search suggested users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-ig-blue focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full mb-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuggestions.map((suggestedUser) => (
                  <div 
                    key={suggestedUser._id} 
                    className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group"
                  >
                    <button
                      onClick={() => handleDismiss(suggestedUser._id)}
                      className="absolute top-3 right-3 w-6 h-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                      <Link href={`/${suggestedUser.username}`} className="block">
                        <div className="relative w-20 h-20 mb-4">
                          {getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username) ? (
                            <img
                              src={getProfilePictureUrl(suggestedUser.profilePicture, suggestedUser.username)!}
                              alt={suggestedUser.username}
                              className="w-full h-full rounded-full object-cover border-3 border-gray-200 dark:border-gray-700 hover:border-ig-blue transition-colors"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-ig-blue to-purple-500 rounded-full flex items-center justify-center">
                              <User size={32} className="text-white" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <Link href={`/${suggestedUser.username}`} className="block mb-4">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white hover:text-ig-blue transition-colors">
                            {suggestedUser.username}
                          </h3>
                          {suggestedUser.isVerified && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {suggestedUser.fullName}
                        </p>
                        {suggestedUser.bio && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-2">
                            {suggestedUser.bio}
                          </p>
                        )}
                        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{suggestedUser.followersCount} followers</span>
                          {suggestedUser.mutualFollowersCount && suggestedUser.mutualFollowersCount > 0 && (
                            <span>{suggestedUser.mutualFollowersCount} mutual</span>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={() => handleFollow(suggestedUser.username, suggestedUser._id)}
                        disabled={followingUsers.has(suggestedUser._id)}
                        className="flex items-center space-x-2 px-6 py-2 bg-ig-blue text-white font-medium rounded-lg hover:bg-ig-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <UserPlus size={16} />
                        <span>{followingUsers.has(suggestedUser._id) ? 'Following' : 'Follow'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No users found' : 'No suggestions available'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try searching with different keywords' 
                    : 'Check back later for new suggestions'
                  }
                </p>
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