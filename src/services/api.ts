import { APP_CONFIG } from '@/app/config';

const API_BASE = APP_CONFIG.apiBaseUrl;
const USE_MOCKS = !import.meta.env.VITE_API_BASE_URL;

function delay(ms?: number): Promise<void> {
  const duration = ms ?? (APP_CONFIG.mockDelay.min + Math.random() * (APP_CONFIG.mockDelay.max - APP_CONFIG.mockDelay.min));
  return new Promise(resolve => setTimeout(resolve, duration));
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (USE_MOCKS) {
    throw new Error('Mock mode: should not reach real API');
  }
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export { apiRequest, delay, USE_MOCKS, API_BASE };
