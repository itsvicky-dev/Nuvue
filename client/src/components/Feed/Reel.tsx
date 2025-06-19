'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { reelsApi } from '@/lib/api';
import { useToast } from '../ui/Toaster';
import { getProfilePictureUrl } from '@/utils/urls';

interface ReelProps {
  reel: {
    _id: string;
    author: {
      username: string;
      fullName: string;
      profilePicture?: string;
      isVerified: boolean;
    };
    caption: string;
    video: {
      url: string;
      duration?: number;
      width?: number;
      height?: number;
    };
    likes: any[];
    comments: any[];
    views: number;
    createdAt: string;
    isLikedBy?: boolean;
    isSaved?: boolean;
  };
}

export function Reel({ reel }: ReelProps) {
  const [isLiked, setIsLiked] = useState(reel.isLikedBy || false);
  const [isSaved, setIsSaved] = useState(reel.isSaved || false);
  const [likesCount, setLikesCount] = useState(reel.likes.length);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local state with props when they change (e.g., after refresh or cache update)
  useEffect(() => {
    setIsLiked(reel.isLikedBy || false);
    setIsSaved(reel.isSaved || false);
    setLikesCount(reel.likes.length);
  }, [reel.isLikedBy, reel.isSaved, reel.likes.length]);

  const handleLike = async () => {
    try {
      const response = await reelsApi.likeReel(reel._id);
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
      
      // Invalidate the feed cache
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like reel',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await reelsApi.saveReel(reel._id);
      setIsSaved(response.data.isSaved);
      
      toast({
        title: response.data.isSaved ? 'Reel saved' : 'Reel unsaved',
        type: 'success'
      });
      
      // Invalidate the feed cache
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save reel',
        type: 'error'
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await reelsApi.addComment(reel._id, newComment);
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <article className="card">
      {/* Reel Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/${reel.author.username}`}>
            <div className="relative w-8 h-8">
              {getProfilePictureUrl(reel.author.profilePicture, reel.author.username) ? (
                <img
                  src={getProfilePictureUrl(reel.author.profilePicture, reel.author.username)!}
                  alt={reel.author.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {reel.author.username[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link 
              href={`/${reel.author.username}`}
              className="font-semibold text-sm text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
            >
              {reel.author.username}
              {reel.author.isVerified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Reel • {reel.views} views
          </span>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Reel Video */}
      <div className="relative aspect-square bg-black">
        <video
          ref={videoRef}
          src={reel.video.url}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          {!isPlaying && (
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <Play size={32} className="text-white" fill="white" />
            </div>
          )}
        </div>
      </div>

      {/* Reel Actions */}
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
        {reel.caption && (
          <div className="mb-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
              {reel.author.username}
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {reel.caption}
            </span>
          </div>
        )}

        {/* Comments */}
        {Array.isArray(reel.comments) && reel.comments.length > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300"
          >
            View all {reel.comments.length} comments
          </button>
        )}

        {showComments && Array.isArray(reel.comments) && (
          <div className="space-y-2 mb-3">
            {reel.comments.slice(0, 3).filter(comment => comment && typeof comment === 'object').map((comment: any, index: number) => (
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