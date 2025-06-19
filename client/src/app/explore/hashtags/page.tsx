'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { ArrowLeft, Hash, TrendingUp, Search, X } from 'lucide-react';

interface TrendingHashtag {
  _id: string;
  hashtag: string;
  count: number;
  trending: boolean;
  growth: number;
}

export default function HashtagsPage() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [filteredHashtags, setFilteredHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'all'>('trending');
  const { user } = useAuth();

  useEffect(() => {
    fetchHashtags();
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHashtags(hashtags);
    } else {
      const filtered = hashtags.filter(hashtag => 
        hashtag.hashtag.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHashtags(filtered);
    }
  }, [searchQuery, hashtags]);

  const fetchHashtags = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockHashtags: TrendingHashtag[] = [
        { _id: '1', hashtag: 'photography', count: 12500, trending: true, growth: 15.2 },
        { _id: '2', hashtag: 'travel', count: 9800, trending: true, growth: 12.8 },
        { _id: '3', hashtag: 'foodie', count: 7420, trending: false, growth: -2.1 },
        { _id: '4', hashtag: 'nature', count: 6510, trending: true, growth: 18.5 },
        { _id: '5', hashtag: 'art', count: 5430, trending: false, growth: 3.2 },
        { _id: '6', hashtag: 'fitness', count: 4320, trending: true, growth: 22.1 },
        { _id: '7', hashtag: 'music', count: 3870, trending: false, growth: -1.5 },
        { _id: '8', hashtag: 'fashion', count: 3210, trending: true, growth: 8.7 },
        { _id: '9', hashtag: 'technology', count: 2980, trending: false, growth: 5.3 },
        { _id: '10', hashtag: 'sunset', count: 2760, trending: true, growth: 25.6 },
        { _id: '11', hashtag: 'love', count: 45600, trending: false, growth: 1.2 },
        { _id: '12', hashtag: 'happy', count: 34200, trending: false, growth: 0.8 },
        { _id: '13', hashtag: 'beautiful', count: 28900, trending: false, growth: 2.1 },
        { _id: '14', hashtag: 'instagood', count: 67800, trending: false, growth: -0.5 },
        { _id: '15', hashtag: 'amazing', count: 23400, trending: false, growth: 3.4 },
      ];
      
      const filtered = activeTab === 'trending' 
        ? mockHashtags.filter(h => h.trending)
        : mockHashtags;
      
      setHashtags(filtered.sort((a, b) => b.count - a.count));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch hashtags:', error);
      setIsLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-gray-500';
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
                  href="/explore"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Trending Hashtags
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Discover what's popular right now
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search hashtags..."
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

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp size={16} />
                  <span>Trending</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Hash size={16} />
                  <span>All Hashtags</span>
                </div>
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hashtags list */}
            {!isLoading && (
              <div className="space-y-3">
                {filteredHashtags.map((hashtag, index) => (
                  <Link
                    key={hashtag._id}
                    href={`/explore/hashtag/${hashtag.hashtag}`}
                    className="block bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                            #{index + 1}
                          </span>
                          {hashtag.trending && (
                            <TrendingUp size={16} className="text-ig-blue" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Hash size={20} className="text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-ig-blue transition-colors">
                              {hashtag.hashtag}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCount(hashtag.count)} posts
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {hashtag.growth !== 0 && (
                          <div className={`text-sm font-medium ${getGrowthColor(hashtag.growth)}`}>
                            {hashtag.growth > 0 ? '+' : ''}{hashtag.growth.toFixed(1)}%
                          </div>
                        )}
                        
                        {hashtag.trending && (
                          <div className="bg-gradient-to-r from-ig-blue to-purple-500 text-white text-xs px-3 py-1 rounded-full">
                            Hot
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredHashtags.length === 0 && (
              <div className="text-center py-12">
                <Hash size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No hashtags found' : 'No hashtags available'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try searching with different keywords' 
                    : 'Check back later for trending hashtags'
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