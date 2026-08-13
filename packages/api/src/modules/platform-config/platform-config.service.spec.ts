import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformConfigService } from './platform-config.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlatformConfigService', () => {
  let service: PlatformConfigService;
  let prisma: PrismaService;

  const findMany = vi.fn();
  const findUnique = vi.fn();
  const upsert = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      platformConfig: { findMany, findUnique, upsert },
    } as unknown as PrismaService;
    service = new PlatformConfigService(prisma);
  });

  describe('get', () => {
    it('returns null when config is missing and DB is empty', async () => {
      findUnique.mockResolvedValue(null);
      const result = await service.get<string>('missing_key');
      expect(result).toBeNull();
    });

    it('returns a value fetched from the DB', async () => {
      findUnique.mockResolvedValue({ key: 'referral_rate', value: 0.05 });
      const result = await service.get<number>('referral_rate');
      expect(result).toBe(0.05);
    });

    it('serves from cache on subsequent calls without hitting the DB', async () => {
      findUnique.mockResolvedValue({ key: 'x', value: 42 });
      await service.get<number>('x');
      await service.get<number>('x');
      expect(findUnique).toHaveBeenCalledTimes(1);
    });

    it('returns null when the DB call throws', async () => {
      findUnique.mockRejectedValue(new Error('db down'));
      const result = await service.get<number>('x');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('reduces config rows into a record', async () => {
      findMany.mockResolvedValue([
        { key: 'a', value: 1 },
        { key: 'b', value: 'two' },
      ]);
      const result = await service.getAll();
      expect(result).toEqual({ a: 1, b: 'two' });
    });

    it('returns {} when the DB is unreachable', async () => {
      findMany.mockRejectedValue(new Error('db down'));
      const result = await service.getAll();
      expect(result).toEqual({});
    });
  });

  describe('set', () => {
    it('upserts the config and refreshes the cache', async () => {
      upsert.mockResolvedValue({ key: 'x', value: 1, updatedById: 'admin-1' });
      await service.set('x', 1, 'admin-1');

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'x' },
          update: { value: 1, updatedById: 'admin-1' },
          create: { key: 'x', value: 1, updatedById: 'admin-1' },
        }),
      );

      findUnique.mockResolvedValue(null);
      const cached = await service.get<number>('x');
      expect(cached).toBe(1);
    });
  });

  describe('invalidate', () => {
    it('drops the cache entry so the next get hits the DB', async () => {
      findUnique.mockResolvedValue({ key: 'x', value: 1 });
      await service.get<number>('x');
      service.invalidate('x');
      await service.get<number>('x');
      expect(findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
