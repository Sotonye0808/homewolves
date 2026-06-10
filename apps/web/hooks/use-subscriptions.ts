'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlans,
  fetchPlan,
  fetchMySubscription,
  initiateCheckout,
  cancelSubscription,
  checkFeatureAccess,
} from '@/lib/subscriptions';

export function usePlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchPlans,
  });
}

export function usePlan(slug: string) {
  return useQuery({
    queryKey: ['subscription-plan', slug],
    queryFn: () => fetchPlan(slug),
    enabled: !!slug,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: fetchMySubscription,
  });
}

export function useInitiateCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initiateCheckout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
}

export function useCheckFeatureAccess(feature: string) {
  return useQuery({
    queryKey: ['feature-access', feature],
    queryFn: () => checkFeatureAccess(feature),
    enabled: !!feature,
  });
}
