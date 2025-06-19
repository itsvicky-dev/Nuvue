'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import { Post } from './Post';
import { Reel } from './Reel';
import { StoriesBar } from '../Stories/StoriesBar';
import { SuggestedUsers } from './SuggestedUsers';

export function Feed() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getCombinedFeed(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StoriesBar />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            </div>
            <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load feed. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StoriesBar />
      
      {posts?.data?.posts?.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Nuvue!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Follow some accounts to see their posts in your feed.
          </p>
          <Link href="/search" className="btn-primary">
            Find people to follow
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.data?.posts?.map((item: any, index: number) => (
            <div key={item._id}>
              {item.type === 'reel' ? (
                <Reel reel={item} />
              ) : (
                <Post post={item} />
              )}
              {/* Show suggestions after 2nd item */}
              {index === 1 && <SuggestedUsers variant="compact" maxUsers={6} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}