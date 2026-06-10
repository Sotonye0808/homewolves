interface ActivityRule {
    id: string;
    key: string;
    label: string;
    points: number;
    category: string;
    cooldownMs?: number;
    active: boolean;
}
interface AgentActivityEntry {
    id: string;
    agentId: string;
    ruleId: string;
    points: number;
    ruleLabel: string;
    category: string;
    createdAt: Date;
}
interface AgentPointsData {
    totalPoints: number;
    tier: string;
    recentActivity: AgentActivityEntry[];
    categoryBreakdown: {
        category: string;
        label: string;
        points: number;
        count: number;
    }[];
}
interface LeaderboardEntry {
    rank: number;
    agentId: string;
    agentName: string;
    avatar?: string;
    totalPoints: number;
    tier: string;
}
interface TierInfo {
    tier: string;
    minPoints: number;
}
//# sourceMappingURL=activity.types.d.ts.map