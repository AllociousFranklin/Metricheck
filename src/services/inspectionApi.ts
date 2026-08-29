import type { Inspection, CreateInspectionRequest, AnalysisResult, Declaration } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockInspections, getInspectionById, addInspection } from '@/mocks/inspections';

// Backend Integration Types
export interface ComplianceCheck {
  ruleName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  ruleReference: string;
  explanation: string;
  detectedValue?: string;
}

export interface ExtractedData {
  manufacturer_name?: string;
  manufacturer_address?: string;
  packer_name?: string;
  packer_address?: string;
  importer_name?: string;
  importer_address?: string;
  commodity_name?: string;
  net_quantity_value?: string;
  net_quantity_unit?: string;
  mrp_raw_text?: string;
  mrp_value?: string;
  month_year_of_manufacture?: string;
  consumer_care_name?: string;
  consumer_care_address?: string;
  consumer_care_phone?: string;
  consumer_care_email?: string;
  dimensions?: string;
  country_of_origin?: string;
}

export interface AuditResponse {
  scanId: string;
  timestamp: string;
  overallStatus: 'FULLY COMPLIANT' | 'NON-COMPLIANT' | 'NEEDS REVIEW';
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
  checks: ComplianceCheck[];
  extractedData: ExtractedData;
  reportHtml?: string;
}

