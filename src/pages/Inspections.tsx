import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getInspections } from '@/services/inspectionApi';

export const InspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data, isLoading, error } = useQuery({
    queryKey: ['inspections', statusFilter, searchTerm],
    queryFn: () => getInspections({ status: statusFilter !== 'All' ? statusFilter : undefined, search: searchTerm }),
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Inspections" subtitle="Manage and track compliance inspections" />
        <Button variant="primary" onClick={() => navigate('/inspections/new')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </Button>
      </div>

      <Card className="bg-white shadow-sm border-neutral-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by ID, product, or manufacturer..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-500" />
              <select
                className="border border-neutral-200 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white text-neutral-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non-Compliant</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white rounded-md animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error bg-white border-l-4 border-l-error rounded-lg">
              Failed to load inspections. Please try again.
            </div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 mb-4">No inspections found matching your criteria.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-600 bg-neutral-25 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Inspection ID</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 hidden md:table-cell">Manufacturer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Violations</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 hidden md:table-cell">Inspector</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((inspection: any) => (
                    <tr 
                      key={inspection.id} 
                      className="bg-white border-b border-neutral-100 hover:bg-neutral-25 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/inspections/${inspection.id}`)}>
                        {inspection.id}
                      </td>
                      <td className="px-4 py-4 font-medium text-neutral-900">{inspection.productName}</td>
                      <td className="px-4 py-4 text-neutral-600 hidden md:table-cell">{inspection.manufacturer}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inspection.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            inspection.score >= 90 ? "text-success" :
                            inspection.score >= 70 ? "text-warning" : "text-error"
                          )}>
                            {inspection.score}%
                          </span>
                          <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden hidden lg:block">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                inspection.score >= 90 ? "bg-success" :
                                inspection.score >= 70 ? "bg-warning" : "bg-error"
                              )} 
                              style={{ width: `${inspection.score}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {inspection.violationsCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border-l-4 border-l-error text-error text-xs font-bold">
                            {inspection.violationsCount}
                          </span>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {new Date(inspection.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-neutral-600 hidden md:table-cell">{inspection.inspectorName}</td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/inspections/${inspection.id}`)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4 mr-1 hidden sm:inline" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
