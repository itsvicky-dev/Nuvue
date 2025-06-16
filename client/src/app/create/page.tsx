'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { postsApi, storiesApi } from '@/lib/api';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { ArrowLeft, Image, Video, FileText, X } from 'lucide-react';
import Link from 'next/link';

export default function CreatePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      let response;
      
      if (postType === 'story') {
        // Handle story upload
        if (selectedFiles[0]) {
          formData.append('media', selectedFiles[0]);
        }
        if (caption) {
          formData.append('text', caption);
        }
        
        response = await storiesApi.createStory(formData);
      } else {
        // Handle post/reel upload
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('caption', caption);
        formData.append('type', postType);
        
        response = await postsApi.createPost(formData);
      }

      toast({
        title: 'Success!',
        description: `${postType.charAt(0).toUpperCase() + postType.slice(1)} created successfully.`,
        type: 'success'
      });

      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
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
          <div className="max-w-2xl mx-auto py-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href="/" className="md:hidden">
                  <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Post
                </h1>
              </div>
            </div>

            {/* Post Type Selector */}
            <div className="mb-6">
              <div className="flex space-x-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setPostType('post')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    postType === 'post'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Image size={16} className="inline mr-2" />
                  Post
                </button>
                <button
                  onClick={() => setPostType('story')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    postType === 'story'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Story
                </button>
                <button
                  onClick={() => setPostType('reel')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    postType === 'reel'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Video size={16} className="inline mr-2" />
                  Reel
                </button>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple={postType === 'post'}
                    accept={postType === 'reel' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {postType === 'reel' ? (
                      <Video size={48} className="text-gray-400 mb-4" />
                    ) : (
                      <Image size={48} className="text-gray-400 mb-4" />
                    )}
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedFiles.length > 0 ? 'Add more files' : `Upload ${postType}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {postType === 'reel' 
                        ? 'Videos up to 15 minutes'
                        : 'Images and videos up to 10MB each'
                      }
                    </p>
                  </label>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {file.type.startsWith('video/') ? (
                              <Video size={32} className="text-gray-400" />
                            ) : (
                              <Image size={32} className="text-gray-400" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caption
                </label>
                <textarea
                  id="caption"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-ig-blue focus:border-ig-blue dark:bg-gray-800 dark:text-white resize-none"
                  placeholder={`Write a caption for your ${postType}...`}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/"
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || selectedFiles.length === 0}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Uploading...' : `Share ${postType}`}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
}