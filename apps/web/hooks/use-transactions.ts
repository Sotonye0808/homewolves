'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchMyTransactions,
  fetchTransaction,
  createTransaction,
  advanceTransaction,
  rejectTransaction,
  cancelTransaction,
  addPayment,
} from '@/lib/transactions';

export function useAgentTransactions(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-transactions', params],
    queryFn: () => fetchTransactions(params),
  });
}

export function useMyTransactions() {
  return useQuery({
    queryKey: ['my-transactions'],
    queryFn: fetchMyTransactions,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-transactions'] });
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
    },
  });
}

export function useAdvanceTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => advanceTransaction(id, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transaction', vars.id] });
      qc.invalidateQueries({ queryKey: ['agent-transactions'] });
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
    },
  });
}

export function useRejectTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectTransaction(id, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transaction', vars.id] });
      qc.invalidateQueries({ queryKey: ['agent-transactions'] });
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
    },
  });
}

export function useCancelTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-transactions'] });
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-transactions'] });
    },
  });
}
