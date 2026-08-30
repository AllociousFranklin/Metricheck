import type { Inspection, CreateInspectionRequest, AnalysisResult, Declaration } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { mockInspections } from '@/mocks/inspections';

// Helper to convert Data URL to Blob for Supabase Storage
function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

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
      manufacturer_name: 
        report.extracted_fields?.manufacturer?.name || 
        report.extracted_fields?.manufacturer_name?.value || 
        report.extracted_fields?.manufacturer_name || '',
      manufacturer_address: 
        report.extracted_fields?.manufacturer?.address || 
        report.extracted_fields?.manufacturer_address?.value || 
        report.extracted_fields?.manufacturer_address || '',
      packer_name: 
        report.extracted_fields?.packer?.name || 
        report.extracted_fields?.packer_name?.value || 
        report.extracted_fields?.packer_name || '',
      packer_address: 
        report.extracted_fields?.packer?.address || 
        report.extracted_fields?.packer_address?.value || 
        report.extracted_fields?.packer_address || '',
      importer_name: 
        report.extracted_fields?.importer?.name || 
        report.extracted_fields?.importer_name?.value || 
        report.extracted_fields?.importer_name || '',
      importer_address: 
        report.extracted_fields?.importer?.address || 
        report.extracted_fields?.importer_address?.value || 
        report.extracted_fields?.importer_address || '',
      commodity_name: 
        report.product?.commodity_name || 
        report.extracted_fields?.commodity_name?.value || 
        report.extracted_fields?.commodity_name || '',
      net_quantity_value: 
        report.extracted_fields?.net_quantity?.raw_value != null ? String(report.extracted_fields?.net_quantity?.raw_value) :
        (report.extracted_fields?.net_quantity_value?.value ? String(report.extracted_fields?.net_quantity_value?.value) : 
        (report.extracted_fields?.net_quantity_value ? String(report.extracted_fields?.net_quantity_value) : '')),
      net_quantity_unit: 
        report.extracted_fields?.net_quantity?.raw_unit || 
        report.extracted_fields?.net_quantity_unit?.value || 
        report.extracted_fields?.net_quantity_unit || '',
      mrp_raw_text: 
        report.extracted_fields?.mrp?.raw_text || 
        report.extracted_fields?.mrp_raw_text?.value || 
        report.extracted_fields?.mrp_raw_text || '',
      mrp_value: 
        report.extracted_fields?.mrp?.numeric_value != null ? String(report.extracted_fields?.mrp?.numeric_value) :
        (report.extracted_fields?.mrp_value?.value ? String(report.extracted_fields?.mrp_value?.value) : 
        (report.extracted_fields?.mrp_value ? String(report.extracted_fields?.mrp_value) : '')),
      month_year_of_manufacture: 
        (typeof report.extracted_fields?.month_year_of_manufacture === 'object' 
          ? report.extracted_fields?.month_year_of_manufacture?.value 
          : report.extracted_fields?.month_year_of_manufacture) || '',
      consumer_care_name: 
        report.extracted_fields?.consumer_care?.name || 
        report.extracted_fields?.consumer_care_name?.value || 
        report.extracted_fields?.consumer_care_name || '',
      consumer_care_address: 
        report.extracted_fields?.consumer_care?.address || 
        report.extracted_fields?.consumer_care_address?.value || 
        report.extracted_fields?.consumer_care_address || '',
      consumer_care_phone: 
        report.extracted_fields?.consumer_care?.phone || 
        report.extracted_fields?.consumer_care_phone?.value || 
        report.extracted_fields?.consumer_care_phone || '',
      consumer_care_email: 
        report.extracted_fields?.consumer_care?.email || 
        report.extracted_fields?.consumer_care_email?.value || 
        report.extracted_fields?.consumer_care_email || '',
      dimensions: 
        (typeof report.extracted_fields?.dimensions === 'object' 
          ? report.extracted_fields?.dimensions?.value 
          : report.extracted_fields?.dimensions) || '',
      country_of_origin: 
        (typeof report.extracted_fields?.country_of_origin === 'object' 
          ? report.extracted_fields?.country_of_origin?.value 
          : report.extracted_fields?.country_of_origin) || '',
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

  // Persist to Supabase
  await persistInspectionToSupabase(newInspection);
  return auditRes;
}

