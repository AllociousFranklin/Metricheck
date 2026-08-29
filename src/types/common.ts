export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalInspections: number;
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  complianceRate: number;
  recentActivity: ActivityItem[];
  complianceTrend: TrendDataPoint[];
  violationCategories: ViolationCategoryData[];
  reviewQueue: ReviewQueueItem[];
}

export interface ActivityItem {
  id: string;
  type: 'inspection_created' | 'inspection_completed' | 'finding_reviewed' | 'report_generated';
  description: string;
  timestamp: string;
  inspectionId?: string;
  userId?: string;
  userName?: string;
}

export interface TrendDataPoint {
  date: string;
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  total: number;
}

export interface ViolationCategoryData {
  category: string;
  count: number;
  percentage: number;
}

export interface ReviewQueueItem {
  id: string;
  inspectionId: string;
  productName: string;
  findingType: string;
  severity: string;
  createdAt: string;
  assignedTo?: string;
}
