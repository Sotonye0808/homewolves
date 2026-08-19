const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/analytics`;

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

export async function trackEvent(payload: {
  event: string;
  sessionId?: string;
  listingId?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}) {
  const r = await fetch(`${API}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleRes(r);
}

export async function fetchListingAnalytics(listingId: string, days?: number) {
  const qs = days ? `?days=${days}` : '';
  const r = await fetch(`${API}/listing/${listingId}${qs}`);
  return handleRes(r);
}

export async function fetchAgentAnalytics(agentId: string, days?: number) {
  const qs = days ? `?days=${days}` : '';
  const r = await fetch(`${API}/agent/${agentId}${qs}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchMyAnalytics(days?: number) {
  const qs = days ? `?days=${days}` : '';
  const r = await fetch(`${API}/me${qs}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchFunnel(days?: number) {
  const qs = days ? `?days=${days}` : '';
  const r = await fetch(`${API}/funnel${qs}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchTopListings(days?: number, limit = 10) {
  const qs = [];
  if (days) qs.push(`days=${days}`);
  if (limit) qs.push(`limit=${limit}`);
  const r = await fetch(`${API}/top-listings?${qs.join('&')}`, { headers: authHeaders() });
  return handleRes(r);
}
