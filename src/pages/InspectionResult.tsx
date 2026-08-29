// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Eye, 
  ChevronRight, 
  FileText, 
  Clock, 
  User, 
  Shield,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { 
  formatDate, 
  formatDateTime, 
  formatPercentage, 
  getConfidenceLabel, 
  getStatusColor, 
  getStatusBgColor, 
  getSeverityColor 
} from '@/utils/format';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/layout/PageHeader';

import { useToastStore } from '@/stores/toastStore';
import { getInspection, updateViolationReview } from '@/services/inspectionApi';
import { generateReport } from '@/services/reportApi';

import type { 
  Inspection, 
  Declaration, 
  Violation, 
  DeclarationType, 
  BoundingBox
} from '@/types';
import { DECLARATION_LABELS, VIOLATION_TYPE_LABELS } from '@/types';

// --- INLINE HELPER COMPONENTS ---

interface BoundingBoxOverlayProps {
  declaration: Declaration;
  isSelected: boolean;
  onClick: () => void;
  scale: number;
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({ 
  declaration, 
  isSelected, 
  onClick,
  scale
}) => {
  if (!declaration.boundingBox) return null;
  
  const { top, left, width, height } = declaration.boundingBox;
  
  let borderColorClass = 'border-success';
  let bgColorClass = 'bg-success/10';
  
  if (declaration.status === 'FAIL') {
    borderColorClass = 'border-error';
    bgColorClass = 'bg-error/10';
  } else if (declaration.status === 'REVIEW') {
    borderColorClass = 'border-warning';
    bgColorClass = 'bg-warning/10';
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'absolute cursor-pointer border-2 transition-all duration-200 group flex flex-col',
        borderColorClass,
        isSelected ? cn(bgColorClass, 'shadow-lg z-20 border-4 scale-[1.02]') : 'hover:border-4 z-10'
      )}
      style={{
        top: `${top * 100}%`,
        left: `${left * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
      }}
    >
      <div className={cn(
        "absolute -top-6 left-0 px-2 py-0.5 text-xs font-semibold text-white whitespace-nowrap transition-opacity",
        declaration.status === 'PASS' ? 'bg-success' : declaration.status === 'FAIL' ? 'bg-error' : 'bg-warning',
        isSelected ? 'opacity-100 z-30' : 'opacity-0 group-hover:opacity-100 z-20'
      )}>
        {DECLARATION_LABELS[declaration.type] || declaration.type}
      </div>
    </div>
  );
};

interface ImageViewerProps {
  imageUrls: string[];
  declarations: Declaration[];
  selectedDeclarationId: string | null;
  onSelectDeclaration: (id: string | null) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  imageUrls, 
  declarations, 
  selectedDeclarationId, 
  onSelectDeclaration 
}) => {
  const [scale, setScale] = useState(1);
  
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const handleReset = () => setScale(1);

  // Note: Using a mockup container instead of real images as requested
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-white border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">Product Analysis View</span>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-md">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</div>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-neutral-300 mx-1"></div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0" title="Reset Zoom">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-auto relative flex items-center justify-center p-4 bg-neutral-200"
        onClick={() => onSelectDeclaration(null)}
      >
        <div 
          className="relative bg-white shadow-md transition-transform duration-200 origin-center"
          style={{ 
            width: '400px', 
            height: '600px',
            transform: `scale(${scale})`
          }}
        >
          {/* Mock Package Background */}
          <div className="absolute inset-0 bg-neutral-25 border border-neutral-200 p-8 flex flex-col">
            <div className="h-32 bg-primary/10 rounded-md mb-8 flex items-center justify-center">
              <span className="text-primary/40 font-bold text-xl">PRODUCT LABEL AREA</span>
            </div>
            <div className="flex-1 flex flex-col space-y-4">
              <div className="h-8 bg-neutral-200 w-3/4 rounded"></div>
              <div className="h-4 bg-neutral-200 w-1/2 rounded"></div>
              <div className="h-4 bg-neutral-200 w-full rounded mt-4"></div>
              <div className="h-4 bg-neutral-200 w-full rounded"></div>
              <div className="h-4 bg-neutral-200 w-2/3 rounded"></div>
              <div className="mt-auto h-24 bg-neutral-200 rounded"></div>
            </div>
          </div>
          
          {/* Bounding Boxes */}
          {declarations.map(dec => (
            <BoundingBoxOverlay 
              key={dec.id}
              declaration={dec}
              isSelected={selectedDeclarationId === dec.id}
              onClick={() => onSelectDeclaration(dec.id)}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ComplianceCheckRowProps {
  label: string;
  status: 'PASS' | 'FAIL' | 'REVIEW';
  message?: string;
}

const ComplianceCheckRow: React.FC<ComplianceCheckRowProps> = ({ label, status, message }) => {
  return (
    <div className="flex items-start justify-between py-2 border-b border-neutral-100 last:border-0">
      <div className="flex items-center space-x-3">
        {status === 'PASS' && <CheckCircle className="w-4 h-4 text-success mt-0.5" />}
        {status === 'FAIL' && <XCircle className="w-4 h-4 text-error mt-0.5" />}
        {status === 'REVIEW' && <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />}
        <div>
          <p className="text-sm font-medium text-neutral-800">{label}</p>
          {message && <p className="text-xs text-neutral-500 mt-0.5">{message}</p>}
        </div>
      </div>
      <Badge variant={
        status === 'PASS' ? 'success' : 
        status === 'FAIL' ? 'error' : 'warning'
      } className="text-[10px]">
        {status}
      </Badge>
    </div>
  );
};

interface DeclarationDetailProps {
  declaration: Declaration;
  isExpanded: boolean;
  onToggle: () => void;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const DeclarationDetail: React.FC<DeclarationDetailProps> = ({ 
  declaration, 
  isExpanded, 
  onToggle,
  innerRef 
}) => {
  const Icon = declaration.status === 'PASS' ? CheckCircle : 
               declaration.status === 'FAIL' ? XCircle : AlertTriangle;
               
  const iconColor = declaration.status === 'PASS' ? 'text-success' : 
                    declaration.status === 'FAIL' ? 'text-error' : 'text-warning';
                    
  const bgColor = declaration.status === 'PASS' ? 'bg-success/5 border-success/20' : 
                  declaration.status === 'FAIL' ? 'bg-error/5 border-error/20' : 'bg-warning/5 border-warning/20';

  return (
    <div 
      ref={innerRef}
      className={cn(
        "border rounded-lg mb-3 transition-all duration-200 overflow-hidden",
        isExpanded ? cn("border-2 shadow-md", bgColor) : "border-neutral-200 hover:border-primary/30 bg-white"
      )}
    >
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <Icon className={cn("w-5 h-5", iconColor)} />
          <div>
            <h4 className="text-sm font-medium text-neutral-900">
              {DECLARATION_LABELS[declaration.type] || declaration.type}
            </h4>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs text-neutral-500 truncate max-w-[150px]">
                {declaration.extractedValue || "No value extracted"}
              </span>
              <span className="text-neutral-600 text-xs">•</span>
              <span className={cn("text-xs font-medium", 
                declaration.confidence >= 0.9 ? 'text-success' : 
                declaration.confidence >= 0.7 ? 'text-warning' : 'text-error'
              )}>
                {Math.round(declaration.confidence * 100)}% conf
              </span>
            </div>
          </div>
        </div>
        <div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-neutral-100 bg-white/50 backdrop-blur-sm">
              <div className="mb-4 mt-3">
                <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Extracted Information</h5>
                <div className="bg-white p-3 rounded border border-neutral-200 text-sm font-mono text-neutral-800 break-words">
                  {declaration.extractedValue || "No text could be extracted."}
                </div>
              </div>
              
              <div>
                <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Compliance Checks</h5>
                <div className="bg-white rounded border border-neutral-200 px-3">
                  {declaration.complianceChecks.map((check, idx) => (
                    <ComplianceCheckRow 
                      key={idx}
                      label={check.name}
                      status={check.status}
                      message={check.message}
                    />
                  ))}
                  {declaration.complianceChecks.length === 0 && (
                    <div className="py-3 text-sm text-neutral-500 text-center">
                      No specific checks available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FindingCardProps {
  violation: Violation;
  onReview: (id: string, action: 'accept' | 'reject', comment?: string) => void;
}

const FindingCard: React.FC<FindingCardProps> = ({ violation, onReview }) => {
  const isHigh = violation.severity === 'HIGH';
  const isMedium = violation.severity === 'MEDIUM';
  const isLow = violation.severity === 'LOW';
  
  return (
    <Card className={cn(
      "mb-4 overflow-hidden border-l-4",
      isHigh ? "border-l-error" : isMedium ? "border-l-warning" : "border-l-info"
    )}>
      <CardHeader className="pb-2 pt-4 px-4 bg-neutral-25/50">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Badge variant={isHigh ? 'error' : isMedium ? 'warning' : 'info'} className="text-[10px]">
              {violation.severity}
            </Badge>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              {VIOLATION_TYPE_LABELS[violation.type] || violation.type}
            </span>
          </div>
          {violation.reviewStatus && violation.reviewStatus !== 'PENDING' && (
            <Badge variant={violation.reviewStatus === 'ACCEPTED' ? 'success' : 'neutral'} className="text-[10px]">
              {violation.reviewStatus === 'ACCEPTED' ? 'Reviewed' : 'Rejected'}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{DECLARATION_LABELS[violation.field] || violation.field} Issue</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <p className="text-sm text-neutral-700 mb-3">{violation.description}</p>
        
        <div className="flex items-center space-x-2 mb-4 bg-neutral-25 p-2 rounded text-xs text-neutral-600 border border-neutral-100">
          <FileText className="w-3.5 h-3.5" />
          <span>Rule Ref: <span className="font-semibold">{violation.ruleReference.section}</span> - {violation.ruleReference.title}</span>
        </div>
        
        {(!violation.reviewStatus || violation.reviewStatus === 'PENDING') && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-neutral-100">
            <Button 
              size="sm" 
              variant="primary" 
              className="flex-1 bg-success hover:bg-success-600 text-white border-0"
              onClick={() => onReview(violation.id, 'accept')}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Accept Finding
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onReview(violation.id, 'reject')}
            >
              <X className="w-4 h-4 mr-1.5" />
              Mark Incorrect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// --- MAIN PAGE COMPONENT ---

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);
  
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  const declarationRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch inspection data
  const { data: inspection, isLoading, isError, error } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => getInspection(id!),
    enabled: !!id,
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ violationId, action, comment }: { violationId: string, action: 'accept' | 'reject', comment?: string }) => 
      updateViolationReview(id!, violationId, {
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
        comment
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      addToast('Review updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update review', 'error');
    }
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: () => generateReport(id!),
    onSuccess: (data) => {
      addToast('Report generated successfully', 'success');
      navigate(`/reports/${data.id}`);
    },
    onError: () => {
      addToast('Failed to generate report', 'error');
    }
  });

  // Scroll to declaration when selected from image
  useEffect(() => {
    if (selectedDeclarationId && declarationRefs.current[selectedDeclarationId]) {
      declarationRefs.current[selectedDeclarationId]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedDeclarationId]);

  const handleDeclarationSelect = useCallback((decId: string | null) => {
    setSelectedDeclarationId(prev => prev === decId ? null : decId);
  }, []);

  const handleReviewAction = useCallback((violationId: string, action: 'accept' | 'reject', comment?: string) => {
    reviewMutation.mutate({ violationId, action, comment });
  }, [reviewMutation]);

  const handleGenerateReport = () => {
    reportMutation.mutate();
  };

  // derived state
  const declarations = inspection?.results?.declarations || [];
  const violations = inspection?.results?.violations || [];
  
  const passCount = declarations.filter(d => d.status === 'PASS').length;
  const failCount = declarations.filter(d => d.status === 'FAIL').length;
  const reviewCount = declarations.filter(d => d.status === 'REVIEW').length;
  
  // Calculate mock score
  const score = declarations.length > 0 ? Math.round((passCount / declarations.length) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-lg animate-pulse border border-neutral-200"></div>
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
          <div className="w-full lg:w-64 h-full bg-white rounded-lg animate-pulse border border-neutral-200 hidden lg:block"></div>
          <div className="flex-1 h-full bg-white rounded-lg animate-pulse border border-neutral-200"></div>
          <div className="w-full lg:w-96 h-full bg-white rounded-lg animate-pulse border border-neutral-200"></div>
        </div>
      </div>
    );
  }

  if (isError || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load inspection</h2>
        <p className="text-neutral-500 mb-6">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        <Button onClick={() => navigate('/inspections')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inspections
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <Link to="/inspections" className="inline-flex items-center text-sm text-neutral-500 hover:text-primary mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inspections
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-900">{inspection.id}</h1>
              <StatusBadge status={inspection.status} />
            </div>
            <p className="text-neutral-500">{inspection.productName} • {formatDateTime(inspection.createdAt)}</p>
          </div>
          <div className="flex space-x-3">
            {inspection.reportId ? (
              <Button onClick={() => navigate(`/reports/${inspection.reportId}`)} variant="outline">
                <FileText className="w-4 h-4 mr-2" /> View Report
              </Button>
            ) : (
              <Button 
                onClick={handleGenerateReport} 
                isLoading={reportMutation.isPending}
                disabled={inspection.status !== 'COMPLETED' && inspection.status !== 'REVIEW_REQUIRED'}
              >
                <FileText className="w-4 h-4 mr-2" /> Generate Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex flex-1 gap-6 min-h-0">
        
        {/* Left Panel: Navigation */}
        <div className="w-48 xl:w-56 flex-shrink-0 flex flex-col space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Inspection Sections
          </div>
          <a href="#overview" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary/5 text-primary">
            <Eye className="w-4 h-4 mr-3" /> Overview
          </a>
          <a href="#declarations" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-25">
            <CheckCircle className="w-4 h-4 mr-3" /> Declarations
          </a>
          <a href="#findings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-25">
            <AlertTriangle className="w-4 h-4 mr-3" /> Findings
            {violations.length > 0 && (
              <Badge variant="error" className="ml-auto text-[10px] px-1.5 py-0 min-w-[20px] text-center">{violations.length}</Badge>
            )}
          </a>
          <a href="#timeline" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-25">
            <Clock className="w-4 h-4 mr-3" /> Timeline
          </a>
          
          <div className="mt-8 pt-4 border-t border-neutral-200">
            <div className="px-3 py-2">
              <div className="text-xs text-neutral-500 mb-1">Inspector</div>
              <div className="text-sm font-medium text-neutral-800 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                {inspection.inspectorId || 'System User'}
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-xs text-neutral-500 mb-1">Rule Set</div>
              <div className="text-sm font-medium text-neutral-800 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                LMPC 2011 (v1.2)
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Image Viewer */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-neutral-200 p-1 flex flex-col">
          <ImageViewer 
            imageUrls={inspection.images || []}
            declarations={declarations}
            selectedDeclarationId={selectedDeclarationId}
            onSelectDeclaration={handleDeclarationSelect}
          />
        </div>

        {/* Right Panel: Assessment Details */}
        <div className="w-[400px] xl:w-[480px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-y-auto">
          <div className="p-5 space-y-8 scroll-smooth" id="right-panel-scroll">
            
            {/* 1. Assessment Summary */}
            <section id="overview" className="scroll-mt-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Compliance Assessment</h2>
              
              <div className="bg-neutral-25 rounded-lg p-5 border border-neutral-100 flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Overall Score</div>
                  <div className="flex items-baseline space-x-2">
                    <span className={cn("text-3xl font-bold", 
                      score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error'
                    )}>
                      {score}%
                    </span>
                    <span className="text-sm font-medium text-neutral-600">Compliance</span>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center relative border-neutral-100">
                  {/* Fake circular progress */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-full border-8 border-transparent",
                      score >= 80 ? 'border-t-success border-r-success border-b-success' : 
                      score >= 60 ? 'border-t-warning border-r-warning' : 'border-t-error'
                    )}
                    style={{ transform: 'rotate(-45deg)' }}
                  ></div>
                  <Shield className={cn("w-8 h-8", 
                    score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error'
                  )} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">{declarations.length} Requirements Checked</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div className="bg-success" style={{ width: `${(passCount/declarations.length)*100}%` }}></div>
                    <div className="bg-warning" style={{ width: `${(reviewCount/declarations.length)*100}%` }}></div>
                    <div className="bg-error" style={{ width: `${(failCount/declarations.length)*100}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-success mr-1.5"></span>{passCount} Passed</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-warning mr-1.5"></span>{reviewCount} Review</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-error mr-1.5"></span>{failCount} Failed</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-neutral-600">Overall AI Confidence</span>
                    <span className="text-sm font-medium">{Math.round((inspection.results?.overallConfidence || 0) * 100)}%</span>
                  </div>
                  <ConfidenceMeter confidence={inspection.results?.overallConfidence || 0} />
                </div>
              </div>
            </section>
            
            {/* 2. Mandatory Declarations */}
            <section id="declarations" className="scroll-mt-6">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
                <h2 className="text-lg font-bold text-neutral-900">Mandatory Declarations</h2>
                <Badge variant="neutral">{declarations.length}</Badge>
              </div>
              
              <div className="space-y-0.5">
                {declarations.map(dec => (
                  <DeclarationDetail
                    key={dec.id}
                    innerRef={(el) => declarationRefs.current[dec.id] = el}
                    declaration={dec}
                    isExpanded={selectedDeclarationId === dec.id}
                    onToggle={() => handleDeclarationSelect(dec.id)}
                  />
                ))}
                
                {declarations.length === 0 && (
                  <div className="text-center py-8 bg-neutral-25 rounded-lg border border-dashed border-neutral-200">
                    <p className="text-neutral-500">No declarations detected.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* 3. Potential Findings */}
            <section id="findings" className="scroll-mt-6">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
                <h2 className="text-lg font-bold text-neutral-900">Potential Findings</h2>
                {violations.length > 0 && <Badge variant="error">{violations.length}</Badge>}
              </div>
              
              {violations.length > 0 ? (
                <div>
                  {violations.map(violation => (
                    <FindingCard 
                      key={violation.id} 
                      violation={violation} 
                      onReview={handleReviewAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-success/5 rounded-lg border border-success/20">
                  <CheckCircle className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-medium text-success-800">No Violations Detected</h3>
                  <p className="text-xs text-success-600/80 mt-1">All mandatory declarations meet compliance rules.</p>
                </div>
              )}
            </section>

            {/* 4. Timeline */}
            <section id="timeline" className="scroll-mt-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Inspection Timeline</h2>
              
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-neutral-200">
                <div className="relative">
                  <div className="absolute -left-6 bg-white p-0.5 rounded-full z-10 border border-neutral-200">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Inspection Created</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{formatDateTime(inspection.createdAt)}</div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-6 bg-white p-0.5 rounded-full z-10 border border-neutral-200">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/50"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">AI Analysis Started</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Automated visual inspection initiated</div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-6 bg-white p-0.5 rounded-full z-10 border border-neutral-200">
                    <div className="w-3.5 h-3.5 rounded-full bg-success"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Analysis Completed</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{formatDateTime(inspection.updatedAt)}</div>
                    <div className="mt-2 text-xs bg-neutral-25 p-2 rounded border border-neutral-100 inline-block">
                      Found {declarations.length} declarations, {violations.length} findings
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-neutral-200">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabList className="w-full overflow-x-auto flex-nowrap border-b border-neutral-200 sticky top-0 bg-white z-10">
            <Tab value="overview">Overview</Tab>
            <Tab value="image">Image View</Tab>
            <Tab value="declarations">Declarations</Tab>
            <Tab value="findings">Findings</Tab>
          </TabList>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabPanel value="overview" className="space-y-6">
              {/* Duplicate Overview Section for mobile */}
              <div className="bg-neutral-25 rounded-lg p-5 border border-neutral-100 flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Overall Score</div>
                  <div className="flex items-baseline space-x-2">
                    <span className={cn("text-3xl font-bold", 
                      score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error'
                    )}>
                      {score}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">{declarations.length} Requirements Checked</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div className="bg-success" style={{ width: `${(passCount/declarations.length)*100}%` }}></div>
                    <div className="bg-warning" style={{ width: `${(reviewCount/declarations.length)*100}%` }}></div>
                    <div className="bg-error" style={{ width: `${(failCount/declarations.length)*100}%` }}></div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            <TabPanel value="image" className="h-[60vh] -mx-4 -mt-4 mb-4">
              <ImageViewer 
                imageUrls={inspection.images || []}
                declarations={declarations}
                selectedDeclarationId={selectedDeclarationId}
                onSelectDeclaration={handleDeclarationSelect}
              />
            </TabPanel>
            
            <TabPanel value="declarations">
              <div className="space-y-1">
                {declarations.map(dec => (
                  <DeclarationDetail
                    key={dec.id}
                    declaration={dec}
                    isExpanded={selectedDeclarationId === dec.id}
                    onToggle={() => handleDeclarationSelect(dec.id)}
                  />
                ))}
              </div>
            </TabPanel>
            
            <TabPanel value="findings">
              {violations.length > 0 ? (
                <div>
                  {violations.map(violation => (
                    <FindingCard 
                      key={violation.id} 
                      violation={violation} 
                      onReview={handleReviewAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-success/5 rounded-lg border border-success/20">
                  <CheckCircle className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-medium text-success-800">No Violations Detected</h3>
                </div>
              )}
            </TabPanel>
          </div>
        </Tabs>
      </div>

    </div>
  );
};

export default InspectionResultPage;

