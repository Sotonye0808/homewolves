const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/signatures`;

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

export async function createSignatureRequest(data: {
  transactionId: string;
  documentId?: string;
  signerId: string;
  signerEmail: string;
  signerName: string;
}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function fetchTransactionSignatures(transactionId: string) {
  const r = await fetch(`${API}/transaction/${transactionId}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchSignature(id: string) {
  const r = await fetch(`${API}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function getSignatureEmbedUrl(id: string) {
  const r = await fetch(`${API}/${id}/embed`, { headers: authHeaders() });
  return handleRes(r);
}
