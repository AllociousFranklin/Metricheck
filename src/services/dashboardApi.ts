import type { DashboardStats } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockDashboardStats } from '@/mocks/dashboard';
import { mockInspections } from '@/mocks/inspections';

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) {
    await delay();
    
    // Calculate dynamic stats from actual mockInspections
    const total = mockInspections.length;
    const compliant = mockInspections.filter(i => i.status === 'COMPLIANT').length;
    const nonCompliant = mockInspections.filter(i => i.status === 'NON_COMPLIANT').length;
    const needsReview = mockInspections.filter(i => i.status === 'NEEDS_REVIEW' || i.status === 'IN_PROGRESS' || i.status === 'DRAFT').length;

    // Base trends on actual data grouped by month
    const trendsMap: Record<string, any> = {};
    mockInspections.forEach(i => {
      const date = new Date(i.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!trendsMap[month]) trendsMap[month] = { date: month, total: 0, compliant: 0, nonCompliant: 0, needsReview: 0 };
      trendsMap[month].total++;
      if (i.status === 'COMPLIANT') trendsMap[month].compliant++;
      if (i.status === 'NON_COMPLIANT') trendsMap[month].nonCompliant++;
    });

    const dynamicTrends = Object.values(trendsMap).reverse();

    return {
      ...mockDashboardStats,
      totalInspections: total,
      compliant,
      nonCompliant,
      needsReview,
      complianceRate: total > 0 ? (compliant / total) * 100 : 0,
      complianceTrend: dynamicTrends.length > 0 ? dynamicTrends : mockDashboardStats.complianceTrend,
    };
  }
  throw new Error('Real API not configured');
}
