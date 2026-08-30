import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';

export async function getProducts(filters?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (filters?.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    const q = filters.search;
    query = query.or(`name.ilike.%${q}%,manufacturer.ilike.%${q}%,category.ilike.%${q}%`);
  }

  query = query.order('last_inspection_date', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('getProducts query error:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
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
    throw new Error(`Product ${id} not found: ${productError?.message || 'Record does not exist'}`);
  }

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  return {
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
    imageUrl: product.image_url,
    inspections: (inspections || []).map((i: any) => ({
      ...i,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        manufacturer: product.manufacturer,
        inspectionCount: product.inspection_count,
      }
    }))
  };
}
