'use client';

import { useState, useRef } from 'react';
import { X, Type, Download, Image, Video, Plus, Minus } from 'lucide-react';
import { storiesApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toaster';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

export function StoryUploadModal({ isOpen, onClose, onStoryCreated }: StoryUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(16);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [selectedBackground, setSelectedBackground] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Predefined background options
  const backgroundOptions = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile && !text.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add a photo, video, or text to your story.',
        type: 'error'
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      
      if (text.trim()) {
        formData.append('text', text);
        // Add text style information
        formData.append('textStyle', JSON.stringify({
          color: textColor,
          size: textSize,
          backgroundColor: selectedFile ? 'transparent' : selectedBackground
        }));
      }

      await storiesApi.createStory(formData);

      toast({
        title: 'Story shared!',
        description: 'Your story has been shared successfully.',
        type: 'success'
      });

      onStoryCreated?.();
      handleClose();
    } catch (error: any) {
      console.error('Story upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to share story. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setText('');
    setIsUploading(false);
    setTextColor('#FFFFFF');
    setTextSize(16);
    setTextPosition({ x: 50, y: 50 });
    setSelectedBackground('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Story
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* File Upload Section */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!previewUrl && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Image size={28} className="text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Add Photo or Video
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Share what's happening in your world
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Preview Area */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                  <div className="aspect-[9/16] max-h-[400px] relative">
                    {selectedFile?.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Text overlay */}
                    {text && (
                      <div 
                        className="absolute pointer-events-none"
                        style={{
                          left: `${textPosition.x}%`,
                          top: `${textPosition.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: textColor,
                          fontSize: `${textSize}px`,
                          fontWeight: 'bold',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          maxWidth: '80%',
                          textAlign: 'center',
                          wordWrap: 'break-word',
                          zIndex: 10
                        }}
                      >
                        {text}
                      </div>
                    )}
                  </div>

                  {/* Change media button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-3 right-3 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Text-Only Preview */}
            {!previewUrl && text.trim() && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden">
                  <div 
                    className="aspect-[9/16] max-h-[400px] relative flex items-center justify-center"
                    style={{ background: selectedBackground }}
                  >
                    <div className="text-center p-8 max-w-sm">
                      <p 
                        style={{
                          color: textColor,
                          fontSize: `${textSize}px`,
                          fontWeight: 'bold',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          wordWrap: 'break-word'
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Text Input Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Type size={18} className="text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add text to your story
                </label>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share what's on your mind..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none transition-all"
                rows={3}
                maxLength={500}
              />
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{text.length}/500 characters</span>
              </div>
              
              {/* Text Customization */}
              {text && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Customize Text</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Text Color */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <div className="flex space-x-1">
                          {['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'].map(color => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Text Size */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Size</label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setTextSize(prev => Math.max(12, prev - 2))}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm min-w-[3rem] text-center font-medium">{textSize}px</span>
                        <button
                          onClick={() => setTextSize(prev => Math.min(32, prev + 2))}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background Selection - only show for text-only stories */}
                  {!selectedFile && (
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Background</label>
                      <div className="grid grid-cols-4 gap-2">
                        {backgroundOptions.map((bg, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedBackground(bg)}
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              selectedBackground === bg 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ background: bg }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || (!selectedFile && !text.trim())}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isUploading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sharing...</span>
                </span>
              ) : (
                'Share Story'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}