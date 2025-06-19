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
  const fetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (user && !fetchingRef.current) {
      fetchReels(isMounted);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchReels = async (isMounted = true) => {
    // Prevent multiple simultaneous requests
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const response = await reelsApi.getAllReels();

      // Only update state if component is still mounted
      if (isMounted) {
        setReels(response.data.reels || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch reels:', error);

      // Only update state if component is still mounted
      if (isMounted) {
        if (error.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError('Failed to load reels. Please try again.');
        }
      }
    } finally {
      fetchingRef.current = false;
      if (isMounted) {
        setIsLoading(false);
      }
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

  // Reels Header Component
  const ReelsHeader = () => (
    <div className="sticky top-0 z-10 mb-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reels</h1>
        <div className="flex items-center space-x-2">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 md:ml-64">
            <div className="max-w-4xl mx-auto py-4 px-4">
              <ReelsHeader />
              <div className="flex items-center justify-center h-[calc(100vh-60px)]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white">Loading Reels...</p>
                </div>
              </div>
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

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 md:ml-64">
            <div className="max-w-4xl mx-auto py-4 px-4">
              <ReelsHeader />
              <div className="flex items-center justify-center h-[calc(100vh-60px)]">
                <div className="text-center">
                  <div className="mb-6">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-white text-lg mb-4">{error}</p>
                  <button
                    onClick={() => fetchReels(true)}
                    className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
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

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 md:ml-64">
            <div className="max-w-4xl mx-auto py-4 px-4">
              <ReelsHeader />
              <div className="text-center mt-8">
                <div className="mb-3">
                  <svg
                    className="w-20 h-20 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-white text-xl mb-2">No Reels Available</p>
                <p className="text-gray-400 mb-6">Check back later for new content</p>

                <button
                  onClick={() => fetchReels(true)}
                  className="btn-primary px-4 py-2"
                >
                  Refresh
                </button>
              </div>
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

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar for desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <ReelsHeader />
          <ReelsViewer
            reels={reels}
            currentIndex={currentIndex}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onIndexChange={setCurrentIndex}
          />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
}