'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Zap,
  Smartphone,
  Globe,
  Star,
  ArrowRight,
  Play,
  Download,
  Instagram,
  Twitter,
  Facebook,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  Eye,
  Palette,
  BarChart3,
  Lock,
  Wand2,
  Rocket,
  Target,
  Award,
  Moon,
  Sun
} from 'lucide-react';

// Theme Hook
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return { theme, toggleTheme };
};

// Theme-aware class utility
const getThemeClasses = (theme: 'light' | 'dark') => ({
  // Background colors
  bgPrimary: theme === 'dark' ? 'bg-black' : 'bg-white',
  bgSecondary: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100',
  bgTertiary: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200',
  
  // Text colors
  textPrimary: theme === 'dark' ? 'text-white' : 'text-gray-900',
  textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
  textTertiary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
  textMuted: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
  
  // Border colors
  borderPrimary: theme === 'dark' ? 'border-gray-800' : 'border-gray-200',
  borderSecondary: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
  
  // Glass/backdrop effects
  glassEffect: theme === 'dark' ? 'bg-gray-900/50 backdrop-blur-xl border border-gray-800/50' : 'bg-white/50 backdrop-blur-xl border border-gray-200/50',
  glassEffectStrong: theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50',
  
  // Navigation background
  navBg: theme === 'dark' ? 'bg-black/20 backdrop-blur-2xl' : 'bg-white/20 backdrop-blur-2xl',
  
  // Shadows
  shadowColor: theme === 'dark' ? 'bg-black/40' : 'bg-gray-900/20',
  shadowColorStrong: theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/40',
  
  // Sticker effects
  stickerShadow: theme === 'dark' ? 'bg-black/30' : 'bg-gray-900/20',
  stickerBg: theme === 'dark' ? 'bg-white/10' : 'bg-gray-900/10',
  stickerBorder: theme === 'dark' ? 'border-white/20' : 'border-gray-900/20',
  stickerHighlight: theme === 'dark' ? 'from-white/20' : 'from-gray-900/20',
  stickerStripe: theme === 'dark' ? 'via-white/40' : 'via-gray-900/40',
  stickerStripeBottom: theme === 'dark' ? 'via-white/30' : 'via-gray-900/30',
  
  // Gradient backgrounds for sections
  heroGradient: theme === 'dark' 
    ? 'bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30'
    : 'bg-gradient-to-br from-purple-100/30 via-white to-pink-100/30',
  featuresGradient: theme === 'dark'
    ? 'bg-gradient-to-b from-black via-purple-900/10 to-black'
    : 'bg-gradient-to-b from-white via-purple-100/10 to-white',
  showcaseGradient: theme === 'dark'
    ? 'bg-gradient-to-r from-purple-900/20 via-black to-pink-900/20'
    : 'bg-gradient-to-r from-purple-100/20 via-white to-pink-100/20',
  ctaGradient: theme === 'dark'
    ? 'bg-gradient-to-r from-purple-600/20 via-black to-pink-600/20'
    : 'bg-gradient-to-r from-purple-600/20 via-white to-pink-600/20',
  footerGradient: theme === 'dark'
    ? 'bg-gradient-to-t from-black via-gray-900/50 to-transparent'
    : 'bg-gradient-to-t from-white via-gray-100/50 to-transparent',
  
  // Image overlays
  imageOverlay: theme === 'dark' 
    ? 'bg-gradient-to-t from-black/80 via-transparent to-transparent'
    : 'bg-gradient-to-t from-white/80 via-transparent to-transparent',
  
  // Button backgrounds for floating elements
  floatingBtnBg: theme === 'dark' ? 'bg-white/20' : 'bg-gray-900/20',
  floatingBtnBorder: theme === 'dark' ? 'border-white/30' : 'border-gray-900/30',
  floatingBtnHover: theme === 'dark' ? 'hover:bg-white/30' : 'hover:bg-gray-900/30',
  
  // Footer social buttons
  socialBtnBg: theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50',
});

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

const useParallax = (speed: number = 0.5) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
};

const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, isVisible]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const GradientBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div
    className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      {children}
    </div>
  );
};

