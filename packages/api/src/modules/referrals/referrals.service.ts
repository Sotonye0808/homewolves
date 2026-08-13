import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { and, desc, eq, inArray, count, sum } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { users, referrals, commissions } from '../../drizzle/schema';

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
    private db: DrizzleService,
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
      const [existing] = await this.db.select().from(users).where(eq(users.referralCode, code));
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
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new NotFoundException('User not found');
    if (user.referralCode) return user.referralCode;

    const code = await this.uniqueCode();
    await this.db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    return code;
  }

  async getMyReferral(userId: string) {
    const code = await this.ensureCode(userId);

    const [referralList, commissionRows] = await Promise.all([
      this.db.query.referrals.findMany({
        where: eq(referrals.referrerId, userId),
        orderBy: desc(referrals.createdAt),
        with: {
          referred: {
            columns: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
          },
        },
      }),
      this.db
        .select({ total: sum(commissions.amount) })
        .from(commissions)
        .where(and(inArray(commissions.status, ['payable', 'paid']), eq(commissions.referrerId, userId))),
    ]);

    const counts = referralList.reduce(
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
        total: referralList.length,
        pending: counts['pending'] ?? 0,
        active: counts['active'] ?? 0,
        converted: counts['converted'] ?? 0,
      },
      totalCommissionEarned: commissionRows[0]?.total ?? 0,
      referrals: referralList,
    };
  }

  async resolveCode(code: string, userId?: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.referralCode, code.toUpperCase()));
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
    const [referrer] = await this.db.select().from(users).where(eq(users.referralCode, normalized));
    if (!referrer) throw new NotFoundException('Invalid referral code');
    if (referrer.id === userId) throw new BadRequestException('You cannot use your own referral code');

    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new NotFoundException('User not found');

    const [existing] = await this.db.select().from(referrals).where(eq(referrals.referredId, userId));
    if (existing) throw new ConflictException('A referral is already attached to this account');

    await this.db.update(users).set({ referredById: referrer.id }).where(eq(users.id, userId));

    const [referral] = await this.db
      .insert(referrals)
      .values({
        code: normalized,
        referrerId: referrer.id,
        referredId: userId,
        status: 'active',
      })
      .returning();
    if (!referral) throw new Error('Failed to create referral');

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
    const [referral] = await this.db.select().from(referrals).where(eq(referrals.referredId, input.referredUserId));
    if (!referral) return null;

    const storedRate = await this.config.get<number>('referral_commission_rate');
    const rate = typeof storedRate === 'number' ? storedRate : 0.05;
    const amount = Number((input.dealAmount * rate).toFixed(2));

    const [updatedReferral, commission] = await Promise.all([
      this.db
        .update(referrals)
        .set({ status: 'converted', convertedAt: new Date() })
        .where(eq(referrals.id, referral.id))
        .returning()
        .then((r) => r[0]),
      this.db
        .insert(commissions)
        .values({
          referralId: referral.id,
          referrerId: referral.referrerId,
          referredId: referral.referredId,
          transactionId: input.transactionId,
          amount: String(amount),
          currency: input.currency ?? 'NGN',
          rate: String(rate),
          status: 'payable',
        })
        .returning()
        .then((r) => r[0]),
    ]);
    if (!updatedReferral || !commission) throw new Error('Failed to attribute commission');

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
    return this.db.query.commissions.findMany({
      where: eq(commissions.referrerId, referrerId),
      orderBy: desc(commissions.createdAt),
      with: { referral: true },
    });
  }

  async getReferralStats() {
    const [total, byStatus, totalCommission] = await Promise.all([
      this.db.select({ value: count() }).from(referrals).then((r) => r[0]?.value ?? 0),
      this.db.select({ status: referrals.status, count: count() }).from(referrals).groupBy(referrals.status),
      this.db
        .select({ total: sum(commissions.amount) })
        .from(commissions)
        .where(inArray(commissions.status, ['payable', 'paid'])),
    ]);

    return {
      total,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g.count })),
      totalCommissionAttributed: totalCommission[0]?.total ?? 0,
    };
  }

  async listAll(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [referralList, total] = await Promise.all([
      this.db.query.referrals.findMany({
        orderBy: desc(referrals.createdAt),
        limit,
        offset: skip,
        with: {
          referrer: { columns: { id: true, firstName: true, lastName: true, email: true } },
          referred: { columns: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.db.select({ value: count() }).from(referrals).then((r) => r[0]?.value ?? 0),
    ]);

    return { referrals: referralList, total, page, limit };
  }
}
