import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';

const db = (prisma: PrismaService) => prisma;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface ReferralAttributionInput {
  referredUserId: string;
  transactionId: string;
  dealAmount: number;
  currency?: string;
  actor: ActorRef;
}

@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: PlatformConfigService,
  ) {}

  static generateCode(): string {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = ReferralsService.generateCode();
      const existing = await db(this.prisma).user.findUnique({ where: { referralCode: code } });
      if (!existing) return code;
    }
    throw new ConflictException('Could not allocate a unique referral code');
  }

  /** Allocates a globally unique referral code without requiring an existing user. */
  async generateUniqueCode(): Promise<string> {
    return this.uniqueCode();
  }

  /** Alias used during signup so the caller doesn't have to know about uniqueness. */
  async ensureCodeForNewUser(): Promise<string> {
    return this.uniqueCode();
  }

  /** Ensures the user has a referral code, generating one if missing. */
  async ensureCode(userId: string): Promise<string> {
    const user = await db(this.prisma).user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.referralCode) return user.referralCode;

    const code = await this.uniqueCode();
    await db(this.prisma).user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  async getMyReferral(userId: string) {
    const code = await this.ensureCode(userId);

    const [referrals, commissions] = await Promise.all([
      db(this.prisma).referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { referred: { select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true } } },
      }),
      db(this.prisma).commission.aggregate({
        where: { referrerId: userId, status: { in: ['payable', 'paid'] } },
        _sum: { amount: true },
      }),
    ]);

    const counts = referrals.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      code,
      shareUrl: `${process.env.WEB_URL ?? 'https://homewolves.africa'}/auth?ref=${code}`,
      stats: {
        total: referrals.length,
        pending: counts['pending'] ?? 0,
        active: counts['active'] ?? 0,
        converted: counts['converted'] ?? 0,
      },
      totalCommissionEarned: commissions._sum.amount ?? 0,
      referrals,
    };
  }

  async resolveCode(code: string, userId?: string) {
    const user = await db(this.prisma).user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    if (!user) return { valid: false, code };
    return {
      valid: true,
      code: code.toUpperCase(),
      referrerName: `${user.firstName} ${user.lastName}`.trim(),
      referrerRole: user.role,
      isSelf: userId != null && user.id === userId,
    };
  }

  async applyCode(userId: string, code: string, actor: ActorRef) {
    const normalized = code.trim().toUpperCase();
    const referrer = await db(this.prisma).user.findUnique({ where: { referralCode: normalized } });
    if (!referrer) throw new NotFoundException('Invalid referral code');
    if (referrer.id === userId) throw new BadRequestException('You cannot use your own referral code');

    const user = await db(this.prisma).user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await db(this.prisma).referral.findUnique({ where: { referredId: userId } });
    if (existing) throw new ConflictException('A referral is already attached to this account');

    await db(this.prisma).user.update({
      where: { id: userId },
      data: { referredById: referrer.id },
    });

    const referral = await db(this.prisma).referral.create({
      data: {
        code: normalized,
        referrerId: referrer.id,
        referredId: userId,
        status: 'active',
      },
    });

    await this.audit.log({
      entityType: 'Referral',
      entityId: referral.id,
      action: 'REFERRAL_APPLIED',
      actor,
      metadata: { referrerId: referrer.id, code: normalized },
    });

    return { referral, referrer: { id: referrer.id, name: `${referrer.firstName} ${referrer.lastName}`.trim() } };
  }

  /**
   * Attributes commission to a referrer when a referred user closes a deal.
   * Uses the `referral_commission_rate` platform config (default 5%).
   * No-op when the user has no referral attached.
   */
  async attributeOnDealCompleted(input: ReferralAttributionInput) {
    const referral = await db(this.prisma).referral.findUnique({
      where: { referredId: input.referredUserId },
    });
    if (!referral) return null;

    const storedRate = await this.config.get<number>('referral_commission_rate');
    const rate = typeof storedRate === 'number' ? storedRate : 0.05;
    const amount = Number((input.dealAmount * rate).toFixed(2));

    const [updatedReferral, commission] = await Promise.all([
      db(this.prisma).referral.update({
        where: { id: referral.id },
        data: { status: 'converted', convertedAt: new Date() },
      }),
      db(this.prisma).commission.create({
        data: {
          referralId: referral.id,
          referrerId: referral.referrerId,
          referredId: referral.referredId,
          transactionId: input.transactionId,
          amount,
          currency: input.currency ?? 'NGN',
          rate,
          status: 'payable',
        },
      }),
    ]);

    await this.audit.log({
      entityType: 'Commission',
      entityId: commission.id,
      action: 'COMMISSION_ATTRIBUTED',
      actor: input.actor,
      metadata: {
        referralId: referral.id,
        referrerId: referral.referrerId,
        transactionId: input.transactionId,
        amount,
        rate,
      },
    });

    return { referral: updatedReferral, commission };
  }

  async getCommissions(referrerId: string) {
    return db(this.prisma).commission.findMany({
      where: { referrerId },
      orderBy: { createdAt: 'desc' },
      include: { referral: true },
    });
  }

  async getReferralStats() {
    const [total, byStatus, totalCommission] = await Promise.all([
      db(this.prisma).referral.count(),
      db(this.prisma).referral.groupBy({ by: ['status'], _count: true }),
      db(this.prisma).commission.aggregate({
        where: { status: { in: ['payable', 'paid'] } },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
      totalCommissionAttributed: totalCommission._sum.amount ?? 0,
    };
  }

  async listAll(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      db(this.prisma).referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, email: true } },
          referred: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      db(this.prisma).referral.count(),
    ]);

    return { referrals, total, page, limit };
  }
}