const AlternatingFeatureCard = ({ feature, index, isReversed, theme }: { feature: any; index: number; isReversed: boolean; theme: 'light' | 'dark' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const themeClasses = getThemeClasses(theme);

  return (
    <ScrollReveal delay={index * 300}>
      <div
        className={`group relative flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 py-16`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Content Side */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center space-x-4">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700 ${isHovered
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-110 rotate-6 shadow-2xl shadow-purple-500/50'
              : themeClasses.glassEffectStrong
              }`}>
              <feature.icon className={`w-10 h-10 transition-all duration-500 ${isHovered ? 'text-white scale-110' : 'text-purple-400'
                }`} />
            </div>
            <div className="space-y-2">
              <h3 className={`text-4xl lg:text-5xl font-black transition-all duration-500 ${isHovered
                ? 'text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text scale-105'
                : themeClasses.textPrimary
                }`}>
                {feature.title}
              </h3>
              <div className={`h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ${isHovered ? 'w-32' : 'w-16'}`} />
            </div>
          </div>

          <p className={`text-xl leading-relaxed max-w-2xl ${themeClasses.textSecondary}`}>
            {feature.description}
          </p>

          {/* Feature Stats */}
          <div className="flex items-center space-x-8">
            <div className={`flex items-center space-x-2 ${themeClasses.textTertiary}`}>
              <Heart className="w-5 h-5" />
              <span className="font-medium">2.4k</span>
            </div>
            <div className={`flex items-center space-x-2 ${themeClasses.textTertiary}`}>
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">156</span>
            </div>
            <div className={`flex items-center space-x-2 ${themeClasses.textTertiary}`}>
              <Share2 className="w-5 h-5" />
              <span className="font-medium">89</span>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="flex-1 relative">
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />

          {/* Shadow */}
          <div className={`absolute inset-0 rounded-3xl transform translate-x-4 translate-y-4 blur-xl ${themeClasses.shadowColor}`} />

          {/* Main Image Container */}
          <div className={`relative rounded-3xl overflow-hidden group-hover:border-purple-500/50 transition-all duration-700 transform group-hover:-translate-y-4 group-hover:scale-105 ${themeClasses.glassEffect}`}>
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-80 lg:h-96 object-cover transition-transform duration-1000 group-hover:scale-110"
            />

            {/* Image Overlay */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${themeClasses.imageOverlay}`} />

            {/* Floating Action Button */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
              <div className={`w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-colors duration-300 ${themeClasses.floatingBtnBg} ${themeClasses.floatingBtnBorder} ${themeClasses.floatingBtnHover}`}>
                <Play className={`w-6 h-6 ${themeClasses.textPrimary}`} />
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
              <div className={`flex items-center justify-between ${themeClasses.textPrimary}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">2.4k</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">156</span>
                  </div>
                </div>
                <div className={`px-4 py-2 backdrop-blur-xl rounded-full text-sm font-medium ${themeClasses.floatingBtnBg}`}>
                  Trending
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

const ExperienceCard = ({ image, index, theme }: { image: string; index: number; theme: 'light' | 'dark' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const themeClasses = getThemeClasses(theme);

  return (
    <ScrollReveal delay={index * 100}>
      <div
        className={`group relative aspect-square overflow-hidden rounded-3xl backdrop-blur-sm hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${themeClasses.glassEffect}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-0 group-hover:opacity-50 transition duration-500" />
        <div className="relative w-full h-full">
          <img
            src={image}
            alt={`Experience ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${themeClasses.imageOverlay}`} />
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
            <div className={`flex items-center space-x-3 ${themeClasses.textPrimary}`}>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span className="text-sm">2.4k</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">156</span>
              </div>
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">89</span>
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center ${themeClasses.floatingBtnBg}`}>
              <Play className={`w-4 h-4 ${themeClasses.textPrimary}`} />
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};


const StickerWord = ({
  word,
  delay = 0,
  rotation = 0,
  gradient = "from-purple-400 to-pink-400",
  borderGradient = "from-purple-500 to-pink-500",
  theme
}: {
  word: string;
  delay?: number;
  rotation?: number;
  gradient?: string;
  borderGradient?: string;
  theme: 'light' | 'dark';
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative inline-block transform transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
        }`}
      style={{
        transform: `rotate(${rotation}deg) ${isVisible ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(2rem)'}`,
        animationDelay: `${delay}ms`
      }}
    >
      {/* Sticker Shadow */}
      <div className={`absolute inset-0 rounded-2xl transform translate-x-1 translate-y-1 blur-sm ${themeClasses.stickerShadow}`} />

      {/* Sticker Border Glow */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${borderGradient} rounded-2xl blur opacity-60 animate-pulse`} />

      {/* Main Sticker */}
      <div className={`relative backdrop-blur-xl border-2 rounded-2xl px-8 py-4 shadow-2xl ${themeClasses.stickerBg} ${themeClasses.stickerBorder}`}>
        {/* Inner glow */}
        <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent rounded-2xl ${themeClasses.stickerHighlight}`} />

        {/* Highlight stripe */}
        <div className={`absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripe}`} />

        {/* Text */}
        <span className={`relative text-4xl md:text-6xl lg:text-7xl font-black drop-shadow-lg ${theme === 'dark' ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent` : themeClasses.textPrimary}`}>
          {word}
        </span>

        {/* Bottom highlight */}
        <div className={`absolute bottom-2 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripeBottom}`} />
      </div>

      {/* Peeling corner effect */}
      <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br to-transparent rounded-full transform rotate-45 shadow-lg ${themeClasses.stickerHighlight}`} />
    </div>
  );
};

