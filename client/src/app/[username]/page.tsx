'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { usersApi, postsApi } from '@/lib/api';
import { getProfilePictureUrl, getImageUrl } from '@/utils/urls';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { FollowersModal } from '@/components/Profile/FollowersModal';
import { PostModal } from '@/components/Profile/PostModal';
import { 
  Grid, 
  Heart, 
  MessageCircle, 
  Settings, 
  UserPlus, 
  UserMinus,
  MoreHorizontal,
  Bookmark,
  Tag,
  Play
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  isVerified: boolean;
}

interface Post {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  type: 'image' | 'video' | 'carousel';
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  
  const { user } = useAuth();

  useEffect(() => {
    if (username) {
      fetchProfile(username);
      fetchUserPosts(username);
    }
  }, [username]);

  const fetchProfile = async (username: string) => {
    try {
      setIsLoading(true);
      const response = await usersApi.getProfile(username);
      const userData = response.data.user;
      
      const userProfile: UserProfile = {
        id: userData._id,
        username: userData.username,
        fullName: userData.fullName || userData.username,
        bio: userData.bio || '',
        avatar: userData.profilePicture || '',
        postsCount: userData.postsCount || 0,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        isFollowing: userData.isFollowing || false,
        isOwnProfile: userData._id === user?.id,
        isVerified: userData.isVerified || false
      };
      
      setProfile(userProfile);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async (username: string) => {
    try {
      const response = await postsApi.getUserPosts(username);
      const postsData = response.data.posts || [];
      
      // Store full post data for modal
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      const response = await usersApi.follow(profile.username);
      const isFollowing = response.data.isFollowing;
      
      setProfile(prev => prev ? {
        ...prev,
        isFollowing,
        followersCount: isFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      } : null);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handlePostClick = (index: number) => {
    setSelectedPostIndex(index);
    setIsPostModalOpen(true);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setIsPostModalOpen(false);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="flex">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 md:ml-64">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ig-blue"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="flex">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 md:ml-64">
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                User not found
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                The user @{username} doesn't exist or has been deleted.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
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
            {/* Profile Header */}
            <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {getProfilePictureUrl(profile.avatar, profile.username) ? (
                    <img
                      src={getProfilePictureUrl(profile.avatar, profile.username)!}
                      alt={profile.username}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-600 dark:text-gray-300">
                        {profile.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.username}
                      {profile.isVerified && (
                        <span className="ml-2 text-ig-blue">✓</span>
                      )}
                    </h1>

                    <div className="flex items-center space-x-2">
                      {profile.isOwnProfile ? (
                        <button className="btn-secondary px-4 py-2 text-sm">
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                              profile.isFollowing
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'btn-primary'
                            }`}
                          >
                            {profile.isFollowing ? (
                              <>
                                <UserMinus size={16} className="inline mr-1" />
                                Unfollow
                              </>
                            ) : (
                              <>
                                <UserPlus size={16} className="inline mr-1" />
                                Follow
                              </>
                            )}
                          </button>
                          <button className="btn-secondary px-4 py-2 text-sm">
                            Message
                          </button>
                        </>
                      )}
                      
                      <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center md:justify-start space-x-8 mb-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {profile.postsCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        posts
                      </div>
                    </div>
                    
                    <button 
                      className="text-center hover:text-ig-blue transition-colors"
                      onClick={() => setIsFollowersModalOpen(true)}
                    >
                      <div className="font-bold text-gray-900 dark:text-white">
                        {profile.followersCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        followers
                      </div>
                    </button>
                    
                    <button 
                      className="text-center hover:text-ig-blue transition-colors"
                      onClick={() => setIsFollowingModalOpen(true)}
                    >
                      <div className="font-bold text-gray-900 dark:text-white">
                        {profile.followingCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        following
                      </div>
                    </button>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {profile.fullName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'posts'
                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Grid size={16} className="inline mr-2" />
                    POSTS
                  </button>
                  
                  {profile.isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('saved')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'saved'
                          ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Bookmark size={16} className="inline mr-2" />
                      SAVED
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('tagged')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'tagged'
                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Tag size={16} className="inline mr-2" />
                    TAGGED
                  </button>
                </nav>
              </div>
            </div>

            {/* Posts Grid */}
            {activeTab === 'posts' && (
              <div>
                {posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {posts.map((post, index) => (
                      <div
                        key={post._id}
                        className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                        onClick={() => handlePostClick(index)}
                      >
                        {/* Render video or image based on type */}
                        {post.media?.[0]?.type === 'video' ? (
                          <video
                            src={getImageUrl(post.media[0].url)}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            muted
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                          />
                        ) : (
                          <img
                            src={getImageUrl(post.media?.[0]?.url || '')}
                            alt="Post"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.svg';
                            }}
                          />
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart size={20} fill="white" />
                              <span className="font-semibold">{post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={20} fill="white" />
                              <span className="font-semibold">{post.comments?.length || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Video indicator */}
                        {post.media?.[0]?.type === 'video' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-black bg-opacity-50 rounded-full p-1">
                              <Play size={12} className="text-white" fill="white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Grid size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {profile.isOwnProfile ? 'Start sharing your moments!' : 'No posts to show'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Saved/Tagged tabs placeholder */}
            {(activeTab === 'saved' || activeTab === 'tagged') && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'saved' ? (
                    <Bookmark size={24} className="text-gray-400" />
                  ) : (
                    <Tag size={24} className="text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {activeTab === 'saved' ? 'No saved posts' : 'No tagged posts'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'saved' 
                    ? 'Save posts you want to see again' 
                    : 'Posts where you\'ve been tagged will appear here'
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

      {/* Modals */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        username={username}
        title="Followers"
        type="followers"
      />
      
      <FollowersModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        username={username}
        title="Following"
        type="following"
      />

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        posts={posts}
        initialPostIndex={selectedPostIndex}
        onPostDeleted={handlePostDeleted}
      />
    </div>
  );
}