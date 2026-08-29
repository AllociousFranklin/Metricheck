import type { LoginCredentials, LoginResponse, User } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockUsers, mockPasswords } from '@/mocks/users';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  if (USE_MOCKS) {
    await delay(800);
    const user = mockUsers.find(u => u.email === credentials.email);
    const validPassword = mockPasswords[credentials.email];
    if (!user || validPassword !== credentials.password) {
      throw new Error('Invalid email or password');
    }
    return {
      user,
      token: `mock-token-${user.id}-${Date.now()}`,
    };
  }
  // Real API call would go here
  throw new Error('Real API not configured');
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCKS) {
    await delay();
    const stored = localStorage.getItem('lm_user');
    if (!stored) throw new Error('Not authenticated');
    return JSON.parse(stored) as User;
  }
  throw new Error('Real API not configured');
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    return;
  }
  throw new Error('Real API not configured');
}
