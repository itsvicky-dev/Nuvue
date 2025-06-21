'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import LandingPage from '@/components/LandingPage';
import HomePage from '@/components/HomePage';

export default function MainPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ig-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <HomePage />;
}