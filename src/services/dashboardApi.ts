import type { DashboardStats } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockDashboardStats } from '@/mocks/dashboard';
import { mockInspections } from '@/mocks/inspections';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('id, status, created_at');

    if (!error && inspections && inspections.length > 0) {
      const allInspections = inspections;
      const total = allInspections.length;
      const compliant = allInspections.filter((i: any) => i.status === 'COMPLIANT').length;
      const nonCompliant = allInspections.filter((i: any) => i.status === 'NON_COMPLIANT').length;
      const needsReview = allInspections.filter((i: any) => ['NEEDS_REVIEW', 'IN_PROGRESS', 'DRAFT'].includes(i.status)).length;

      const trendsMap: Record<string, any> = {};
      allInspections.forEach((i: any) => {
        const date = new Date(i.created_at);
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
        complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        complianceTrend: dynamicTrends.length > 0 ? dynamicTrends : mockDashboardStats.complianceTrend,
      };
    }
  } catch (err) {
    console.warn('Supabase getDashboardStats fallback to in-memory store:', err);
  }

  // Graceful fallback to mock store
  const total = mockInspections.length;
  const compliant = mockInspections.filter(i => i.status === 'COMPLIANT').length;
  const nonCompliant = mockInspections.filter(i => i.status === 'NON_COMPLIANT').length;
  const needsReview = mockInspections.filter(i => ['NEEDS_REVIEW', 'IN_PROGRESS', 'DRAFT'].includes(i.status)).length;

  return {
    ...mockDashboardStats,
    totalInspections: total,
    compliant,
    nonCompliant,
    needsReview,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
  };
}
