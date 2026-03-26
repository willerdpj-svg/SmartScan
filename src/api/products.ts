import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export async function getProducts(brandId?: number) {
  let query = supabase
    .from('products')
    .select('*, brand:brands(*)')
    .eq('is_active', true)
    .order('name');
  if (brandId) {
    query = query.eq('brand_id', brandId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function getProduct(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*, brand:brands(*), reference_images:product_reference_images(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Product;
}

export async function createProduct(product: {
  brand_id: number;
  name: string;
  sku?: string;
  size_variant?: string;
  packaging_type?: string;
  description?: string;
  image_url?: string;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, brand:brands(*)')
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: number, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*, brand:brands(*)')
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: number) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}
