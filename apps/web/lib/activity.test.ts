import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchLeaderboard,
  fetchMyStats,
  fetchAgentStats,
  fetchTiers,
  awardPoints,
} from './activity';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/activity`;

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

describe('activity lib', () => {
  it('fetchLeaderboard sends the limit query param', async () => {
    await fetchLeaderboard(10);
    expect(fetch).toHaveBeenCalledWith(`${API}/leaderboard?limit=10`);
  });

  it('fetchLeaderboard defaults limit to 20', async () => {
    await fetchLeaderboard();
    expect(fetch).toHaveBeenCalledWith(`${API}/leaderboard?limit=20`);
  });

  it('fetchMyStats sends auth header', async () => {
    await fetchMyStats();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/stats`,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('fetchAgentStats hits the agent stats endpoint', async () => {
    await fetchAgentStats('agent-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/stats/agent-1`);
  });

  it('fetchTiers hits the tiers endpoint', async () => {
    await fetchTiers();
    expect(fetch).toHaveBeenCalledWith(`${API}/tiers`);
  });

  it('awardPoints POSTs to the rule key endpoint', async () => {
    await awardPoints('listing_created');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/award/listing_created`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns parsed json on success', async () => {
    const body = { points: 10 };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchMyStats()).resolves.toEqual(body);
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Broken'));
    await expect(fetchLeaderboard()).rejects.toThrow('Broken');
  });
});