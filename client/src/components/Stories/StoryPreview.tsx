'use client';

import { getProfilePictureUrl } from '@/utils/urls';

interface StoryPreviewProps {
  story: {
    _id: string;
    author: {
      username: string;
      profilePicture?: string;
    };
    isViewed: boolean;
    totalStories?: number;
  };
  onClick?: () => void;
}

export function StoryPreview({ story, onClick }: StoryPreviewProps) {
  const ringClass = story.isViewed 
    ? 'story-ring-viewed' 
    : 'story-ring';

  return (
    <div 
      className="flex-shrink-0 text-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className={`relative w-16 h-16 mb-2 ${ringClass} p-[2px] rounded-full`}>
        <div className="bg-white dark:bg-dark-surface rounded-full w-full h-full flex items-center justify-center">
          {getProfilePictureUrl(story.author.profilePicture, story.author.username) ? (
            <img
              src={getProfilePictureUrl(story.author.profilePicture, story.author.username)!}
              alt={story.author.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {story.author.username[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-900 dark:text-white font-medium truncate max-w-[60px]">
        {story.totalStories && story.totalStories > 1 
          ? `${story.author.username} (${story.totalStories})`
          : story.author.username
        }
      </p>
    </div>
  );
}