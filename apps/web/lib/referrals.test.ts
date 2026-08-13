import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMyReferral,
  fetchMyCommissions,
  resolveReferralCode,
  applyReferralCode,
  fetchReferralStats,
  fetchAllReferrals,
} from './referrals';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/referrals`;

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
  localStorage.setItem('hw-auth', JSON.stringify({ state: { accessToken: 'test-token' } }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('referrals lib', () => {
  it('fetchMyReferral hits the me endpoint', async () => {
    await fetchMyReferral();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/me`,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('fetchMyCommissions hits the commissions endpoint', async () => {
    await fetchMyCommissions();
    expect(fetch).toHaveBeenCalledWith(`${API}/commissions`, expect.any(Object));
  });

  it('resolveReferralCode encodes the code in the query', async () => {
    await resolveReferralCode('AB-12');
    expect(fetch).toHaveBeenCalledWith(`${API}/resolve?code=AB-12`, expect.any(Object));
  });

  it('applyReferralCode POSTs the code', async () => {
    await applyReferralCode('AB-12');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/apply`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'AB-12' }),
      }),
    );
  });

  it('fetchReferralStats hits the stats endpoint', async () => {
    await fetchReferralStats();
    expect(fetch).toHaveBeenCalledWith(`${API}/stats`, expect.any(Object));
  });

  it('fetchAllReferrals builds query string from params', async () => {
    await fetchAllReferrals({ page: '2' });
    expect(fetch).toHaveBeenCalledWith(`${API}/all?page=2`, expect.any(Object));
  });

  it('returns parsed json on success', async () => {
    const body = { code: 'AB-12' };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchMyReferral()).resolves.toEqual(body);
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(401, 'Unauthorized'));
    await expect(fetchMyReferral()).rejects.toThrow('Unauthorized');
  });
});