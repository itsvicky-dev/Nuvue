'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ReelsViewer } from '@/components/Reels/ReelsViewer';
import { reelsApi } from '@/lib/api';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReels();
    }
  }, [user]);

  const fetchReels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reelsApi.getAllReels();
      setReels(response.data.reels || []);
    } catch (error: any) {
      console.error('Failed to fetch reels:', error);
      setError('Failed to load reels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Reels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">{error}</p>
          <button 
            onClick={fetchReels}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No reels available</p>
          <p className="text-gray-400">Check back later for new content</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop - Show sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Reels Viewer */}
      <div className="md:ml-64">
        <ReelsViewer
          reels={reels}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onIndexChange={setCurrentIndex}
        />
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
}