const StickerBadge = ({
  text,
  icon: Icon,
  delay = 0,
  rotation = 0,
  size = "md",
  gradient = "from-purple-400 to-pink-400",
  theme
}: {
  text: string;
  icon?: any;
  delay?: number;
  rotation?: number;
  size?: "sm" | "md" | "lg";
  gradient?: string;
  theme: 'light' | 'dark';
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <div
      className={`relative inline-block transform transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
        }`}
      style={{
        transform: `rotate(${rotation}deg) ${isVisible ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(2rem)'}`,
        animationDelay: `${delay}ms`
      }}
    >
      {/* Badge Shadow */}
      <div className={`absolute inset-0 rounded-full transform translate-x-0.5 translate-y-0.5 blur-sm ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-900/15'}`} />

      {/* Badge Glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-full blur opacity-40 animate-pulse`} />

      {/* Main Badge */}
      <div className={`relative backdrop-blur-xl border rounded-full ${sizeClasses[size]} shadow-xl flex items-center space-x-2 ${themeClasses.stickerBg} ${themeClasses.stickerBorder}`}>
        {/* Inner highlight */}
        <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent rounded-full ${themeClasses.stickerHighlight}`} />

        {Icon && <Icon className={`w-4 h-4 relative z-10 ${themeClasses.textPrimary}`} />}
        <span className={`relative font-bold ${theme === 'dark' ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent` : themeClasses.textPrimary}`}>
          {text}
        </span>
      </div>
    </div>
  );
};

const WallStripe = ({
  width = "w-20",
  height = "h-1",
  rotation = 0,
  delay = 0,
  gradient = "from-purple-400 to-pink-400"
}: {
  width?: string;
  height?: string;
  rotation?: number;
  delay?: number;
  gradient?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`absolute ${width} ${height} bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      style={{
        transform: `rotate(${rotation}deg)`,
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 80}%`,
        animationDelay: `${delay}ms`
      }}
    />
  );
};

