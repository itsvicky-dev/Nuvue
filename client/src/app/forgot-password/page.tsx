'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toaster';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Sparkles, 
  Shield, 
  Clock, 
  CheckCircle,
  Camera,
  Heart,
  Users,
  MessageCircle,
  Star,
  Globe,
  Lock,
  Key,
  Send
} from 'lucide-react';

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
};

const GradientBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div
    className={`absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 dark:opacity-20 animate-blob ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0 
}: { 
  icon: any; 
  className?: string; 
  delay?: number 
}) => (
  <div
    className={`absolute animate-float ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="relative">
      <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-lg" />
      <Icon className="relative w-6 h-6 text-purple-400/60 dark:text-purple-300/60" />
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const mousePosition = useMousePosition();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsEmailSent(true);
      toast({
        title: 'Reset link sent!',
        description: 'Check your email for password reset instructions.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Email resent!',
        description: 'Check your inbox for the new reset link.',
        type: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-black dark:via-gray-900 dark:to-purple-950 text-gray-900 dark:text-white relative overflow-hidden transition-colors duration-500">
      {/* Cursor Follower */}
      <div
        className="fixed w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pointer-events-none z-40 mix-blend-difference transition-transform duration-150 ease-out"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: `scale(${mousePosition.x > 0 ? 1 : 0})`
        }}
      />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Blobs */}
        <GradientBlob 
          className="w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 -top-48 -right-48" 
          delay={0} 
        />
        <GradientBlob 
          className="w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 -bottom-40 -left-40" 
          delay={2} 
        />
        <GradientBlob 
          className="w-72 h-72 bg-gradient-to-r from-pink-400 to-red-400 dark:from-pink-600 dark:to-red-600 top-1/2 left-1/4" 
          delay={4} 
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating Icons */}
        <FloatingIcon icon={Heart} className="top-20 left-20" delay={0} />
        <FloatingIcon icon={Camera} className="top-40 right-32" delay={1} />
        <FloatingIcon icon={Sparkles} className="bottom-32 left-32" delay={2} />
        <FloatingIcon icon={Users} className="bottom-20 right-20" delay={3} />
        <FloatingIcon icon={MessageCircle} className="top-1/2 left-10" delay={1.5} />
        <FloatingIcon icon={Star} className="top-1/3 right-10" delay={2.5} />
        <FloatingIcon icon={Shield} className="top-3/4 left-1/4" delay={3.5} />
        <FloatingIcon icon={Globe} className="bottom-1/4 right-1/3" delay={4.5} />
      </div>

      {/* Main Content - Centered */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <div className={`space-y-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
         

            {/* Back Button */}
            <div className="animate-fade-in">
              <Link
                href="/login"
                className="inline-flex items-center text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to login
              </Link>
            </div>

            {!isEmailSent ? (
              <>
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-6">
                    <Key className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Forgot Password?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {/* Form */}
                <div className="relative">
                  {/* Form Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-600/20 dark:to-pink-600/20 rounded-3xl blur-xl" />
                  
                  {/* Form Container */}
                  <div className="relative bg-white/80 dark:bg-gray-900/50 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-8 shadow-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="group">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-all duration-300" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="relative w-full px-4 py-4 pl-12 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all duration-300 text-base"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" />
                          </div>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                              Sending reset link...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span>Send Reset Link</span>
                              <Send className="w-4 h-4 ml-2" />
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    We've sent password reset instructions to
                  </p>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">
                    {email}
                  </p>
                </div>

                {/* Instructions */}
                <div className="relative">
                  {/* Form Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-600/20 dark:to-pink-600/20 rounded-3xl blur-xl" />
                  
                  {/* Form Container */}
                  <div className="relative bg-white/80 dark:bg-gray-900/50 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-8 shadow-2xl">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Check your inbox</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Look for an email from Nuvue</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Click the reset link</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">This will take you to a secure page</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Create a new password</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Choose a strong, unique password</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Link expires in 15 minutes</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleResendEmail}
                          disabled={isLoading}
                          className="w-full py-3 px-4 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 disabled:opacity-50"
                        >
                          {isLoading ? 'Resending...' : 'Resend Email'}
                        </button>

                        <Link
                          href="/login"
                          className="block w-full py-3 px-4 text-center text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                        >
                          Back to Login
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Security Indicators */}
            <div className="flex items-center justify-center space-x-6 pt-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>15 min</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Lock className="w-4 h-4 text-purple-500" />
                <span>Protected</span>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleResendEmail}
                  className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium hover:underline transition-colors duration-200"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}