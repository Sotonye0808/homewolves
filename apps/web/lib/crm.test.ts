import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchClients,
  createClient,
  addNote,
  fetchNotes,
  addRating,
  createInspection,
  fetchInspections,
  fetchDashboardStats,
} from './crm';
import { useAuth } from '@/hooks/use-auth';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/crm`;

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetchOk({}));
  useAuth.setState({ accessToken: 'test-token' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuth.setState({ accessToken: null });
});

describe('crm lib', () => {
  it('fetchClients filters out null params', async () => {
    await fetchClients({ status: 'ACTIVE', search: null as unknown as string });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/clients?status=ACTIVE`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    );
  });

  it('fetchClients omits query string when no params', async () => {
    await fetchClients();
    expect(fetch).toHaveBeenCalledWith(`${API}/clients`, expect.any(Object));
  });

  it('createClient POSTs buyerId and status', async () => {
    await createClient('b-1', 'ACTIVE');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/clients`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ buyerId: 'b-1', status: 'ACTIVE' }),
      }),
    );
  });

  it('addNote POSTs note content', async () => {
    await addNote('c-1', 'Called twice');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/clients/c-1/notes`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Called twice' }),
      }),
    );
  });

  it('fetchNotes hits the notes endpoint', async () => {
    await fetchNotes('c-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/clients/c-1/notes`, expect.any(Object));
  });

  it('addRating POSTs score and review', async () => {
    await addRating('c-1', 5, 'Great agent');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/clients/c-1/ratings`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ score: 5, review: 'Great agent' }),
      }),
    );
  });

  it('createInspection POSTs inspection data', async () => {
    const data = { clientId: 'c-1', listingId: 'l-1', scheduledAt: '2026-08-15T10:00:00Z' };
    await createInspection(data);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/inspections`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }),
    );
  });

  it('fetchInspections appends date query param', async () => {
    await fetchInspections('2026-08-15');
    expect(fetch).toHaveBeenCalledWith(`${API}/inspections?date=2026-08-15`, expect.any(Object));
  });

  it('fetchDashboardStats hits the dashboard endpoint', async () => {
    await fetchDashboardStats();
    expect(fetch).toHaveBeenCalledWith(`${API}/dashboard/stats`, expect.any(Object));
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(403, 'Forbidden'));
    await expect(fetchClients()).rejects.toThrow('Forbidden');
  });
});