'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/lib/api';
import { StoryPreview } from './StoryPreview';
import { StoryUploadModal } from './StoryUploadModal';
import { StoryViewer } from './StoryViewer';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { useRouter } from 'next/navigation';
import { getProfilePictureUrl } from '@/utils/urls';

export function StoriesBar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewingUsername, setViewingUsername] = useState('');

  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: () => storiesApi.getFeed(),
    staleTime: 30 * 1000, // 30 seconds
    onSuccess: (data) => {
      console.log('Stories feed data:', data);
    }
  });

  const handleAddStoryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to parent circle
    setIsStoryModalOpen(true);
  };

  const handleStoryClick = (userStoryGroup: any, index: number) => {
    // userStoryGroup now contains all stories for a user
    setSelectedStoryIndex(0); // Always start from first story
    setViewingUsername(userStoryGroup.username);
    setIsViewerOpen(true);
  };

  const handleViewOwnStory = () => {
    if (!user) return;

    // Check if current user has stories in the grouped data
    const userStoryGroup = stories?.data?.stories?.find((group: any) => group.username === user.username);
    
    console.log('Debug - handleViewOwnStory:', {
      user: user.username,
      allStories: stories?.data?.stories,
      userStoryGroup,
      hasStories: userStoryGroup?.stories?.length
    });

    if (userStoryGroup && userStoryGroup.stories.length > 0) {
      // User has stories, show story viewer
      setSelectedStoryIndex(0);
      setViewingUsername(user.username);
      setIsViewerOpen(true);
    }
    // If no stories, do nothing - user must click + to add story
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-lg p-4 shadow-sm mb-6">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mb-2"></div>
              <div className="w-12 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg p-4 shadow-sm mb-6">


      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Your Story */}
        <div className="flex-shrink-0 text-center">
          <div className="relative w-16 h-16 mb-2">
            {(() => {
              // Check if user has stories in the grouped data
              const userStoryGroup = stories?.data?.stories?.find((group: any) => group.username === user?.username);
              const hasStories = userStoryGroup && userStoryGroup.stories.length > 0;
              
              return (
                <div 
                  className={`w-full h-full rounded-full p-[2px] ${hasStories ? 'story-ring cursor-pointer hover:opacity-80 transition-opacity' : 'bg-gray-300 dark:bg-gray-600'}`}
                  onClick={hasStories ? handleViewOwnStory : undefined}
                >
                  <div className="bg-white dark:bg-dark-surface rounded-full w-full h-full flex items-center justify-center">
                    {getProfilePictureUrl(user?.profilePicture, user?.username) ? (
                      <img
                        src={getProfilePictureUrl(user?.profilePicture, user?.username)!}
                        alt="Your story"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {user?.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Add Story Button */}
            <button
              onClick={handleAddStoryClick}
              title="Add to your story"
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-blue-600 transition-colors z-10"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-900 dark:text-white font-medium truncate max-w-[60px]">
            {(() => {
              const userStoryGroup = stories?.data?.stories?.find((group: any) => group.username === user?.username);
              const storyCount = userStoryGroup?.stories?.length || 0;
              return storyCount > 1 ? `Your story (${storyCount})` : 'Your story';
            })()}
          </p>
        </div>

        {/* Other Stories */}
        {stories?.data?.stories
          ?.filter((userGroup: any) => userGroup.username !== user?.username) // Filter out own stories
          ?.map((userGroup: any, index: number) => (
            <StoryPreview
              key={userGroup._id}
              story={{
                _id: userGroup._id,
                author: {
                  username: userGroup.username,
                  profilePicture: userGroup.profilePicture
                },
                isViewed: !userGroup.hasUnseen, // If no unseen stories, then all are viewed
                totalStories: userGroup.totalStories
              }}
              onClick={() => handleStoryClick(userGroup, index)}
            />
          ))}
      </div>

      <StoryUploadModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={async () => {
          setIsStoryModalOpen(false);
          // Small delay to ensure backend processing is complete
          setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ['stories-feed'] });
          }, 500);
        }}
      />

      {/* Story Viewer */}
      {isViewerOpen && viewingUsername && (
        <StoryViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          stories={(() => {
            const userGroup = stories?.data?.stories?.find((group: any) => group.username === viewingUsername);
            return userGroup?.stories || [];
          })()}
          initialStoryIndex={selectedStoryIndex}
          username={viewingUsername}
          onStoryDeleted={() => {
            refetch(); // Refetch stories when one is deleted
          }}
        />
      )}
    </div>
  );
}