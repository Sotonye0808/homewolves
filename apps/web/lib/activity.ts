const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/activity`;

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('hw-auth');
  if (!raw) return {};
  try {
    const { state } = JSON.parse(raw);
    if (!state.accessToken) return {};
    return { Authorization: `Bearer ${state.accessToken}` };
  } catch {
    return {};
  }
}

async function handleRes(r: Response) {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${r.status}`);
  }
  return r.json();
}

export async function fetchLeaderboard(limit = 20) {
  const r = await fetch(`${API}/leaderboard?limit=${limit}`);
  return handleRes(r);
}

export async function fetchMyStats() {
  const r = await fetch(`${API}/stats`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchAgentStats(agentId: string) {
  const r = await fetch(`${API}/stats/${agentId}`);
  return handleRes(r);
}

export async function fetchTiers() {
  const r = await fetch(`${API}/tiers`);
  return handleRes(r);
}

export async function awardPoints(ruleKey: string) {
  const r = await fetch(`${API}/award/${ruleKey}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(r);
}
