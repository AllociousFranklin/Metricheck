import type { Violation } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockViolations, getViolationById as getMockViolation } from '@/mocks/violations';

export async function getViolations(filters?: {
  search?: string;
  severity?: string;
  type?: string;
  status?: string;
}): Promise<Violation[]> {
  if (USE_MOCKS) {
    await delay();
    let results = [...mockViolations];
    if (filters?.severity) {
      results = results.filter(v => v.severity === filters.severity);
    }
    if (filters?.type) {
      results = results.filter(v => v.type === filters.type);
    }
    if (filters?.status) {
      results = results.filter(v => v.reviewStatus === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(v =>
        v.field.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        (v.productName || '').toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  throw new Error('Real API not configured');
}

export async function getViolation(id: string): Promise<Violation> {
  if (USE_MOCKS) {
    await delay();
    const violation = getMockViolation(id);
    if (!violation) throw new Error(`Violation ${id} not found`);
    return violation;
  }
  throw new Error('Real API not configured');
}

export async function updateViolationReview(
  id: string,
  status: string,
  note?: string
): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    return;
  }
  throw new Error('Real API not configured');
}