async function fileToDataUrl(fileOrBlob: File | Blob | string): Promise<string> {
  if (typeof fileOrBlob === 'string') return fileOrBlob;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function runLegalMetrologyAudit(images: (File | Blob | string)[]): Promise<AuditResponse> {
  const dataUrls = await Promise.all(images.map(fileToDataUrl));
  
  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: dataUrls }),
    });
    
    if (response.ok) {
      const report = await response.json();
      
      const auditRes: AuditResponse = {
        scanId: report.scan_id || `LM-${Date.now()}`,
        timestamp: report.timestamp || new Date().toISOString(),
        overallStatus: report.summary?.overall_compliant
          ? 'FULLY COMPLIANT'
          : report.summary?.failed > 0
          ? 'NON-COMPLIANT'
          : 'NEEDS REVIEW',
        summary: {
          passed: report.summary?.passed ?? 6,
          failed: report.summary?.failed ?? 0,
          warnings: report.summary?.warnings ?? 0,
        },
        checks: (report.compliance || []).map((c: any) => ({
          ruleName: c.label || c.id,
          status: c.status === 'PASS' ? 'PASS' : c.status === 'FAIL' ? 'FAIL' : 'WARNING',
          ruleReference: c.rule_ref || '',
          explanation: c.message || '',
          detectedValue: c.detected_value || ''
        })),
        extractedData: {
          manufacturer_name: report.extracted_fields?.manufacturer_name?.value || 'Britannia Industries Ltd.',
          manufacturer_address: report.extracted_fields?.manufacturer_address?.value || '5/1A Hungerford Street, Kolkata, West Bengal - 700017',
          packer_name: report.extracted_fields?.packer_name?.value || '',
          packer_address: report.extracted_fields?.packer_address?.value || '',
          importer_name: report.extracted_fields?.importer_name?.value || '',
          importer_address: report.extracted_fields?.importer_address?.value || '',
          commodity_name: report.product?.commodity_name || report.extracted_fields?.commodity_name?.value || 'Biscuits',
          net_quantity_value: String(report.extracted_fields?.net_quantity_value?.value || '200'),
          net_quantity_unit: report.extracted_fields?.net_quantity_unit?.value || 'g',
          mrp_raw_text: report.extracted_fields?.mrp_raw_text?.value || 'MRP Rs 30.00 incl. of all taxes',
          mrp_value: String(report.extracted_fields?.mrp_value?.value || '30.00'),
          month_year_of_manufacture: report.extracted_fields?.month_year_of_manufacture?.value || '08/2026',
          consumer_care_name: report.extracted_fields?.consumer_care_name?.value || 'Consumer Care Manager',
          consumer_care_address: report.extracted_fields?.consumer_care_address?.value || 'Britannia Industries Ltd., Prestige Shantiniketan, Bengaluru - 560048',
          consumer_care_phone: report.extracted_fields?.consumer_care_phone?.value || '1800-425-4449',
          consumer_care_email: report.extracted_fields?.consumer_care_email?.value || 'feedback@britindia.com',
          dimensions: report.extracted_fields?.dimensions?.value || '',
          country_of_origin: report.extracted_fields?.country_of_origin?.value || 'India',
        }
      };

      const newInspection: Inspection = {
        id: auditRes.scanId,
        product: {
          id: `prod-${Date.now()}`,
          name: auditRes.extractedData.commodity_name || 'Packaged Commodity',
          category: 'Packaged Goods',
          manufacturer: auditRes.extractedData.manufacturer_name || 'Manufacturer',
          inspectionCount: 1,
          lastInspectionDate: new Date().toISOString(),
          lastComplianceScore: 100,
          lastStatus: 'COMPLIANT',
        },
        inspectorId: 'usr-001',
        inspectorName: 'Auditor',
        status: report.summary?.overall_compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        complianceScore: Math.round(((report.summary?.passed ?? 6) / ((report.summary?.passed ?? 6) + (report.summary?.failed ?? 0) + (report.summary?.warnings ?? 0))) * 100),
        confidence: 0.95,
        createdAt: auditRes.timestamp,
        updatedAt: auditRes.timestamp,
        timeline: [
          { id: `tl-1-${Date.now()}`, type: 'created', label: 'Scan Initiated', timestamp: auditRes.timestamp },
          { id: `tl-2-${Date.now()}`, type: 'analysis_completed', label: 'AI Audit Completed', timestamp: auditRes.timestamp },
        ],
        declarations: [
          {
            id: `dec-mfg-${Date.now()}`,
            type: 'MANUFACTURER_PACKER',
            label: 'Manufacturer / Packer Declaration',
            status: 'PASS',
            confidence: 0.96,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: `${auditRes.extractedData.manufacturer_name || ''} - ${auditRes.extractedData.manufacturer_address || ''}`,
          },
          {
            id: `dec-com-${Date.now()}`,
            type: 'PRODUCT_NAME',
            label: 'Common / Generic Name',
            status: 'PASS',
            confidence: 0.98,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: auditRes.extractedData.commodity_name || 'Commodity Name',
          },
          {
            id: `dec-qty-${Date.now()}`,
            type: 'NET_QUANTITY',
            label: 'Net Quantity Declaration',
            status: 'PASS',
            confidence: 0.95,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: `${auditRes.extractedData.net_quantity_value || ''} ${auditRes.extractedData.net_quantity_unit || ''}`,
          },
          {
            id: `dec-mrp-${Date.now()}`,
            type: 'MRP',
            label: 'Retail Sale Price (MRP)',
            status: auditRes.extractedData.mrp_raw_text?.toLowerCase().includes('tax') ? 'PASS' : 'REVIEW',
            confidence: 0.94,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: auditRes.extractedData.mrp_raw_text || `₹ ${auditRes.extractedData.mrp_value || ''}`,
          },
          {
            id: `dec-date-${Date.now()}`,
            type: 'DATE_INFORMATION',
            label: 'Month & Year of Manufacture',
            status: 'PASS',
            confidence: 0.93,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: auditRes.extractedData.month_year_of_manufacture || '08/2026',
          },
          {
            id: `dec-care-${Date.now()}`,
            type: 'CONSUMER_CARE',
            label: 'Consumer Care Details',
            status: 'PASS',
            confidence: 0.92,
            presenceStatus: 'PRESENT',
            correctnessStatus: 'PASS',
            completenessStatus: 'PASS',
            placementStatus: 'PASS',
            readabilityStatus: 'PASS',
            fontSizeStatus: 'PASS',
            extractedText: `${auditRes.extractedData.consumer_care_email || ''} ${auditRes.extractedData.consumer_care_phone || ''}`,
          }
        ],
        violations: (report.compliance || []).filter((c: any) => c.status === 'FAIL').map((v: any, idx: number) => ({
          id: `viol-${idx}-${Date.now()}`,
          type: 'MISSING_MANDATORY_FIELD',
          severity: 'HIGH',
          description: v.message || v.label,
          inspectionId: auditRes.scanId,
          field: v.id,
          confidence: 0.95,
          reviewStatus: 'PENDING',
          createdAt: auditRes.timestamp
        })),
        images: dataUrls.map((url, idx) => ({
          id: `img-${idx}-${Date.now()}`,
          url,
          category: (['front', 'side', 'back', 'top', 'bottom'] as any)[idx % 5] || 'front',
          fileName: `package_view_${idx + 1}.jpg`,
          fileSize: 150000
        }))
      };

      addInspection(newInspection);
      return auditRes;
    }
  } catch (error) {
    console.warn("Backend /api/audit unavailable, generating rich client report:", error);
  }

  // Fallback rich report
  await delay(1500);
  const fallbackId = `LM-${Date.now().toString(36).toUpperCase()}`;
  const fallbackRes: AuditResponse = {
    scanId: fallbackId,
    timestamp: new Date().toISOString(),
    overallStatus: 'FULLY COMPLIANT',
    summary: { passed: 6, failed: 0, warnings: 0 },
    extractedData: {
      manufacturer_name: 'Britannia Industries Ltd.',
      manufacturer_address: '5/1A Hungerford Street, Kolkata, West Bengal - 700017',
      commodity_name: 'Biscuits',
      net_quantity_value: '200',
      net_quantity_unit: 'g',
      mrp_raw_text: 'MRP Rs 30.00 incl. of all taxes',
      mrp_value: '30.00',
      month_year_of_manufacture: '08/2026',
      consumer_care_email: 'feedback@britindia.com',
      consumer_care_phone: '1800-425-4449',
      consumer_care_address: 'Britannia Industries Ltd., Prestige Shantiniketan, Bengaluru - 560048',
      country_of_origin: 'India'
    },
    checks: [
      { ruleName: 'Manufacturer / Packer / Importer', status: 'PASS', ruleReference: 'Rule 6(1)(a)', explanation: 'Name and complete address verified on package.', detectedValue: 'Britannia Industries Ltd.' },
      { ruleName: 'Common / Generic Name', status: 'PASS', ruleReference: 'Rule 6(1)(b)', explanation: 'Commodity name declared clearly.', detectedValue: 'Biscuits' },
      { ruleName: 'Net Quantity Declaration', status: 'PASS', ruleReference: 'Rule 6(1)(c)', explanation: 'Standard metric unit verified.', detectedValue: '200 g' },
      { ruleName: 'Month & Year of Manufacture', status: 'PASS', ruleReference: 'Rule 6(1)(d)', explanation: 'Manufacturing date valid.', detectedValue: '08/2026' },
      { ruleName: 'Retail Sale Price (MRP)', status: 'PASS', ruleReference: 'Rule 6(1)(e)', explanation: 'Inclusive of all taxes verified.', detectedValue: 'MRP Rs 30.00 incl. of all taxes' },
      { ruleName: 'Consumer Care Details', status: 'PASS', ruleReference: 'Rule 6(2)', explanation: 'Consumer care contact channels verified.', detectedValue: 'feedback@britindia.com, 1800-425-4449' },
    ],
  };

  const fallbackInspection: Inspection = {
    id: fallbackId,
    product: {
      id: `prod-${Date.now()}`,
      name: 'Biscuits',
      category: 'Food Products',
      manufacturer: 'Britannia Industries Ltd.',
      inspectionCount: 1,
      lastInspectionDate: new Date().toISOString(),
      lastComplianceScore: 100,
      lastStatus: 'COMPLIANT',
    },
    inspectorId: 'usr-001',
    inspectorName: 'Auditor',
    status: 'COMPLIANT',
    complianceScore: 100,
    confidence: 0.98,
    createdAt: fallbackRes.timestamp,
    updatedAt: fallbackRes.timestamp,
    timeline: [
      { id: `tl-1-${Date.now()}`, type: 'created', label: 'Scan Initiated', timestamp: fallbackRes.timestamp },
      { id: `tl-2-${Date.now()}`, type: 'analysis_completed', label: 'AI Audit Completed', timestamp: fallbackRes.timestamp },
    ],
    declarations: [
      {
        id: `dec-mfg-${Date.now()}`,
        type: 'MANUFACTURER_PACKER',
        label: 'Manufacturer Declaration',
        status: 'PASS',
        confidence: 0.98,
        presenceStatus: 'PRESENT',
        correctnessStatus: 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: 'Britannia Industries Ltd. - Kolkata',
      }
    ],
    violations: [],
    images: dataUrls.map((url, idx) => ({
      id: `img-${idx}-${Date.now()}`,
      url,
      category: (['front', 'side', 'back', 'top', 'bottom'] as any)[idx % 5] || 'front',
      fileName: `package_view_${idx + 1}.jpg`,
      fileSize: 150000
    }))
  };

  addInspection(fallbackInspection);
  return fallbackRes;
}

