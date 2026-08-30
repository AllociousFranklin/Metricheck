import type { Violation } from '@/types';
import { supabase } from '@/lib/supabase';

export async function getViolations(filters?: {
  search?: string;
  severity?: string;
  type?: string;
  status?: string;
}): Promise<Violation[]> {
  let query = supabase.from('violations').select('*, inspections!inner(product_name)');

  if (filters?.severity && filters.severity !== 'All') {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.type && filters.type !== 'All') {
    query = query.eq('type', filters.type);
  }
  if (filters?.status && filters.status !== 'All') {
    query = query.eq('review_status', filters.status);
  }
  if (filters?.search) {
    const q = filters.search;
    query = query.or(`field.ilike.%${q}%,description.ilike.%${q}%,inspections.product_name.ilike.%${q}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('getViolations query error:', error);
    return [];
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    inspectionId: v.inspection_id,
    type: v.type,
    severity: v.severity,
    field: v.field,
    description: v.description,
    confidence: v.confidence,
    ruleReference: v.rule_reference_json || v.rule_reference,
    reviewStatus: v.review_status,
    reviewedBy: v.reviewed_by,
    reviewedAt: v.reviewed_at,
    reviewNote: v.review_note,
    createdAt: v.created_at,
    productName: v.inspections?.product_name || 'Packaged Product'
  }));
}

export async function getViolation(id: string): Promise<Violation> {
  const { data: v, error } = await supabase
    .from('violations')
    .select('*, inspections(product_name)')
    .eq('id', id)
    .single();

  if (error || !v) {
    throw new Error(`Violation ${id} not found: ${error?.message || 'Record does not exist'}`);
  }

  return {
    id: v.id,
    inspectionId: v.inspection_id,
    type: v.type,
    severity: v.severity,
    field: v.field,
    description: v.description,
    confidence: v.confidence,
    ruleReference: v.rule_reference_json || v.rule_reference,
    reviewStatus: v.review_status,
    reviewedBy: v.reviewed_by,
    reviewedAt: v.reviewed_at,
    reviewNote: v.review_note,
    createdAt: v.created_at,
    productName: v.inspections?.product_name || 'Packaged Product'
  };
}

export async function updateViolationReview(
  id: string,
  status: string,
  note?: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const { error } = await supabase
    .from('violations')
    .update({
      review_status: status,
      review_note: note,
      reviewed_by: session?.user?.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
