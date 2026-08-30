import type { LoginCredentials, LoginResponse, User } from '@/types';
import { supabase } from '@/lib/supabase';

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

export async function getCurrentUser(): Promise<User | null> {
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
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