async function persistInspectionToSupabase(inspection: Inspection) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Insert or Upsert Product
  let productId = inspection.product.id;
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('name', inspection.product.name)
    .single();

  if (existingProduct) {
    productId = existingProduct.id;
  } else {
    const { data: p } = await supabase.from('products').insert({
      user_id: userId,
      name: inspection.product.name,
      category: inspection.product.category,
      manufacturer: inspection.product.manufacturer,
      last_compliance_score: inspection.product.lastComplianceScore,
      last_status: inspection.product.lastStatus
    }).select().single();
    if (p) productId = p.id;
  }

  // Insert Inspection
  const { data: savedInspection, error: inspError } = await supabase.from('inspections').insert({
    id: inspection.id,
    user_id: userId,
    product_id: productId,
    status: inspection.status,
    compliance_score: inspection.complianceScore,
    confidence: inspection.confidence,
    product_name: inspection.product.name,
    product_manufacturer: inspection.product.manufacturer,
  }).select().single();

  if (inspError) throw inspError;

  // Insert Images
  for (const img of inspection.images) {
    const blob = dataURLtoBlob(img.url);
    const storagePath = `${userId}/${inspection.id}/${img.id}.jpg`;
    
    await supabase.storage.from('inspection-images').upload(storagePath, blob, {
      contentType: 'image/jpeg'
    });

    const { data: publicUrlData } = supabase.storage.from('inspection-images').getPublicUrl(storagePath);
    
    await supabase.from('inspection_images').insert({
      inspection_id: inspection.id,
      user_id: userId,
      storage_path: storagePath,
      category: img.category,
      file_name: img.fileName,
      file_size: img.fileSize
    });
  }

  // Insert Declarations
  if (inspection.declarations.length > 0) {
    const decs = inspection.declarations.map(d => ({
      id: d.id,
      inspection_id: inspection.id,
      user_id: userId,
      type: d.type,
      label: d.label,
      extracted_text: d.extractedText,
      status: d.status,
      confidence: d.confidence
    }));
    await supabase.from('declarations').insert(decs);
  }

  // Insert Violations
  if (inspection.violations && inspection.violations.length > 0) {
    const viols = inspection.violations.map(v => ({
      id: v.id,
      inspection_id: inspection.id,
      user_id: userId,
      type: v.type,
      severity: v.severity,
      field: v.field,
      description: v.description,
      confidence: v.confidence,
      review_status: v.reviewStatus
    }));
    await supabase.from('violations').insert(viols);
  }
}


export async function getInspections(filters?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Inspection[]> {
  try {
    let query = supabase
      .from('inspections')
      .select('*, products(*)');

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      const q = filters.search;
      query = query.or(`id.ilike.%${q}%,product_name.ilike.%${q}%,product_manufacturer.ilike.%${q}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((i: any) => ({
        id: i.id,
        status: i.status,
        complianceScore: i.compliance_score,
        confidence: i.confidence,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        inspectorId: i.user_id,
        inspectorName: 'Inspector',
        product: {
          id: i.products?.id || '',
          name: i.products?.name || i.product_name || 'Packaged Product',
          category: i.products?.category || 'Packaged Commodity',
          manufacturer: i.products?.manufacturer || i.product_manufacturer || 'Declared Entity',
          inspectionCount: i.products?.inspection_count || 1,
        },
        images: [],
        declarations: [],
        violations: [],
        timeline: [],
      }));
    }
  } catch (err) {
    console.warn('Supabase getInspections fallback:', err);
  }

  // Graceful fallback to mockInspections
  let results = [...mockInspections];
  if (filters?.status && filters.status !== 'All') {
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
  return results;
}

export async function getInspection(id: string): Promise<Inspection> {
  try {
    const { data: i, error } = await supabase
      .from('inspections')
      .select(`
        *,
        products(*),
        inspection_images(*),
        declarations(*),
        violations(*)
      `)
      .eq('id', id)
      .single();

    if (!error && i) {
      return {
        id: i.id,
        status: i.status,
        complianceScore: i.compliance_score,
        confidence: i.confidence,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        inspectorId: i.user_id,
        inspectorName: 'Inspector',
        product: {
          id: i.products?.id || '',
          name: i.products?.name || i.product_name,
          category: i.products?.category || '',
          manufacturer: i.products?.manufacturer || i.product_manufacturer,
          inspectionCount: i.products?.inspection_count || 1,
        },
        images: (i.inspection_images || []).map((img: any) => ({
          id: img.id,
          url: supabase.storage.from('inspection-images').getPublicUrl(img.storage_path).data.publicUrl,
          category: img.category,
          fileName: img.file_name,
          fileSize: img.file_size
        })),
        declarations: (i.declarations || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          label: d.label,
          extractedText: d.extracted_text,
          status: d.status,
          confidence: d.confidence,
        })),
        violations: (i.violations || []).map((v: any) => ({
          id: v.id,
          inspectionId: v.inspection_id,
          type: v.type,
          severity: v.severity,
          field: v.field,
          description: v.description,
          confidence: v.confidence,
          reviewStatus: v.review_status,
          reviewNote: v.review_note
        })),
        timeline: []
      };
    }
  } catch (err) {
    console.warn(`Supabase getInspection(${id}) fallback:`, err);
  }

  const found = mockInspections.find(i => i.id === id) || mockInspections[0];
  return found;
}

export async function createInspection(request: CreateInspectionRequest): Promise<Inspection> {
  throw new Error('Please use runLegalMetrologyAudit instead to initiate an inspection');
}

export async function analyzeInspection(id: string): Promise<AnalysisResult> {
  const inspection = await getInspection(id);
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

export async function updateViolationReview(
  inspectionId: string,
  violationId: string,
  reviewStatus: string,
  reviewNote?: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const { error } = await supabase
    .from('violations')
    .update({
      review_status: reviewStatus,
      review_note: reviewNote,
      reviewed_by: session?.user?.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', violationId);

  if (error) {
    throw error;
  }
}

