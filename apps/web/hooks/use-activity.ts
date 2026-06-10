'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeaderboard, fetchMyStats, fetchAgentStats, fetchTiers, awardPoints } from '@/lib/activity';

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ['my-activity-stats'],
    queryFn: fetchMyStats,
  });
}

export function useAgentStats(agentId: string) {
  return useQuery({
    queryKey: ['agent-stats', agentId],
    queryFn: () => fetchAgentStats(agentId),
    enabled: !!agentId,
  });
}

export function useTiers() {
  return useQuery({
    queryKey: ['tiers'],
    queryFn: fetchTiers,
  });
}

export function useAwardPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleKey: string) => awardPoints(ruleKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-activity-stats'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
