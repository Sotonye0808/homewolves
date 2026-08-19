import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { EmailService } from '../email/email.service';
import { subscriptionPlans, subscriptions, users } from '../../drizzle/schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private paystack: PaystackClient,
    private emailService: EmailService,
  ) {}

  get paymentsConfigured(): boolean {
    return this.paystack.isConfigured;
  }

  async getPlans() {
    return this.db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.active, true),
      orderBy: asc(subscriptionPlans.price),
    });
  }

  async getPlan(slug: string) {
    const [plan] = await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, slug));
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getUserSubscription(userId: string) {
    const [sub] = await this.db.query.subscriptions.findMany({
      where: and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ['active', 'trialing'])),
      orderBy: desc(subscriptions.createdAt),
      limit: 1,
      with: { plan: true },
    });
    return sub;
  }

  async initiateCheckout(userId: string, planId: string, actor: ActorRef) {
    const [plan] = await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
    if (!plan) throw new NotFoundException('Plan not found');

    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new NotFoundException('User not found');

    const paystackRef = `hw_sub_${userId.slice(0, 8)}_${Date.now()}`;

    const [sub] = await this.db
      .insert(subscriptions)
      .values({
        userId,
        planId,
        status: 'pending',
        paystackRef,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
    if (!sub) throw new Error('Failed to create subscription');

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
    const [sub] = await this.db.select().from(subscriptions).where(eq(subscriptions.paystackRef, paystackRef));
    if (!sub) throw new NotFoundException('Subscription not found');

    if (this.paystack.isConfigured) {
      const verification = await this.paystack.verifyTransaction(paystackRef);
      if (!verification || verification.status !== 'success') {
        throw new BadRequestException('Payment not verified');
      }
    }

    const [updated] = await this.db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .where(eq(subscriptions.id, sub.id))
      .returning();
    if (!updated) throw new Error('Failed to activate subscription');

    const plan = await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, updated.planId)).then((r) => r[0] ?? null);
    const updatedWithPlan = { ...updated, plan };

    await this.audit.log({
      entityType: 'Subscription',
      entityId: sub.id,
      action: 'SUBSCRIPTION_ACTIVATED',
      actor: { id: 'system', role: 'SYSTEM', name: 'Paystack Webhook' },
      metadata: { planName: updatedWithPlan.plan?.name, paystackRef },
    });

    const [subscriber] = await this.db.select().from(users).where(eq(users.id, sub.userId));
    if (subscriber?.email) {
      void this.emailService.send(subscriber.email, 'subscription_activated', {
        firstName: subscriber.firstName ?? 'there',
        planName: updatedWithPlan.plan?.name ?? '',
        subscriptionId: sub.id,
        billingPeriod: `${updatedWithPlan.currentPeriodStart?.toISOString() ?? ''} — ${updatedWithPlan.currentPeriodEnd?.toISOString() ?? ''}`,
      });
    }

    return updatedWithPlan;
  }

  async processWebhook(event: string, reference: string) {
    if (event === 'charge.success' || event === 'subscription.create') {
      return this.webhookActivate(reference);
    }
    return { received: true, event };
  }

  async cancel(userId: string, actor: ActorRef) {
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ['active', 'trialing'])))
      .limit(1);
    if (!sub) throw new NotFoundException('No active subscription found');

    const [updated] = await this.db
      .update(subscriptions)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(eq(subscriptions.id, sub.id))
      .returning();

    await this.audit.log({
      entityType: 'Subscription',
      entityId: sub.id,
      action: 'SUBSCRIPTION_CANCELLED',
      actor,
    });

    return updated;
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<{ allowed: boolean; plan?: string }> {
    const [sub] = await this.db.query.subscriptions.findMany({
      where: and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ['active', 'trialing'])),
      orderBy: desc(subscriptions.createdAt),
      limit: 1,
      with: { plan: true },
    });
    if (!sub) return { allowed: false };
    const features = (sub.plan?.features as string[] | undefined) ?? [];
    return { allowed: features.includes(feature) || features.includes('*'), plan: sub.plan?.slug };
  }
}
