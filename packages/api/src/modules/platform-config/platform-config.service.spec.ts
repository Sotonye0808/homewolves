import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformConfigService } from './platform-config.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { platformConfig } from '../../drizzle/schema';

describe('PlatformConfigService', () => {
  let service: PlatformConfigService;
  let mocks: ReturnType<typeof createDrizzleMock>;

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    service = new PlatformConfigService(mocks.db);
  });

  describe('get', () => {
    it('returns null when config is missing and DB is empty', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.get<string>('missing_key');
      expect(result).toBeNull();
    });

    it('returns a value fetched from the DB', async () => {
      mocks.select.mockReturnValue(createChain([{ key: 'referral_rate', value: 0.05 }]));
      const result = await service.get<number>('referral_rate');
      expect(result).toBe(0.05);
    });

    it('serves from cache on subsequent calls without hitting the DB', async () => {
      mocks.select.mockReturnValue(createChain([{ key: 'x', value: 42 }]));
      await service.get<number>('x');
      await service.get<number>('x');
      expect(mocks.select).toHaveBeenCalledTimes(1);
    });

    it('returns null when the DB call throws', async () => {
      mocks.select.mockReturnValue(createChain(Promise.reject(new Error('db down'))));
      const result = await service.get<number>('x');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('reduces config rows into a record', async () => {
      mocks.select.mockReturnValue(
        createChain([
          { key: 'a', value: 1 },
          { key: 'b', value: 'two' },
        ]),
      );
      const result = await service.getAll();
      expect(result).toEqual({ a: 1, b: 'two' });
    });

    it('returns {} when the DB is unreachable', async () => {
      mocks.select.mockReturnValue(createChain(Promise.reject(new Error('db down'))));
      const result = await service.getAll();
      expect(result).toEqual({});
    });
  });

  describe('set', () => {
    it('upserts the config and refreshes the cache', async () => {
      mocks.insert.mockReturnValue(createChain([]));
      await service.set('x', 1, 'admin-1');

      expect(mocks.insert).toHaveBeenCalledWith(platformConfig);

      mocks.select.mockReturnValue(createChain([]));
      const cached = await service.get<number>('x');
      expect(cached).toBe(1);
    });
  });

  describe('invalidate', () => {
    it('drops the cache entry so the next get hits the DB', async () => {
      mocks.select.mockReturnValue(createChain([{ key: 'x', value: 1 }]));
      await service.get<number>('x');
      service.invalidate('x');
      await service.get<number>('x');
      expect(mocks.select).toHaveBeenCalledTimes(2);
    });
  });
});