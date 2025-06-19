'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  isVerified: boolean;
  emailVerified: boolean;
  isPrivate?: boolean;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: {
      likes: boolean;
      comments: boolean;
      follows: boolean;
      messages: boolean;
      posts: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  reactivateAccount: (identifier: string, password: string) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [mounted]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      if (mounted) {
        localStorage.removeItem('token');
      }
      api.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { token, user } = response.data;
      
      if (mounted) {
        localStorage.setItem('token', token);
      }
      api.setToken(token);
      setUser(user);
      
      router.push('/');
    } catch (error: any) {
      // Check if account is deactivated
      if (error.response?.status === 403 && error.response?.data?.accountDeactivated) {
        const deactivatedError = new Error(error.response.data.message);
        (deactivatedError as any).accountDeactivated = true;
        (deactivatedError as any).userInfo = {
          userId: error.response.data.userId,
          username: error.response.data.username,
          email: error.response.data.email
        };
        throw deactivatedError;
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;
      
      if (mounted) {
        localStorage.setItem('token', token);
      }
      api.setToken(token);
      setUser(user);
      
      router.push('/');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    if (mounted) {
      localStorage.removeItem('token');
    }
    api.removeToken();
    setUser(null);
    router.push('/login');
  };

  const reactivateAccount = async (identifier: string, password: string) => {
    try {
      const response = await api.post('/auth/reactivate', { identifier, password });
      const { token, user } = response.data;
      
      if (mounted) {
        localStorage.setItem('token', token);
      }
      api.setToken(token);
      setUser(user);
      
      router.push('/');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Reactivation failed');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    reactivateAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}