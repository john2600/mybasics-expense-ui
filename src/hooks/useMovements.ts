import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CreateMovementPayload, UpdateMovementPayload } from '../types';

export function useMovements(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['movements', params],
    queryFn: () => api.getMovements(params),
  });
}

export function useExpenses(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => api.getExpenses(params),
  });
}

export function useMovementsSummary() {
  return useQuery({
    queryKey: ['movements-summary'],
    queryFn: api.getMovementsSummary,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) => api.createMovement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function useUpdateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMovementPayload }) =>
      api.updateMovement(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMovement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
