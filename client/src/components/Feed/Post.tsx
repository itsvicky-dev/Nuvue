'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import { useToast } from '../ui/Toaster';
import { getImageUrl, getProfilePictureUrl } from '@/utils/urls';
import { CustomVideoPlayer } from '../ui/CustomVideoPlayer';

interface PostProps {
  post: {
    _id: string;
    author: {
      username: string;
      fullName: string;
      profilePicture?: string;
      isVerified: boolean;
    };
    caption: string;
    media: Array<{
      url: string;
      type: 'image' | 'video';
    }>;
    likes: any[];
    comments: any[];
    createdAt: string;
    isLikedBy?: boolean;
    isSaved?: boolean;
  };
}

export function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLikedBy || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local state with props when they change (e.g., after refresh or cache update)
  useEffect(() => {
    setIsLiked(post.isLikedBy || false);
    setIsSaved(post.isSaved || false);
    setLikesCount(post.likes.length);
  }, [post.isLikedBy, post.isSaved, post.likes.length]);

  const handleLike = async () => {
    try {
      const response = await postsApi.likePost(post._id);
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
      
      // Invalidate the feed cache so the like state persists after refresh
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await postsApi.savePost(post._id);
      setIsSaved(response.data.isSaved);
      
      toast({
        title: response.data.isSaved ? 'Post saved' : 'Post unsaved',
        type: 'success'
      });
      
      // Invalidate the feed cache
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save post',
        type: 'error'
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await postsApi.addComment(post._id, newComment);
      setNewComment('');
      toast({
        title: 'Comment added',
        type: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        type: 'error'
      });
    }
  };

  return (
    <article className="card">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/${post.author.username}`}>
            <div className="relative w-8 h-8">
              {getProfilePictureUrl(post.author.profilePicture, post.author.username) ? (
                <Image
                  src={getProfilePictureUrl(post.author.profilePicture, post.author.username)!}
                  alt={post.author.username}
                  fill
                  className="rounded-full object-cover"
                  onError={() => {/* Handle profile pic error silently */}}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {post.author.username[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link 
              href={`/${post.author.username}`}
              className="font-semibold text-sm text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
            >
              {post.author.username}
              {post.author.isVerified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Post Media */}
      <div className="relative aspect-square">
        {post.media[0]?.type === 'video' ? (
          <CustomVideoPlayer
            src={getImageUrl(post.media[0].url)}
            className="w-full h-full"
            autoPlay={false}
            muted={true}
            loop={true}
          />
        ) : (
          <>
            {imageError ? (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Failed to load image</p>
              </div>
            ) : (
              <Image
                src={getImageUrl(post.media[0]?.url || '')}
                alt="Post content"
                fill
                className="object-cover"
                onError={() => setImageError(true)}
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
              onClick={handleLike}
              className={`p-2 -m-2 ${isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} hover:text-gray-500 dark:hover:text-gray-400`}
            >
              <Heart 
                size={24} 
                fill={isLiked ? 'currentColor' : 'none'}
                className={isLiked ? 'animate-heart' : ''}
              />
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="p-2 -m-2 text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <MessageCircle size={24} />
            </button>
            <button className="p-2 -m-2 text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-400">
              <Send size={24} />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`p-2 -m-2 ${isSaved ? 'text-ig-blue' : 'text-gray-700 dark:text-gray-200'} hover:text-gray-500 dark:hover:text-gray-400`}
          >
            <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
              {post.author.username}
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {post.caption}
            </span>
          </div>
        )}

        {/* Comments */}
        {Array.isArray(post.comments) && post.comments.length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {showComments && Array.isArray(post.comments) && (
          <div className="space-y-2 mb-3">
            {post.comments.slice(0, 3).filter(comment => comment && typeof comment === 'object').map((comment: any, index: number) => (
              <div key={comment._id || comment.id || index} className="flex items-start space-x-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.user?.username || comment.author?.username || 'Unknown User'}
                </span>
                <span className="text-sm text-gray-900 dark:text-white flex-1">
                  {comment.text || ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <form onSubmit={handleComment} className="flex items-center space-x-3 pt-3 border-t dark:border-gray-700">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
          />
          {newComment.trim() && (
            <button
              type="submit"
              className="text-sm font-semibold text-ig-blue hover:text-ig-blue-hover"
            >
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}