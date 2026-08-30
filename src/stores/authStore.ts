import { create } from 'zustand';
import type { User, LoginCredentials } from '@/types';
import * as authApi from '@/services/authApi';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // start loading to prevent flash
  error: null,
  
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login();
      // the redirect will handle the rest
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
      throw err;
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.loginWithEmail(email, password);
      set({
        user,
        token: 'active-session-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Email sign-in failed',
      });
      throw err;
    }
  },
  
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },
  
  initialize: () => {
    // Check current session
    authApi.getCurrentUser().then(user => {
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = await authApi.getCurrentUser();
        set({
          user,
          token: session?.access_token || null,
          isAuthenticated: !!user,
          isLoading: false
        });
      } else if (event === 'SIGNED_OUT') {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });
  },
  
  clearError: () => set({ error: null }),
}));

