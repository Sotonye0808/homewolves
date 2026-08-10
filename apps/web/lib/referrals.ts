const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/referrals`;

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

export async function fetchMyReferral() {
  const r = await fetch(`${API}/me`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchMyCommissions() {
  const r = await fetch(`${API}/commissions`, { headers: authHeaders() });
  return handleRes(r);
}

export async function resolveReferralCode(code: string) {
  const r = await fetch(`${API}/resolve?code=${encodeURIComponent(code)}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function applyReferralCode(code: string) {
  const r = await fetch(`${API}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code }),
  });
  return handleRes(r);
}

export async function fetchReferralStats() {
  const r = await fetch(`${API}/stats`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchAllReferrals(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const r = await fetch(`${API}/all${qs}`, { headers: authHeaders() });
  return handleRes(r);
}
