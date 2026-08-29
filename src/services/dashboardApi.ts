import type { DashboardStats } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockDashboardStats } from '@/mocks/dashboard';

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) {
    await delay();
    return mockDashboardStats;
  }
  throw new Error('Real API not configured');
}
