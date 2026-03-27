export type UserRole = 'admin' | 'manager' | 'field_rep';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  region: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BrandCategory = 'Food' | 'Personal Care' | 'Home Care' | 'Beauty';

export interface Brand {
  id: number;
  name: string;
  category: BrandCategory;
  logo_url: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  brand_id: number;
  brand?: Brand;
  name: string;
  sku: string | null;
  size_variant: string | null;
  packaging_type: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  reference_images?: ProductReferenceImage[];
  // Bulk upload fields
  barcode: string | null;
  category: string | null;
  pack_size: string | null;
  vat: boolean;
  moq: number;
  unit_price: number | null;
  supplier: string | null;
}

export interface ProductReferenceImage {
  id: number;
  product_id: number;
  image_url: string;
  image_type: 'front' | 'side' | 'top' | 'shelf' | 'logo_closeup';
  is_primary: boolean;
  created_at: string;
}

export interface StoreChain {
  id: number;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface Store {
  id: number;
  chain_id: number;
  chain?: StoreChain;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorePlanogramEntry {
  id: number;
  store_id: number;
  product_id: number;
  product?: Product;
  section: string | null;
  shelf_position: string | null;
  min_facings: number;
  is_required: boolean;
  created_at: string;
}

export type AuditStatus = 'in_progress' | 'processing' | 'completed' | 'failed';

export interface Audit {
  id: number;
  user_id: string;
  profile?: Profile;
  store_id: number;
  store?: Store;
  status: AuditStatus;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
  updated_at: string;
  // computed
  image_count?: number;
  compliance_pct?: number;
  total_found?: number;
  total_missing?: number;
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AuditImage {
  id: number;
  audit_id: number;
  image_url: string;
  source_type: 'photo' | 'video_frame';
  source_video_url: string | null;
  frame_index: number | null;
  analysis_status: AnalysisStatus;
  analysis_raw_json: ClaudeVisionResponse | null;
  analysis_error: string | null;
  processed_at: string | null;
  created_at: string;
}

export type FindingStatus = 'found' | 'missing' | 'unmatched';

export interface AuditFinding {
  id: number;
  audit_id: number;
  audit_image_id: number | null;
  product_id: number | null;
  product?: Product;
  brand_id: number | null;
  brand?: Brand;
  status: FindingStatus;
  confidence_score: number | null;
  detected_label: string | null;
  detected_brand: string | null;
  shelf_position: string | null;
  facing_count: number;
  notes: string | null;
  created_at: string;
}

// Claude Vision API response
export interface ClaudeVisionDetectedProduct {
  brand: string;
  product_name: string;
  size_variant: string | null;
  catalog_match_id: number | null;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  shelf_position: string;
  facing_count: number;
  is_unilever: boolean;
  notes: string | null;
}

export interface ClaudeVisionResponse {
  shelf_section: string;
  image_quality: 'good' | 'fair' | 'poor';
  products_detected: ClaudeVisionDetectedProduct[];
  analysis_notes: string;
}

// Dashboard types
export interface ComplianceSummary {
  overall_pct: number;
  total_audits: number;
  total_stores: number;
  by_store: {
    store_id: number;
    store_name: string;
    chain_name: string;
    compliance_pct: number;
    audit_count: number;
    last_audit: string;
  }[];
  by_brand: {
    brand_id: number;
    brand_name: string;
    category: BrandCategory;
    found_count: number;
    missing_count: number;
    presence_pct: number;
  }[];
}

export interface TrendDataPoint {
  date: string;
  compliance_pct: number;
  audit_count: number;
}

export interface AuditSummary {
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_unmatched: number;
  compliance_pct: number;
}
