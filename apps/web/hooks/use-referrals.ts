'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyReferral,
  fetchMyCommissions,
  applyReferralCode,
  resolveReferralCode,
} from '@/lib/referrals';

export function useMyReferral() {
  return useQuery({
    queryKey: ['my-referral'],
    queryFn: fetchMyReferral,
  });
}

export function useMyCommissions() {
  return useQuery({
    queryKey: ['my-commissions'],
    queryFn: fetchMyCommissions,
  });
}

export function useResolveReferralCode(code: string, enabled = false) {
  return useQuery({
    queryKey: ['resolve-referral', code],
    queryFn: () => resolveReferralCode(code),
    enabled: enabled && !!code,
  });
}

export function useApplyReferralCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => applyReferralCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-referral'] });
    },
  });
}
