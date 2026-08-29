import type { Product } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockProducts } from '@/mocks/products';
import { getInspectionsByProductId } from '@/mocks/inspections';

export async function getProducts(filters?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  if (USE_MOCKS) {
    await delay();
    let results = [...mockProducts];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (filters?.category) {
      results = results.filter(p => p.category === filters.category);
    }
    return results;
  }
  throw new Error('Real API not configured');
}

export async function getProduct(id: string): Promise<Product & { inspections: import('@/types').Inspection[] }> {
  if (USE_MOCKS) {
    await delay();
    const product = mockProducts.find(p => p.id === id);
    if (!product) throw new Error(`Product ${id} not found`);
    const inspections = getInspectionsByProductId(id);
    return { ...product, inspections };
  }
  throw new Error('Real API not configured');
}
