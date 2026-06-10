import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto, VerifyOtpDto, LoginDto, CompleteProfileDto } from './dto/register.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();
  private refreshStore = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const otp = this.generateOtp();
    this.otpStore.set(dto.email, { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    // Stub: in production, send OTP via Resend (email) + Termii (SMS)
    console.log(`[OTP] ${otp} for ${dto.email}`);

    return { message: 'OTP sent', otp };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = this.otpStore.get(dto.email);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('OTP expired or not found');
    }
    if (stored.code !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    this.otpStore.delete(dto.email);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('User not found. Please register first.');

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'OTP_VERIFIED',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('No account found with this email');

    const otp = this.generateOtp();
    this.otpStore.set(dto.email, { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`[OTP] ${otp} for ${dto.email}`);

    return { message: 'OTP sent', otp };
  }

  async completeProfile(dto: CompleteProfileDto) {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: (dto.role as any) ?? 'BUYER',
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: (dto.role as any) ?? 'BUYER',
          referralCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
        },
      });
    }

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'PROFILE_COMPLETED',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    const stored = this.refreshStore.get(refreshToken);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    this.refreshStore.delete(refreshToken);
    return this.generateTokens(user);
  }

  async logout(userId: string) {
    for (const [token, data] of this.refreshStore.entries()) {
      if (data.userId === userId) this.refreshStore.delete(token);
    }
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(32).toString('hex');

    this.refreshStore.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar,
      },
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