const GraffitiText = ({
  text,
  delay = 0,
  rotation = 0,
  style = "spray",
  theme
}: {
  text: string;
  delay?: number;
  rotation?: number;
  style?: "spray" | "bubble" | "wildstyle";
  theme: 'light' | 'dark';
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const styleClasses = {
    spray: "font-black text-4xl md:text-6xl tracking-wider",
    bubble: "font-black text-5xl md:text-7xl tracking-wide",
    wildstyle: "font-black text-3xl md:text-5xl tracking-widest"
  };

  const shadowColor = theme === 'dark' ? 'text-black/60' : 'text-white/60';
  const shadowColorLight = theme === 'dark' ? 'text-black/40' : 'text-white/40';
  const highlightColor = theme === 'dark' ? 'from-white/20' : 'from-gray-900/20';

  return (
    <div
      className={`relative inline-block transform transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
        }`}
      style={{
        transform: `rotate(${rotation}deg) ${isVisible ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(2rem)'}`,
        animationDelay: `${delay}ms`
      }}
    >
      {/* Multiple shadow layers for depth */}
      <div className={`absolute inset-0 blur-sm transform translate-x-2 translate-y-2 ${shadowColor}`}>
        <span className={styleClasses[style]}>{text}</span>
      </div>
      <div className={`absolute inset-0 blur-md transform translate-x-3 translate-y-3 ${shadowColorLight}`}>
        <span className={styleClasses[style]}>{text}</span>
      </div>

      {/* Main text with gradient */}
      <span className={`relative ${styleClasses[style]} drop-shadow-2xl ${theme === 'dark' ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
        {text}
      </span>

      {/* Highlight effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${highlightColor} via-transparent to-transparent opacity-30 blur-xl`} />
    </div>
  );
};

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const mousePosition = useMousePosition();
  const parallaxOffset = useParallax(0.3);
  const parallaxOffsetSlow = useParallax(0.1);
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    setIsLoaded(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your data, your rules. Military-grade encryption, granular privacy controls, and complete transparency about how your information is used.",
      image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
      icon: Rocket,
      title: "Viral Engine",
      description: "Built-in virality mechanics that amplify great content. Our platform learns what resonates and helps your best work reach millions.",
      image: "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
      icon: Award,
      title: "Creator Rewards",
      description: "Get paid for your creativity. Multiple monetization streams, brand partnerships, and direct fan support - all built into the platform.",
      image: "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=600"
    }
  ];

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-500 ${themeClasses.bgPrimary} ${themeClasses.textPrimary}`}>
      {/* Cursor Follower */}
      <div
        className="fixed w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pointer-events-none z-50 mix-blend-difference transition-transform duration-150 ease-out"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: `scale(${mousePosition.x > 0 ? 1 : 0})`
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 transition-all duration-300">
        <div className={`absolute inset-0 ${themeClasses.navBg}`} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/assets/images/logo.svg" alt="" width={50}/>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 animate-pulse" />
              </div>
              <span className={`text-2xl font-bold bg-gradient-to-r ${theme === 'dark' ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                Nuvue
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Showcase', 'Download'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`transition-colors duration-300 relative group ${themeClasses.textSecondary} hover:${themeClasses.textPrimary.replace('text-', '')}`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 ${themeClasses.glassEffect} hover:scale-110`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-400" />
                )}
              </button>
              
              <Link
                href="/login"
                className={`transition-colors duration-300 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary.replace('text-', '')}`}
              >
                Sign In
              </Link>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Link
                  href="/register"
                  className={`relative px-6 py-3 rounded-full font-medium transition-colors duration-300 border border-transparent group-hover:border-purple-500/50 ${theme === 'dark' ? 'bg-black text-white group-hover:bg-gray-900' : 'bg-white text-gray-900 group-hover:bg-gray-100'}`}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 ${themeClasses.heroGradient}`}
            style={{ transform: `translateY(${parallaxOffsetSlow}px)` }}
          />
          <GradientBlob className="top-0 -left-4 w-96 h-96 bg-purple-300" delay={0} />
          <GradientBlob className="top-0 -right-4 w-96 h-96 bg-pink-300" delay={2} />
          <GradientBlob className="bottom-0 left-20 w-96 h-96 bg-blue-300" delay={4} />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: theme === 'dark' 
              ? `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`
              : `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) translateY(${parallaxOffset}px)`
          }}
        />

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 mt-[100px] mb-8">
          {/* Decorative Wall Stripes */}
          <WallStripe width="w-24" height="h-1" rotation={15} delay={300} gradient="from-purple-400 to-pink-400" />
          <WallStripe width="w-16" height="h-0.5" rotation={-25} delay={600} gradient="from-blue-400 to-purple-400" />
          <WallStripe width="w-20" height="h-1" rotation={45} delay={900} gradient="from-pink-400 to-red-400" />

          <ScrollReveal>
            <div className="mb-6 relative">
              <StickerBadge
                text="Beta Access Available"
                icon={Star}
                delay={500}
                rotation={-3}
                gradient="from-yellow-400 to-orange-400"
                theme={theme}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="space-y-8 mb-12">
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                <StickerWord word="Create" delay={800} rotation={-5} theme={theme} />
                <StickerWord word="Share" delay={1200} rotation={3} gradient="from-blue-400 to-purple-400" theme={theme} />
                <StickerWord word="Inspire" delay={1600} rotation={-2} gradient="from-pink-400 to-red-400" theme={theme} />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className={`text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${themeClasses.textSecondary}`}>
              The next-generation social platform where creativity meets community.
              Share your story, discover amazing content, and connect with creators worldwide.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Link
                  href="/register"
                  className={`relative px-8 py-4 rounded-full font-bold text-lg transition-colors duration-300 flex items-center space-x-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <button className={`flex items-center space-x-3 transition-colors duration-300 group ${themeClasses.textSecondary} hover:${themeClasses.textPrimary.replace('text-', '')}`}>
                <div className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors duration-300 ${themeClasses.floatingBtnBg} ${themeClasses.floatingBtnHover}`}>
                  <Play className="w-5 h-5 ml-1" />
                </div>
                <span className="font-medium">Watch Demo</span>
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={800}>
            <div className={`flex justify-center items-center space-x-12 ${themeClasses.textTertiary}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                  <AnimatedCounter end={2500000} />+
                </div>
                <div className="text-sm">Active Creators</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                  <AnimatedCounter end={50000000} />+
                </div>
                <div className="text-sm">Posts Shared</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                  <AnimatedCounter end={180} />+
                </div>
                <div className="text-sm">Countries</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className={`w-6 h-6 ${themeClasses.textTertiary}`} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${themeClasses.featuresGradient}`}
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        />

        {/* Decorative Wall Stripes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-8">
            <WallStripe width="w-48" height="h-4" rotation={-20} delay={200} gradient="from-purple-500/15 to-pink-500/15" />
          </div>
          <div className="absolute top-40 right-12">
            <WallStripe width="w-36" height="h-3" rotation={30} delay={400} gradient="from-blue-500/15 to-purple-500/15" />
          </div>
          <div className="absolute bottom-32 left-1/3">
            <WallStripe width="w-40" height="h-3" rotation={-45} delay={600} gradient="from-pink-500/15 to-red-500/15" />
          </div>
          <div className="absolute bottom-16 right-1/4">
            <WallStripe width="w-32" height="h-2" rotation={25} delay={800} gradient="from-cyan-500/15 to-blue-500/15" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20 relative">
              <div className="mb-8">
                <StickerBadge
                  text="Powerful Features"
                  icon={Layers}
                  delay={100}
                  rotation={-1}
                  size="md"
                  gradient="from-purple-400 to-pink-400"
                  theme={theme}
                />
              </div>

              <div className="mb-6">
                <GraffitiText
                  text="BUILT FOR THE"
                  delay={300}
                  rotation={-1}
                  style="spray"
                  theme={theme}
                />
              </div>
              <div className="mb-8">
                <GraffitiText
                  text="FUTURE OF SOCIAL"
                  delay={600}
                  rotation={2}
                  style="bubble"
                  theme={theme}
                />
              </div>

              {/* Decorative stickers around title */}
              <div className="absolute -top-8 left-1/4 hidden md:block">
                <StickerBadge
                  text="AI POWERED"
                  delay={1000}
                  rotation={25}
                  size="sm"
                  gradient="from-cyan-400 to-blue-400"
                  theme={theme}
                />
              </div>
              <div className="absolute top-1/2  right-10 hidden lg:block">
                <StickerBadge
                  text="NEXT GEN"
                  delay={1200}
                  rotation={-20}
                  size="sm"
                  gradient="from-green-400 to-teal-400"
                  theme={theme}
                />
              </div>
              <div className="absolute -bottom-10 left-1/3 hidden md:block">
                <StickerBadge
                  text="INNOVATIVE"
                  delay={1400}
                  rotation={15}
                  size="sm"
                  gradient="from-orange-400 to-red-400"
                  theme={theme}
                />
              </div>

              <p className={`text-xl max-w-3xl mx-auto leading-relaxed mt-8 ${themeClasses.textTertiary}`}>
                Every feature is crafted with precision, designed to empower creators and foster genuine connections
                in the digital age.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-8">
            {features.map((feature, index) => (
              <AlternatingFeatureCard
                key={index}
                feature={feature}
                index={index}
                isReversed={index % 2 === 1}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="showcase" className="py-16 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${themeClasses.showcaseGradient}`}
          style={{ transform: `translateY(${parallaxOffsetSlow}px)` }}
        />

        {/* Decorative Wall Stripes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-16">
            <WallStripe width="w-44" height="h-3" rotation={-25} delay={100} gradient="from-pink-500/20 to-red-500/20" />
          </div>
          <div className="absolute top-48 right-20">
            <WallStripe width="w-36" height="h-2" rotation={35} delay={300} gradient="from-purple-500/20 to-pink-500/20" />
          </div>
          <div className="absolute bottom-40 left-1/4">
            <WallStripe width="w-40" height="h-3" rotation={-15} delay={500} gradient="from-blue-500/20 to-purple-500/20" />
          </div>
          <div className="absolute bottom-20 right-1/3">
            <WallStripe width="w-32" height="h-2" rotation={45} delay={700} gradient="from-cyan-500/20 to-blue-500/20" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20 relative">
              <div className="mb-8">
                <StickerBadge
                  text="Creator Showcase"
                  icon={Eye}
                  delay={100}
                  rotation={1}
                  size="md"
                  gradient="from-pink-400 to-red-400"
                  theme={theme}
                />
              </div>

              <div className="mb-6">
                <GraffitiText
                  text="EXPERIENCE"
                  delay={300}
                  rotation={-2}
                  style="bubble"
                  theme={theme}
                />
              </div>
              <div className="mb-8">
                <GraffitiText
                  text="PURE MAGIC"
                  delay={600}
                  rotation={3}
                  style="wildstyle"
                  theme={theme}
                />
              </div>

              {/* Decorative stickers around title */}
              <div className="absolute -top-6 left-1/5 hidden md:block">
                <StickerBadge
                  text="CREATIVE"
                  delay={1000}
                  rotation={-25}
                  size="sm"
                  gradient="from-purple-400 to-pink-400"
                  theme={theme}
                />
              </div>
              <div className="absolute top-1/3 -right-12 hidden lg:block">
                <StickerBadge
                  text="AMAZING"
                  delay={1200}
                  rotation={20}
                  size="sm"
                  gradient="from-yellow-400 to-orange-400"
                  theme={theme}
                />
              </div>
              <div className="absolute -bottom-8 left-1/4 hidden md:block">
                <StickerBadge
                  text="INSPIRING"
                  delay={1400}
                  rotation={-15}
                  size="sm"
                  gradient="from-green-400 to-teal-400"
                  theme={theme}
                />
              </div>
              <div className="absolute bottom-0 right-1/4 hidden md:block">
                <StickerBadge
                  text="WOW"
                  delay={1600}
                  rotation={30}
                  size="sm"
                  gradient="from-red-400 to-pink-400"
                  theme={theme}
                />
              </div>

              <p className={`text-xl max-w-3xl mx-auto leading-relaxed mt-8 ${themeClasses.textTertiary}`}>
                Discover incredible content from our community of creators. Every post tells a story,
                every interaction sparks connection.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400"
            ].map((image, index) => (
              <ExperienceCard key={index} image={image} index={index} theme={theme} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-16 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${themeClasses.ctaGradient}`}
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        />

        {/* Decorative Wall Stripes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-12">
            <WallStripe width="w-52" height="h-4" rotation={-30} delay={100} gradient="from-purple-500/25 to-pink-500/25" />
          </div>
          <div className="absolute top-32 right-16">
            <WallStripe width="w-40" height="h-3" rotation={25} delay={300} gradient="from-pink-500/25 to-red-500/25" />
          </div>
          <div className="absolute bottom-32 left-1/4">
            <WallStripe width="w-48" height="h-3" rotation={-20} delay={500} gradient="from-blue-500/25 to-purple-500/25" />
          </div>
          <div className="absolute bottom-16 right-1/5">
            <WallStripe width="w-36" height="h-2" rotation={35} delay={700} gradient="from-cyan-500/25 to-blue-500/25" />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-6">
          <ScrollReveal>
            <div className="mb-16 relative">
              <div className="mb-8">
                <StickerBadge
                  text="Ready to Launch"
                  icon={Rocket}
                  delay={100}
                  rotation={-2}
                  size="md"
                  gradient="from-purple-400 to-pink-400"
                  theme={theme}
                />
              </div>

              <div className="mb-6">
                <GraffitiText
                  text="READY TO"
                  delay={300}
                  rotation={-1}
                  style="spray"
                  theme={theme}
                />
              </div>
              <div className="mb-8">
                <GraffitiText
                  text="CREATE MAGIC?"
                  delay={600}
                  rotation={2}
                  style="bubble"
                  theme={theme}
                />
              </div>

              {/* Decorative stickers around title */}
              <div className="absolute -top-4 left-1/5 hidden md:block">
                <StickerBadge
                  text="JOIN NOW"
                  delay={1000}
                  rotation={20}
                  size="sm"
                  gradient="from-green-400 to-teal-400"
                  theme={theme}
                />
              </div>
              <div className="absolute top-1/3 -right-8 hidden lg:block">
                <StickerBadge
                  text="FREE"
                  delay={1200}
                  rotation={-25}
                  size="sm"
                  gradient="from-yellow-400 to-orange-400"
                  theme={theme}
                />
              </div>
              <div className="absolute -bottom-10 left-1/3 hidden md:block">
                <StickerBadge
                  text="START TODAY"
                  delay={1400}
                  rotation={15}
                  size="sm"
                  gradient="from-red-400 to-pink-400"
                  theme={theme}
                />
              </div>

              <p className={`text-xl mb-12 max-w-2xl mx-auto leading-relaxed mt-8 ${themeClasses.textSecondary}`}>
                Join millions of creators who are already shaping the future of social media.
                Your story starts here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              {/* iOS Download Sticker Button */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-60 group-hover:opacity-100 transition duration-500" />
                <div className={`relative backdrop-blur-xl border-2 rounded-3xl px-8 py-4 transition-all duration-500 transform group-hover:-translate-y-1 group-hover:scale-105 ${themeClasses.stickerBg} ${themeClasses.stickerBorder} group-hover:${themeClasses.stickerBg.replace('bg-', 'bg-').replace('/10', '/15')}`}>
                  {/* Inner glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent rounded-3xl ${themeClasses.stickerHighlight}`} />

                  {/* Highlight stripe */}
                  <div className={`absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripe}`} />

                  <div className={`relative flex items-center justify-center space-x-3 text-lg font-bold ${themeClasses.textPrimary}`}>
                    <Link
                      href="/register"
                      className='flex items-center'
                      >
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>

                  {/* Bottom highlight */}
                  <div className={`absolute bottom-2 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripeBottom}`} />
                </div>

                {/* Peeling corner effect */}
                <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br to-transparent rounded-full transform rotate-45 shadow-lg ${themeClasses.stickerHighlight}`} />
              </div>

              {/* Android Download Sticker Button */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl blur opacity-60 group-hover:opacity-100 transition duration-500" />
                <div className={`relative backdrop-blur-xl border-2 rounded-3xl px-8 py-4 transition-all duration-500 transform group-hover:-translate-y-1 group-hover:scale-105 ${themeClasses.stickerBg} ${themeClasses.stickerBorder} group-hover:${themeClasses.stickerBg.replace('bg-', 'bg-').replace('/10', '/15')}`}>
                  {/* Inner glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent rounded-3xl ${themeClasses.stickerHighlight}`} />

                  {/* Highlight stripe */}
                  <div className={`absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripe}`} />

                  <div className={`relative flex items-center justify-center space-x-3 text-lg font-bold ${themeClasses.textPrimary}`}>
                    <Smartphone className="w-5 h-5" />
                    <Link
                      href="/login"
                    >
                      Sign In
                    </Link>
                  </div>

                  {/* Bottom highlight */}
                  <div className={`absolute bottom-2 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent to-transparent rounded-full ${themeClasses.stickerStripeBottom}`} />
                </div>

                {/* Peeling corner effect */}
                <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br to-transparent rounded-full transform rotate-45 shadow-lg ${themeClasses.stickerHighlight}`} />
              </div>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <StickerBadge
                text="Available on all platforms"
                delay={1600}
                rotation={-1}
                size="sm"
                gradient="from-gray-400 to-gray-600"
                theme={theme}
              />
              <StickerBadge
                text="Free to download"
                delay={1800}
                rotation={1}
                size="sm"
                gradient="from-green-400 to-teal-400"
                theme={theme}
              />
              <StickerBadge
                text="No credit card required"
                delay={2000}
                rotation={-2}
                size="sm"
                gradient="from-blue-400 to-purple-400"
                theme={theme}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative py-20 ${themeClasses.borderPrimary} border-t`}>
        <div className={`absolute inset-0 ${themeClasses.footerGradient}`} />
        <div className="relative max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30" />
                  </div>
                  <span className={`text-2xl font-bold bg-gradient-to-r ${theme === 'dark' ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                    Nuvue
                  </span>
                </div>
                <p className={`mb-8 max-w-md leading-relaxed ${themeClasses.textTertiary}`}>
                  Empowering creators worldwide to share their stories, connect authentically,
                  and build meaningful communities in the digital age.
                </p>
                <div className="flex space-x-4">
                  {[
                    { icon: Instagram, href: "#", color: "hover:bg-pink-600" },
                    { icon: Twitter, href: "#", color: "hover:bg-blue-500" },
                    { icon: Facebook, href: "#", color: "hover:bg-blue-600" }
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${social.color} transition-all duration-300 hover:scale-110 ${themeClasses.socialBtnBg}`}
                    >
                      <social.icon className={`w-5 h-5 ${themeClasses.textPrimary}`} />
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={`text-lg font-semibold mb-6 ${themeClasses.textPrimary}`}>Product</h4>
                <ul className="space-y-3">
                  {["Features", "Pricing", "API", "Updates", "Roadmap"].map((item) => (
                    <li key={item}>
                      <a href="#" className={`transition-colors duration-300 relative group ${themeClasses.textTertiary} hover:${themeClasses.textPrimary.replace('text-', '')}`}>
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className={`text-lg font-semibold mb-6 ${themeClasses.textPrimary}`}>Company</h4>
                <ul className="space-y-3">
                  {["About", "Blog", "Careers", "Contact", "Press"].map((item) => (
                    <li key={item}>
                      <a href="#" className={`transition-colors duration-300 relative group ${themeClasses.textTertiary} hover:${themeClasses.textPrimary.replace('text-', '')}`}>
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`pt-8 flex flex-col md:flex-row justify-between items-center ${themeClasses.borderPrimary} border-t`}>
              <p className={`mb-4 md:mb-0 ${themeClasses.textMuted}`}>
                © 2025 Nuvue. All rights reserved. Crafted with passion for creators worldwide.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className={`transition-colors ${themeClasses.textMuted} hover:${themeClasses.textPrimary.replace('text-', '')}`}>Privacy Policy</a>
                <a href="#" className={`transition-colors ${themeClasses.textMuted} hover:${themeClasses.textPrimary.replace('text-', '')}`}>Terms of Service</a>
                <a href="#" className={`transition-colors ${themeClasses.textMuted} hover:${themeClasses.textPrimary.replace('text-', '')}`}>Cookie Policy</a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  );
}