'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { usersApi, postsApi, reelsApi } from '@/lib/api';
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
  Play,
  X,
  ChevronLeft,
  ChevronRight
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
  isPrivate: boolean;
  isRequested?: boolean;
}

interface Post {
  _id: string;
  id: string;
  imageUrl: string;
  likes: any[] | number;
  comments: any[] | number;
  type: 'image' | 'video' | 'carousel';
  media: any[];
  caption: string;
  author?: any;
  createdAt?: string;
  isLiked?: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedReels, setSavedReels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged' | 'followers' | 'following' | 'post-detail'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { user, isLoading: authLoading } = useAuth();

  // Helper function to check if posts/reels content should be visible
  const canViewContent = () => {
    if (!profile) return false;
    // If user is not logged in, only show public profiles
    if (!user) return !profile.isPrivate;
    if (profile.isOwnProfile) return true;
    if (!profile.isPrivate) return true;
    // For private accounts, only followers can see content
    console.log("Checking visibility:", profile.isPrivate, profile.isFollowing, profile);
    return profile.isFollowing;
  };

  // Helper function to check if followers/following lists should be visible
  const canViewFollowLists = () => {
    if (!profile) return false;
    // If user is not logged in, only show public profiles
    if (!user) return !profile.isPrivate;
    if (profile.isOwnProfile) return true;
    if (!profile.isPrivate) return true;
    return profile.isFollowing;
  };

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, [username, user]);

  useEffect(() => {
    if (username && profile && canViewContent()) {
      fetchUserPosts(username);
      fetchUserReels(username);
    }
  }, [username, profile?.isPrivate, profile?.isFollowing, profile?.isOwnProfile, user]);

  useEffect(() => {
    if (username) {
      if (activeTab === 'reels' && canViewContent()) {
        fetchUserReels(username);
      } else if (activeTab === 'saved' && profile?.isOwnProfile && canViewContent()) {
        fetchSavedContent();
      } else if (activeTab === 'followers' && canViewFollowLists()) {
        fetchFollowers(username);
      } else if (activeTab === 'following' && canViewFollowLists()) {
        fetchFollowing(username);
      }
    }
  }, [activeTab, username, profile?.isOwnProfile, profile?.isPrivate, profile?.isFollowing, user]);

  // Re-evaluate isOwnProfile when user state changes
  useEffect(() => {
    if (profile && user && !authLoading) {
      const updatedIsOwnProfile = profile.id === user.id;
      if (profile.isOwnProfile !== updatedIsOwnProfile) {
        setProfile(prev => prev ? { ...prev, isOwnProfile: updatedIsOwnProfile } : null);
      }
    }
  }, [user, profile, authLoading]);

  const fetchProfile = async (username: string) => {
    try {
      setIsLoading(true);
      const response = await usersApi.getProfile(username);
      const userData = response.data.user;
      console.log(userData);

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
        isOwnProfile: user ? userData._id === user.id : false,
        isVerified: userData.isVerified || false,
        isPrivate: userData.isPrivate || false,
        isRequested: userData.isRequested || false
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

  const fetchUserReels = async (username: string) => {
    try {
      const response = await reelsApi.getUserReels(username);
      const reelsData = response.data.reels || [];
      setReels(reelsData);
    } catch (error) {
      console.error('Failed to fetch reels:', error);
      setReels([]);
    }
  };

  const fetchSavedContent = async () => {
    try {
      // Fetch saved posts
      const postsResponse = await postsApi.getSavedPosts();
      setSavedPosts(postsResponse.data.posts || []);

      // Fetch saved reels
      const reelsResponse = await reelsApi.getSavedReels();
      setSavedReels(reelsResponse.data.reels || []);
    } catch (error) {
      console.error('Failed to fetch saved content:', error);
      setSavedPosts([]);
      setSavedReels([]);
    }
  };

  const fetchFollowers = async (username: string) => {
    try {
      const response = await usersApi.getFollowers(username, 1);
      setFollowers(response.data.followers || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
      setFollowers([]);
    }
  };

  const fetchFollowing = async (username: string) => {
    try {
      const response = await usersApi.getFollowing(username, 1);
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
      setFollowing([]);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      const response = await usersApi.follow(profile.username);
      const { isFollowing, isRequested } = response.data;

      setProfile(prev => prev ? {
        ...prev,
        isFollowing,
        isRequested,
        followersCount: isFollowing ? prev.followersCount + 1 : 
                       (prev.isFollowing && !isFollowing) ? prev.followersCount - 1 : 
                       prev.followersCount
      } : null);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleFollowUser = async (targetUsername: string) => {
    try {
      await usersApi.follow(targetUsername);
      // Refresh the followers/following lists
      if (activeTab === 'followers') {
        fetchFollowers(username);
      } else if (activeTab === 'following') {
        fetchFollowing(username);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  };

  const handlePostClick = (index: number) => {
    setSelectedPostIndex(index);
    setSelectedPost(posts[index]);
    setActiveTab('post-detail');
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setIsPostModalOpen(false);
  };

  // Allow viewing profiles even when not logged in (for public profiles)
  // if (!user) {
  //   return null;
  // }

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

                    {user && (
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
                                  : profile.isRequested
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                  : 'btn-primary'
                              }`}
                            >
                              {profile.isFollowing ? (
                                <>
                                  <UserMinus size={16} className="inline mr-1" />
                                  Unfollow
                                </>
                              ) : profile.isRequested ? (
                                <>
                                  <X size={16} className="inline mr-1" />
                                  Requested
                                </>
                              ) : (
                                <>
                                  <UserPlus size={16} className="inline mr-1" />
                                  Follow
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center md:justify-start space-x-8 mb-4">
                    <button
                      className={`text-center transition-colors ${canViewContent() ? 'hover:text-ig-blue cursor-pointer' : 'cursor-default'}`}
                      onClick={() => canViewContent() && setActiveTab('posts')}>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {profile.postsCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        posts
                      </div>
                    </button>

                    <button
                      className={`text-center transition-colors ${canViewFollowLists() ? 'hover:text-ig-blue cursor-pointer' : 'cursor-default'}`}
                      onClick={() => canViewFollowLists() && setActiveTab('followers')}
                    >
                      <div className="font-bold text-gray-900 dark:text-white">
                        {profile.followersCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        followers
                      </div>
                    </button>

                    <button
                      className={`text-center transition-colors ${canViewFollowLists() ? 'hover:text-ig-blue cursor-pointer' : 'cursor-default'}`}
                      onClick={() => canViewFollowLists() && setActiveTab('following')}
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

            {/* Tabs - Only show for main content tabs and when content is viewable */}
            {!['followers', 'following', 'post-detail'].includes(activeTab) && canViewContent() && (
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'posts'
                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <Grid size={16} className="inline mr-2" />
                      POSTS
                    </button>

                    <button
                      onClick={() => setActiveTab('reels')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reels'
                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <Play size={16} className="inline mr-2" />
                      REELS
                    </button>

                    {profile.isOwnProfile && (
                      <button
                        onClick={() => setActiveTab('saved')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved'
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
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tagged'
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
            )}

            {/* Private Account Message */}
            {!canViewContent() && !['followers', 'following', 'post-detail'].includes(activeTab) && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  This Account is Private
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Follow @{profile?.username} to see their posts and reels.
                </p>
                {user && !profile?.isFollowing && !profile?.isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      profile?.isRequested
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'btn-primary'
                    }`}
                  >
                    {profile?.isRequested ? (
                      <>
                        <X size={16} className="inline mr-2" />
                        Requested
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="inline mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Posts Grid */}
            {activeTab === 'posts' && canViewContent() && (
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
                              <span className="font-semibold">{Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={20} fill="white" />
                              <span className="font-semibold">{Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)}</span>
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

            {/* Reels Grid */}
            {activeTab === 'reels' && canViewContent() && (
              <div>
                {reels.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {reels.map((reel, index) => (
                      <div
                        key={reel._id}
                        className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                        onClick={() => {
                          // TODO: Add reel viewer modal
                          console.log('Open reel:', reel);
                        }}
                      >
                        {/* Video thumbnail/preview */}
                        <video
                          src={reel.video.url}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          muted
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart size={20} fill="white" />
                              <span className="font-semibold">{reel.likesCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={20} fill="white" />
                              <span className="font-semibold">{reel.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Play indicator */}
                        <div className="absolute top-2 right-2">
                          <div className="bg-black bg-opacity-50 rounded-full p-1">
                            <Play size={12} className="text-white" fill="white" />
                          </div>
                        </div>

                        {/* Views count */}
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                            <span className="text-white text-xs font-medium">
                              {reel.views || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No reels yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {profile.isOwnProfile ? 'Start creating reels!' : 'No reels to show'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Saved Posts and Reels */}
            {activeTab === 'saved' && profile?.isOwnProfile && canViewContent() && (
              <div>
                {(savedPosts.length > 0 || savedReels.length > 0) ? (
                  <div className="space-y-8">
                    {/* Saved Posts */}
                    {savedPosts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Saved Posts
                        </h3>
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                          {savedPosts.map((post, index) => (
                            <div
                              key={post._id}
                              className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                              onClick={() => {
                                setSelectedPost(post);
                                setActiveTab('post-detail');
                              }}
                            >
                              {post.media?.[0]?.type === 'video' ? (
                                <video
                                  src={getImageUrl(post.media[0].url)}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={getImageUrl(post.media?.[0]?.url || '')}
                                  alt="Saved Post"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                                  <div className="flex items-center space-x-1">
                                    <Heart size={20} fill="white" />
                                    <span className="font-semibold">{Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle size={20} fill="white" />
                                    <span className="font-semibold">{Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Saved Reels */}
                    {savedReels.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Saved Reels
                        </h3>
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                          {savedReels.map((reel) => (
                            <div
                              key={reel._id}
                              className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                            >
                              <video
                                src={reel.video.url}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                                  <div className="flex items-center space-x-1">
                                    <Heart size={20} fill="white" />
                                    <span className="font-semibold">{reel.likesCount || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle size={20} fill="white" />
                                    <span className="font-semibold">{reel.commentsCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2">
                                <div className="bg-black bg-opacity-50 rounded-full p-1">
                                  <Play size={12} className="text-white" fill="white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No saved posts or reels
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Save posts and reels you want to see again
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tagged tab placeholder */}
            {activeTab === 'tagged' && canViewContent() && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No tagged posts
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Posts where you've been tagged will appear here
                </p>
              </div>
            )}

            {/* Followers List */}
            {activeTab === 'followers' && canViewFollowLists() && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Followers ({profile?.followersCount || 0})
                  </h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {followers.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {followers.map((follower) => (
                        <div key={follower._id} className="p-4 flex items-center justify-between">
                          <a
                            href={`/${follower.username}`}
                            className="flex items-center space-x-3 flex-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <div className="relative w-10 h-10 flex-shrink-0">
                              {getProfilePictureUrl(follower.profilePicture, follower.username) ? (
                                <img
                                  src={getProfilePictureUrl(follower.profilePicture, follower.username)!}
                                  alt={follower.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                    {follower.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {follower.username}
                                </span>
                                {follower.isVerified && (
                                  <span className="text-blue-500 text-xs">✓</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {follower.fullName}
                              </p>
                            </div>
                          </a>
                          {user?.id !== follower._id && (
                            <button
                              onClick={() => handleFollowUser(follower.username)}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-ig-blue text-white hover:bg-ig-blue-hover transition-colors"
                            >
                              Follow
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={24} className="text-gray-400" />
                      </div>
                      <p>No followers yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Following List */}
            {activeTab === 'following' && canViewFollowLists() && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Following ({profile?.followingCount || 0})
                  </h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {following.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {following.map((followingUser) => (
                        <div key={followingUser._id} className="p-4 flex items-center justify-between">
                          <a
                            href={`/${followingUser.username}`}
                            className="flex items-center space-x-3 flex-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <div className="relative w-10 h-10 flex-shrink-0">
                              {getProfilePictureUrl(followingUser.profilePicture, followingUser.username) ? (
                                <img
                                  src={getProfilePictureUrl(followingUser.profilePicture, followingUser.username)!}
                                  alt={followingUser.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                    {followingUser.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {followingUser.username}
                                </span>
                                {followingUser.isVerified && (
                                  <span className="text-blue-500 text-xs">✓</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {followingUser.fullName}
                              </p>
                            </div>
                          </a>
                          {user?.id !== followingUser._id && (
                            <button
                              onClick={() => handleFollowUser(followingUser.username)}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Unfollow
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={24} className="text-gray-400" />
                      </div>
                      <p>Not following anyone yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post Detail View */}
            {activeTab === 'post-detail' && selectedPost && canViewContent() && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Post {selectedPostIndex + 1} of {posts.length}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const prevIndex = selectedPostIndex > 0 ? selectedPostIndex - 1 : posts.length - 1;
                        setSelectedPostIndex(prevIndex);
                        setSelectedPost(posts[prevIndex]);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      disabled={posts.length <= 1}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => {
                        const nextIndex = selectedPostIndex < posts.length - 1 ? selectedPostIndex + 1 : 0;
                        setSelectedPostIndex(nextIndex);
                        setSelectedPost(posts[nextIndex]);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      disabled={posts.length <= 1}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {/* Post Image/Video */}
                  <div className="mb-4">
                    {selectedPost.media?.[0]?.type === 'video' ? (
                      <video
                        src={getImageUrl(selectedPost.media[0].url)}
                        className="w-full max-h-96 object-contain rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={getImageUrl(selectedPost.media?.[0]?.url || '')}
                        alt="Post"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center space-x-4 mb-4">
                    <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500">
                      <Heart size={20} />
                      <span>{Array.isArray(selectedPost.likes) ? selectedPost.likes.length : (selectedPost.likes || 0)}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-ig-blue">
                      <MessageCircle size={20} />
                      <span>{Array.isArray(selectedPost.comments) ? selectedPost.comments.length : (selectedPost.comments || 0)}</span>
                    </button>
                  </div>

                  {/* Post Caption */}
                  {selectedPost.caption && (
                    <div className="mb-4">
                      <p className="text-gray-900 dark:text-white">
                        <span className="font-semibold">{profile?.username}</span> {selectedPost.caption}
                      </p>
                    </div>
                  )}

                  {/* Post Date */}
                  {selectedPost.createdAt && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(selectedPost.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
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