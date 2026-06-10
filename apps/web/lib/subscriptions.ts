const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/subscriptions`;

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

export async function fetchPlans() {
  const r = await fetch(`${API}/plans`);
  return handleRes(r);
}

export async function fetchPlan(slug: string) {
  const r = await fetch(`${API}/plans/${slug}`);
  return handleRes(r);
}

export async function fetchMySubscription() {
  const r = await fetch(`${API}/my`, { headers: authHeaders() });
  return handleRes(r);
}

export async function initiateCheckout(planId: string) {
  const r = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ planId }),
  });
  return handleRes(r);
}

export async function cancelSubscription() {
  const r = await fetch(`${API}/cancel`, { method: 'POST', headers: authHeaders() });
  return handleRes(r);
}

export async function checkFeatureAccess(feature: string) {
  const r = await fetch(`${API}/check-feature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ feature }),
  });
  return handleRes(r);
}
