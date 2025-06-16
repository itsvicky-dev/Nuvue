'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal, Trash2, Play, Pause } from 'lucide-react';
import { storiesApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { getImageUrl, getProfilePictureUrl } from '@/utils/urls';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/Toaster';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: any[];
  initialStoryIndex: number;
  username: string;
  onStoryDeleted?: () => void;
}

export function StoryViewer({ isOpen, onClose, stories, initialStoryIndex, username, onStoryDeleted }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const progressRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const STORY_DURATION = 5000; // 5 seconds for images
  const PROGRESS_INTERVAL = 50; // Update every 50ms

  useEffect(() => {
    if (isOpen && stories[currentIndex]) {
      setCurrentStory(stories[currentIndex]);
      setIsLiked(stories[currentIndex].isLiked || false);
      setProgress(0);
      setIsPaused(false);
      setIsPlaying(true);
      
      // Mark story as viewed
      if (stories[currentIndex]._id) {
        storiesApi.viewStory(stories[currentIndex]._id).catch(console.error);
      }
    }
  }, [isOpen, currentIndex, stories]);

  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) return;

    const isVideo = currentStory.media?.type === 'video';
    
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      const duration = video.duration * 1000; // Convert to ms
      
      const updateProgress = () => {
        if (video.currentTime && video.duration) {
          const progressPercent = (video.currentTime / video.duration) * 100;
          setProgress(progressPercent);
          
          if (progressPercent >= 100) {
            handleNext();
          }
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('ended', handleNext);
      
      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('ended', handleNext);
      };
    } else {
      // For images, use timer
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL));
          if (newProgress >= 100) {
            handleNext();
            return 100;
          }
          return newProgress;
        });
      }, PROGRESS_INTERVAL);

      return () => {
        if (progressRef.current) {
          clearInterval(progressRef.current);
        }
      };
    }
  }, [currentStory, isPaused, isOpen]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleLike = async () => {
    if (!currentStory) return;
    
    try {
      await storiesApi.likeStory(currentStory._id);
      setIsLiked(prev => !prev);
    } catch (error) {
      console.error('Failed to like story:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentStory) return;

    try {
      await storiesApi.replyToStory(currentStory._id, replyText);
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent to the story.',
        type: 'success'
      });
      setReplyText('');
    } catch (error: any) {
      console.error('Failed to reply to story:', error);
      toast({
        title: 'Reply failed',
        description: error.response?.data?.message || 'Failed to send reply.',
        type: 'error'
      });
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !window.confirm('Are you sure you want to delete this story?')) return;

    try {
      await storiesApi.deleteStory(currentStory._id);
      toast({
        title: 'Story deleted',
        description: 'Your story has been deleted.',
        type: 'success'
      });
      
      // Remove story from list and move to next
      const updatedStories = [...stories];
      updatedStories.splice(currentIndex, 1);
      
      if (updatedStories.length === 0) {
        onClose();
      } else if (currentIndex >= updatedStories.length) {
        setCurrentIndex(updatedStories.length - 1);
      }
      
      // Update the stories array reference
      stories.splice(currentIndex, 1);
      
      // Call the callback to refetch stories
      onStoryDeleted?.();
      
      setShowOptions(false);
    } catch (error: any) {
      console.error('Failed to delete story:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete story. Please try again.',
        type: 'error'
      });
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    setIsPaused(!isPaused);
  };

  if (!isOpen || !currentStory) return null;

  const isOwner = user?.id === currentStory.author?._id;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8">
            {getProfilePictureUrl(currentStory.author?.profilePicture, currentStory.author?.username) ? (
              <img
                src={getProfilePictureUrl(currentStory.author?.profilePicture, currentStory.author?.username)!}
                alt={currentStory.author?.username}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-sm font-bold text-white">
                  {currentStory.author?.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {currentStory.author?.username}
            </p>
            <p className="text-gray-300 text-xs">
              {(() => {
                try {
                  if (currentStory.createdAt) {
                    const date = new Date(currentStory.createdAt);
                    if (isNaN(date.getTime())) {
                      return 'Just now';
                    }
                    return formatDistanceToNow(date, { addSuffix: true });
                  }
                  return 'Just now';
                } catch (error) {
                  console.error('Date parsing error:', error);
                  return 'Just now';
                }
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentStory.media?.type === 'video' && (
            <button
              onClick={togglePlayPause}
              className="p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          )}
          
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full"
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 top-10 bg-black bg-opacity-75 rounded-lg py-2 z-20">
                  <button
                    onClick={handleDeleteStory}
                    className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-500 hover:bg-opacity-25 w-full text-left"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full max-w-sm mx-auto bg-black flex items-center justify-center md:max-w-md lg:max-w-lg">
        <div className="relative w-full max-h-full">
          {currentStory.media ? (
            currentStory.media.type === 'video' ? (
              <video
                ref={videoRef}
                src={getImageUrl(currentStory.media.url)}
                className="w-full max-h-screen object-contain"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={getImageUrl(currentStory.media.url)}
                alt="Story"
                className="w-full max-h-screen object-contain"
              />
            )
          ) : (
            <div 
              className="w-full h-screen flex items-center justify-center"
              style={{
                background: currentStory.textStyle?.backgroundColor || 
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <div className="text-center p-8 max-w-sm">
                <p 
                  className="break-words leading-relaxed"
                  style={{
                    color: currentStory.textStyle?.color || '#FFFFFF',
                    fontSize: currentStory.textStyle?.size ? `${currentStory.textStyle.size}px` : '2rem',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                    textAlign: 'center'
                  }}
                >
                  {currentStory.text}
                </p>
              </div>
            </div>
          )}

          {/* Text overlay */}
          {currentStory.text && currentStory.media && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-60 text-white px-6 py-4 rounded-xl text-center max-w-xs backdrop-blur-sm">
                <p className="text-lg font-semibold break-words">{currentStory.text}</p>
              </div>
            </div>
          )}

          {/* Navigation areas - invisible tap zones */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-0 w-1/3 h-full z-10 focus:outline-none"
            disabled={currentIndex === 0}
            aria-label="Previous story"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 w-1/3 h-full z-10 focus:outline-none"
            aria-label="Next story"
          />
          <button
            onClick={togglePlayPause}
            className="absolute left-1/3 top-0 w-1/3 h-full z-10 focus:outline-none"
            aria-label="Play/Pause"
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {stories.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full z-10"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full z-10"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}

      {/* Bottom actions */}
      {!isOwner && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-3 z-10">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full ${isLiked ? 'text-red-500' : 'text-white'}`}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Reply to story..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-3 py-2 bg-black bg-opacity-50 text-white placeholder-gray-300 rounded-full border border-gray-600 focus:border-white focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            {replyText.trim() && (
              <button
                onClick={handleReply}
                className="p-2 text-white hover:bg-black hover:bg-opacity-25 rounded-full"
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}