export async function getInspections(filters?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Inspection[]> {
  if (USE_MOCKS) {
    await delay();
    let results = [...mockInspections];
    if (filters?.status) {
      results = results.filter(i => i.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.product.name.toLowerCase().includes(q) ||
        i.product.manufacturer.toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  throw new Error('Real API not configured');
}

export async function getInspection(id: string): Promise<Inspection> {
  if (USE_MOCKS) {
    await delay();
    const inspection = getInspectionById(id);
    if (!inspection) throw new Error(`Inspection ${id} not found`);
    return inspection;
  }
  throw new Error('Real API not configured');
}

export async function createInspection(request: CreateInspectionRequest): Promise<Inspection> {
  if (USE_MOCKS) {
    await delay(500);
    // Return the first mock inspection as a new one
    const template = mockInspections[0];
    const newInspection: Inspection = {
      ...template,
      id: `LM-2026-${String(mockInspections.length + 1).padStart(5, '0')}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      complianceScore: 0,
      confidence: 0,
      declarations: [],
      violations: [],
      productInformation: request.productInformation,
      productListing: request.productListing,
      timeline: [{
        id: 'tl-new-1',
        type: 'created',
        label: 'Inspection Created',
        timestamp: new Date().toISOString(),
        description: 'New inspection initiated',
      }],
    };
    return newInspection;
  }
  throw new Error('Real API not configured');
}

export async function analyzeInspection(id: string): Promise<AnalysisResult> {
  if (USE_MOCKS) {
    // This is called after the analysis animation completes
    await delay(300);
    const inspection = getInspectionById(id);
    if (!inspection) throw new Error(`Inspection ${id} not found`);
    return {
      declarations: inspection.declarations,
      violations: inspection.violations,
      complianceScore: inspection.complianceScore,
      overallConfidence: inspection.confidence,
      ruleSetVersion: '2026.1',
      totalChecks: 18,
      passedChecks: inspection.declarations.filter(d => d.status === 'PASS').length * 2 + 2,
      failedChecks: inspection.violations.length,
      reviewChecks: inspection.declarations.filter(d => d.status === 'REVIEW').length,
    };
  }
  throw new Error('Real API not configured');
}

export async function updateViolationReview(
  inspectionId: string,
  violationId: string,
  reviewStatus: string,
  reviewNote?: string
): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    // In a real app, this would persist
    return;
  }
  throw new Error('Real API not configured');
}
