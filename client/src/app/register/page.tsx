'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toaster';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Heart,
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Award,
  Rocket,
  Target
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

const BenefitCard = ({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0
}: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`group relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-all duration-500`} />

      {/* Card */}
      <div className="relative bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200/20 dark:border-gray-800/50 rounded-2xl p-3 group-hover:border-purple-500/30 transition-all duration-500 transform group-hover:-translate-y-1">
        <div className="flex items-start space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isHovered
            ? `bg-gradient-to-r ${gradient} scale-110 rotate-3 shadow-2xl`
            : 'bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50'
            }`}>
            <Icon className={`w-7 h-7 transition-all duration-500 ${isHovered ? 'text-white scale-110' : 'text-purple-600 dark:text-purple-400'
              }`} />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className={`text-xl font-bold transition-all duration-500 ${isHovered
              ? 'text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text'
              : 'text-gray-900 dark:text-white'
              }`}>
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { register } = useAuth();
  const { toast } = useToast();
  const mousePosition = useMousePosition();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
      await register(formData);
      toast({
        title: 'Welcome to Nuvue!',
        description: 'Your account has been created successfully.',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Rocket,
      title: "Launch Your Creativity",
      description: "Share your unique perspective with a global audience of creators and enthusiasts.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Target,
      title: "Reach Your Goals",
      description: "Access powerful tools and analytics to grow your presence and impact.",
      gradient: "from-blue-500 to-purple-600"
    }
  ];

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
        <GradientBlob
          className="w-64 h-64 bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-600 dark:to-orange-600 top-1/4 right-1/4"
          delay={6}
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 min-h-screen relative z-10">
        {/* Left Column - Branding & Benefits */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12 relative">
          <div className={`text-center space-y-12 max-w-lg transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            {/* Logo Section */}
            <div className="space-y-6">
              <div className="relative inline-block">
                {/* Logo Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-600/30 dark:to-pink-600/30 rounded-3xl blur-2xl animate-pulse" />

                {/* Logo */}
                <div className="relative flex items-center justify-center space-x-4">
                  <div className="relative">
                    <img src="/assets/images/logo.svg" alt="" width={50} />
                  </div>
                  <h1 className="text-6xl font-black bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
                    Nuvue
                  </h1>
                </div>

                {/* Sparkles */}
                <div className="absolute -top-4 -right-4">
                  <Sparkles className="w-8 h-8 text-yellow-500 dark:text-yellow-400 animate-spin-slow" />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Join the Revolution
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Create your account and start sharing your story with the world
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <BenefitCard
                  key={benefit.title}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  gradient={benefit.gradient}
                  delay={index * 200}
                />
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 mt-1">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">10M+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Creators</div>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">1B+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Views Daily</div>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">150+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Register Form */}
        <div className="flex items-center justify-center p-8 py-2 lg:p-12 lg:py-2">
          <div className={`w-full max-w-md space-y-8 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <div className="relative inline-block">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative">
                    <img src="/assets/images/logo.svg" alt="" width={50} />
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-40" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Nuvue
                  </h1>
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400 animate-spin-slow" />
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Join millions of creators sharing their stories
              </p>
            </div>

            {/* Register Form */}
            <div className="relative">
              {/* Form Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-600/20 dark:to-pink-600/20 rounded-3xl blur-xl" />

              {/* Form Container */}
              <div className="relative bg-white/80 dark:bg-gray-900/50 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-8 shadow-2xl">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    {/* Full Name Field */}
                    <div className="group">
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-all duration-300" />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          className="relative w-full px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all duration-300 text-base"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Email Field */}
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
                          className="relative w-full px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all duration-300 text-base"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Username Field */}
                    <div className="group">
                      <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        User name
                      </label>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-all duration-300" />
                        <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          className="relative w-full px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all duration-300 text-base"
                          placeholder="Choose a unique username"
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="group">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-all duration-300" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          className="relative w-full px-4 py-4 pr-12 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/70 dark:focus:bg-gray-800/70 transition-all duration-300 text-base"
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="relative group pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                          Creating account...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Create Account</span>
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center pt-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors duration-200 hover:underline"
                      >
                        Sign in
                      </Link>
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}