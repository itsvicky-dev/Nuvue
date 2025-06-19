'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Play, 
  Pause,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { reelsApi } from '@/lib/api';
import { useToast } from '../ui/Toaster';
import { getProfilePictureUrl } from '@/utils/urls';

interface ReelsViewerProps {
  reels: any[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onIndexChange: (index: number) => void;
}

export function ReelsViewer({ reels, currentIndex, onNext, onPrevious, onIndexChange }: ReelsViewerProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentReel = reels[currentIndex];

  // Update reel-specific state when currentIndex changes
  useEffect(() => {
    if (currentReel) {
      setIsLiked(currentReel.isLikedBy || false);
      setIsSaved(currentReel.isSaved || false);
      setLikesCount(currentReel.likes?.length || 0);
      setIsPlaying(true);
    }
  }, [currentReel]);

  // Auto-play current video
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch(console.error);
    } else if (videoRef.current && !isPlaying) {
      videoRef.current.pause();
    }
  }, [currentIndex, isPlaying]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevious();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious]);

  // Handle scroll navigation
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        onNext();
      } else {
        onPrevious();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
      return () => container.removeEventListener('wheel', handleScroll);
    }
  }, [onNext, onPrevious]);

  const handleLike = async () => {
    if (!currentReel) return;
    
    try {
      const response = await reelsApi.likeReel(currentReel._id);
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
      
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like reel',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    if (!currentReel) return;
    
    try {
      const response = await reelsApi.saveReel(currentReel._id);
      setIsSaved(response.data.isSaved);
      
      toast({
        title: response.data.isSaved ? 'Reel saved' : 'Reel unsaved',
        type: 'success'
      });
      
      queryClient.invalidateQueries({ queryKey: ['reels'] });
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
    if (!newComment.trim() || !currentReel) return;

    try {
      await reelsApi.addComment(currentReel._id, newComment);
      setNewComment('');
      setShowComments(false);
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!currentReel) return null;

  return (
    <div ref={containerRef} className="h-screen bg-black relative overflow-hidden">
      {/* Video Container */}
      <div className="flex items-center justify-center h-full">
        <div className="relative aspect-[9/16] h-full max-w-[calc(100vh*9/16)] mx-auto">
          <video
            ref={videoRef}
            src={currentReel.video.url}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
          
          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="bg-black bg-opacity-50 rounded-full p-6">
                <Play size={48} className="text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Reel Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            {/* Author Info */}
            <div className="flex items-center space-x-3 mb-3">
              <Link href={`/${currentReel.author.username}`}>
                <div className="relative w-10 h-10">
                  {getProfilePictureUrl(currentReel.author.profilePicture, currentReel.author.username) ? (
                    <img
                      src={getProfilePictureUrl(currentReel.author.profilePicture, currentReel.author.username)!}
                      alt={currentReel.author.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white font-semibold">
                        {currentReel.author.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <div>
                <Link 
                  href={`/${currentReel.author.username}`}
                  className="font-semibold text-white hover:text-gray-300"
                >
                  {currentReel.author.username}
                  {currentReel.author.isVerified && (
                    <span className="ml-1 text-blue-400">✓</span>
                  )}
                </Link>
                <p className="text-xs text-gray-300">
                  {formatDistanceToNow(new Date(currentReel.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Caption */}
            {currentReel.caption && (
              <p className="text-white text-sm mb-2 line-clamp-3">
                {currentReel.caption}
              </p>
            )}

            {/* Views */}
            <p className="text-gray-300 text-xs">
              {currentReel.views || 0} views
            </p>
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleMute}
              className="bg-black bg-opacity-50 p-2 rounded-full mb-2 hover:bg-opacity-70 transition-colors"
            >
              {isMuted ? (
                <VolumeX size={20} className="text-white" />
              ) : (
                <Volume2 size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button 
          onClick={handleLike}
          className="flex flex-col items-center p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
        >
          <Heart 
            size={24} 
            fill={isLiked ? 'red' : 'none'}
            className={isLiked ? 'text-red-500' : 'text-white'}
          />
          <span className="text-xs mt-1">{likesCount}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
        >
          <MessageCircle size={24} />
          <span className="text-xs mt-1">{currentReel.comments?.length || 0}</span>
        </button>
        
        <button className="flex flex-col items-center p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors">
          <Send size={24} />
        </button>
        
        <button 
          onClick={handleSave}
          className="flex flex-col items-center p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
        >
          <Bookmark 
            size={24} 
            fill={isSaved ? 'white' : 'none'}
            className={isSaved ? 'text-white' : 'text-white'}
          />
        </button>
        
        <button className="flex flex-col items-center p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp size={24} />
        </button>
        
        <button
          onClick={onNext}
          disabled={currentIndex === reels.length - 1}
          className="p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Reel Counter */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
        <span className="text-white text-sm">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-t-lg w-full max-w-md max-h-80 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Comments</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-48 overflow-y-auto">
              {Array.isArray(currentReel.comments) && currentReel.comments.length > 0 ? (
                <div className="space-y-3">
                  {currentReel.comments.filter(comment => comment && typeof comment === 'object').map((comment: any, index: number) => (
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
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">No comments yet</p>
              )}
            </div>
            
            <form onSubmit={handleComment} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white px-3 py-2 rounded-lg"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    className="text-sm font-semibold text-blue-500 hover:text-blue-600"
                  >
                    Post
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}