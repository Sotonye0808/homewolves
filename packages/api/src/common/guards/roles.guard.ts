import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub?: string; role?: string } | undefined;
    if (!user?.role) {
      throw new ForbiddenException('Role required');
    }

    const allowed = requiredRoles.some((role) => role === user.role);
    if (!allowed) {
      throw new ForbiddenException(`Requires role: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
