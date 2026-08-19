import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { and, desc, eq, count } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EmailService } from '../email/email.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AdvanceTransactionDto } from './dto/advance-transaction.dto';
import { RejectTransactionDto } from './dto/reject-transaction.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { transactions, listings, users, paymentRecords, media } from '../../drizzle/schema';

interface TransactionStep {
  id: string;
  label: string;
  order: number;
  status: string;
  completedAt?: Date;
  completedBy?: { id: string; role: string; name: string };
  notes?: string;
}

const DEFAULT_STEPS = [
  { id: 'offer', label: 'Offer Accepted', order: 0, status: 'pending' },
  { id: 'inspection', label: 'Inspection Completed', order: 1, status: 'pending' },
  { id: 'documentation', label: 'Documentation Signed', order: 2, status: 'pending' },
  { id: 'payment', label: 'Payment Confirmed', order: 3, status: 'pending' },
  { id: 'handover', label: 'Keys Handed Over', order: 4, status: 'pending' },
];

@Injectable()
export class TransactionsService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private activityService: ActivityService,
    private referralsService: ReferralsService,
    private analyticsService: AnalyticsService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateTransactionDto, agentId: string, actor: ActorRef) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, dto.listingId));
    if (!listing) throw new NotFoundException('Listing not found');

    const [buyer] = await this.db.select().from(users).where(eq(users.id, dto.buyerId));
    if (!buyer) throw new NotFoundException('Buyer not found');

    const steps = dto.customSteps ?? DEFAULT_STEPS;

    const [transaction] = await this.db
      .insert(transactions)
      .values({
        listingId: dto.listingId,
        buyerId: dto.buyerId,
        agentId,
        type: dto.type,
        status: 'INITIATED',
        currentStep: 0,
        stepsJson: steps,
      })
      .returning();
    if (!transaction) throw new Error('Failed to create transaction');

    const full = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, transaction.id),
      with: { listing: { with: { media: true } }, buyer: true, agent: true },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: transaction.id,
      action: 'TRANSACTION_CREATED',
      actor,
      metadata: { listingId: dto.listingId, buyerId: dto.buyerId, type: dto.type },
    });

    if (full?.buyer?.email) {
      void this.emailService.send(full.buyer.email, 'transaction_created', {
        firstName: full.buyer.firstName ?? 'there',
        listingTitle: full.listing?.title ?? '',
        transactionId: transaction.id,
        amount: full.listing ? String(Number(full.listing.price ?? 0)) : '',
        currency: full.listing?.currency ?? 'NGN',
      });
    }
    if (full?.agent?.email) {
      void this.emailService.send(full.agent.email, 'transaction_created', {
        firstName: full.agent.firstName ?? 'there',
        listingTitle: full.listing?.title ?? '',
        transactionId: transaction.id,
        amount: full.listing ? String(Number(full.listing.price ?? 0)) : '',
        currency: full.listing?.currency ?? 'NGN',
      });
    }

    this.activityService
      .awardForUser(agentId, actor.role, 'transaction_created', actor, { transactionId: transaction.id, listingId: dto.listingId })
      .catch(() => {});

    this.analyticsService
      .track({
        event: 'transaction_started',
        userId: dto.buyerId,
        agentId,
        listingId: dto.listingId,
        metadata: { transactionId: transaction.id, type: dto.type },
      })
      .catch(() => {});

    return full;
  }

  async findAll(agentId: string, role: string, params: { status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (role === 'AGENT' || role === 'DEVELOPER' || role === 'HOMEOWNER') {
      conditions.push(eq(transactions.agentId, agentId));
    } else if (role === 'BUYER') {
      conditions.push(eq(transactions.buyerId, agentId));
    }
    if (params.status) conditions.push(eq(transactions.status, params.status as never));

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db.query.transactions.findMany({
        where,
        offset: skip,
        limit,
        orderBy: desc(transactions.createdAt),
        with: {
          listing: { with: { media: { where: eq(media.isPrimary, true), limit: 1 } } },
          buyer: true,
          agent: true,
          payments: true,
        },
      }),
      this.db.select({ value: count() }).from(transactions).where(where),
    ]);

    return { transactions: rows, total: totalResult[0]?.value ?? 0, page, limit };
  }

  async findById(id: string, userId: string, role: string) {
    const transaction = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        listing: { with: { media: true } },
        buyer: true,
        agent: true,
        documents: true,
        payments: true,
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isAgent = transaction.agentId === userId;
    const isBuyer = transaction.buyerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAgent && !isBuyer && !isAdmin) throw new ForbiddenException('Not your transaction');

    return transaction;
  }

  async advance(id: string, dto: AdvanceTransactionDto, userId: string, actor: ActorRef) {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, id));
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId) throw new ForbiddenException('Only the agent can advance steps');
    if (transaction.status !== 'INITIATED' && transaction.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Transaction is not active');
    }

    const steps = transaction.stepsJson as unknown as TransactionStep[];
    const stepIndex = transaction.currentStep;

    if (stepIndex >= steps.length) {
      return this.complete(transaction, actor);
    }

    const current = steps[stepIndex] ?? { id: '', label: '', order: stepIndex };
    steps[stepIndex] = {
      id: current.id,
      label: current.label,
      order: current.order,
      status: 'completed',
      completedAt: new Date(),
      completedBy: { id: actor.id, role: actor.role, name: actor.name },
      notes: dto.notes,
    };

    const nextStep = stepIndex + 1;

    await this.db
      .update(transactions)
      .set({
        currentStep: nextStep,
        stepsJson: steps,
        status: nextStep >= steps.length ? 'COMPLETED' : 'IN_PROGRESS',
      })
      .where(eq(transactions.id, id));

    const updated = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        listing: { with: { media: true } },
        buyer: true,
        agent: true,
        payments: true,
      },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: id,
      action: 'TRANSACTION_ADVANCED',
      actor,
      metadata: { fromStep: stepIndex, toStep: nextStep, stepLabel: steps[stepIndex]?.label },
    });

    if (updated?.status === 'COMPLETED') {
      this.sendTransactionCompletedEmail(updated);
    }

    return updated;
  }

  private sendTransactionCompletedEmail(updated: {
    id: string;
    listing?: { title: string | null; price?: string | number | null; currency?: string | null };
    buyer?: { id: string; email: string | null; firstName?: string | null };
    agent?: { id: string; email: string | null; firstName?: string | null };
  }) {
    const templateVars = {
      firstName: '',
      listingTitle: updated.listing?.title ?? '',
      transactionId: updated.id,
      amount: updated.listing ? String(Number(updated.listing.price ?? 0)) : '',
      currency: updated.listing?.currency ?? 'NGN',
    };
    if (updated.buyer?.email) {
      void this.emailService.send(updated.buyer.email, 'transaction_completed', {
        ...templateVars,
        firstName: updated.buyer.firstName ?? 'there',
      });
    }
    if (updated.agent?.email) {
      void this.emailService.send(updated.agent.email, 'transaction_completed', {
        ...templateVars,
        firstName: updated.agent.firstName ?? 'there',
      });
    }
  }

  private sendTransactionStatusEmail(
    updated: {
      id: string;
      listing?: { title: string | null; price?: string | number | null; currency?: string | null };
      buyer?: { id: string; email: string | null; firstName?: string | null };
      agent?: { id: string; email: string | null; firstName?: string | null };
    },
    templateKey: 'transaction_rejected' | 'transaction_cancelled',
    reason?: string,
  ) {
    const base = {
      listingTitle: updated.listing?.title ?? '',
      transactionId: updated.id,
      amount: updated.listing ? String(Number(updated.listing.price ?? 0)) : '',
      currency: updated.listing?.currency ?? 'NGN',
    };
    const vars = reason ? { ...base, reason } : base;
    if (updated.buyer?.email) {
      void this.emailService.send(updated.buyer.email, templateKey, { ...vars, firstName: updated.buyer.firstName ?? 'there' });
    }
    if (updated.agent?.email) {
      void this.emailService.send(updated.agent.email, templateKey, { ...vars, firstName: updated.agent.firstName ?? 'there' });
    }
  }

  private async complete(transaction: { id: string; agentId: string; buyerId: string; listingId: string }, actor: ActorRef) {
    await this.db.update(transactions).set({ status: 'COMPLETED' }).where(eq(transactions.id, transaction.id));

    const updated = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, transaction.id),
      with: {
        listing: { with: { media: true } },
        buyer: true,
        agent: true,
        payments: true,
      },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: transaction.id,
      action: 'TRANSACTION_COMPLETED',
      actor,
    });

    if (updated?.status === 'COMPLETED') {
      this.sendTransactionCompletedEmail(updated);
    }

    if (updated?.listing) {
      await this.db.update(listings).set({ status: 'SOLD' }).where(eq(listings.id, updated.listingId));
    }

    this.activityService
      .awardForUser(transaction.agentId, actor.role, 'transaction_completed', actor, { transactionId: transaction.id })
      .catch(() => {});
    if (updated?.listing) {
      const [owner] = await this.db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, updated.listing.ownerId));
      this.activityService
        .awardForUser(updated.listing.ownerId, owner?.role ?? 'BUYER', 'listing_sold', actor, { listingId: updated.listingId })
        .catch(() => {});
    }

    this.referralsService
      .attributeOnDealCompleted({
        referredUserId: transaction.agentId,
        transactionId: transaction.id,
        dealAmount: Number(updated?.listing?.price ?? 0),
        currency: updated?.listing?.currency ?? 'NGN',
        actor,
      })
      .catch(() => {});

    this.analyticsService
      .track({
        event: 'transaction_completed',
        userId: transaction.buyerId,
        agentId: transaction.agentId,
        listingId: transaction.listingId,
        metadata: { transactionId: transaction.id },
      })
      .catch(() => {});

    return updated;
  }

  async reject(id: string, dto: RejectTransactionDto, userId: string, actor: ActorRef) {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, id));
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId && transaction.buyerId !== userId) {
      throw new ForbiddenException('Not your transaction');
    }
    if (transaction.status === 'COMPLETED' || transaction.status === 'REJECTED' || transaction.status === 'CANCELLED') {
      throw new BadRequestException('Transaction already finalised');
    }

    const steps = transaction.stepsJson as unknown as TransactionStep[];
    const currentIdx = Math.min(transaction.currentStep, steps.length - 1);
    if (steps[currentIdx]) {
      const current = steps[currentIdx] ?? { id: '', label: '', order: currentIdx };
      steps[currentIdx] = {
        id: current.id,
        label: current.label,
        order: current.order,
        status: 'rejected',
        notes: dto.reason,
        completedBy: { id: actor.id, role: actor.role, name: actor.name },
      };
    }

    await this.db
      .update(transactions)
      .set({ status: 'REJECTED', stepsJson: steps })
      .where(eq(transactions.id, id));

    const updated = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        listing: { with: { media: true } },
        buyer: true,
        agent: true,
        payments: true,
      },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: id,
      action: 'TRANSACTION_REJECTED',
      actor,
      metadata: { reason: dto.reason },
    });

    if (updated) {
      this.sendTransactionStatusEmail(updated, 'transaction_rejected', dto.reason);
    }

    return updated;
  }

  async cancel(id: string, userId: string, actor: ActorRef) {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, id));
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId && transaction.buyerId !== userId) {
      throw new ForbiddenException('Not your transaction');
    }
    if (transaction.status === 'COMPLETED' || transaction.status === 'REJECTED' || transaction.status === 'CANCELLED') {
      throw new BadRequestException('Transaction already finalised');
    }

    await this.db.update(transactions).set({ status: 'CANCELLED' }).where(eq(transactions.id, id));

    const updated = await this.db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        listing: { with: { media: true } },
        buyer: true,
        agent: true,
        payments: true,
      },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: id,
      action: 'TRANSACTION_CANCELLED',
      actor,
      metadata: { reason: 'Cancelled by participant' },
    });

    if (updated) {
      this.sendTransactionStatusEmail(updated, 'transaction_cancelled');
    }

    return updated;
  }

  // ─── PAYMENTS ───────────────────────────────────────────

  async addPayment(dto: UpdatePaymentDto, userId: string, actor: ActorRef) {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, dto.transactionId));
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId && transaction.buyerId !== userId) {
      throw new ForbiddenException('Not your transaction');
    }

    const [payment] = await this.db
      .insert(paymentRecords)
      .values({
        transactionId: dto.transactionId,
        amount: String(dto.amount),
        currency: dto.currency ?? 'NGN',
        type: dto.type,
        status: 'pending',
        evidenceUrl: dto.evidenceUrl ?? null,
      })
      .returning();
    if (!payment) throw new Error('Failed to add payment');

    await this.audit.log({
      entityType: 'PaymentRecord',
      entityId: payment.id,
      action: 'PAYMENT_ADDED',
      actor,
      metadata: { transactionId: dto.transactionId, type: dto.type, amount: dto.amount },
    });

    return payment;
  }

  async confirmPayment(dto: ConfirmPaymentDto, actor: ActorRef) {
    const [payment] = await this.db.select().from(paymentRecords).where(eq(paymentRecords.id, dto.paymentId));
    if (!payment) throw new NotFoundException('Payment not found');

    const [updated] = await this.db
      .update(paymentRecords)
      .set({
        status: dto.status,
        confirmedBy: dto.confirmedBy,
        confirmedAt: new Date(),
      })
      .where(eq(paymentRecords.id, dto.paymentId))
      .returning();

    await this.audit.log({
      entityType: 'PaymentRecord',
      entityId: dto.paymentId,
      action: `PAYMENT_${dto.status === 'confirmed' ? 'CONFIRMED' : 'REJECTED'}`,
      actor,
      metadata: { status: dto.status },
    });

    if (dto.status === 'confirmed' && updated?.transactionId) {
      const tx = await this.db.query.transactions.findFirst({
        where: eq(transactions.id, updated.transactionId),
        with: { listing: { with: { media: true } }, buyer: true, agent: true },
      });
      if (tx) {
        const vars = {
          listingTitle: tx.listing?.title ?? '',
          transactionId: tx.id,
          amount: String(Number(updated.amount ?? 0)),
          currency: updated.currency ?? 'NGN',
        };
        if (tx.buyer?.email) {
          void this.emailService.send(tx.buyer.email, 'payment_confirmed', { ...vars, firstName: tx.buyer.firstName ?? 'there' });
        }
        if (tx.agent?.email) {
          void this.emailService.send(tx.agent.email, 'payment_confirmed', { ...vars, firstName: tx.agent.firstName ?? 'there' });
        }
      }
    }

    return updated;
  }

  async getTransactionsByBuyer(buyerId: string) {
    return this.db.query.transactions.findMany({
      where: eq(transactions.buyerId, buyerId),
      orderBy: desc(transactions.createdAt),
      with: {
        listing: { with: { media: { where: eq(media.isPrimary, true), limit: 1 } } },
        payments: true,
      },
    });
  }

  async getPendingPayments(role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can view pending payments');
    }

    return this.db.query.paymentRecords.findMany({
      where: eq(paymentRecords.status, 'pending'),
      with: {
        transaction: {
          with: {
            listing: { with: { media: { where: eq(media.isPrimary, true), limit: 1 } } },
            buyer: true,
            agent: true,
          },
        },
      },
      orderBy: desc(paymentRecords.createdAt),
    });
  }

  async attachEvidence(paymentId: string, evidenceUrl: string, userId: string, actor: ActorRef) {
    const payment = await this.db.query.paymentRecords.findFirst({
      where: eq(paymentRecords.id, paymentId),
      with: { transaction: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.transaction.buyerId !== userId && payment.transaction.agentId !== userId) {
      throw new ForbiddenException('Not your payment');
    }

    const [updated] = await this.db
      .update(paymentRecords)
      .set({ evidenceUrl })
      .where(eq(paymentRecords.id, paymentId))
      .returning();

    await this.audit.log({
      entityType: 'PaymentRecord',
      entityId: paymentId,
      action: 'PAYMENT_EVIDENCE_UPLOADED',
      actor,
      metadata: { evidenceUrl },
    });

    return updated;
  }

  async getUploadUrl(filename: string, _contentType: string) {
    return {
      uploadUrl: `https://storage.homewolves.africa/payments/${filename}`,
      publicUrl: `https://storage.homewolves.africa/payments/${filename}`,
      expiresIn: 3600,
    };
  }
}

