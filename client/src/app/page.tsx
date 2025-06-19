'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Feed } from '@/components/Feed/Feed';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { SuggestedUsers } from '@/components/Feed/SuggestedUsers';
import { TrendingHashtags } from '@/components/Trending/TrendingHashtags';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ig-blue"></div>
      </div>
    );
  }

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
            <Feed />
          </div>
        </main>

        {/* Right panel for suggested users (desktop only) */}
        <div className="hidden lg:block w-80 p-4">
          <div className="sticky top-4 space-y-4">
            {/* Suggested Users */}
            <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
              <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm mb-3">
                Suggestions for you
              </h3>
              <SuggestedUsers variant="sidebar" showTitle={false} maxUsers={5} />
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link 
                  href="/suggested-users"
                  className="text-sm text-ig-blue hover:text-ig-blue-hover font-medium"
                >
                  See all suggestions
                </Link>
              </div>
            </div>

            {/* Trending Hashtags */}
            <TrendingHashtags maxHashtags={8} />

            {/* Footer links */}
            <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap gap-2">
                  <Link href="/about" className="hover:text-ig-blue">About</Link>
                  <Link href="/help" className="hover:text-ig-blue">Help</Link>
                  <Link href="/privacy" className="hover:text-ig-blue">Privacy</Link>
                  <Link href="/terms" className="hover:text-ig-blue">Terms</Link>
                </div>
                <p className="text-gray-400 dark:text-gray-500">
                  © 2024 Nuvue. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
}