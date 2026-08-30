import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockUsers } from '@/mocks/users';

const DEMO_USER_KEY = 'metricheck_demo_user';

export async function login(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
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
  // Check local demo user session
  try {
    const saved = localStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    // Fetch the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
      role: profile?.role || 'INSPECTOR',
      department: 'Inspection',
      avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
    };
  } catch (err) {
    console.warn('Supabase auth getSession check failed:', err);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem(DEMO_USER_KEY);
  } catch {}

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signOut warning:', error);
    }
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

