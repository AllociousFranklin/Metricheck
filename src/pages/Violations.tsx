import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, AlertTriangle, Eye, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getViolations } from '@/services/violationApi';

export const ViolationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data, isLoading, error } = useQuery({
    queryKey: ['violations', severityFilter, statusFilter, searchTerm],
    queryFn: () => getViolations({ 
      severity: severityFilter !== 'All' ? severityFilter : undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      search: searchTerm 
    }),
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border-l-4 border-l-error text-error">High</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border-l-4 border-l-warning text-warning">Medium</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border-l-4 border-l-info text-info">Low</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-neutral-600">{severity}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Potential Findings" subtitle="Centralized Findings Repository for review" />

      <Card className="bg-white shadow-sm border-neutral-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by ID, product, or finding type..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 border border-neutral-200 rounded-md bg-white">
                <AlertTriangle className="w-4 h-4 text-neutral-500 ml-3" />
                <select
                  className="py-2 pr-8 pl-1 focus:outline-none focus:ring-0 text-sm text-neutral-900 bg-transparent"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="All">All Severities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-md bg-white">
                <Filter className="w-4 h-4 text-neutral-500 ml-3" />
                <select
                  className="py-2 pr-8 pl-1 focus:outline-none focus:ring-0 text-sm text-neutral-900 bg-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FURTHER_REVIEW">Needs Further Review</option>
                </select>
              </div>
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
              Failed to load findings. Please try again.
            </div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No findings match your filters.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSeverityFilter('All'); setStatusFilter('All'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-600 bg-neutral-25 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 hidden md:table-cell">Product</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Confidence</th>
                    <th className="px-4 py-3">Review Status</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((violation: any) => (
                    <tr 
                      key={violation.id} 
                      className="bg-white border-b border-neutral-100 hover:bg-neutral-25 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/violations/${violation.id}`)}>
                        {violation.id}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-neutral-900">{violation.type}</p>
                          <p className="text-xs text-neutral-500">Field: {violation.field}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-900 hidden md:table-cell">
                        <span className="truncate max-w-[200px] block" title={violation.productName}>
                          {violation.productName}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {getSeverityBadge(violation.severity)}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{violation.confidence}%</span>
                          <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", violation.confidence > 80 ? "bg-success" : "bg-warning")}
                              style={{ width: `${violation.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={violation.reviewStatus} />
                      </td>
                      <td className="px-4 py-4 text-neutral-600 hidden sm:table-cell">
                        {new Date(violation.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/violations/${violation.id}`)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4 mr-1 hidden lg:inline" />
                          Review
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
