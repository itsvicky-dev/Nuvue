'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usersApi } from '@/lib/api';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileNavbar } from '@/components/Layout/MobileNavbar';
import { UserCard } from '@/components/Search/UserCard';
import { Search, X, Hash, User } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'user' | 'hashtag' | 'post';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  followers?: number;
  posts?: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await usersApi.search(query);
      const users = response.data.users || [];
      
      const userResults: SearchResult[] = users.map((user: any) => ({
        type: 'user' as const,
        id: user._id,
        title: user.username,
        subtitle: user.fullName,
        imageUrl: user.profilePicture,
        followers: user.followersCount || 0,
        posts: user.postsCount || 0
      }));
      
      setSearchResults(userResults);
      setIsLoading(false);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    performSearch(value);
  };

  const addToRecentSearches = (result: SearchResult) => {
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const removeFromRecent = (id: string) => {
    const updated = recentSearches.filter(r => r.id !== id);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

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
            {/* Search Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Search
              </h1>
              
              {/* Search Input */}
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, hashtags..."
                  className="w-full pl-10 pr-10 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-ig-blue focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm">
              {searchQuery ? (
                /* Search Results */
                <div>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Search Results
                    </h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ig-blue mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.map((result) => (
                        result.type === 'user' ? (
                          <div key={result.id} onClick={() => addToRecentSearches(result)}>
                            <UserCard
                              user={{
                                _id: result.id,
                                username: result.title,
                                fullName: result.subtitle || result.title,
                                profilePicture: result.imageUrl,
                                followersCount: result.followers || 0,
                                postsCount: result.posts || 0,
                                isVerified: false
                              }}
                            />
                          </div>
                        ) : (
                          <Link
                            key={result.id}
                            href={`/explore/tags/${result.title.replace('#', '')}`}
                            className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => addToRecentSearches(result)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <Hash size={20} className="text-gray-500" />
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {result.title}
                                </div>
                                {result.subtitle && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {result.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              ) : (
                /* Recent Searches */
                <div>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Recent
                    </h2>
                    {recentSearches.length > 0 && (
                      <button
                        onClick={clearRecentSearches}
                        className="text-sm text-ig-blue hover:text-ig-blue-hover"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  {recentSearches.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentSearches.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group"
                        >
                          <Link 
                            href={result.type === 'user' ? `/${result.title}` : `/explore/tags/${result.title.replace('#', '')}`}
                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              {result.type === 'user' ? (
                                <img
                                  src={result.imageUrl}
                                  alt={result.title}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <Hash size={20} className="text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                          </Link>
                          
                          <button
                            onClick={() => removeFromRecent(result.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Search size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No recent searches</p>
                      <p className="text-sm mt-1">Search for users and hashtags to see them here</p>
                    </div>
                  )}
                </div>
              )}
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