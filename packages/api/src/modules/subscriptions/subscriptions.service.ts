import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaystackClient } from '../../common/integrations/paystack.client';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private paystack: PaystackClient,
  ) {}

  get paymentsConfigured(): boolean {
    return this.paystack.isConfigured;
  }

  async getPlans() {
    return db(this.prisma).subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlan(slug: string) {
    const plan = await db(this.prisma).subscriptionPlan.findUnique({ where: { slug } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getUserSubscription(userId: string) {
    const sub = await db(this.prisma).subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return sub;
  }

  async initiateCheckout(userId: string, planId: string, actor: ActorRef) {
    const plan = await db(this.prisma).subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const user = await db(this.prisma).user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const paystackRef = `hw_sub_${userId.slice(0, 8)}_${Date.now()}`;

    const sub = await db(this.prisma).subscription.create({
      data: {
        userId,
        planId,
        status: 'pending',
        paystackRef,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.audit.log({
      entityType: 'Subscription',
      entityId: sub.id,
      action: 'SUBSCRIPTION_CHECKOUT_INITIATED',
      actor,
      metadata: { planId, planName: plan.name, paystackConfigured: this.paystack.isConfigured },
    });

    let authorizationUrl: string | null = null;
    if (this.paystack.isConfigured) {
      try {
        const init = await this.paystack.initializeTransaction({
          email: user.email,
          amountKobo: Math.round(Number(plan.price) * 100),
          reference: paystackRef,
          metadata: { subscriptionId: sub.id, planId, planName: plan.name },
        });
        authorizationUrl = init?.authorizationUrl ?? null;
      } catch {
        // Paystack transient failure — keep the pending subscription, allow retry
        authorizationUrl = null;
      }
    }

    if (!authorizationUrl) {
      // Graceful fallback: development mode payment link (no provider configured)
      authorizationUrl = `${process.env.WEB_URL ?? 'https://homewolves.africa'}/dashboard/admin/payments?subscription=${sub.id}`;
    }

    return {
      subscriptionId: sub.id,
      paystackRef,
      authorizationUrl,
      providerConfigured: this.paystack.isConfigured,
    };
  }

  /**
   * Activates a pending subscription referenced by a Paystack reference.
   * When the provider is configured the transaction is verified before activation.
   */
  async webhookActivate(paystackRef: string) {
    const sub = await db(this.prisma).subscription.findFirst({ where: { paystackRef } });
    if (!sub) throw new NotFoundException('Subscription not found');

    if (this.paystack.isConfigured) {
      const verification = await this.paystack.verifyTransaction(paystackRef);
      if (!verification || verification.status !== 'success') {
        throw new BadRequestException('Payment not verified');
      }
    }

    const updated = await db(this.prisma).subscription.update({
      where: { id: sub.id },
      data: {
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });

    await this.audit.log({
      entityType: 'Subscription',
      entityId: sub.id,
      action: 'SUBSCRIPTION_ACTIVATED',
      actor: { id: 'system', role: 'SYSTEM', name: 'Paystack Webhook' },
      metadata: { planName: updated.plan?.name, paystackRef },
    });

    return updated;
  }

  async processWebhook(event: string, reference: string) {
    if (event === 'charge.success' || event === 'subscription.create') {
      return this.webhookActivate(reference);
    }
    return { received: true, event };
  }

  async cancel(userId: string, actor: ActorRef) {
    const sub = await db(this.prisma).subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
    });
    if (!sub) throw new NotFoundException('No active subscription found');

    const updated = await db(this.prisma).subscription.update({
      where: { id: sub.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    await this.audit.log({
      entityType: 'Subscription',
      entityId: sub.id,
      action: 'SUBSCRIPTION_CANCELLED',
      actor,
    });

    return updated;
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<{ allowed: boolean; plan?: string }> {
    const sub = await db(this.prisma).subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
    });
    if (!sub) return { allowed: false };
    const features = (sub.plan?.features as string[] | undefined) ?? [];
    return { allowed: features.includes(feature) || features.includes('*'), plan: sub.plan?.slug };
  }
}
