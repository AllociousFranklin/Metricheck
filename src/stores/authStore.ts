import { create } from 'zustand';
import type { User, LoginCredentials } from '@/types';
import * as authApi from '@/services/authApi';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('lm_user', JSON.stringify(response.user));
      localStorage.setItem('lm_token', response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
      throw err;
    }
  },
  
  logout: () => {
    localStorage.removeItem('lm_user');
    localStorage.removeItem('lm_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
  
  initialize: () => {
    const userStr = localStorage.getItem('lm_user');
    const token = localStorage.getItem('lm_token');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('lm_user');
        localStorage.removeItem('lm_token');
      }
    }
  },
  
  clearError: () => set({ error: null }),
}));

