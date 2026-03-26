import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as brandsApi from '../api/brands';
import type { BrandCategory } from '../types';

export function useBrands() {
  return useQuery({ queryKey: ['brands'], queryFn: brandsApi.getBrands });
}

export function useBrand(id: number) {
  return useQuery({ queryKey: ['brands', id], queryFn: () => brandsApi.getBrand(id) });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brand: { name: string; category: BrandCategory; logo_url?: string }) =>
      brandsApi.createBrand(brand),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: number; name?: string; category?: BrandCategory }) =>
      brandsApi.updateBrand(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: brandsApi.deleteBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
}
