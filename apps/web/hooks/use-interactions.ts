'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecentViews, toggleSave, checkSaved, getSavedListings } from '@/lib/interactions';
import { useAuth } from './use-auth';

export function useRecentViews() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['recently-viewed', userId],
    queryFn: () => getRecentViews(userId),
    staleTime: 30_000,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: (listingId: string) => toggleSave(listingId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

export function useSavedListings() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['saved', 'listings'],
    queryFn: () => getSavedListings(accessToken!),
    enabled: !!accessToken,
  });
}

export function useCheckSaved(listingId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['saved', 'check', listingId],
    queryFn: () => checkSaved(listingId, accessToken!),
    enabled: !!accessToken && !!listingId,
  });
}
