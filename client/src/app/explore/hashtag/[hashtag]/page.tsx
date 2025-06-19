'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { ArrowLeft, Hash, TrendingUp, Grid3X3, Bookmark } from 'lucide-react';

interface HashtagPost {
  _id: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  type: 'image' | 'video';
}

export default function HashtagPage() {
  const params = useParams();
  const hashtag = params.hashtag as string;
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>('recent');
  const { user } = useAuth();

  useEffect(() => {
    if (hashtag) {
      fetchHashtagPosts();
    }
  }, [hashtag, activeTab]);

  const fetchHashtagPosts = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPosts: HashtagPost[] = Array.from({ length: 12 }, (_, i) => ({
        _id: `post-${i}`,
        imageUrl: `https://picsum.photos/400/400?random=${i}`,
        likesCount: Math.floor(Math.random() * 1000),
        commentsCount: Math.floor(Math.random() * 100),
        type: Math.random() > 0.7 ? 'video' : 'image'
      }));
      
      setPosts(mockPosts);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch hashtag posts:', error);
      setIsLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
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
            <div className="flex items-center space-x-4 mb-6">
              <Link 
                href="/explore"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Hash size={24} className="text-gray-600 dark:text-gray-400" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {hashtag}
                  </h1>
                  <TrendingUp size={20} className="text-ig-blue" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatCount(Math.floor(Math.random() * 10000))} posts
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setActiveTab('top')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'top'
                    ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Top Posts
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-3 gap-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-300 dark:bg-gray-600 animate-pulse rounded-lg"></div>
                ))}
              </div>
            )}

            {/* Posts grid */}
            {!isLoading && (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/post/${post._id}`}
                    className="aspect-square relative group overflow-hidden rounded-lg"
                  >
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-4 text-white">
                        <div className="flex items-center space-x-1">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span className="text-sm font-medium">{formatCount(post.likesCount)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M21 6h-2l-1.27-1.27c-.38-.38-.89-.59-1.41-.59H7.68c-.53 0-1.04.21-1.41.59L5 6H3c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8h1c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                          </svg>
                          <span className="text-sm font-medium">{formatCount(post.commentsCount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Video indicator */}
                    {post.type === 'video' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-12">
                <Hash size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No posts found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Be the first to post with #{hashtag}
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