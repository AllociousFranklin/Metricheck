// @ts-nocheck
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package, Calendar, Activity, Eye, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getProduct } from '@/services/productApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-200 w-1/3 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-white rounded-lg animate-pulse"></div>
          <div className="h-64 bg-white rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center">
        <p className="text-error text-lg mb-4">Product not found or failed to load.</p>
        <Button onClick={() => navigate('/products')}>Back to Products</Button>
      </div>
    );
  }

  const trendData = product.inspections?.map((insp: any) => ({
    date: new Date(insp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: insp.score
  })).reverse() || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center text-sm text-neutral-500 mb-2">
        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-neutral-900 font-medium truncate">{product.name}</span>
      </div>

      <PageHeader title={product.name} subtitle={product.manufacturer} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-neutral-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-h3 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Category</dt>
                <dd className="mt-1 text-sm text-neutral-900">{product.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Barcode/UPC</dt>
                <dd className="mt-1 text-sm text-neutral-900">{product.barcode || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Net Quantity</dt>
                <dd className="mt-1 text-sm text-neutral-900">{product.netQuantity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">MRP</dt>
                <dd className="mt-1 text-sm text-neutral-900">{product.mrp || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-neutral-500">Description</dt>
                <dd className="mt-1 text-sm text-neutral-900">{product.description || 'No description provided.'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-100 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-h3 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Latest Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-6">
            {product.lastScore !== undefined ? (
              <>
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={cn(
                        product.lastScore >= 90 ? "text-success" :
                        product.lastScore >= 70 ? "text-warning" : "text-error"
                      )}
                      strokeDasharray={`${product.lastScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-neutral-900">{product.lastScore}</span>
                    <span className="text-xs text-neutral-500">/ 100</span>
                  </div>
                </div>
                <StatusBadge status={product.inspections?.[0]?.status || 'UNKNOWN'} />
                <p className="text-xs text-neutral-500 mt-4 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last inspected: {new Date(product.lastInspectionDate).toLocaleDateString()}
                </p>
              </>
            ) : (
              <div className="text-center text-neutral-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-neutral-600" />
                <p>No inspection data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {trendData.length > 1 && (
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-h3">Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" tick={{fontSize: 12}} />
                  <YAxis stroke="#6B7280" domain={[0, 100]} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                  <Line type="monotone" dataKey="score" stroke="#087E8B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-neutral-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-h3">Inspection History</CardTitle>
          <Button onClick={() => navigate('/inspections/new')} variant="outline" size="sm">
            Start New Inspection
          </Button>
        </CardHeader>
        <CardContent>
          {product.inspections && product.inspections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-600 bg-neutral-25 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Violations</th>
                    <th className="px-4 py-3">Inspector</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {product.inspections.map((inspection: any) => (
                    <tr key={inspection.id} className="border-b border-neutral-100 hover:bg-neutral-25 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{inspection.id}</td>
                      <td className="px-4 py-3 text-neutral-600">{new Date(inspection.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={inspection.status} /></td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "font-semibold",
                          inspection.score >= 90 ? "text-success" :
                          inspection.score >= 70 ? "text-warning" : "text-error"
                        )}>
                          {inspection.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{inspection.violationsCount}</td>
                      <td className="px-4 py-3 text-neutral-600">{inspection.inspectorName}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/inspections/${inspection.id}`)} className="text-primary hover:bg-primary/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              No inspections recorded for this product.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

