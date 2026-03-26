import { supabase } from '../lib/supabase';
import type { Audit, AuditImage, AuditFinding, AuditSummary } from '../types';

export async function getAudits(filters?: { store_id?: number; user_id?: string; status?: string }) {
  let query = supabase
    .from('audits')
    .select('*, profile:profiles(full_name), store:stores(name, chain:store_chains(name))')
    .order('created_at', { ascending: false });

  if (filters?.store_id) query = query.eq('store_id', filters.store_id);
  if (filters?.user_id) query = query.eq('user_id', filters.user_id);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data as Audit[];
}

export async function getAudit(id: number) {
  const { data, error } = await supabase
    .from('audits')
    .select('*, profile:profiles(full_name), store:stores(name, chain:store_chains(name))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Audit;
}

export async function createAudit(audit: {
  user_id: string;
  store_id: number;
  notes?: string;
  gps_lat?: number;
  gps_lng?: number;
}) {
  const { data, error } = await supabase
    .from('audits')
    .insert({ ...audit, status: 'in_progress', started_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Audit;
}

export async function updateAudit(id: number, updates: Partial<Audit>) {
  const { data, error } = await supabase
    .from('audits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Audit;
}

// Audit images
export async function getAuditImages(auditId: number) {
  const { data, error } = await supabase
    .from('audit_images')
    .select('*')
    .eq('audit_id', auditId)
    .order('created_at');
  if (error) throw error;
  return data as AuditImage[];
}

export async function createAuditImage(image: {
  audit_id: number;
  image_url: string;
  source_type: 'photo' | 'video_frame';
  source_video_url?: string;
  frame_index?: number;
}) {
  const { data, error } = await supabase
    .from('audit_images')
    .insert({ ...image, analysis_status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as AuditImage;
}

// Audit findings
export async function getAuditFindings(auditId: number) {
  const { data, error } = await supabase
    .from('audit_findings')
    .select('*, product:products(name, brand:brands(name, category)), brand:brands(name, category)')
    .eq('audit_id', auditId)
    .order('status');
  if (error) throw error;
  return data as AuditFinding[];
}

// Process audit via API
export async function processAudit(auditId: number) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch('/api/process-audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ audit_id: auditId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process audit');
  }

  return response.json() as Promise<AuditSummary>;
}

// Upload image to storage
export async function uploadAuditImage(auditId: number, file: Blob, filename: string) {
  const path = `audits/${auditId}/${filename}`;
  const { error } = await supabase.storage
    .from('audit-images')
    .upload(path, file, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}
