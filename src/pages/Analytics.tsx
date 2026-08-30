import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getDashboardStats } from '@/services/dashboardApi';

const COLORS = ['#16324F', '#087E8B', '#16803C', '#B7791F', '#C0392B', '#456782', '#6B7280'];

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-error">Failed to load analytics data.</div>;
  }

  const stats = data as any;
  const complianceRate = stats?.complianceRate || 0;

  const pieData = (stats?.violationCategories || []).map((v: any) => ({ name: v.category, value: v.count }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Analytics" subtitle="Enforcement Analytics & Insights" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Overall Compliance Rate</h3>
            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-neutral-900">{complianceRate}%</span>
              <div className="flex items-center text-success mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+2.4% vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Avg. Review Time</h3>
            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-neutral-900">2.4<span className="text-2xl text-neutral-500">d</span></span>
              <div className="flex items-center text-success mb-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">-0.5d vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-warning border-warning/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-warning-700 mb-2">Review Backlog</h3>
                <span className="text-4xl font-bold text-warning-900">{stats?.needsReview}</span>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-h3">Inspection Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.complianceTrend || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="total" name="Inspections" fill="#16324F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-h3">Finding Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: any) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
