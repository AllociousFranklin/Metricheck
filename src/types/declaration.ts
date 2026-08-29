import type { BoundingBox } from './common';

export type DeclarationStatus = 'PASS' | 'FAIL' | 'REVIEW';
export type PresenceStatus = 'PRESENT' | 'MISSING' | 'UNCERTAIN';

export type DeclarationType = 
  | 'PRODUCT_NAME'
  | 'MANUFACTURER_PACKER'
  | 'NET_QUANTITY'
  | 'MRP'
  | 'DATE_INFORMATION'
  | 'CONSUMER_CARE'
  | 'COUNTRY_OF_ORIGIN'
  | 'INGREDIENTS'
  | 'BATCH_NUMBER';

export const DECLARATION_LABELS: Record<DeclarationType, string> = {
  PRODUCT_NAME: 'Product Name',
  MANUFACTURER_PACKER: 'Manufacturer / Packer',
  NET_QUANTITY: 'Net Quantity',
  MRP: 'MRP',
  DATE_INFORMATION: 'Date Information',
  CONSUMER_CARE: 'Consumer Care',
  COUNTRY_OF_ORIGIN: 'Country of Origin',
  INGREDIENTS: 'Ingredients',
  BATCH_NUMBER: 'Batch / Lot Number',
};

export interface Declaration {
  id: string;
  type: DeclarationType;
  label: string;
  value?: string;
  extractedText?: string;
  status: DeclarationStatus;
  confidence: number;
  boundingBox?: BoundingBox;
  presenceStatus: PresenceStatus;
  correctnessStatus: DeclarationStatus;
  completenessStatus: DeclarationStatus;
  placementStatus: DeclarationStatus;
  readabilityStatus: DeclarationStatus;
  fontSizeStatus: DeclarationStatus;
  checks?: any;
}
