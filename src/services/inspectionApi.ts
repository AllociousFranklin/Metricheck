import type { Inspection, CreateInspectionRequest, AnalysisResult, Declaration } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockInspections, getInspectionById, addInspection } from '@/mocks/inspections';
import { useAuthStore } from '@/stores/authStore';

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

/**
 * Compress an image to stay within Vercel's 4.5MB payload limit.
 * Resizes to max 1200px on longest edge and compresses to JPEG quality 0.7.
 */
async function compressImage(fileOrBlob: File | Blob | string): Promise<string> {
  // If already a data URL string, compress it too
  if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let w = img.width, h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(fileOrBlob); // fallback to original
      img.src = fileOrBlob;
    });
  }
  if (typeof fileOrBlob === 'string') return fileOrBlob;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1200;
      let w = img.width, h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
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
  const compressedDataUrls = await Promise.all(images.map(compressImage));
  
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: compressedDataUrls }),
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server Audit Error (${response.status}): ${response.statusText}`);
  }
  
  const report = await response.json();
  const currentUser = useAuthStore.getState().user;
  
  const auditRes: AuditResponse = {
    scanId: report.scan_id || `LM-${Date.now()}`,
    timestamp: report.timestamp || new Date().toISOString(),
    overallStatus: report.summary?.overall_compliant
      ? 'FULLY COMPLIANT'
      : (report.summary?.failed ?? 0) > 0
      ? 'NON-COMPLIANT'
      : 'NEEDS REVIEW',
    summary: {
      passed: report.summary?.passed ?? 0,
      failed: report.summary?.failed ?? 0,
      warnings: report.summary?.warnings ?? 0,
    },
    checks: (report.compliance || []).map((c: any) => ({
      ruleName: c.label || c.id || 'Statutory Check',
      status: c.status === 'PASS' ? 'PASS' : c.status === 'FAIL' ? 'FAIL' : 'WARNING',
      ruleReference: c.rule_ref || '',
      explanation: c.message || '',
      detectedValue: c.detected_value || ''
    })),
    extractedData: {
      manufacturer_name: report.extracted_fields?.manufacturer_name?.value || '',
      manufacturer_address: report.extracted_fields?.manufacturer_address?.value || '',
      packer_name: report.extracted_fields?.packer_name?.value || '',
      packer_address: report.extracted_fields?.packer_address?.value || '',
      importer_name: report.extracted_fields?.importer_name?.value || '',
      importer_address: report.extracted_fields?.importer_address?.value || '',
      commodity_name: report.product?.commodity_name || report.extracted_fields?.commodity_name?.value || '',
      net_quantity_value: report.extracted_fields?.net_quantity_value?.value ? String(report.extracted_fields?.net_quantity_value?.value) : '',
      net_quantity_unit: report.extracted_fields?.net_quantity_unit?.value || '',
      mrp_raw_text: report.extracted_fields?.mrp_raw_text?.value || '',
      mrp_value: report.extracted_fields?.mrp_value?.value ? String(report.extracted_fields?.mrp_value?.value) : '',
      month_year_of_manufacture: report.extracted_fields?.month_year_of_manufacture?.value || '',
      consumer_care_name: report.extracted_fields?.consumer_care_name?.value || '',
      consumer_care_address: report.extracted_fields?.consumer_care_address?.value || '',
      consumer_care_phone: report.extracted_fields?.consumer_care_phone?.value || '',
      consumer_care_email: report.extracted_fields?.consumer_care_email?.value || '',
      dimensions: report.extracted_fields?.dimensions?.value || '',
      country_of_origin: report.extracted_fields?.country_of_origin?.value || '',
    }
  };

  const totalChecks = (report.summary?.passed ?? 0) + (report.summary?.failed ?? 0) + (report.summary?.warnings ?? 0);
  const calculatedScore = totalChecks > 0 ? Math.round(((report.summary?.passed ?? 0) / totalChecks) * 100) : 100;

  // Helper to find compliance status for declaration mapping
  const findCheckStatus = (ruleIdSub: string): 'PASS' | 'FAIL' | 'REVIEW' => {
    const matched = (report.compliance || []).find((c: any) => 
      c.id?.toLowerCase().includes(ruleIdSub.toLowerCase()) || 
      c.rule_ref?.toLowerCase().includes(ruleIdSub.toLowerCase())
    );
    if (!matched) return 'PASS';
    return matched.status === 'PASS' ? 'PASS' : matched.status === 'FAIL' ? 'FAIL' : 'REVIEW';
  };

  const newInspection: Inspection = {
    id: auditRes.scanId,
    product: {
      id: `prod-${Date.now()}`,
      name: auditRes.extractedData.commodity_name || 'Packaged Commodity',
      category: 'Packaged Goods',
      manufacturer: auditRes.extractedData.manufacturer_name || 'Declared Entity',
      inspectionCount: 1,
      lastInspectionDate: new Date().toISOString(),
      lastComplianceScore: calculatedScore,
      lastStatus: report.summary?.overall_compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    },
    inspectorId: currentUser?.id || 'usr-inspector',
    inspectorName: currentUser?.name || 'Field Auditor',
    status: report.summary?.overall_compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    complianceScore: calculatedScore,
    confidence: report.analysis_confidence || 0.95,
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
        status: findCheckStatus('manufacturer'),
        confidence: 0.95,
        presenceStatus: auditRes.extractedData.manufacturer_name ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('manufacturer') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: auditRes.extractedData.manufacturer_address ? 'PASS' : 'FAIL',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: [auditRes.extractedData.manufacturer_name, auditRes.extractedData.manufacturer_address].filter(Boolean).join(' - ') || 'Not detected',
      },
      {
        id: `dec-com-${Date.now()}`,
        type: 'PRODUCT_NAME',
        label: 'Common / Generic Name',
        status: findCheckStatus('generic_name'),
        confidence: 0.96,
        presenceStatus: auditRes.extractedData.commodity_name ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('generic_name') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: auditRes.extractedData.commodity_name || 'Not detected',
      },
      {
        id: `dec-qty-${Date.now()}`,
        type: 'NET_QUANTITY',
        label: 'Net Quantity Declaration',
        status: findCheckStatus('net_quantity'),
        confidence: 0.95,
        presenceStatus: auditRes.extractedData.net_quantity_value ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('net_quantity') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: [auditRes.extractedData.net_quantity_value, auditRes.extractedData.net_quantity_unit].filter(Boolean).join(' ') || 'Not detected',
      },
      {
        id: `dec-mrp-${Date.now()}`,
        type: 'MRP',
        label: 'Retail Sale Price (MRP)',
        status: findCheckStatus('mrp'),
        confidence: 0.94,
        presenceStatus: auditRes.extractedData.mrp_raw_text || auditRes.extractedData.mrp_value ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('mrp') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: auditRes.extractedData.mrp_raw_text || (auditRes.extractedData.mrp_value ? `₹ ${auditRes.extractedData.mrp_value}` : 'Not detected'),
      },
      {
        id: `dec-date-${Date.now()}`,
        type: 'DATE_INFORMATION',
        label: 'Month & Year of Manufacture',
        status: findCheckStatus('date'),
        confidence: 0.93,
        presenceStatus: auditRes.extractedData.month_year_of_manufacture ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('date') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: auditRes.extractedData.month_year_of_manufacture || 'Not detected',
      },
      {
        id: `dec-care-${Date.now()}`,
        type: 'CONSUMER_CARE',
        label: 'Consumer Care Details',
        status: findCheckStatus('consumer_care'),
        confidence: 0.92,
        presenceStatus: (auditRes.extractedData.consumer_care_email || auditRes.extractedData.consumer_care_phone) ? 'PRESENT' : 'MISSING',
        correctnessStatus: findCheckStatus('consumer_care') === 'FAIL' ? 'FAIL' : 'PASS',
        completenessStatus: 'PASS',
        placementStatus: 'PASS',
        readabilityStatus: 'PASS',
        fontSizeStatus: 'PASS',
        extractedText: [auditRes.extractedData.consumer_care_email, auditRes.extractedData.consumer_care_phone, auditRes.extractedData.consumer_care_address].filter(Boolean).join(', ') || 'Not detected',
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
    images: compressedDataUrls.map((url, idx) => ({
      id: `img-${idx}-${Date.now()}`,
      url,
      category: (['front', 'side', 'back', 'top', 'bottom'] as any)[idx % 5] || 'front',
      fileName: `package_view_${idx + 1}.jpg`,
      fileSize: Math.round(url.length * 0.75)
    }))
  };

  addInspection(newInspection);
  return auditRes;
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
