import type { Violation } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockViolations } from '@/mocks/violations';

export async function getViolations(filters?: {
  search?: string;
  severity?: string;
  type?: string;
  status?: string;
}): Promise<Violation[]> {
  try {
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
    if (!error && data && data.length > 0) {
      return data.map((v: any) => ({
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
  } catch (err) {
    console.warn('Supabase getViolations fallback:', err);
  }

  // Graceful fallback to mockViolations
  let results = [...mockViolations];
  if (filters?.severity && filters.severity !== 'All') {
    results = results.filter(v => v.severity === filters.severity);
  }
  if (filters?.status && filters.status !== 'All') {
    results = results.filter(v => v.reviewStatus === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(v => 
      v.id.toLowerCase().includes(q) || 
      v.type.toLowerCase().includes(q) ||
      (v.productName && v.productName.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function getViolation(id: string): Promise<Violation> {
  try {
    const { data: v, error } = await supabase
      .from('violations')
      .select('*, inspections(product_name)')
      .eq('id', id)
      .single();

    if (!error && v) {
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
  } catch (err) {
    console.warn(`Supabase getViolation(${id}) fallback:`, err);
  }

  const found = mockViolations.find(v => v.id === id) || mockViolations[0];
  return found;
}

export async function updateViolationReview(
  id: string,
  status: string,
  note?: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase
      .from('violations')
      .update({
        review_status: status,
        review_note: note,
        reviewed_by: session?.user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
  } catch (err) {
    console.warn(`Supabase updateViolationReview(${id}) fallback:`, err);
  }

  // Update in local mock
  const index = mockViolations.findIndex(v => v.id === id);
  if (index !== -1) {
    mockViolations[index].reviewStatus = status as any;
    if (note) mockViolations[index].reviewNote = note;
  }
}
