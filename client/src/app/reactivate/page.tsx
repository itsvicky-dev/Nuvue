'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function ReactivatePage() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { reactivateAccount } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill identifier if coming from login page
  useEffect(() => {
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    if (username || email) {
      setFormData(prev => ({
        ...prev,
        identifier: username || email || ''
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await reactivateAccount(formData.identifier, formData.password);
      toast({
        title: 'Welcome back!',
        description: 'Your account has been reactivated successfully.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Reactivation failed',
        description: error.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <h1 className="text-3xl font-bold text-gradient">Nuvue</h1>
          </div>
          <div className="mt-6 text-center">
            <RefreshCw className="mx-auto h-12 w-12 text-ig-blue mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Reactivate Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your account is currently deactivated. Enter your credentials to reactivate it.
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email address or username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                className="input rounded-t-md"
                placeholder="Email address or username"
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input rounded-b-md pr-10"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Reactivating...
                </>
              ) : (
                'Reactivate Account'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-ig-blue hover:text-ig-blue-hover"
              >
                Forgot your password?
              </Link>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Want to try a different account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-ig-blue hover:text-ig-blue-hover"
                >
                  Back to login
                </Link>
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}