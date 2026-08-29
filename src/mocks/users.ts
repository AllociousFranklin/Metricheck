import type { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'usr-001',
    email: 'inspector@metrology.gov',
    name: 'Rajesh Kumar',
    role: 'INSPECTOR',
    department: 'METRICHECK - Delhi Division',
  },
  {
    id: 'usr-002',
    email: 'reviewer@metrology.gov',
    name: 'Priya Sharma',
    role: 'SUPERVISOR',
    department: 'METRICHECK - Mumbai Division',
  },
  {
    id: 'usr-003',
    email: 'admin@metrology.gov',
    name: 'Anand Patel',
    role: 'ADMIN',
    department: 'METRICHECK - Central Administration',
  },
];

export const mockPasswords: Record<string, string> = {
  'inspector@metrology.gov': 'inspect123',
  'reviewer@metrology.gov': 'review123',
  'admin@metrology.gov': 'admin123',
};
