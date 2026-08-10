import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

    const paystackRef = `hw_${userId}_${Date.now()}`;

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
      metadata: { planId, planName: plan.name },
    });

    return {
      subscriptionId: sub.id,
      paystackRef,
      authorizationUrl: `https://paystack.com/checkout/${paystackRef}`,
    };
  }

  async webhookActivate(paystackRef: string) {
    const sub = await db(this.prisma).subscription.findFirst({ where: { paystackRef } });
    if (!sub) throw new NotFoundException('Subscription not found');

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
      metadata: { planName: updated.plan?.name },
    });

    return updated;
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
