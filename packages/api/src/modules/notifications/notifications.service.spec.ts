import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { notifications, users } from '../../drizzle/schema';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mocks: ReturnType<typeof createDrizzleMock>;

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    service = new NotificationsService(mocks.db);
  });

  describe('findByUser', () => {
    it('returns notifications and total with pagination', async () => {
      mocks.table('notifications').findMany.mockResolvedValue([{ id: 'n-1' }]);
      mocks.select.mockReturnValue(createChain([{ value: 1 }]));

      const result = await service.findByUser('user-1', 50, 0);

      expect(mocks.table('notifications').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      );
      expect(result).toEqual({ notifications: [{ id: 'n-1' }], total: 1 });
    });
  });

  describe('markAsRead', () => {
    it('marks only the given ids for the user as read', async () => {
      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      await service.markAsRead('user-1', ['n-1', 'n-2']);

      expect(mocks.update).toHaveBeenCalledWith(notifications);
      expect(setArgs[0]).toEqual({ read: true });
    });
  });

  describe('createAndDispatch', () => {
    it('creates a notification and invokes the socket emitter', async () => {
      const emit = vi.fn();
      const values: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([{ id: 'n-1', userId: 'user-1' }], (method, args) => {
          if (method === 'values') values.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.createAndDispatch(
        { userId: 'user-1', type: 'NEW_MESSAGE', title: 'Hi', body: 'New message' },
        emit,
      );

      expect(mocks.insert).toHaveBeenCalledWith(notifications);
      expect(values[0]).toMatchObject({ userId: 'user-1', type: 'NEW_MESSAGE', channel: 'in_app' });
      expect(emit).toHaveBeenCalledWith('user-1', expect.objectContaining({ id: 'n-1' }));
      expect(result.id).toBe('n-1');
    });

    it('does not emit when no emitter is supplied', async () => {
      mocks.insert.mockReturnValue(createChain([{ id: 'n-1' }]));
      const result = await service.createAndDispatch({ userId: 'u', type: 'T', title: 't', body: 'b' });
      expect(result.id).toBe('n-1');
    });
  });

  describe('getPreferences / updatePreferences', () => {
    it('returns {} when the user has no preferences', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'user-1', preferences: null }]));
      const result = await service.getPreferences('user-1');
      expect(result).toEqual({});
    });

    it('returns the notification preferences object', async () => {
      mocks.select.mockReturnValue(
        createChain([{ id: 'user-1', preferences: { notifications: { email: true, sms: false } } }]),
      );
      const result = await service.getPreferences('user-1');
      expect(result).toEqual({ email: true, sms: false });
    });

    it('persists the updated notification preference set', async () => {
      mocks.select.mockReturnValue(
        createChain([{ id: 'user-1', preferences: { notifications: { email: true } } }]),
      );
      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      await service.updatePreferences('user-1', { email: false, sms: true });

      expect(mocks.update).toHaveBeenCalledWith(users);
      expect(setArgs[0]).toEqual({ preferences: { notifications: { email: false, sms: true } } });
    });
  });
});
