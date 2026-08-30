export type ReportStatus = 'GENERATED' | 'DRAFT' | 'FINALIZED';

export interface Report {
  id: string;
  inspectionId: string;
  productName: string;
  productId: string;
  manufacturer?: string;
  category?: string;
  status: ReportStatus;
  assessmentStatus: string;
  assessmentResult?: string;
  complianceScore: number;
  score?: number;
  passedChecks: number;
  failedChecks: number;
  reviewChecks: number;
  totalChecks: number;
  generatedAt: string;
  generatedDate?: string;
  inspectionDate?: string;
  generatedBy: string;
  inspectorName: string;
  findings: ReportFinding[];
  evidenceImages: string[];
  ruleSetVersion: string;
  summary?: {
    passedChecks: number;
    totalFindings: number;
    pendingReviews: number;
  };
}

export interface ReportFinding {
  id: string;
  type: string;
  field: string;
  severity: string;
  description: string;
  ruleReference?: string;
  reviewStatus: string;
}
