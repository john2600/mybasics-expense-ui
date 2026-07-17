import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useBalance(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['balance', params],
    queryFn: () => api.getBalance(params),
  });
}

export function useBalancePeriods() {
  return useQuery({
    queryKey: ['balance-periods'],
    queryFn: api.getBalancePeriods,
    staleTime: 30_000,
  });
}

export function useIncomeConfig() {
  return useQuery({
    queryKey: ['income-config'],
    queryFn: api.getIncomeConfig,
    staleTime: 60 * 1000,
  });
}
