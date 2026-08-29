export type ReportStatus = 'GENERATED' | 'DRAFT' | 'FINALIZED';

export interface Report {
  id: string;
  inspectionId: string;
  productName: string;
  productId: string;
  status: ReportStatus;
  assessmentStatus: string;
  complianceScore: number;
  passedChecks: number;
  failedChecks: number;
  reviewChecks: number;
  totalChecks: number;
  generatedAt: string;
  generatedBy: string;
  inspectorName: string;
  findings: ReportFinding[];
  evidenceImages: string[];
  ruleSetVersion: string;
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
