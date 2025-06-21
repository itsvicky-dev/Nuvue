'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { getImageUrl, getProfilePictureUrl } from '@/utils/urls';
import { CustomVideoPlayer } from '@/components/ui/CustomVideoPlayer';
import { EditPostModal } from './EditPostModal';

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
  isSaved?: boolean;
  likesCount?: number;
  commentsData?: any[];
}

interface FeedStylePostViewProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  initialPostIndex: number;
  onPostDeleted?: (postId: string) => void;
}

export function FeedStylePostView({ 
  isOpen, 
  onClose, 
  posts, 
  initialPostIndex, 
  onPostDeleted 
}: FeedStylePostViewProps) {
  const [postsData, setPostsData] = useState<Post[]>([]);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<{[key: string]: string}>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<{[key: string]: boolean}>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && posts.length > 0) {
      // Initialize posts data with proper state
      const initializedPosts = posts.map(post => ({
        ...post,
        isLiked: post.isLiked || false,
        isSaved: false, // You might want to add this to the Post interface
        likesCount: Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0),
        commentsData: Array.isArray(post.comments) 
          ? post.comments.filter(comment => comment && typeof comment === 'object')
          : []
      }));
      setPostsData(initializedPosts);
      setImageErrors(new Set());
    }
  }, [isOpen, posts]);

  const handleLike = async (postId: string, currentIsLiked: boolean) => {
    try {
      const response = await postsApi.likePost(postId);
      
      // Update the specific post in the array
      setPostsData(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isLiked: response.data.isLiked,
              likesCount: response.data.likesCount 
            }
          : post
      ));
      
      // Invalidate queries to keep data in sync
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    } catch (error) {
      console.error('Failed to like post:', error);
      toast({
        title: 'Error',
        description: 'Failed to like post',
        type: 'error'
      });
    }
  };

  const handleSave = async (postId: string, currentIsSaved: boolean) => {
    try {
      const response = await postsApi.savePost(postId);
      
      // Update the specific post in the array
      setPostsData(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, isSaved: response.data.isSaved }
          : post
      ));
      
      toast({
        title: response.data.isSaved ? 'Post saved' : 'Post unsaved',
        type: 'success'
      });
      
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save post',
        type: 'error'
      });
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = newComments[postId];
    if (!commentText?.trim()) return;

    try {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
      const response = await postsApi.addComment(postId, commentText);
      
      const newCommentData = response.data.comment;
      if (newCommentData && typeof newCommentData === 'object') {
        setPostsData(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, commentsData: [...(post.commentsData || []), newCommentData] }
            : post
        ));
      }
      
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      
      toast({
        title: 'Comment added',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        type: 'error'
      });
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsApi.deletePost(postId);
      onPostDeleted?.(postId);
      
      // Remove from local state
      setPostsData(prev => prev.filter(post => post._id !== postId));
      
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully.',
        type: 'success'
      });
      
      setShowOptions(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete post. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
    setShowOptions(null);
  };

  const handlePostUpdated = (updatedPost: any) => {
    setPostsData(prev => prev.map(post => 
      post._id === updatedPost._id ? { ...post, ...updatedPost } : post
    ));
    setEditingPost(null);
  };

  const handleImageError = (postId: string) => {
    setImageErrors(prev => new Set([...prev, postId]));
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Posts</h2>
        <div></div> {/* Spacer for centering */}
      </div>

      {/* Feed-style posts */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {postsData.map((post) => {
          const isOwner = user?.id === post.author?._id;
          const hasImageError = imageErrors.has(post._id);
          
          return (
            <article key={post._id} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Link href={`/${post.author?.username}`}>
                    <div className="relative w-8 h-8">
                      {getProfilePictureUrl(post.author?.profilePicture, post.author?.username) ? (
                        <Image
                          src={getProfilePictureUrl(post.author?.profilePicture, post.author?.username)!}
                          alt={post.author?.username}
                          fill
                          className="rounded-full object-cover"
                          onError={() => {/* Handle profile pic error silently */}}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {post.author?.username?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link 
                      href={`/${post.author?.username}`}
                      className="font-semibold text-sm text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {post.author?.username}
                      {post.author?.isVerified && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {/* Edit icon for owner's posts */}
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowOptions(showOptions === post._id ? null : post._id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {showOptions === post._id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-10 min-w-[120px]">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left text-red-600"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Media */}
              <div className="relative aspect-square">
                {post.media?.[0]?.type === 'video' ? (
                  <CustomVideoPlayer
                    src={getImageUrl(post.media[0].url)}
                    className="w-full h-full"
                    autoPlay={false}
                    muted={true}
                    loop={true}
                  />
                ) : (
                  <>
                    {hasImageError ? (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">Failed to load image</p>
                      </div>
                    ) : (
                      <Image
                        src={getImageUrl(post.media?.[0]?.url || post.imageUrl || '')}
                        alt="Post content"
                        fill
                        className="object-cover"
                        onError={() => handleImageError(post._id)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(post._id, post.isLiked || false)}
                      className={`p-2 -m-2 ${post.isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} hover:text-gray-500 dark:hover:text-gray-400`}
                    >
                      <Heart 
                        size={24} 
                        fill={post.isLiked ? 'currentColor' : 'none'}
                        className={post.isLiked ? 'animate-heart' : ''}
                      />
                    </button>
                    <button className="p-2 -m-2 text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400">
                      <MessageCircle size={24} />
                    </button>
                    <button className="p-2 -m-2 text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400">
                      <Send size={24} />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleSave(post._id, post.isSaved || false)}
                    className={`p-2 -m-2 ${post.isSaved ? 'text-ig-blue' : 'text-gray-700 dark:text-gray-200'} hover:text-gray-500 dark:hover:text-gray-400`}
                  >
                    <Bookmark size={24} fill={post.isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Likes Count */}
                {post.likesCount > 0 && (
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                  </p>
                )}

                {/* Caption */}
                {post.caption && (
                  <div className="mb-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
                      {post.author?.username}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {post.caption}
                    </span>
                  </div>
                )}

                {/* Comments */}
                {Array.isArray(post.commentsData) && post.commentsData.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View all {post.commentsData.length} comments
                    </p>
                    {post.commentsData.slice(0, 2).filter(comment => comment && typeof comment === 'object').map((comment: any, index: number) => {
                      const commentText = String(comment.text || comment.content || '');
                      const commentAuthor = comment.author || comment.user || {};
                      const commentId = comment._id || comment.id || `comment-${index}`;
                      
                      if (!commentText.trim()) return null;
                      
                      return (
                        <div key={commentId} className="flex items-start space-x-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {String(commentAuthor.username || 'Unknown User')}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white flex-1">
                            {commentText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Comment */}
                <form onSubmit={(e) => handleAddComment(post._id, e)} className="flex items-center space-x-3 pt-3 border-t dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComments[post._id] || ''}
                    onChange={(e) => setNewComments(prev => ({ ...prev, [post._id]: e.target.value }))}
                    className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
                  />
                  {(newComments[post._id]?.trim()) && (
                    <button
                      type="submit"
                      disabled={isSubmittingComment[post._id]}
                      className="text-sm font-semibold text-ig-blue hover:text-ig-blue-hover disabled:opacity-50"
                    >
                      {isSubmittingComment[post._id] ? 'Posting...' : 'Post'}
                    </button>
                  )}
                </form>
              </div>
            </article>
          );
        })}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          post={editingPost}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}