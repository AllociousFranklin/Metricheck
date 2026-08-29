export interface Product {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  netQuantity?: string;
  mrp?: string;
  inspectionCount: number;
  lastInspectionDate?: string;
  lastComplianceScore?: number;
  lastStatus?: string;
  imageUrl?: string;
}

export interface ProductInformation {
  productName?: string;
  manufacturer?: string;
  mrp?: string;
  netQuantity?: string;
  countryOfOrigin?: string;
  consumerCare?: string;
  dateInformation?: string;
  additionalInformation?: string;
}

export interface ProductListing {
  url?: string;
  title?: string;
  description?: string;
  listedPrice?: string;
  listedQuantity?: string;
  additionalInformation?: string;
}
