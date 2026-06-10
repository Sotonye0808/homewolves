import { useAuth } from '@/hooks/use-auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function authHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = token ?? useAuth.getState().accessToken;
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  category: 'SALE' | 'RENT' | 'SHORTLET' | 'LAND';
  propertyType: string;
  currency?: string;
  locationJson: Record<string, unknown>;
  amenityIds?: string[];
}

export async function createListing(data: CreateListingPayload) {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to create listing');
  }
  return res.json();
}

export async function updateListing(id: string, data: Partial<CreateListingPayload> & { status?: string }) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to update listing');
  }
  return res.json();
}

export async function deleteListing(id: string) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to delete listing');
  }
}

export async function fetchListings(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/listings${qs}`);
  if (!res.ok) {
    throw new Error('Failed to fetch listings');
  }
  return res.json();
}

export async function fetchFeaturedListings() {
  const res = await fetch(`${API_BASE}/listings/featured`);
  if (!res.ok) {
    throw new Error('Failed to fetch featured listings');
  }
  return res.json();
}

export async function fetchListingById(id: string) {
  const res = await fetch(`${API_BASE}/listings/${id}`);
  if (!res.ok) {
    throw new Error('Listing not found');
  }
  return res.json();
}

export async function incrementView(id: string) {
  await fetch(`${API_BASE}/listings/${id}/view`, { method: 'POST' });
}
