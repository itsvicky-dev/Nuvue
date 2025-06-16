'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { postsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toaster';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    _id: string;
    caption: string;
  };
  onPostUpdated?: (updatedPost: any) => void;
}

export function EditPostModal({ isOpen, onClose, post, onPostUpdated }: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (caption.trim() === post.caption) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      const response = await postsApi.editPost(post._id, caption.trim());
      
      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully.',
        type: 'success'
      });

      onPostUpdated?.(response.data.post);
      onClose();
    } catch (error: any) {
      console.error('Edit post error:', error);
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update post. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCaption(post.caption || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Post
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-ig-blue focus:border-ig-blue dark:bg-gray-800 dark:text-white resize-none"
              rows={6}
              maxLength={2200}
              placeholder="Write a caption..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length}/2200 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}