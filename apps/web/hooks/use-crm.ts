'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  addNote,
  fetchNotes,
  addRating,
  fetchRatings,
  createInspection,
  fetchInspections,
  updateInspection,
  fetchDashboardStats,
  fetchRecentClients,
} from '@/lib/crm';

// ─── CLIENTS ─────────────────────────────────────────────

export function useClients(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['crm', 'clients', params],
    queryFn: () => fetchClients(params),
    staleTime: 30_000,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['crm', 'client', id],
    queryFn: () => fetchClientById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ buyerId, status }: { buyerId: string; status?: string }) => createClient(buyerId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'clients'] }),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status?: string }) => updateClient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'clients'] });
      qc.invalidateQueries({ queryKey: ['crm', 'client', id] });
    },
  });
}

// ─── NOTES ───────────────────────────────────────────────

export function useClientNotes(clientId: string) {
  return useQuery({
    queryKey: ['crm', 'notes', clientId],
    queryFn: () => fetchNotes(clientId),
    enabled: !!clientId,
  });
}

export function useAddNote(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addNote(clientId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'notes', clientId] }),
  });
}

// ─── RATINGS ─────────────────────────────────────────────

export function useClientRatings(clientId: string) {
  return useQuery({
    queryKey: ['crm', 'ratings', clientId],
    queryFn: () => fetchRatings(clientId),
    enabled: !!clientId,
  });
}

export function useAddRating(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ score, review }: { score: number; review?: string }) => addRating(clientId, score, review),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'ratings', clientId] }),
  });
}

// ─── INSPECTIONS ─────────────────────────────────────────

export function useInspections(date?: string) {
  return useQuery({
    queryKey: ['crm', 'inspections', date],
    queryFn: () => fetchInspections(date),
    staleTime: 30_000,
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: string; listingId: string; scheduledAt: string; notes?: string }) => createInspection(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'inspections'] }),
  });
}

export function useUpdateInspection(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status?: string; scheduledAt?: string; notes?: string }) => updateInspection(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'inspections'] });
    },
  });
}

// ─── DASHBOARD ───────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['crm', 'dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}

export function useRecentClients() {
  return useQuery({
    queryKey: ['crm', 'dashboard', 'recent-clients'],
    queryFn: fetchRecentClients,
    staleTime: 30_000,
  });
}
