const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('hw-session');
  if (!id) {
    id = crypto.randomUUID?.() ?? Date.now().toString(36);
    sessionStorage.setItem('hw-session', id);
  }
  return id;
}

export async function recordView(listingId: string, userId?: string) {
  await fetch(`${API_BASE}/recently-viewed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listingId,
      userId,
      sessionId: userId ? undefined : getSessionId(),
    }),
  });
}

export async function getRecentViews(userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  else params.set('sessionId', getSessionId());

  const res = await fetch(`${API_BASE}/recently-viewed?${params}`);
  if (!res.ok) return [];
  return res.json();
}

export async function toggleSave(listingId: string, token: string) {
  const res = await fetch(`${API_BASE}/saved/${listingId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to toggle save');
  return res.json();
}

export async function getSavedListings(token: string) {
  const res = await fetch(`${API_BASE}/saved`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function checkSaved(listingId: string, token: string) {
  const res = await fetch(`${API_BASE}/saved/${listingId}/check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { saved: false };
  return res.json();
}
