import { SetMetadata } from '@nestjs/common';

export interface ThrottleOptions {
  limit: number;
  ttlMs: number;
}

export const THROTTLE_KEY = 'throttle';

export const Throttle = (options: ThrottleOptions) => SetMetadata(THROTTLE_KEY, options);

export const DEFAULT_THROTTLE: ThrottleOptions = { limit: 120, ttlMs: 60_000 };
export const AUTH_THROTTLE: ThrottleOptions = { limit: 10, ttlMs: 60_000 };
