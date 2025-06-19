'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { Search, Grid, Heart, MessageCircle } from 'lucide-react';

interface Post {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  type: 'image' | 'video' | 'carousel';
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  // Auto-play videos sequentially
  useEffect(() => {
    if (posts.length === 0) return;

    const videoPosts = posts.filter(post => post.type === 'video');
    if (videoPosts.length === 0) return;

    let currentIndex = 0;
    const playNextVideo = () => {
      if (currentIndex < videoPosts.length) {
        const currentPost = videoPosts[currentIndex];
        setCurrentPlayingVideo(currentPost.id);
        
        // Play for 3 seconds then move to next
        setTimeout(() => {
          currentIndex++;
          if (currentIndex >= videoPosts.length) {
            currentIndex = 0; // Loop back to first video
          }
          playNextVideo();
        }, 3000); // 3 seconds per video
      }
    };

    // Start playing videos after 1 second
    const timer = setTimeout(playNextVideo, 1000);
    
    return () => {
      clearTimeout(timer);
      setCurrentPlayingVideo(null);
    };
  }, [posts]);

  const fetchExplorePosts = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsLoadingMore(true);
      }
      
      // Fetch trending posts and posts from followed users
      const [trendingResponse, followedResponse] = await Promise.all([
        fetch(`/api/posts/trending?page=${pageNum}&limit=15`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`/api/posts/following?page=${pageNum}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      ]);

      const trendingData = trendingResponse.ok ? await trendingResponse.json() : { posts: [], hasMore: false };
      const followedData = followedResponse.ok ? await followedResponse.json() : { posts: [], hasMore: false };
      
      console.log('API Response - Trending:', trendingData);
      console.log('API Response - Following:', followedData);
      
      // Combine and shuffle trending posts with posts from followed users
      // Prioritize posts from followed users
      const combinedPosts = [
        ...followedData.posts.slice(0, 10), // First 10 posts from followed users
        ...trendingData.posts.slice(0, 15), // Then 15 trending posts
        ...followedData.posts.slice(10),    // Rest of followed posts
        ...trendingData.posts.slice(15)     // Rest of trending posts
      ];

      // Remove duplicates based on post ID
      const uniquePosts = combinedPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );

      if (append) {
        setPosts(prev => [...prev, ...uniquePosts]);
      } else {
        setPosts(uniquePosts);
      }
      
      // Check if there are more posts to load
      setHasMore(trendingData.hasMore || followedData.hasMore);
      
      setIsLoading(false);
      setIsLoadingMore(false);
    } catch (error) {
      console.error('Failed to fetch explore posts:', error);
      setIsLoading(false);
      setIsLoadingMore(false);
      
      // Fallback: show empty state or retry option
      if (!append) {
        setPosts([]);
      }
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || isLoadingMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchExplorePosts(nextPage, true);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // Implement search functionality here
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

            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ig-blue"></div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Explore
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Grid size={20} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {posts.length} posts
                    </span>
                  </div>
                </div>

                {/* Posts Grid */}
                {posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                      >
                        {/* Render video or image based on type */}
                        {post.type === 'video' ? (
                          <video
                            key={post.id}
                            src={post.imageUrl}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            muted
                            playsInline
                            autoPlay={currentPlayingVideo === post.id}
                            ref={(video) => {
                              if (video && currentPlayingVideo === post.id) {
                                video.currentTime = 0;
                                video.play().catch(console.error);
                              } else if (video && currentPlayingVideo !== post.id) {
                                video.pause();
                                video.currentTime = 0;
                              }
                            }}
                            onMouseEnter={(e) => {
                              // Pause auto-play when user hovers
                              e.currentTarget.play();
                            }}
                            onMouseLeave={(e) => {
                              // Resume auto-play behavior when mouse leaves
                              if (currentPlayingVideo !== post.id) {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }
                            }}
                          />
                        ) : (
                          <img
                            src={post.imageUrl}
                            alt="Explore post"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              console.error('Image failed to load:', post.imageUrl);
                              e.currentTarget.src = '/placeholder-image.svg'; // Fallback image
                            }}
                          />
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart size={20} fill="white" />
                              <span className="font-semibold">{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={20} fill="white" />
                              <span className="font-semibold">{post.comments}</span>
                            </div>
                          </div>
                        </div>

                        {/* Post type indicator */}
                        {post.type === 'video' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-black bg-opacity-50 rounded-full p-1">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Carousel indicator */}
                        {post.type === 'carousel' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-black bg-opacity-50 rounded-full p-1">
                              <Grid size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Grid size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No posts to explore yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Follow some users to see their posts here, or check back later for trending content.
                    </p>
                    <button 
                      onClick={() => fetchExplorePosts()}
                      className="btn-primary px-4 py-2"
                    >
                      Refresh
                    </button>
                  </div>
                )}

                {/* Load More */}
                {posts.length > 0 && hasMore && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={loadMorePosts}
                      disabled={isLoadingMore}
                      className="btn-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Posts'
                      )}
                    </button>
                  </div>
                )}
              </>
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