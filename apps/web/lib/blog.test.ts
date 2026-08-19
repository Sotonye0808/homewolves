import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchBlogPosts,
  fetchBlogPost,
  fetchBlogCategories,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from './blog';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/blog`;

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

describe('blog lib', () => {
  it('fetchBlogPosts builds query string from params', async () => {
    await fetchBlogPosts({ category: 'market', featured: true, limit: 10 });
    expect(fetch).toHaveBeenCalledWith(`${API}?category=market&featured=true&limit=10`);
  });

  it('fetchBlogPosts omits query string when no params', async () => {
    await fetchBlogPosts();
    expect(fetch).toHaveBeenCalledWith(API);
  });

  it('fetchBlogPost hits the slug endpoint', async () => {
    await fetchBlogPost('buying-in-lagos');
    expect(fetch).toHaveBeenCalledWith(`${API}/buying-in-lagos`);
  });

  it('fetchBlogCategories hits the categories endpoint', async () => {
    await fetchBlogCategories();
    expect(fetch).toHaveBeenCalledWith(`${API}/categories`);
  });

  it('createBlogPost POSTs payload with auth header', async () => {
    const post = { title: 'T', slug: 't', excerpt: 'E', content: 'C', published: true };
    await createBlogPost(post);
    expect(fetch).toHaveBeenCalledWith(
      API,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        body: JSON.stringify(post),
      }),
    );
  });

  it('updateBlogPost PUTs to the id endpoint', async () => {
    await updateBlogPost('p-1', { title: 'New' });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/p-1`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'New' }) }),
    );
  });

  it('deleteBlogPost sends a DELETE request', async () => {
    await deleteBlogPost('p-1');
    expect(fetch).toHaveBeenCalledWith(`${API}/p-1`, expect.objectContaining({ method: 'DELETE' }));
  });

  it('throws Error with server message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Boom'));
    await expect(fetchBlogPosts()).rejects.toThrow('Boom');
  });
});