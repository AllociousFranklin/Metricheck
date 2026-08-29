import type { Product, ProductInformation, ProductListing } from './product';
import type { Declaration } from './declaration';
import type { Violation } from './violation';

export type InspectionStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' | 'IN_PROGRESS' | 'DRAFT';

export interface InspectionImage {
  id: string;
  url: string;
  category: 'front' | 'back' | 'side' | 'top' | 'bottom' | 'label';
  fileName: string;
  fileSize: number;
  qualityCheck?: ImageQualityCheck;
}

export interface ImageQualityCheck {
  resolutionAdequate: boolean;
  productDetected: boolean;
  labelVisible: boolean;
  textReadable: boolean | null;
  overallPass: boolean;
  issues: string[];
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export interface AnalysisResult {
  declarations: Declaration[];
  violations: Violation[];
  complianceScore: number;
  overallConfidence: number;
  ruleSetVersion: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  reviewChecks: number;
}

export interface InspectionTimelineEvent {
  id: string;
  type: 'created' | 'images_added' | 'info_added' | 'analysis_started' | 'analysis_completed' | 'findings_detected' | 'review_started' | 'finding_reviewed' | 'report_generated';
  label: string;
  timestamp: string;
  description?: string;
  userId?: string;
}

export interface Inspection {
  id: string;
  status: InspectionStatus;
  complianceScore: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  inspectorId: string;
  inspectorName: string;
  product: Product;
  productInformation?: ProductInformation;
  productListing?: ProductListing;
  images: InspectionImage[];
  declarations: Declaration[];
  violations: Violation[];
  analysisResult?: AnalysisResult;
  timeline: InspectionTimelineEvent[];
  reportId?: string;
}

export interface CreateInspectionRequest {
  productInformation?: ProductInformation;
  productListing?: ProductListing;
  images?: File[];
}
