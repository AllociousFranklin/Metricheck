import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Package, History } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getProducts } from '@/services/productApi';

export const ProductRepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', categoryFilter, searchTerm],
    queryFn: () => getProducts({ category: categoryFilter !== 'All' ? categoryFilter : undefined, search: searchTerm }),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Products" subtitle="Product Repository" />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search products by name, manufacturer, or barcode..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-neutral-500" />
          <select
            className="border border-neutral-200 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white text-neutral-900"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="FMCG">FMCG</option>
            <option value="Electronics">Electronics</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Food & Beverage">Food & Beverage</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-error bg-white border-l-4 border-l-error rounded-lg">
          Failed to load products. Please try again.
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-neutral-100">
          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">No products found matching your criteria.</p>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((product: any) => (
            <Card 
              key={product.id} 
              className="bg-white border-neutral-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">{product.name}</h3>
                  <span className="shrink-0 bg-white text-neutral-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-neutral-600"><span className="font-medium">Manufacturer:</span> {product.manufacturer}</p>
                  <p className="text-sm text-neutral-600"><span className="font-medium">Net Qty:</span> {product.netQuantity}</p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-500">
                    <History className="w-4 h-4 mr-1" />
                    {product.inspectionCount} Inspections
                  </div>
                  {product.lastScore !== undefined && (
                    <div className="text-sm text-right">
                      <span className="text-neutral-500 block text-xs">Last Score</span>
                      <span className={cn(
                        "font-bold",
                        product.lastScore >= 90 ? "text-success" :
                        product.lastScore >= 70 ? "text-warning" : "text-error"
                      )}>
                        {product.lastScore}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
