'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hash, TrendingUp } from 'lucide-react';

interface TrendingHashtag {
  _id: string;
  hashtag: string;
  count: number;
  trending: boolean;
}

interface TrendingHashtagsProps {
  variant?: 'compact' | 'full';
  showTitle?: boolean;
  maxHashtags?: number;
}

export function TrendingHashtags({ 
  variant = 'full', 
  showTitle = true, 
  maxHashtags = 10 
}: TrendingHashtagsProps) {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockHashtags: TrendingHashtag[] = [
        { _id: '1', hashtag: 'photography', count: 1250, trending: true },
        { _id: '2', hashtag: 'travel', count: 980, trending: true },
        { _id: '3', hashtag: 'foodie', count: 742, trending: false },
        { _id: '4', hashtag: 'nature', count: 651, trending: true },
        { _id: '5', hashtag: 'art', count: 543, trending: false },
        { _id: '6', hashtag: 'fitness', count: 432, trending: true },
        { _id: '7', hashtag: 'music', count: 387, trending: false },
        { _id: '8', hashtag: 'fashion', count: 321, trending: true },
        { _id: '9', hashtag: 'technology', count: 298, trending: false },
        { _id: '10', hashtag: 'sunset', count: 276, trending: true },
      ];
      
      setHashtags(mockHashtags.slice(0, maxHashtags));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch trending hashtags:', error);
      setIsLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
        <div className="animate-pulse">
          {showTitle && (
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
          )}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Trending Hashtags
          </h3>
          <Link 
            href="/explore/hashtags" 
            className="text-sm text-ig-blue hover:text-ig-blue-hover font-medium"
          >
            See All
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {hashtags.map((hashtag, index) => (
          <Link
            key={hashtag._id}
            href={`/explore/hashtag/${hashtag.hashtag}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-4">
                  {index + 1}
                </span>
                {hashtag.trending && (
                  <TrendingUp size={14} className="text-ig-blue" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Hash size={16} className="text-gray-400" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-ig-blue transition-colors">
                    {hashtag.hashtag}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCount(hashtag.count)} posts
                  </p>
                </div>
              </div>
            </div>

            {hashtag.trending && (
              <div className="bg-gradient-to-r from-ig-blue to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                Hot
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}