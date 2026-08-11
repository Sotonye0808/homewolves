import { Request } from 'express';

export interface JwtUser {
  sub: string;
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}

export function toActor(req: AuthenticatedRequest): ActorRef {
  return { id: req.user.sub, role: req.user.role, name: req.user.email };
}
