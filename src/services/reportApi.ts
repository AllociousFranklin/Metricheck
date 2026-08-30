import type { Report } from '@/types';
import { supabase } from '@/lib/supabase';
import { getInspection } from './inspectionApi';
import { mockReports } from '@/mocks/reports';

export async function getReports(filters?: {
  search?: string;
  status?: string;
}): Promise<Report[]> {
  try {
    let query = supabase.from('reports').select('*, inspections(*, products(*), inspection_images(*), violations(*))');

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((r: any) => mapReport(r));
    }
  } catch (err) {
    console.warn('Supabase getReports fallback:', err);
  }

  let results = [...mockReports];
  if (filters?.status && filters.status !== 'All') {
    results = results.filter(r => r.status === filters.status || r.assessmentResult === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(r => 
      r.id.toLowerCase().includes(q) || 
      r.productName.toLowerCase().includes(q) ||
      r.inspectionId.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getReport(id: string): Promise<Report> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, inspections(*, products(*), inspection_images(*), violations(*))')
      .eq('id', id)
      .single();

    if (!error && data) {
      return mapReport(data);
    }
  } catch (err) {
    console.warn(`Supabase getReport(${id}) fallback:`, err);
  }

  const found = mockReports.find(r => r.id === id) || mockReports[0];
  return found;
}

export async function getReportByInspection(inspectionId: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, inspections(*, products(*), inspection_images(*), violations(*))')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      return mapReport(data);
    }
  } catch (err) {
    console.warn(`Supabase getReportByInspection(${inspectionId}) fallback:`, err);
  }

  return mockReports.find(r => r.inspectionId === inspectionId) || null;
}

export async function generateReport(inspectionId: string): Promise<Report> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const inspection = await getInspection(inspectionId);
      
      const { data, error } = await supabase.from('reports').insert({
        inspection_id: inspectionId,
        user_id: userId,
        product_id: inspection.product.id,
        status: 'GENERATED'
      }).select().single();

      if (!error && data) {
        return await getReport(data.id);
      }
    }
  } catch (err) {
    console.warn('Supabase generateReport fallback:', err);
  }

  const inspection = await getInspection(inspectionId);
  const newReport: Report = {
    id: `rep-${Date.now()}`,
    inspectionId: inspection.id,
    productId: inspection.product.id,
    productName: inspection.product.name,
    manufacturer: inspection.product.manufacturer,
    category: inspection.product.category,
    status: 'GENERATED',
    assessmentStatus: inspection.status,
    assessmentResult: inspection.status,
    complianceScore: inspection.complianceScore,
    score: inspection.complianceScore,
    passedChecks: 6,
    failedChecks: 0,
    reviewChecks: 0,
    totalChecks: 6,
    generatedAt: new Date().toISOString(),
    generatedDate: new Date().toISOString(),
    inspectionDate: inspection.createdAt,
    generatedBy: 'System AI Engine',
    inspectorName: inspection.inspectorName || 'Field Inspector',
    ruleSetVersion: '2026.1',
    evidenceImages: inspection.images?.map(i => i.url) || [],
    findings: (inspection.violations || []).map(v => ({
      id: v.id,
      type: v.type,
      field: v.field,
      severity: v.severity,
      description: v.description,
      ruleReference: typeof v.ruleReference === 'object' ? `${(v.ruleReference as any)?.ruleNumber || ''} ${(v.ruleReference as any)?.title || ''}`.trim() : (v.ruleReference || ''),
      reviewStatus: v.reviewStatus
    }))
  };
  mockReports.unshift(newReport);
  return newReport;
}

export async function exportReport(id: string, format: 'pdf' | 'docx' | 'json'): Promise<Blob> {
  const rep = await getReport(id);
  if (format === 'json') {
    return new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
  }
  const mockContent = `Legal Metrology Compliance Report\nReport ID: ${rep.id}\nProduct: ${rep.productName}\nScore: ${rep.complianceScore}%\nStatus: ${rep.assessmentStatus}`;
  return new Blob([mockContent], { 
    type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}

function mapReport(r: any): Report {
  const i = r.inspections || {};
  const p = i.products || {};
  return {
    id: r.id,
    inspectionId: r.inspection_id,
    productId: r.product_id,
    productName: p.name || i.product_name || 'Packaged Commodity',
    manufacturer: p.manufacturer || i.product_manufacturer || 'Declared Entity',
    category: p.category || 'Packaged Commodity',
    status: r.status || 'GENERATED',
    assessmentStatus: i.status === 'COMPLIANT' ? 'COMPLIANT' : i.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'NON_COMPLIANT',
    assessmentResult: i.status || 'COMPLIANT',
    complianceScore: i.compliance_score || 100,
    score: i.compliance_score || 100,
    passedChecks: i.passed_checks || 6,
    failedChecks: i.failed_checks || 0,
    reviewChecks: i.review_checks || 0,
    totalChecks: i.total_checks || 6,
    generatedAt: r.created_at || new Date().toISOString(),
    generatedDate: r.created_at || new Date().toISOString(),
    inspectionDate: i.created_at || new Date().toISOString(),
    inspectorName: 'Inspector',
    generatedBy: 'System',
    ruleSetVersion: i.rule_set_version || '2026.1',
    findings: (i.violations || []).map((v: any) => ({
      id: v.id,
      type: v.type,
      severity: v.severity,
      field: v.field,
      description: v.description,
      reviewStatus: v.review_status
    })),
    evidenceImages: (i.inspection_images || []).map((img: any) => 
      img.storage_path ? supabase.storage.from('inspection-images').getPublicUrl(img.storage_path).data.publicUrl : ''
    ).filter(Boolean)
  };
}
