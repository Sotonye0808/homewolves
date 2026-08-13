import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPlans,
  fetchPlan,
  fetchMySubscription,
  initiateCheckout,
  cancelSubscription,
  checkFeatureAccess,
} from './subscriptions';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/subscriptions`;

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

describe('subscriptions lib', () => {
  it('fetchPlans hits the plans endpoint', async () => {
    await fetchPlans();
    expect(fetch).toHaveBeenCalledWith(`${API}/plans`);
  });

  it('fetchPlan hits the plan slug endpoint', async () => {
    await fetchPlan('pro');
    expect(fetch).toHaveBeenCalledWith(`${API}/plans/pro`);
  });

  it('fetchMySubscription sends auth header', async () => {
    await fetchMySubscription();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/my`,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('initiateCheckout POSTs planId', async () => {
    await initiateCheckout('plan-1');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/checkout`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ planId: 'plan-1' }),
      }),
    );
  });

  it('cancelSubscription POSTs without body', async () => {
    await cancelSubscription();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/cancel`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('checkFeatureAccess POSTs feature name', async () => {
    await checkFeatureAccess('crm');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/check-feature`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ feature: 'crm' }),
      }),
    );
  });

  it('returns parsed json on success', async () => {
    const body = { id: 'sub-1' };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchMySubscription()).resolves.toEqual(body);
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(404, 'No plan'));
    await expect(fetchPlans()).rejects.toThrow('No plan');
  });
});