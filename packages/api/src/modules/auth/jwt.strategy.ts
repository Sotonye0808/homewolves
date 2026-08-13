import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { users } from '../../drizzle/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private db: DrizzleService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'homewolves-dev-secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub));
    if (!user) throw new UnauthorizedException('User not found');
    return { sub: user.id, id: user.id, email: user.email, role: user.role };
  }
}
