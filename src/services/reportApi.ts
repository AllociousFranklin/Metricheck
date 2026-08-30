import type { Report } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockReports, getReportById as getMockReport, getReportByInspectionId as getMockReportByInspection } from '@/mocks/reports';

export async function getReports(filters?: {
  search?: string;
  status?: string;
}): Promise<Report[]> {
  if (USE_MOCKS) {
    await delay();
    let results = [...mockReports];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.inspectionId.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    return results.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }
  throw new Error('Real API not configured');
}

export async function getReport(id: string): Promise<Report> {
  if (USE_MOCKS) {
    await delay();
    const report = getMockReport(id);
    if (!report) throw new Error(`Report ${id} not found`);
    return report;
  }
  throw new Error('Real API not configured');
}

export async function getReportByInspection(inspectionId: string): Promise<Report | null> {
  if (USE_MOCKS) {
    await delay();
    return getMockReportByInspection(inspectionId) || null;
  }
  throw new Error('Real API not configured');
}

import { getInspectionById } from '@/mocks/inspections';

export async function generateReport(inspectionId: string): Promise<Report> {
  if (USE_MOCKS) {
    await delay(1500);
    // Return an existing report or generate one
    const existing = getMockReportByInspection(inspectionId);
    if (existing) return existing;
    
    const inspection = getInspectionById(inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const passCount = inspection.declarations.filter(d => d.status === 'PASS').length;
    const failCount = inspection.declarations.filter(d => d.status === 'FAIL').length;
    const reviewCount = inspection.declarations.filter(d => d.status === 'REVIEW').length;
    
    const newReport: Report = {
      id: `RPT-2026-${Date.now()}`,
      inspectionId,
      productId: inspection.product.id,
      productName: inspection.product.name,
      status: 'GENERATED',
      assessmentStatus: inspection.status === 'COMPLIANT' ? 'COMPLIANT' : inspection.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'NON_COMPLIANT',
      complianceScore: inspection.complianceScore,
      passedChecks: passCount,
      failedChecks: failCount,
      reviewChecks: reviewCount,
      totalChecks: inspection.declarations.length,
      generatedAt: new Date().toISOString(),
      inspectorName: inspection.inspectorName,
      generatedBy: "System",
      findings: [],
      evidenceImages: [],
      ruleSetVersion: '2026.1',
    };
    
    mockReports.unshift(newReport);
    return newReport;
  }
  throw new Error('Real API not configured');
}

export async function exportReport(id: string, format: 'pdf' | 'docx' | 'json'): Promise<Blob> {
  if (USE_MOCKS) {
    await delay(1000);
    // Return a mock blob - in real app, backend would generate the file
    const mockContent = `Mock ${format.toUpperCase()} Report: ${id}`;
    return new Blob([mockContent], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  throw new Error('Real API not configured');
}
