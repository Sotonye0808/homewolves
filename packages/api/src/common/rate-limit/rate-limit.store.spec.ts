import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRateLimitStore } from './memory-rate-limit.store';

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  it('allows requests up to the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await store.hit('ip-1', 5, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.count).toBe(i + 1);
    }
  });

  it('blocks requests beyond the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await store.hit('ip-1', 5, 60_000);
    }
    const r = await store.hit('ip-1', 5, 60_000);
    expect(r.allowed).toBe(false);
  });

  it('is isolated per key', async () => {
    await store.hit('ip-1', 1, 60_000);
    const other = await store.hit('ip-2', 1, 60_000);
    expect(other.allowed).toBe(true);
  });

  it('expires hits outside the sliding window', async () => {
    vi.useFakeTimers();
    try {
      await store.hit('ip-1', 5, 60_000);
      vi.setSystemTime(Date.now() + 61_000);
      const r = await store.hit('ip-1', 5, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.count).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up idle buckets', async () => {
    vi.useFakeTimers();
    try {
      await store.hit('ip-1', 5, 60_000);
      vi.setSystemTime(Date.now() + 6 * 60_000);
      const r = await store.hit('ip-2', 5, 60_000);
      expect(r.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});