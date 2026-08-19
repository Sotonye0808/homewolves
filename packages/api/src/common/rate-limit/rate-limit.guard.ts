import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_KEY, DEFAULT_THROTTLE, ThrottleOptions } from './throttle.decorator';
import { RATE_LIMIT_STORE, RateLimitStore } from './rate-limit-store';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(RATE_LIMIT_STORE) private store: RateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? DEFAULT_THROTTLE;

    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    const key = request.ip ?? 'unknown';

    const { allowed } = await this.store.hit(key, options.limit, options.ttlMs);

    if (!allowed) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}