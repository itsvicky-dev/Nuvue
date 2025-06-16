'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { postsApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getImageUrl, getProfilePictureUrl } from '@/utils/urls';
import { formatDistanceToNow } from 'date-fns';
import { EditPostModal } from './EditPostModal';
import { useToast } from '@/components/ui/Toaster';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: any[];
  initialPostIndex: number;
  onPostDeleted?: (postId: string) => void;
}

export function PostModal({ isOpen, onClose, posts, initialPostIndex, onPostDeleted }: PostModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPostIndex);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && posts[currentIndex]) {
      setCurrentPost(posts[currentIndex]);
      setIsLiked(posts[currentIndex].isLiked || false);
      setLikesCount(posts[currentIndex].likes?.length || 0);
      setComments(posts[currentIndex].comments || []);
    }
  }, [isOpen, currentIndex, posts]);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : posts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < posts.length - 1 ? prev + 1 : 0));
  };

  const handleLike = async () => {
    if (!currentPost) return;
    
    try {
      await postsApi.likePost(currentPost._id);
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentPost) return;

    try {
      setIsSubmittingComment(true);
      const response = await postsApi.addComment(currentPost._id, newComment);
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentPost || !window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsApi.deletePost(currentPost._id);
      onPostDeleted?.(currentPost._id);
      
      // If this was the last post, close modal
      if (posts.length === 1) {
        onClose();
      } else {
        // Move to next post or previous if at end
        const newIndex = currentIndex === posts.length - 1 ? currentIndex - 1 : currentIndex;
        setCurrentIndex(newIndex);
      }
      
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete post. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditPost = () => {
    setIsEditModalOpen(true);
    setShowOptions(false);
  };

  const handlePostUpdated = (updatedPost: any) => {
    setCurrentPost(updatedPost);
    // Update the post in the posts array
    posts[currentIndex] = updatedPost;
  };

  if (!isOpen || !currentPost) return null;

  const isOwner = user?.id === currentPost.author?._id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] flex overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
        >
          <X size={20} />
        </button>

        {/* Navigation arrows */}
        {posts.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image/Video */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {currentPost.media && currentPost.media[0] && (
            currentPost.media[0].type === 'video' ? (
              <video
                src={getImageUrl(currentPost.media[0].url)}
                controls
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={getImageUrl(currentPost.media[0].url)}
                alt="Post"
                className="max-w-full max-h-full object-contain"
              />
            )
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8">
                {getProfilePictureUrl(currentPost.author?.profilePicture, currentPost.author?.username) ? (
                  <img
                    src={getProfilePictureUrl(currentPost.author?.profilePicture, currentPost.author?.username)!}
                    alt={currentPost.author?.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                      {currentPost.author?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm">
                {currentPost.author?.username}
              </span>
            </div>

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <MoreHorizontal size={20} />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-10">
                    <button
                      onClick={handleEditPost}
                      className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
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

          {/* Caption */}
          {currentPost.caption && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm">
                <span className="font-semibold">{currentPost.author?.username}</span>{' '}
                {currentPost.caption}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.map((comment, index) => (
              <div key={index} className="flex space-x-3">
                <div className="w-6 h-6 flex-shrink-0">
                  {getProfilePictureUrl(comment.author?.profilePicture, comment.author?.username) ? (
                    <img
                      src={getProfilePictureUrl(comment.author?.profilePicture, comment.author?.username)!}
                      alt={comment.author?.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {comment.author?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{comment.author?.username}</span>{' '}
                    {comment.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button className="text-gray-700 dark:text-gray-300">
                  <MessageCircle size={24} />
                </button>
                <button className="text-gray-700 dark:text-gray-300">
                  <Send size={24} />
                </button>
              </div>
              <button className="text-gray-700 dark:text-gray-300">
                <Bookmark size={24} />
              </button>
            </div>

            {likesCount > 0 && (
              <p className="text-sm font-semibold mb-2">
                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
              </p>
            )}

            <p className="text-xs text-gray-500 mb-3">
              {formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}
            </p>

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="text-ig-blue font-medium text-sm disabled:opacity-50"
              >
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {currentPost && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          post={currentPost}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}