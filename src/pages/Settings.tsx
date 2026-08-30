import React from 'react';
import { User, LogOut, Shield, Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { APP_CONFIG } from '@/app/config';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <Card className="bg-white border-neutral-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-h3 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {user?.name.charAt(0) || 'U'}
              </span>
            </div>
            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Full Name</label>
                  <p className="text-neutral-900 font-medium">{user?.name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Email Address</label>
                  <p className="text-neutral-900 font-medium">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
                  <span className="inline-block px-2 py-1 bg-white text-neutral-700 text-xs font-bold rounded uppercase">
                    {user?.role || 'USER'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Department</label>
                  <p className="text-neutral-900">{user?.department || 'METRICHECK Department'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-neutral-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-h3 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            System & Rule Set Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-900">Current Rule Set</p>
                <p className="text-sm text-neutral-500">The active set of rules used for automated compliance checks.</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-white border-l-4 border-l-success text-success text-xs font-bold rounded mb-1">ACTIVE</span>
                <p className="text-sm font-medium">v{APP_CONFIG.ruleSetVersion}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-neutral-900">Last System Update</p>
                <p className="text-sm text-neutral-500">Platform and vision model updates.</p>
              </div>
              <p className="text-sm text-neutral-600">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-6 flex justify-end">
        <Button variant="outline" className="text-error hover:bg-white border-l-4 border-l-error hover:text-error hover:border-error" onClick={() => logout()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
