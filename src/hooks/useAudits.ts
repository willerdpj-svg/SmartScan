import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as auditsApi from '../api/audits';

export function useAudits(filters?: { store_id?: number; user_id?: string; status?: string }) {
  return useQuery({
    queryKey: ['audits', filters],
    queryFn: () => auditsApi.getAudits(filters),
  });
}

export function useAudit(id: number) {
  return useQuery({
    queryKey: ['audits', id],
    queryFn: () => auditsApi.getAudit(id),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: auditsApi.createAudit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  });
}

export function useAuditImages(auditId: number) {
  return useQuery({
    queryKey: ['audit-images', auditId],
    queryFn: () => auditsApi.getAuditImages(auditId),
    enabled: !!auditId,
  });
}

export function useAuditFindings(auditId: number) {
  return useQuery({
    queryKey: ['audit-findings', auditId],
    queryFn: () => auditsApi.getAuditFindings(auditId),
    enabled: !!auditId,
  });
}

export function useProcessAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: auditsApi.processAudit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audits'] });
      qc.invalidateQueries({ queryKey: ['audit-images'] });
      qc.invalidateQueries({ queryKey: ['audit-findings'] });
    },
  });
}

export function useUploadAuditImage() {
  return useMutation({
    mutationFn: ({ auditId, file, filename }: { auditId: number; file: Blob; filename: string }) =>
      auditsApi.uploadAuditImage(auditId, file, filename),
  });
}

export function useCreateAuditImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: auditsApi.createAuditImage,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['audit-images', vars.audit_id] }),
  });
}
