export const APP_CONFIG = {
  appName: 'METRICHECK Compliance Platform',
  appShortName: 'METRICHECK',
  version: '1.0.0',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mockDelay: { min: 300, max: 800 },
  pagination: { defaultPageSize: 10, pageSizeOptions: [10, 25, 50] },
  imageUpload: { maxFileSize: 10 * 1024 * 1024, acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'], maxImages: 10 },
  ruleSetVersion: '2026.1',
} as const;
