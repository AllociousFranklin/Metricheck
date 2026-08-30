import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, AlertCircle, CheckCircle, XCircle, FileText, Image as ImageIcon, Scale } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getViolation, updateViolationReview } from '@/services/violationApi';
import { useToastStore } from '@/stores/toastStore';

export const ViolationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data: violation, isLoading, error } = useQuery({
    queryKey: ['violation', id],
    queryFn: () => getViolation(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => updateViolationReview(id!, newStatus),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['violation', id] });
      addToast({
        title: 'Status Updated',
        message: `Finding marked as ${variables.replace('_', ' ')}.`,
        type: variables === 'ACCEPTED' ? 'success' : variables === 'REJECTED' ? 'error' : 'info'
      });
    },
    onError: () => {
      addToast({
        title: 'Error',
        message: 'Failed to update finding status. Please try again.',
        type: 'error'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-200 w-1/3 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white rounded-lg animate-pulse"></div>
            <div className="h-48 bg-white rounded-lg animate-pulse"></div>
          </div>
          <div className="h-96 bg-white rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !violation) {
    return (
      <div className="p-8 text-center">
        <p className="text-error text-lg mb-4">Finding not found or failed to load.</p>
        <Button onClick={() => navigate('/violations')}>Back to Findings</Button>
      </div>
    );
  }

  const isPending = violation.reviewStatus === 'PENDING';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center text-sm text-neutral-500 mb-2">
        <Link to="/violations" className="hover:text-primary transition-colors">Findings</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-neutral-900 font-medium truncate">{violation.id}</span>
      </div>

      <PageHeader 
        title={`${violation.type} Finding`} 
        subtitle={`Detected on ${new Date(violation.createdAt || violation.date || Date.now()).toLocaleDateString()}`} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Finding Overview */}
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-h3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-warning" />
                Finding Overview
              </CardTitle>
              <StatusBadge status={violation.reviewStatus as any} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-1">Description</h4>
                  <p className="text-body text-neutral-900">{violation.description}</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
                  <div>
                    <span className="block text-xs text-neutral-500 mb-1">Field</span>
                    <span className="font-medium text-neutral-900">{violation.field}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 mb-1">Severity</span>
                    <span className={cn(
                      "font-medium",
                      violation.severity === 'HIGH' ? "text-error" :
                      violation.severity === 'MEDIUM' ? "text-warning" : "text-info"
                    )}>
                      {violation.severity}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 mb-1">Confidence</span>
                    <span className="font-medium text-neutral-900">{Math.round(violation.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 mb-1">Inspection ID</span>
                    <Link to={`/inspections/${violation.inspectionId}`} className="font-medium text-primary hover:underline">
                      {violation.inspectionId}
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Details */}
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                Evidence & Extraction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-video bg-white rounded-lg border border-neutral-200 flex items-center justify-center relative overflow-hidden mb-2">
                    {(violation.evidenceImage || violation.evidenceImageUrl) ? (
                      <img src={violation.evidenceImage || violation.evidenceImageUrl} alt="Evidence" className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-center text-neutral-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-sm">Image evidence placeholder</span>
                      </div>
                    )}
                    {/* Simulated bounding box */}
                    {violation.boundingBox && (
                      <div 
                        className="absolute border-2 border-error bg-error/10 rounded"
                        style={{
                          top: violation.boundingBox.top,
                          left: violation.boundingBox.left,
                          width: violation.boundingBox.width,
                          height: violation.boundingBox.height
                        }}
                      ></div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 text-center">Highlighted region indicates detected issue</p>
                </div>
                
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="p-4 bg-white border-l-4 border-l-error border border-error/20 rounded-lg">
                    <span className="block text-xs font-semibold text-error mb-1 uppercase tracking-wide">Extracted Value</span>
                    <p className="text-neutral-900 font-mono break-all">{violation.extractedValue || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white border-l-4 border-l-success border border-success/20 rounded-lg">
                    <span className="block text-xs font-semibold text-success mb-1 uppercase tracking-wide">Expected Value / Format</span>
                    <p className="text-neutral-900 font-mono break-all">{violation.expectedValue || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Review Action Card */}
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3">Review Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending ? (
                <>
                  <p className="text-sm text-neutral-600 mb-4">Please review the evidence and determine if this is a valid non-compliance finding.</p>
                  <Button 
                    className="w-full justify-start bg-success hover:bg-success-600 text-white" 
                    onClick={() => updateStatusMutation.mutate('ACCEPTED')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Accept Finding
                  </Button>
                  <Button 
                    className="w-full justify-start bg-error hover:bg-error-600 text-white" 
                    onClick={() => updateStatusMutation.mutate('REJECTED')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Mark as Incorrect
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start" 
                    onClick={() => updateStatusMutation.mutate('FURTHER_REVIEW')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" /> Needs Further Review
                  </Button>
                </>
              ) : (
                <div className="p-4 rounded-lg bg-neutral-25 border border-neutral-200">
                  <p className="text-sm font-medium text-neutral-900 mb-2">Review Completed</p>
                  <p className="text-sm text-neutral-600">This finding was marked as <strong className="text-neutral-900">{violation.reviewStatus}</strong>.</p>
                  <p className="text-xs text-neutral-500 mt-2">By: {violation.reviewedBy || 'Admin'}</p>
                  <p className="text-xs text-neutral-500">Date: {violation.reviewedAt ? new Date(violation.reviewedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => updateStatusMutation.mutate('PENDING')}>
                      Re-open Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rule Reference */}
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-primary" />
                Rule Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-neutral-25 rounded-lg border border-neutral-100">
                <h4 className="font-semibold text-neutral-900 mb-1">{violation.ruleReference?.title || 'N/A'}</h4>
                <p className="text-sm font-medium text-primary mb-2">Section {violation.ruleReference?.section || 'N/A'}</p>
                <p className="text-xs text-neutral-600 italic">
                  "{violation.ruleReference?.description || ''}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Context Links */}
          <Card className="bg-white border-neutral-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-h3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/products/${violation.productId}`} className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-25 transition-colors border border-transparent hover:border-neutral-200 group">
                <div>
                  <span className="block text-xs text-neutral-500">Product</span>
                  <span className="font-medium text-primary group-hover:underline">{violation.productName}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </Link>
              <Link to={`/inspections/${violation.inspectionId}`} className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-25 transition-colors border border-transparent hover:border-neutral-200 group">
                <div>
                  <span className="block text-xs text-neutral-500">Source Inspection</span>
                  <span className="font-medium text-primary group-hover:underline">{violation.inspectionId}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

