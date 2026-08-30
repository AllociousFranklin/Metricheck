import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!email || !password) {
    throw new Error('Please enter both email and password');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Authentication failed. Please check your credentials.');
  }

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
    department: profile?.department || 'Legal Metrology Inspection Division',
    avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url,
  };
  return user;
}

export async function login(): Promise<void> {
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

export async function getCurrentUser(): Promise<User | null> {
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
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase signOut error:', error);
  }
}

