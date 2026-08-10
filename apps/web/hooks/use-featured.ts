'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFeaturedListings,
  fetchMyFeaturedPlacements,
  fetchFeaturedProviderStatus,
  purchaseFeaturedPlacement,
} from '@/lib/featured';

export function useFeaturedListings(take = 6) {
  return useQuery({
    queryKey: ['featured-listings', take],
    queryFn: () => fetchFeaturedListings(take),
  });
}

export function useMyFeaturedPlacements() {
  return useQuery({
    queryKey: ['my-featured-placements'],
    queryFn: fetchMyFeaturedPlacements,
  });
}

export function useFeaturedProviderStatus() {
  return useQuery({
    queryKey: ['featured-provider-status'],
    queryFn: fetchFeaturedProviderStatus,
  });
}

export function usePurchaseFeaturedPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, days }: { listingId: string; days: number }) =>
      purchaseFeaturedPlacement(listingId, days),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-featured-placements'] });
      qc.invalidateQueries({ queryKey: ['featured-listings'] });
    },
  });
}
