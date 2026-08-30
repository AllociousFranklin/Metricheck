import type { Report } from '@/types';
import { supabase } from '@/lib/supabase';
import { getInspection } from './inspectionApi';

export async function getReports(filters?: {
  search?: string;
  status?: string;
}): Promise<Report[]> {
  let query = supabase.from('reports').select('*, inspections(*, products(*), inspection_images(*), violations(*))');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  // search by ID isn't as trivial on UUID, so maybe skip or do ILIKE on product_name if joined.
  
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((r: any) => mapReport(r));
}

export async function getReport(id: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, inspections(*, products(*), inspection_images(*), violations(*))')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error(`Report ${id} not found`);
  return mapReport(data);
}

export async function getReportByInspection(inspectionId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, inspections(*, products(*), inspection_images(*), violations(*))')
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return mapReport(data);
}

export async function generateReport(inspectionId: string): Promise<Report> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const inspection = await getInspection(inspectionId);
  
  const { data, error } = await supabase.from('reports').insert({
    inspection_id: inspectionId,
    user_id: userId,
    product_id: inspection.product.id,
    status: 'GENERATED'
  }).select().single();

  if (error) throw error;

  return await getReport(data.id);
}

export async function exportReport(id: string, format: 'pdf' | 'docx' | 'json'): Promise<Blob> {
  // Mock export for now as backend generation isn't wired up to a PDF lambda yet
  const mockContent = `Mock ${format.toUpperCase()} Report: ${id}`;
  return new Blob([mockContent], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

function mapReport(r: any): Report {
  const i = r.inspections || {};
  const p = i.products || {};
  return {
    id: r.id,
    inspectionId: r.inspection_id,
    productId: r.product_id,
    productName: p.name || i.product_name || '',
    status: r.status,
    assessmentStatus: i.status === 'COMPLIANT' ? 'COMPLIANT' : i.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'NON_COMPLIANT',
    complianceScore: i.compliance_score || 0,
    passedChecks: i.passed_checks || 0,
    failedChecks: i.failed_checks || 0,
    reviewChecks: i.review_checks || 0,
    totalChecks: i.total_checks || 0,
    generatedAt: r.created_at,
    inspectorName: 'Inspector', // from profiles if joined
    generatedBy: 'System',
    ruleSetVersion: i.rule_set_version || '2026.1',
    pdfUrl: r.pdf_storage_path ? supabase.storage.from('inspection-reports').getPublicUrl(r.pdf_storage_path).data.publicUrl : undefined,
    findings: (i.violations || []).map((v: any) => ({
      id: v.id,
      inspectionId: v.inspection_id,
      type: v.type,
      severity: v.severity,
      field: v.field,
      description: v.description,
      confidence: v.confidence,
      reviewStatus: v.review_status,
      reviewNote: v.review_note
    })),
    evidenceImages: (i.inspection_images || []).map((img: any) => ({
      id: img.id,
      url: supabase.storage.from('inspection-images').getPublicUrl(img.storage_path).data.publicUrl,
      category: img.category,
      fileName: img.file_name,
      fileSize: img.file_size
    }))
  };
}
