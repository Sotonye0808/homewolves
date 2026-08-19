export const RATE_LIMIT_STORE = Symbol('RATE_LIMIT_STORE');

export interface RateLimitStore {
  /**
   * Records a hit for the key and returns whether the request is allowed
   * within a sliding window of `ttlMs` at `limit` hits.
   */
  hit(key: string, limit: number, ttlMs: number): Promise<{ allowed: boolean; count: number }>;
  /** Releases any underlying connections (no-op for in-memory). */
  dispose?(): Promise<void> | void;
}