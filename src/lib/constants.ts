import type { BrandCategory } from '../types';

export const APP_NAME = 'SmartScan';

export const BRAND_CATEGORIES: BrandCategory[] = ['Food', 'Personal Care', 'Home Care', 'Beauty'];

export const BRAND_CATEGORY_COLORS: Record<BrandCategory, string> = {
  Food: 'bg-orange-100 text-orange-800',
  'Personal Care': 'bg-blue-100 text-blue-800',
  'Home Care': 'bg-green-100 text-green-800',
  Beauty: 'bg-pink-100 text-pink-800',
};

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

export const STORE_CHAINS = [
  'Checkers',
  'Shoprite',
  'Pick n Pay',
  'Spar',
  'Woolworths',
  'Game',
  'Makro',
  'Clicks',
  'Dis-Chem',
];

export const SHELF_POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

export const AUDIT_STATUS_LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const AUDIT_STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export const FINDING_STATUS_COLORS: Record<string, string> = {
  found: 'bg-green-100 text-green-800',
  missing: 'bg-red-100 text-red-800',
  unmatched: 'bg-gray-100 text-gray-800',
};

export const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
};
