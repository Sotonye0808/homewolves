import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  markAllNotificationsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from './notifications';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}`;

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number) {
  return vi.fn().mockResolvedValue({ ok: false, status, json: () => Promise.resolve({}) });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetchOk({}));
  localStorage.setItem('hw-auth', JSON.stringify({ state: { accessToken: 'test-token' } }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('notifications lib', () => {
  it('fetchNotifications sends limit and offset params', async () => {
    await fetchNotifications(20, 40);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/notifications?limit=20&offset=40`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    );
  });

  it('fetchUnreadCount hits the unread-count endpoint', async () => {
    await fetchUnreadCount();
    expect(fetch).toHaveBeenCalledWith(`${API}/notifications/unread-count`, expect.any(Object));
  });

  it('markNotificationsRead POSTs notification ids', async () => {
    await markNotificationsRead(['n-1', 'n-2']);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/notifications/mark-read`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ notificationIds: ['n-1', 'n-2'] }),
      }),
    );
  });

  it('markAllNotificationsRead POSTs to mark-all-read', async () => {
    await markAllNotificationsRead();
    expect(fetch).toHaveBeenCalledWith(
      `${API}/notifications/mark-all-read`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fetchNotificationPreferences hits the preferences endpoint', async () => {
    await fetchNotificationPreferences();
    expect(fetch).toHaveBeenCalledWith(`${API}/notifications/preferences`, expect.any(Object));
  });

  it('updateNotificationPreferences PUTs preferences', async () => {
    await updateNotificationPreferences({ email: true, sms: false });
    expect(fetch).toHaveBeenCalledWith(
      `${API}/notifications/preferences`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ preferences: { email: true, sms: false } }),
      }),
    );
  });

  it('returns parsed json on success', async () => {
    const body = { count: 3 };
    vi.stubGlobal('fetch', mockFetchOk(body));
    await expect(fetchUnreadCount()).resolves.toEqual(body);
  });

  it('throws Error with status code on failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(401));
    await expect(fetchUnreadCount()).rejects.toThrow('API error: 401');
  });
});