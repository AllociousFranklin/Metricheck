import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Activity,
  FileText
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getDashboardStats } from '@/services/dashboardApi';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Inspection & Compliance Overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Inspection & Compliance Overview" />
        <div className="p-4 bg-white border-l-4 border-l-error text-error rounded-lg">Failed to load dashboard data.</div>
      </div>
    );
  }

  const stats = (data as any)?.stats || { total: 0, compliant: 0, nonCompliant: 0, needsReview: 0 };
  const trendData = (data as any)?.trends || [];
  const violationsData = (data as any)?.violationsByCategory || [];
  const recentInspections = (data as any)?.recentInspections || [];
  const reviewQueue = data?.reviewQueue || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Dashboard" subtitle="Inspection & Compliance Overview" />
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Inspections</p>
              <h3 className="text-h2 font-bold text-neutral-900">{stats.total}</h3>
            </div>
            <div className="p-3 bg-neutral-25 rounded-full">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-l-4 border-l-success border-success/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-success mb-1">Compliant</p>
              <h3 className="text-h2 font-bold text-success">{stats.compliant}</h3>
            </div>
            <div className="p-3 bg-white rounded-full">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-error border-error/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-error mb-1">Potentially Non-Compliant</p>
              <h3 className="text-h2 font-bold text-error">{stats.nonCompliant}</h3>
            </div>
            <div className="p-3 bg-white rounded-full">
              <XCircle className="w-6 h-6 text-error" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-warning border-warning/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warning mb-1">Needs Review</p>
              <h3 className="text-h2 font-bold text-warning">{stats.needsReview}</h3>
            </div>
            <div className="p-3 bg-white rounded-full">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900">Compliance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#16324F" strokeWidth={2} />
                    <Line type="monotone" dataKey="compliant" name="Compliant" stroke="#16803C" strokeWidth={2} />
                    <Line type="monotone" dataKey="nonCompliant" name="Non-Compliant" stroke="#C0392B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900">Violation Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={violationsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis dataKey="category" type="category" stroke="#6B7280" width={120} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="count" name="Violations" fill="#087E8B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-h3 text-neutral-900">Recent Inspections</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/inspections')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-600 bg-neutral-25 uppercase border-b border-neutral-100">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInspections.map((inspection: any) => (
                      <tr 
                        key={inspection.id} 
                        className="bg-white border-b border-neutral-100 hover:bg-neutral-25 cursor-pointer"
                        onClick={() => navigate(`/inspections/${inspection.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-primary">{inspection.id}</td>
                        <td className="px-4 py-3 text-neutral-900">{inspection.productName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inspection.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "font-semibold",
                            inspection.score >= 90 ? "text-success" :
                            inspection.score >= 70 ? "text-warning" : "text-error"
                          )}>
                            {inspection.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {new Date(inspection.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {recentInspections.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-neutral-600">
                          No recent inspections
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-h3 text-neutral-900">Review Queue</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/violations')} className="text-primary hover:bg-primary/10">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewQueue.map((item: any) => (
                <div 
                  key={item.id} 
                  className="p-3 border border-neutral-100 rounded-lg hover:border-primary/30 hover:bg-neutral-25 cursor-pointer transition-colors"
                  onClick={() => navigate(`/violations/${item.id}`)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-neutral-900 truncate pr-2">{item.productName}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap",
                      item.severity === 'HIGH' ? "bg-white border-l-4 border-l-error text-error" :
                      item.severity === 'MEDIUM' ? "bg-white border-l-4 border-l-warning text-warning" : "bg-white border-l-4 border-l-info text-info"
                    )}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2">{item.findingType}</p>
                  <p className="text-xs text-neutral-500 mt-2">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              ))}
              {reviewQueue.length === 0 && (
                <div className="p-4 text-center text-neutral-600 bg-neutral-25 rounded-lg">
                  No items pending review
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1">
                      {activity.type === 'INSPECTION_CREATED' ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ClipboardList className="w-4 h-4 text-primary" />
                        </div>
                      ) : activity.type === 'REPORT_GENERATED' ? (
                        <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-info" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <Activity className="w-4 h-4 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-900">{activity.description}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{activity.relativeTime}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="p-4 text-center text-neutral-600">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
