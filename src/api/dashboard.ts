import { supabase } from '../lib/supabase';

export async function getDashboardStats() {
  const [auditsRes, storesRes, productsRes, brandsRes] = await Promise.all([
    supabase.from('audits').select('id, status, store_id, created_at', { count: 'exact' }),
    supabase.from('stores').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('brands').select('id', { count: 'exact' }),
  ]);

  return {
    total_audits: auditsRes.count || 0,
    total_stores: storesRes.count || 0,
    total_products: productsRes.count || 0,
    total_brands: brandsRes.count || 0,
  };
}

export async function getRecentAudits(limit = 10) {
  const { data, error } = await supabase
    .from('audits')
    .select('*, profile:profiles(full_name), store:stores(name, chain:store_chains(name))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getComplianceByStore() {
  const { data, error } = await supabase
    .from('audits')
    .select(`
      id,
      store_id,
      store:stores(name, chain:store_chains(name)),
      findings:audit_findings(status)
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  // Compute compliance per store
  const storeMap = new Map<number, { name: string; chain: string; found: number; total: number; audits: number }>();

  for (const audit of data || []) {
    const storeId = audit.store_id;
    const store = audit.store as { name: string; chain: { name: string } } | null;
    if (!store) continue;

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        name: store.name,
        chain: store.chain?.name || '',
        found: 0,
        total: 0,
        audits: 0,
      });
    }

    const entry = storeMap.get(storeId)!;
    entry.audits++;
    const findings = audit.findings as { status: string }[] | null;
    if (findings) {
      for (const f of findings) {
        if (f.status === 'found' || f.status === 'missing') {
          entry.total++;
          if (f.status === 'found') entry.found++;
        }
      }
    }
  }

  return Array.from(storeMap.entries()).map(([store_id, entry]) => ({
    store_id,
    store_name: entry.name,
    chain_name: entry.chain,
    compliance_pct: entry.total > 0 ? Math.round((entry.found / entry.total) * 100) : 0,
    audit_count: entry.audits,
  }));
}

export async function getComplianceByBrand() {
  const { data, error } = await supabase
    .from('audit_findings')
    .select('status, brand:brands(id, name, category)')
    .in('status', ['found', 'missing']);
  if (error) throw error;

  const brandMap = new Map<number, { name: string; category: string; found: number; missing: number }>();

  for (const finding of data || []) {
    const brand = finding.brand as { id: number; name: string; category: string } | null;
    if (!brand) continue;

    if (!brandMap.has(brand.id)) {
      brandMap.set(brand.id, { name: brand.name, category: brand.category, found: 0, missing: 0 });
    }

    const entry = brandMap.get(brand.id)!;
    if (finding.status === 'found') entry.found++;
    else entry.missing++;
  }

  return Array.from(brandMap.entries()).map(([brand_id, entry]) => ({
    brand_id,
    brand_name: entry.name,
    category: entry.category,
    found_count: entry.found,
    missing_count: entry.missing,
    presence_pct: entry.found + entry.missing > 0
      ? Math.round((entry.found / (entry.found + entry.missing)) * 100)
      : 0,
  }));
}
