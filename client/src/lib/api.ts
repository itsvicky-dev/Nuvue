import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 API Client initialized with baseURL:', baseURL);
    }
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, config.baseURL);
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  // File upload
  async uploadFile(url: string, formData: FormData, onProgress?: (progress: number) => void) {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

// Create and export API client instance
export const api = new ApiClient();

// Specific API functions
export const authApi = {
  login: (data: { identifier: string; password: string }) =>
    api.post('/auth/login', data),
  
  register: (data: { username: string; email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; email: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

export const usersApi = {
  getProfile: (username: string) => api.get(`/users/${username}`),
  
  updateProfile: (data: FormData) => api.uploadFile('/users/profile', data),
  
  follow: (username: string) => api.post(`/users/${username}/follow`),
  
  search: (query: string, page = 1, limit = 20) =>
    api.get(`/users/search?q=${query}&page=${page}&limit=${limit}`),
  
  getFollowers: (username: string, page = 1) =>
    api.get(`/users/${username}/followers?page=${page}`),
  
  getFollowing: (username: string, page = 1) =>
    api.get(`/users/${username}/following?page=${page}`),
  
  getSuggestions: (limit = 10) =>
    api.get(`/users/suggestions?limit=${limit}`),
};

export const postsApi = {
  getFeed: (page = 1, limit = 10) =>
    api.get(`/posts/feed?page=${page}&limit=${limit}`),
  
  getExplore: (page = 1, limit = 20) =>
    api.get(`/posts/explore?page=${page}&limit=${limit}`),
  
  getPost: (id: string) => api.get(`/posts/${id}`),
  
  createPost: (data: FormData) => api.uploadFile('/posts', data),
  
  likePost: (id: string) => api.post(`/posts/${id}/like`),
  
  addComment: (id: string, text: string) =>
    api.post(`/posts/${id}/comments`, { text }),
  
  getUserPosts: (username: string, page = 1) =>
    api.get(`/posts/user/${username}?page=${page}`),
  
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  
  editPost: (id: string, caption: string) => 
    api.put(`/posts/${id}`, { caption }),
};

export const storiesApi = {
  getFeed: () => api.get('/stories/feed'),
  
  getUserStories: (username: string) => api.get(`/stories/user/${username}`),
  
  createStory: (data: FormData) => api.uploadFile('/stories', data),
  
  viewStory: (id: string) => api.post(`/stories/${id}/view`),
  
  likeStory: (id: string) => api.post(`/stories/${id}/like`),
  
  replyToStory: (id: string, message: string) =>
    api.post(`/stories/${id}/reply`, { message }),
  
  deleteStory: (id: string) => api.delete(`/stories/${id}`),
};

export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  
  getMessages: (userId: string, page = 1) =>
    api.get(`/messages/conversations/${userId}?page=${page}`),
  
  sendMessage: (data: FormData) => api.uploadFile('/messages/send', data),
  
  markAsRead: (messageIds: string[], conversationId: string) =>
    api.post('/messages/read', { messageIds, conversationId }),
  
  reactToMessage: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/react`, { emoji }),
  
  deleteMessage: (messageId: string, deleteFor: 'me' | 'everyone') =>
    api.delete(`/messages/${messageId}`, { data: { deleteFor } }),
};

export const uploadApi = {
  single: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadFile('/upload/single', formData);
  },
  
  multiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.uploadFile('/upload/multiple', formData);
  },
  
  profilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.uploadFile('/upload/profile-picture', formData);
  },
};