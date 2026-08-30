import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockProducts } from '@/mocks/products';
import { mockInspections } from '@/mocks/inspections';

export async function getProducts(filters?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  try {
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

    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
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
  } catch (err) {
    console.warn('Supabase getProducts query fallback:', err);
  }

  // Graceful fallback to mock products
  let result = [...mockProducts];
  if (filters?.category && filters.category !== 'All') {
    result = result.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.manufacturer.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getProduct(id: string): Promise<Product & { inspections: import('@/types').Inspection[] }> {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!productError && product) {
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
  } catch (err) {
    console.warn(`Supabase getProduct(${id}) fallback:`, err);
  }

  const found = mockProducts.find(p => p.id === id) || mockProducts[0];
  const relatedInspections = mockInspections.filter(i => i.product.id === id || i.product.name === found.name);
  return {
    ...found,
    inspections: relatedInspections
  };
}
