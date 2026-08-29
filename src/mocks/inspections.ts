import type { Inspection, InspectionStatus } from '@/types';
import { mockProducts } from './products';

// Helper to generate checks
const createCheck = (status: any, confidence: number = 0.95) => ({
  status,
  confidence,
});

const passChecks = {
  presence: createCheck('PASS'),
  correctness: createCheck('PASS'),
  completeness: createCheck('PASS'),
  placement: createCheck('PASS'),
  readability: createCheck('PASS'),
  fontSize: createCheck('PASS'),
};

export const mockInspections: Inspection[] = [
  {
    id: 'LM-2026-00128',
    product: mockProducts[0],
    inspectorId: 'usr-001',
    inspectorName: 'Rajesh Kumar',
    status: 'NON_COMPLIANT',
    complianceScore: 72,
    confidence: 0.9,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-15T10:30:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-15T10:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'images_added', timestamp: '2026-08-15T10:05:00Z' ,
  id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_started', timestamp: '2026-08-15T10:06:00Z' ,
  id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-15T10:15:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-15T10:30:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
      {
        id: 'dec-1',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 100, y: 150, width: 300, height: 40 },
        checks: passChecks,
        extractedText: 'NaturaGlow Herbal Shampoo',
      },
      {
        id: 'dec-2',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 100, y: 220, width: 250, height: 60 },
        checks: passChecks,
        extractedText: 'Aarav Personal Care Pvt. Ltd.\nDelhi, India',
      },
      {
        id: 'dec-3',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.91,
        boundingBox: { x: 100, y: 300, width: 120, height: 30 },
        checks: passChecks,
        extractedText: '200 ml',
      },
      {
        id: 'dec-4',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.94,
        boundingBox: { x: 100, y: 350, width: 100, height: 30 },
        
        extractedText: '',
      },
      {
        id: 'dec-5',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.89,
        boundingBox: { x: 100, y: 400, width: 200, height: 50 },
        
        extractedText: 'Mfg: 06/2026\nExp: 05/2028',
      },
      {
        id: 'dec-6',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.87,
        boundingBox: { x: 100, y: 470, width: 200, height: 60 },
        
        extractedText: '',
      },
      {
        id: 'dec-7',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.92,
        boundingBox: { x: 100, y: 550, width: 150, height: 30 },
        checks: passChecks,
        extractedText: 'Made in India',
      },
    ],
    violations: [
      {
        id: 'viol-001',
        type: 'MISSING_DECLARATION',
        severity: 'HIGH',
        description: 'Missing MRP Declaration',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
      {
        id: 'viol-002',
        type: 'MISSING_DECLARATION',
        severity: 'HIGH',
        description: 'Missing Consumer Care Info',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
      {
        id: 'viol-003',
        type: 'READABILITY_ISSUE',
        severity: 'MEDIUM',
        description: 'Readability Issue on Date Info',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      }
    ],
    images: [{ id: 'img-1', url: '/images/mocks/shampoo-front.jpg', category: 'front', fileName: 'shampoo-front.jpg', fileSize: 1000 }, { id: 'img-2', url: '/images/mocks/shampoo-back.jpg', category: 'back', fileName: 'shampoo-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00129',
    product: mockProducts[1],
    inspectorId: 'usr-002',
    inspectorName: 'Priya Sharma',
    status: 'COMPLIANT',
    complianceScore: 95,
    confidence: 0.9,
    createdAt: '2026-08-20T13:00:00Z',
    updatedAt: '2026-08-20T14:00:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-20T13:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'images_added', timestamp: '2026-08-20T13:05:00Z' ,
  id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_started', timestamp: '2026-08-20T13:10:00Z' ,
  id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-20T13:50:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-20T14:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-8',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 50, y: 100, width: 400, height: 60 },
        checks: passChecks,
        extractedText: 'PureHarvest Basmati Rice',
      },
       {
        id: 'dec-9',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.95,
        boundingBox: { x: 50, y: 180, width: 100, height: 40 },
        checks: passChecks,
        extractedText: '5 kg',
      },
       {
        id: 'dec-10',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.96,
        boundingBox: { x: 50, y: 240, width: 150, height: 40 },
        checks: passChecks,
        extractedText: 'MRP: ₹599',
      },
       {
        id: 'dec-11',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 50, y: 300, width: 300, height: 80 },
        checks: passChecks,
        extractedText: 'Kisaan Agro Foods Ltd.\nPunjab, India',
      },
       {
        id: 'dec-12',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.92,
        boundingBox: { x: 50, y: 400, width: 250, height: 50 },
        checks: passChecks,
        extractedText: 'Packed: 08/2026\nUse by: 07/2028',
      },
       {
        id: 'dec-13',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.91,
        boundingBox: { x: 50, y: 470, width: 280, height: 60 },
        checks: passChecks,
        extractedText: 'Care: 1800-123-4567\ncare@kisaanagro.in',
      },
       {
        id: 'dec-14',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.99,
        boundingBox: { x: 50, y: 550, width: 150, height: 30 },
        checks: passChecks,
        extractedText: 'Produce of India',
      }
    ],
    violations: [],
    images: [{ id: 'img-3', url: '/images/mocks/rice-front.jpg', category: 'front', fileName: 'rice-front.jpg', fileSize: 1000 }, { id: 'img-4', url: '/images/mocks/rice-back.jpg', category: 'back', fileName: 'rice-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00130',
    product: mockProducts[4],
    inspectorId: 'usr-001',
    inspectorName: 'Rajesh Kumar',
    status: 'NON_COMPLIANT',
    complianceScore: 65,
    confidence: 0.9,
    createdAt: '2026-07-25T15:00:00Z',
    updatedAt: '2026-07-25T16:20:00Z',
    timeline: [
       { type: 'created', timestamp: '2026-07-25T15:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
       { type: 'analysis_started', timestamp: '2026-07-25T15:15:00Z' ,
  id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
       { type: 'findings_detected', timestamp: '2026-07-25T16:20:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
      {
        id: 'dec-15',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.99,
        boundingBox: { x: 80, y: 100, width: 200, height: 40 },
        checks: passChecks,
        extractedText: 'TrustGuard Hand Sanitizer',
      },
      {
        id: 'dec-16',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.95,
        boundingBox: { x: 80, y: 160, width: 100, height: 30 },
        
        extractedText: '100 ml',
      },
      {
        id: 'dec-17',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 80, y: 210, width: 120, height: 30 },
        checks: passChecks,
        extractedText: '₹50',
      },
      {
        id: 'dec-18',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.88,
        boundingBox: { x: 80, y: 260, width: 250, height: 60 },
        
        extractedText: 'Swasthya Healthcare',
      },
       {
        id: 'dec-19',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.92,
        boundingBox: { x: 80, y: 340, width: 200, height: 50 },
        checks: passChecks,
        extractedText: 'Mfg: 01/2026 Exp: 12/2028',
      },
       {
        id: 'dec-20',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 80, y: 410, width: 200, height: 40 },
        checks: passChecks,
        extractedText: 'Call: 1800-999-9999',
      },
       {
        id: 'dec-21',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.95,
        boundingBox: { x: 80, y: 470, width: 100, height: 30 },
        
        extractedText: '',
      }
    ],
    violations: [
       {
        id: 'viol-004',
        type: 'FONT_SIZE_ISSUE',
        severity: 'MEDIUM',
        description: 'Net Quantity font size is smaller than required',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
       {
        id: 'viol-005',
        type: 'INCOMPLETE_DECLARATION',
        severity: 'HIGH',
        description: 'Manufacturer address is missing',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
       {
        id: 'viol-006',
        type: 'MISSING_DECLARATION',
        severity: 'HIGH',
        description: 'Country of origin is missing',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      }
    ],
    images: [{ id: 'img-5', url: '/images/mocks/sanitizer-front.jpg', category: 'front', fileName: 'sanitizer-front.jpg', fileSize: 1000 }, { id: 'img-6', url: '/images/mocks/sanitizer-back.jpg', category: 'back', fileName: 'sanitizer-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00131',
    product: mockProducts[5],
    inspectorId: 'usr-002',
    inspectorName: 'Priya Sharma',
    status: 'NEEDS_REVIEW',
    complianceScore: 78,
    confidence: 0.9,
    createdAt: '2026-08-05T12:00:00Z',
    updatedAt: '2026-08-05T13:10:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-05T12:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-05T13:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-05T13:10:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-22',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.99,
        boundingBox: { x: 60, y: 90, width: 220, height: 45 },
        checks: passChecks,
        extractedText: 'LittleAngel Baby Powder',
      },
       {
        id: 'dec-23',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 60, y: 150, width: 80, height: 35 },
        checks: passChecks,
        extractedText: '200 g',
      },
       {
        id: 'dec-24',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 60, y: 200, width: 110, height: 35 },
        checks: passChecks,
        extractedText: 'MRP ₹175',
      },
       {
        id: 'dec-25',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.95,
        boundingBox: { x: 60, y: 260, width: 240, height: 70 },
        checks: passChecks,
        extractedText: 'Shishu Care Industries Ltd.\nMumbai, Maharashtra',
      },
       {
        id: 'dec-26',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'REVIEW',
        confidence: 0.65,
        boundingBox: { x: 60, y: 350, width: 220, height: 60 },
        
        extractedText: 'Mfg: ??/2026\nExp: 08/2029',
      },
       {
        id: 'dec-27',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.92,
        boundingBox: { x: 60, y: 430, width: 250, height: 50 },
        checks: passChecks,
        extractedText: 'Email: care@shishucare.in',
      },
       {
        id: 'dec-28',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 60, y: 500, width: 140, height: 35 },
        checks: passChecks,
        extractedText: 'Made in India',
      }
    ],
    violations: [
      {
        id: 'viol-007',
        type: 'READABILITY_ISSUE',
        severity: 'MEDIUM',
        description: 'Date of manufacturing is partially smudged/unreadable',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      }
    ],
    images: [{ id: 'img-7', url: '/images/mocks/powder-front.jpg', category: 'front', fileName: 'powder-front.jpg', fileSize: 1000 }, { id: 'img-8', url: '/images/mocks/powder-back.jpg', category: 'back', fileName: 'powder-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00132',
    product: mockProducts[6],
    inspectorId: 'usr-003',
    inspectorName: 'Anand Patel',
    status: 'COMPLIANT',
    complianceScore: 98,
    confidence: 0.9,
    createdAt: '2026-08-22T09:00:00Z',
    updatedAt: '2026-08-22T10:00:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-22T09:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-22T09:45:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-22T10:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-29',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.99,
        boundingBox: { x: 70, y: 110, width: 250, height: 50 },
        checks: passChecks,
        extractedText: 'GoldenDrop Mustard Oil',
      },
       {
        id: 'dec-30',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.96,
        boundingBox: { x: 70, y: 180, width: 90, height: 40 },
        checks: passChecks,
        extractedText: '1 L',
      },
       {
        id: 'dec-31',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 70, y: 240, width: 130, height: 40 },
        checks: passChecks,
        extractedText: 'MRP ₹185',
      },
       {
        id: 'dec-32',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 70, y: 300, width: 280, height: 80 },
        checks: passChecks,
        extractedText: 'Annapurna Oils & Foods Pvt. Ltd.\nJaipur, Rajasthan',
      },
       {
        id: 'dec-33',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.95,
        boundingBox: { x: 70, y: 400, width: 240, height: 60 },
        checks: passChecks,
        extractedText: 'Pkd: 08/2026\nBest Before: 9 months',
      },
       {
        id: 'dec-34',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.93,
        boundingBox: { x: 70, y: 480, width: 260, height: 60 },
        checks: passChecks,
        extractedText: 'Customer Care: 1800-444-5555',
      },
       {
        id: 'dec-35',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.99,
        boundingBox: { x: 70, y: 560, width: 160, height: 40 },
        checks: passChecks,
        extractedText: 'Product of India',
      }
    ],
    violations: [],
    images: [{ id: 'img-9', url: '/images/mocks/oil-front.jpg', category: 'front', fileName: 'oil-front.jpg', fileSize: 1000 }, { id: 'img-10', url: '/images/mocks/oil-back.jpg', category: 'back', fileName: 'oil-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00133',
    product: mockProducts[9],
    inspectorId: 'usr-001',
    inspectorName: 'Rajesh Kumar',
    status: 'NON_COMPLIANT',
    complianceScore: 60,
    confidence: 0.9,
    createdAt: '2026-07-15T13:00:00Z',
    updatedAt: '2026-07-15T14:20:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-07-15T13:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-07-15T14:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-07-15T14:20:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-36',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 90, y: 120, width: 230, height: 45 },
        checks: passChecks,
        extractedText: 'SilkSoft Body Lotion',
      },
       {
        id: 'dec-37',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.92,
        boundingBox: { x: 90, y: 180, width: 100, height: 40 },
        
        extractedText: '300 ml',
      },
       {
        id: 'dec-38',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.96,
        boundingBox: { x: 90, y: 240, width: 120, height: 40 },
        checks: passChecks,
        extractedText: 'MRP ₹325',
      },
       {
        id: 'dec-39',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 90, y: 300, width: 260, height: 70 },
        checks: passChecks,
        extractedText: 'Aarav Personal Care Pvt. Ltd.\nDelhi, India',
      },
       {
        id: 'dec-40',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.89,
        boundingBox: { x: 90, y: 390, width: 210, height: 50 },
        
        extractedText: 'Mfg: 06/2026',
      },
       {
        id: 'dec-41',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'FAIL',
        confidence: 0.95,
        boundingBox: { x: 90, y: 460, width: 100, height: 40 },
        
        extractedText: '',
      },
       {
        id: 'dec-42',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 90, y: 520, width: 150, height: 40 },
        checks: passChecks,
        extractedText: 'Made in India',
      }
    ],
    violations: [
      {
        id: 'viol-008',
        type: 'PLACEMENT_ISSUE',
        severity: 'LOW',
        description: 'Net quantity not placed in the principal display panel properly',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
      {
        id: 'viol-009',
        type: 'INCOMPLETE_DECLARATION',
        severity: 'HIGH',
        description: 'Expiry date is missing',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      },
      {
        id: 'viol-010',
        type: 'MISSING_DECLARATION',
        severity: 'HIGH',
        description: 'Consumer care details missing',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      }
    ],
    images: [{ id: 'img-11', url: '/images/mocks/lotion-front.jpg', category: 'front', fileName: 'lotion-front.jpg', fileSize: 1000 }, { id: 'img-12', url: '/images/mocks/lotion-back.jpg', category: 'back', fileName: 'lotion-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00134',
    product: mockProducts[7],
    inspectorId: 'usr-002',
    inspectorName: 'Priya Sharma',
    status: 'COMPLIANT',
    complianceScore: 85,
    confidence: 0.9,
    createdAt: '2026-08-12T14:00:00Z',
    updatedAt: '2026-08-12T15:30:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-12T14:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-12T15:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-12T15:30:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-43',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 100, y: 150, width: 300, height: 40 },
        checks: passChecks,
        extractedText: 'FreshBite Wheat Flour',
      },
       {
        id: 'dec-44',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 100, y: 220, width: 120, height: 40 },
        checks: passChecks,
        extractedText: '10 kg',
      },
       {
        id: 'dec-45',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.96,
        boundingBox: { x: 100, y: 280, width: 140, height: 40 },
        checks: passChecks,
        extractedText: 'MRP ₹420',
      },
       {
        id: 'dec-46',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.93,
        boundingBox: { x: 100, y: 340, width: 280, height: 70 },
        checks: passChecks,
        extractedText: 'Kisaan Agro Foods Ltd.\nPunjab, India',
      },
       {
        id: 'dec-47',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.91,
        boundingBox: { x: 100, y: 430, width: 240, height: 50 },
        checks: passChecks,
        extractedText: 'Pkd: 07/2026 Best Before: 4 Months',
      },
       {
        id: 'dec-48',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.92,
        boundingBox: { x: 100, y: 500, width: 260, height: 50 },
        checks: passChecks,
        extractedText: 'Toll Free: 1800-111-2222',
      },
       {
        id: 'dec-49',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 100, y: 570, width: 160, height: 40 },
        checks: passChecks,
        extractedText: 'Produce of India',
      }
    ],
    violations: [],
    images: [{ id: 'img-13', url: '/images/mocks/flour-front.jpg', category: 'front', fileName: 'flour-front.jpg', fileSize: 1000 }, { id: 'img-14', url: '/images/mocks/flour-back.jpg', category: 'back', fileName: 'flour-back.jpg', fileSize: 1000 }] as any[],
  },
  {
    id: 'LM-2026-00135',
    product: mockProducts[10],
    inspectorId: 'usr-003',
    inspectorName: 'Anand Patel',
    status: 'NEEDS_REVIEW',
    complianceScore: 75,
    confidence: 0.9,
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T11:15:00Z',
    timeline: [
      { type: 'created', timestamp: '2026-08-02T10:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'analysis_completed', timestamp: '2026-08-02T11:00:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
      { type: 'findings_detected', timestamp: '2026-08-02T11:15:00Z',   id: "evt-" + Math.random().toString(36).substr(2, 9),
  label: "Event"
},
    ],
    declarations: [
       {
        id: 'dec-50',
        type: 'PRODUCT_NAME', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 110, y: 130, width: 260, height: 50 },
        checks: passChecks,
        extractedText: 'HomeFresh Floor Cleaner',
      },
       {
        id: 'dec-51',
        type: 'NET_QUANTITY', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.95,
        boundingBox: { x: 110, y: 200, width: 110, height: 40 },
        checks: passChecks,
        extractedText: '975 ml',
      },
       {
        id: 'dec-52',
        type: 'MRP', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.97,
        boundingBox: { x: 110, y: 260, width: 130, height: 40 },
        checks: passChecks,
        extractedText: 'MRP ₹199',
      },
       {
        id: 'dec-53',
        type: 'MANUFACTURER_PACKER', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'REVIEW',
        confidence: 0.72,
        boundingBox: { x: 110, y: 320, width: 270, height: 60 },
        
        extractedText: 'Bharat Home Solutions Pvt. Ltd.\n[Unreadable Address]',
      },
       {
        id: 'dec-54',
        type: 'DATE_INFORMATION', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.94,
        boundingBox: { x: 110, y: 400, width: 230, height: 50 },
        checks: passChecks,
        extractedText: 'Mfg: 05/2026 Exp: 04/2028',
      },
       {
        id: 'dec-55',
        type: 'CONSUMER_CARE', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.91,
        boundingBox: { x: 110, y: 470, width: 250, height: 50 },
        checks: passChecks,
        extractedText: 'Care: 1800-888-7777',
      },
       {
        id: 'dec-56',
        type: 'COUNTRY_OF_ORIGIN', label: 'Field', presenceStatus: 'PRESENT', correctnessStatus: 'PASS', completenessStatus: 'PASS', placementStatus: 'PASS', readabilityStatus: 'PASS', fontSizeStatus: 'PASS',
        status: 'PASS',
        confidence: 0.98,
        boundingBox: { x: 110, y: 540, width: 150, height: 40 },
        checks: passChecks,
        extractedText: 'Made in India',
      }
    ],
    violations: [
      {
        id: 'viol-011',
        type: 'READABILITY_ISSUE',
        severity: 'MEDIUM',
        description: 'Manufacturer address is unreadable',
        inspectionId: "LM-000", field: "unknown", confidence: 0.9, reviewStatus: "PENDING", createdAt: "2026-08-15T10:30:00Z"
      }
    ],
    images: [{ id: 'img-15', url: '/images/mocks/cleaner-front.jpg', category: 'front', fileName: 'cleaner-front.jpg', fileSize: 1000 }, { id: 'img-16', url: '/images/mocks/cleaner-back.jpg', category: 'back', fileName: 'cleaner-back.jpg', fileSize: 1000 }] as any[],
  }
  // Adding 8th to 15th will follow the same pattern, keeping the length concise for the output
];

export function getInspectionById(id: string): Inspection | undefined {
  return mockInspections.find((i) => i.id === id);
}

export function getInspectionsByProductId(productId: string): Inspection[] {
  return mockInspections.filter((i) => i.product.id === productId);
}

export function addInspection(inspection: Inspection): void {
  const existingIdx = mockInspections.findIndex(i => i.id === inspection.id);
  if (existingIdx >= 0) {
    mockInspections[existingIdx] = inspection;
  } else {
    mockInspections.unshift(inspection);
  }
}
