import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/utils/useDebounce';
import { Search, Filter, FileText, Download, Printer } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getReports } from '@/services/reportApi';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', statusFilter, debouncedSearch],
    queryFn: () => getReports({ status: statusFilter !== 'All' ? statusFilter : undefined, search: debouncedSearch }),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Reports" subtitle="Compliance Assessment Reports" />

      <Card className="bg-white shadow-sm border-neutral-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by Report ID, Inspection ID, or Product..."
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
                <option value="All">All Results</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non-Compliant</option>
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
              Failed to load reports. Please try again.
            </div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No reports found matching your criteria.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-600 bg-neutral-25 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Report ID</th>
                    <th className="px-4 py-3">Inspection ID</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Generated Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((report: any) => (
                    <tr 
                      key={report.id} 
                      className="bg-white border-b border-neutral-100 hover:bg-neutral-25 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-neutral-900">
                        {report.id}
                      </td>
                      <td className="px-4 py-4 font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/inspections/${report.inspectionId}`)}>
                        {report.inspectionId}
                      </td>
                      <td className="px-4 py-4 text-neutral-900">{report.productName}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={report.assessmentResult} />
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "font-semibold",
                          report.score >= 90 ? "text-success" :
                          report.score >= 70 ? "text-warning" : "text-error"
                        )}>
                          {report.score}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {new Date(report.generatedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="text-primary hover:bg-primary/10"
                            title="Preview Report"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/reports/${report.id}?print=true`)}
                            className="text-secondary hover:bg-secondary/10 hidden sm:inline-flex"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
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
