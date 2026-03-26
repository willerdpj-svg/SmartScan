import { supabase } from '../lib/supabase';
import type { Store, StoreChain, StorePlanogramEntry } from '../types';

export async function getStoreChains() {
  const { data, error } = await supabase
    .from('store_chains')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as StoreChain[];
}

export async function createStoreChain(chain: { name: string; logo_url?: string }) {
  const { data, error } = await supabase
    .from('store_chains')
    .insert(chain)
    .select()
    .single();
  if (error) throw error;
  return data as StoreChain;
}

export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*, chain:store_chains(*)')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data as Store[];
}

export async function getStore(id: number) {
  const { data, error } = await supabase
    .from('stores')
    .select('*, chain:store_chains(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Store;
}

export async function createStore(store: {
  chain_id: number;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  gps_lat?: number;
  gps_lng?: number;
}) {
  const { data, error } = await supabase
    .from('stores')
    .insert(store)
    .select('*, chain:store_chains(*)')
    .single();
  if (error) throw error;
  return data as Store;
}

export async function updateStore(id: number, updates: Partial<Store>) {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select('*, chain:store_chains(*)')
    .single();
  if (error) throw error;
  return data as Store;
}

export async function deleteStore(id: number) {
  const { error } = await supabase
    .from('stores')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// Planogram
export async function getStorePlanogram(storeId: number) {
  const { data, error } = await supabase
    .from('store_planograms')
    .select('*, product:products(*, brand:brands(*))')
    .eq('store_id', storeId)
    .order('section');
  if (error) throw error;
  return data as StorePlanogramEntry[];
}

export async function addToPlanogram(entry: {
  store_id: number;
  product_id: number;
  section?: string;
  shelf_position?: string;
  min_facings?: number;
  is_required?: boolean;
}) {
  const { data, error } = await supabase
    .from('store_planograms')
    .insert(entry)
    .select('*, product:products(*, brand:brands(*))')
    .single();
  if (error) throw error;
  return data as StorePlanogramEntry;
}

export async function removeFromPlanogram(id: number) {
  const { error } = await supabase.from('store_planograms').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkAddToPlanogram(storeId: number, productIds: number[]) {
  const entries = productIds.map((product_id) => ({
    store_id: storeId,
    product_id,
    is_required: true,
  }));
  const { error } = await supabase.from('store_planograms').upsert(entries, {
    onConflict: 'store_id,product_id',
  });
  if (error) throw error;
}
