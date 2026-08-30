import type { DashboardStats } from '@/types';
import { supabase } from '@/lib/supabase';

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('id, status, created_at');

  const { data: violations } = await supabase
    .from('violations')
    .select('field, severity');

  const allInspections = inspections || [];
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

  // Aggregate top violations
  const violCounts: Record<string, number> = {};
  (violations || []).forEach((v: any) => {
    const name = v.field || 'General Violation';
    violCounts[name] = (violCounts[name] || 0) + 1;
  });

  const violationCategories = Object.entries(violCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalInspections: total,
    compliant,
    nonCompliant,
    needsReview,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    complianceTrend: dynamicTrends,
    violationCategories,
    recentActivity: [],
    reviewQueue: []
  };
}
