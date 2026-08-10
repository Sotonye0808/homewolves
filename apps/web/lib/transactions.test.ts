import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchTransactions,
  fetchMyTransactions,
  createTransaction,
  advanceTransaction,
  rejectTransaction,
  cancelTransaction,
  addPayment,
} from './transactions';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/transactions`;

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
  localStorage.setItem(
    'hw-auth',
    JSON.stringify({ state: { accessToken: 'test-token' } }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('transactions lib', () => {
  it('fetchTransactions builds query string from params', async () => {
    await fetchTransactions({ status: 'ACTIVE', page: 2, limit: 10 });
    expect(fetch).toHaveBeenCalledWith(
      `${API}?status=ACTIVE&page=2&limit=10`,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('fetchTransactions omits query string when no params', async () => {
    await fetchTransactions();
    expect(fetch).toHaveBeenCalledWith(API, expect.any(Object));
  });

  it('createTransaction POSTs JSON body', async () => {
    await createTransaction({ listingId: 'l-1', buyerId: 'b-1', type: 'PURCHASE' });
    expect(fetch).toHaveBeenCalledWith(
      API,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ listingId: 'l-1', buyerId: 'b-1', type: 'PURCHASE' }),
      }),
    );
  });

  it('advanceTransaction PUTs notes', async () => {
    await advanceTransaction('t-1', 'funds received');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/t-1/advance`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ notes: 'funds received' }),
      }),
    );
  });

  it('rejectTransaction PUTs reason', async () => {
    await rejectTransaction('t-1', 'bad docs');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/t-1/reject`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ reason: 'bad docs' }),
      }),
    );
  });

  it('cancelTransaction PUTs without body', async () => {
    await cancelTransaction('t-1');
    expect(fetch).toHaveBeenCalledWith(
      `${API}/t-1/cancel`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('addPayment POSTs payment payload', async () => {
    await addPayment({ transactionId: 't-1', amount: 500, type: 'deposit' });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/payments`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ transactionId: 't-1', amount: 500, type: 'deposit' }),
      }),
    );
  });

  it('returns parsed json on success', async () => {
    const body = { id: 't-1', status: 'ACTIVE' };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchMyTransactions()).resolves.toEqual(body);
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Server exploded'));
    await expect(fetchMyTransactions()).rejects.toThrow('Server exploded');
  });
});
