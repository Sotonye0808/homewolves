import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createListing,
  updateListing,
  deleteListing,
  fetchListings,
  fetchFeaturedListings,
  fetchListingById,
  incrementView,
} from './listings';
import { useAuth } from '@/hooks/use-auth';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/listings`;

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

describe('listings lib', () => {
  const payload = {
    title: 'Modern Apartment',
    description: 'A bright 3-bed apartment',
    price: 250000,
    category: 'SALE' as const,
    propertyType: 'Apartment',
    locationJson: { city: 'Lagos' },
  };

  it('createListing POSTs payload with auth header', async () => {
    await createListing(payload);
    expect(fetch).toHaveBeenCalledWith(
      API,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it('updateListing PUTs partial payload to the listing endpoint', async () => {
    await updateListing('l-1', { price: 260000 });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/l-1`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ price: 260000 }),
      }),
    );
  });

  it('deleteListing sends a DELETE request', async () => {
    await deleteListing('l-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/l-1`, expect.objectContaining({ method: 'DELETE' }));
  });

  it('fetchListings builds query string from params', async () => {
    await fetchListings({ category: 'RENT', city: 'Lagos' });
    expect(fetch).toHaveBeenCalledWith(`${API}?category=RENT&city=Lagos`);
  });

  it('fetchListings omits query string when no params', async () => {
    await fetchListings();
    expect(fetch).toHaveBeenCalledWith(API);
  });

  it('fetchFeaturedListings hits the featured endpoint', async () => {
    await fetchFeaturedListings();
    expect(fetch).toHaveBeenCalledWith(`${API}/featured`);
  });

  it('fetchListingById hits the detail endpoint', async () => {
    await fetchListingById('l-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/l-1`);
  });

  it('incrementView POSTs to the view endpoint', async () => {
    await incrementView('l-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/l-1/view`, { method: 'POST' });
  });

  it('returns parsed json on success', async () => {
    const body = { id: 'l-1' };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchListingById('l-1')).resolves.toEqual(body);
  });

  it('fetchListingById throws Listing not found on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(404, 'Nope'));
    await expect(fetchListingById('l-1')).rejects.toThrow('Listing not found');
  });

  it('createListing throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Nope'));
    await expect(createListing(payload)).rejects.toThrow('Nope');
  });
});