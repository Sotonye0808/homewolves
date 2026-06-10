const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/documents`;

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

export async function uploadDocument(data: {
  transactionId: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  visibility?: string;
}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function fetchTransactionDocuments(transactionId: string) {
  const r = await fetch(`${API}/transaction/${transactionId}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchDocument(id: string) {
  const r = await fetch(`${API}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function deleteDocument(id: string) {
  const r = await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleRes(r);
}

export async function updateDocumentVisibility(id: string, visibility: string) {
  const r = await fetch(`${API}/${id}/visibility`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ visibility }),
  });
  return handleRes(r);
}

export async function getDocumentUploadUrl(filename: string, contentType: string) {
  const r = await fetch(`${API}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filename, contentType }),
  });
  return handleRes(r);
}
