import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('@/pages/Login');
      return { Component: LoginPage };
    },
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { 
            path: 'dashboard', 
            lazy: async () => {
              const { DashboardPage } = await import('@/pages/Dashboard');
              return { Component: DashboardPage };
            } 
          },
          { 
            path: 'inspections', 
            lazy: async () => {
              const { InspectionsPage } = await import('@/pages/Inspections');
              return { Component: InspectionsPage };
            } 
          },
          { 
            path: 'inspections/new', 
            lazy: async () => {
              const { NewInspectionPage } = await import('@/pages/NewInspection');
              return { Component: NewInspectionPage };
            } 
          },
          { 
            path: 'inspections/:id', 
            lazy: async () => {
              const { InspectionResultPage } = await import('@/pages/InspectionResult');
              return { Component: InspectionResultPage };
            } 
          },
          { 
            path: 'products', 
            lazy: async () => {
              const { ProductRepositoryPage } = await import('@/pages/ProductRepository');
              return { Component: ProductRepositoryPage };
            } 
          },
          { 
            path: 'products/:id', 
            lazy: async () => {
              const { ProductDetailPage } = await import('@/pages/ProductDetail');
              return { Component: ProductDetailPage };
            } 
          },
          { 
            path: 'violations', 
            lazy: async () => {
              const { ViolationsPage } = await import('@/pages/Violations');
              return { Component: ViolationsPage };
            } 
          },
          { 
            path: 'violations/:id', 
            lazy: async () => {
              const { ViolationDetailPage } = await import('@/pages/ViolationDetail');
              return { Component: ViolationDetailPage };
            } 
          },
          { 
            path: 'reports', 
            lazy: async () => {
              const { ReportsPage } = await import('@/pages/Reports');
              return { Component: ReportsPage };
            } 
          },
          { 
            path: 'reports/:id', 
            lazy: async () => {
              const { ReportPreviewPage } = await import('@/pages/ReportPreview');
              return { Component: ReportPreviewPage };
            } 
          },
          { 
            path: 'analytics', 
            lazy: async () => {
              const { AnalyticsPage } = await import('@/pages/Analytics');
              return { Component: AnalyticsPage };
            } 
          },
          { 
            path: 'settings', 
            lazy: async () => {
              const { SettingsPage } = await import('@/pages/Settings');
              return { Component: SettingsPage };
            } 
          },
        ],
      },
    ],
  },
]);
