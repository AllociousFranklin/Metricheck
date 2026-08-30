import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockUsers } from '@/mocks/users';

const DEMO_USER_KEY = 'metricheck_demo_user';
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder'));
};

export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!email || !password) {
    throw new Error('Please enter both email and password');
  }

  // 1. Try Supabase Auth if real URL configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          role: (profile?.role || 'INSPECTOR') as UserRole,
          department: profile?.department || 'Inspection Division',
          avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (err: any) {
      // If Supabase gave an invalid credentials error, bubble it up unless in offline/demo mode
      if (err?.message && !err.message.includes('fetch') && !err.message.includes('network')) {
        throw err;
      }
      console.warn('Supabase auth attempt failed, falling back to local verification:', err);
    }
  }

  // 2. Local / Demo User Fallback
  const matched = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  const role: UserRole = email.toLowerCase().includes('admin') ? 'ADMIN' : (matched?.role || 'INSPECTOR');
  
  const user: User = {
    id: matched?.id || `usr-${Date.now()}`,
    email: email,
    name: matched?.name || email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
    role: role,
    department: matched?.department || 'Legal Metrology Enforcement',
    avatar: matched?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  };

  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}

export async function login(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google OAuth, or use Email / Quick Demo login above.');
  }

  const redirectUrl = window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });

  if (error) {
    throw error;
  }
}

export async function loginAsDemo(role: 'INSPECTOR' | 'ADMIN' = 'INSPECTOR'): Promise<User> {
  const matched = mockUsers.find(u => u.role === role) || mockUsers[0];
  const user: User = {
    id: matched?.id || 'usr-demo-001',
    email: matched?.email || 'anand.patel@legalmetrology.gov.in',
    name: matched?.name || 'Anand Patel',
    role: role,
    department: matched?.department || 'Metrology Enforcement Division',
    avatar: matched?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  // Check local session
  try {
    const saved = localStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  if (isSupabaseConfigured()) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Inspector',
        role: (profile?.role || 'INSPECTOR') as UserRole,
        department: profile?.department || 'Legal Metrology Inspection Division',
        avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      };
    } catch (err) {
      console.warn('Supabase auth getSession check failed:', err);
    }
  }
  return null;
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem(DEMO_USER_KEY);
  } catch {}

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
  }
}

