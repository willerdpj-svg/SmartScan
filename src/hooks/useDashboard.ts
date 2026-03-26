import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getDashboardStats,
  });
}

export function useRecentAudits(limit = 10) {
  return useQuery({
    queryKey: ['recent-audits', limit],
    queryFn: () => dashboardApi.getRecentAudits(limit),
  });
}

export function useComplianceByStore() {
  return useQuery({
    queryKey: ['compliance-by-store'],
    queryFn: dashboardApi.getComplianceByStore,
  });
}

export function useComplianceByBrand() {
  return useQuery({
    queryKey: ['compliance-by-brand'],
    queryFn: dashboardApi.getComplianceByBrand,
  });
}
