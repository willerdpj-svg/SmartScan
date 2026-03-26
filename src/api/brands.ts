import { supabase } from '../lib/supabase';
import type { Brand, BrandCategory } from '../types';

export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Brand[];
}

export async function getBrand(id: number) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function createBrand(brand: { name: string; category: BrandCategory; logo_url?: string }) {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function updateBrand(id: number, updates: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function deleteBrand(id: number) {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}
