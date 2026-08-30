import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';

export async function getProducts(filters?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    const q = filters.search;
    query = query.or(`name.ilike.%${q}%,manufacturer.ilike.%${q}%,category.ilike.%${q}%`);
  }

  query = query.order('last_inspection_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Map snake_case to camelCase
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    manufacturer: p.manufacturer,
    netQuantity: p.net_quantity,
    mrp: p.mrp,
    inspectionCount: p.inspection_count,
    lastInspectionDate: p.last_inspection_date,
    lastComplianceScore: p.last_compliance_score,
    lastStatus: p.last_status,
    imageUrl: p.image_url
  }));
}

export async function getProduct(id: string): Promise<Product & { inspections: import('@/types').Inspection[] }> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (productError || !product) {
    throw new Error(`Product ${id} not found`);
  }

  const { data: inspections, error: inspectionsError } = await supabase
    .from('inspections')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  if (inspectionsError) {
    throw inspectionsError;
  }

  // Partial mapping of inspection, we don't need full relations here normally
  // but just matching what was returned
  const mappedProduct = {
    id: product.id,
    name: product.name,
    category: product.category,
    manufacturer: product.manufacturer,
    netQuantity: product.net_quantity,
    mrp: product.mrp,
    inspectionCount: product.inspection_count,
    lastInspectionDate: product.last_inspection_date,
    lastComplianceScore: product.last_compliance_score,
    lastStatus: product.last_status,
    imageUrl: product.image_url
  };

  const mappedInspections = (inspections || []).map((insp: any) => ({
    id: insp.id,
    status: insp.status,
    complianceScore: insp.compliance_score,
    confidence: insp.confidence,
    createdAt: insp.created_at,
    updatedAt: insp.updated_at,
    product: mappedProduct
  }));

  return { 
    ...mappedProduct, 
    inspections: mappedInspections as import('@/types').Inspection[]
  };
}

