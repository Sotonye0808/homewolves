import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const notificationFindMany = vi.fn();
  const notificationCount = vi.fn();
  const notificationUpdateMany = vi.fn();
  const notificationCreate = vi.fn();
  const userFindUnique = vi.fn();
  const userUpdate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      notification: {
        findMany: notificationFindMany,
        count: notificationCount,
        updateMany: notificationUpdateMany,
        create: notificationCreate,
      },
      user: { findUnique: userFindUnique, update: userUpdate },
    } as unknown as PrismaService;
    service = new NotificationsService(prisma);
  });

  describe('findByUser', () => {
    it('returns notifications and total with pagination', async () => {
      notificationFindMany.mockResolvedValue([{ id: 'n-1' }]);
      notificationCount.mockResolvedValue(1);

      const result = await service.findByUser('user-1', 50, 0);

      expect(notificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, take: 50, skip: 0 }),
      );
      expect(result).toEqual({ notifications: [{ id: 'n-1' }], total: 1 });
    });
  });

  describe('markAsRead', () => {
    it('marks only the given ids for the user as read', async () => {
      await service.markAsRead('user-1', ['n-1', 'n-2']);
      expect(notificationUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['n-1', 'n-2'] }, userId: 'user-1' },
        data: { read: true },
      });
    });
  });

  describe('createAndDispatch', () => {
    it('creates a notification and invokes the socket emitter', async () => {
      const emit = vi.fn();
      notificationCreate.mockResolvedValue({ id: 'n-1', userId: 'user-1' });

      const result = await service.createAndDispatch(
        { userId: 'user-1', type: 'NEW_MESSAGE', title: 'Hi', body: 'New message' },
        emit,
      );

      expect(notificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', type: 'NEW_MESSAGE', channel: 'in_app' }),
        }),
      );
      expect(emit).toHaveBeenCalledWith('user-1', expect.objectContaining({ id: 'n-1' }));
      expect(result.id).toBe('n-1');
    });

    it('does not emit when no emitter is supplied', async () => {
      notificationCreate.mockResolvedValue({ id: 'n-1' });
      const result = await service.createAndDispatch({ userId: 'u', type: 'T', title: 't', body: 'b' });
      expect(result.id).toBe('n-1');
    });
  });

  describe('getPreferences / updatePreferences', () => {
    it('returns {} when the user has no preferences', async () => {
      userFindUnique.mockResolvedValue({ id: 'user-1', preferences: null });
      const result = await service.getPreferences('user-1');
      expect(result).toEqual({});
    });

    it('returns the notification preferences object', async () => {
      userFindUnique.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { email: true, sms: false } },
      });
      const result = await service.getPreferences('user-1');
      expect(result).toEqual({ email: true, sms: false });
    });

    it('persists the updated notification preference set', async () => {
      userFindUnique.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { email: true } },
      });
      await service.updatePreferences('user-1', { email: false, sms: true });
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { preferences: { notifications: { email: false, sms: true } } },
        }),
      );
    });
  });
});
