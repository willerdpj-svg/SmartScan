import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as storesApi from '../api/stores';

export function useStoreChains() {
  return useQuery({ queryKey: ['store-chains'], queryFn: storesApi.getStoreChains });
}

export function useCreateStoreChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.createStoreChain,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-chains'] }),
  });
}

export function useStores() {
  return useQuery({ queryKey: ['stores'], queryFn: storesApi.getStores });
}

export function useStore(id: number) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => storesApi.getStore(id),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.createStore,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: number; [key: string]: unknown }) =>
      storesApi.updateStore(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.deleteStore,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useStorePlanogram(storeId: number) {
  return useQuery({
    queryKey: ['planogram', storeId],
    queryFn: () => storesApi.getStorePlanogram(storeId),
    enabled: !!storeId,
  });
}

export function useAddToPlanogram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.addToPlanogram,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['planogram', vars.store_id] }),
  });
}

export function useRemoveFromPlanogram(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.removeFromPlanogram,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planogram', storeId] }),
  });
}

export function useBulkAddToPlanogram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, productIds }: { storeId: number; productIds: number[] }) =>
      storesApi.bulkAddToPlanogram(storeId, productIds),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['planogram', vars.storeId] }),
  });
}
