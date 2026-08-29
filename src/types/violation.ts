import type { RuleReference } from './rule';

export type ViolationSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FURTHER_REVIEW';
export type ViolationType = 
  | 'MISSING_DECLARATION'
  | 'INCORRECT_DECLARATION'
  | 'INCOMPLETE_DECLARATION'
  | 'PLACEMENT_ISSUE'
  | 'READABILITY_ISSUE'
  | 'FONT_SIZE_ISSUE'
  | 'MISLEADING_DECLARATION'
  | 'NON_STANDARD_DECLARATION';

export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  MISSING_DECLARATION: 'Missing Declaration',
  INCORRECT_DECLARATION: 'Incorrect Declaration',
  INCOMPLETE_DECLARATION: 'Incomplete Declaration',
  PLACEMENT_ISSUE: 'Placement Issue',
  READABILITY_ISSUE: 'Readability Issue',
  FONT_SIZE_ISSUE: 'Font Size Issue',
  MISLEADING_DECLARATION: 'Misleading Declaration',
  NON_STANDARD_DECLARATION: 'Non-Standard Declaration',
};

export interface Violation {
  id: string;
  inspectionId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  field: string;
  description: string;
  confidence: number;
  evidenceImage?: string;
  extractedValue?: string;
  expectedValue?: string;
  ruleReference?: RuleReference;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  productName?: string;
  productId?: string;
  createdAt: string;
}
