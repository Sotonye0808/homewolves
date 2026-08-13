import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AdvanceTransactionDto } from './dto/advance-transaction.dto';
import { RejectTransactionDto } from './dto/reject-transaction.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

const db = (prisma: PrismaService) => prisma;

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
    private prisma: PrismaService,
    private audit: AuditService,
    private activityService: ActivityService,
    private referralsService: ReferralsService,
    private analyticsService: AnalyticsService,
  ) {}

  async create(dto: CreateTransactionDto, agentId: string, actor: ActorRef) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const buyer = await db(this.prisma).user.findUnique({ where: { id: dto.buyerId } });
    if (!buyer) throw new NotFoundException('Buyer not found');

    const steps = dto.customSteps ?? DEFAULT_STEPS;

    const transaction = await db(this.prisma).transaction.create({
      data: {
        listingId: dto.listingId,
        buyerId: dto.buyerId,
        agentId,
        type: dto.type,
        status: 'INITIATED',
        currentStep: 0,
        stepsJson: steps,
      },
      include: { listing: { include: { media: true } }, buyer: true, agent: true },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: transaction.id,
      action: 'TRANSACTION_CREATED',
      actor,
      metadata: { listingId: dto.listingId, buyerId: dto.buyerId, type: dto.type },
    });

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

    return transaction;
  }

  async findAll(agentId: string, role: string, params: { status?: string; page?: number; limit?: number }) {
    const where: Prisma.TransactionWhereInput = {};
    if (role === 'AGENT' || role === 'DEVELOPER' || role === 'HOMEOWNER') {
      where.agentId = agentId;
    } else if (role === 'BUYER') {
      where.buyerId = agentId;
    }
    if (params.status) where.status = params.status as TransactionStatus;

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      db(this.prisma).transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { include: { media: { where: { isPrimary: true }, take: 1 } } },
          buyer: true,
          agent: true,
          payments: true,
        },
      }),
      db(this.prisma).transaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async findById(id: string, userId: string, role: string) {
    const transaction = await db(this.prisma).transaction.findUnique({
      where: { id },
      include: {
        listing: { include: { media: true } },
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
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id } });
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

    const updated = await db(this.prisma).transaction.update({
      where: { id },
      data: {
        currentStep: nextStep,
        stepsJson: steps as unknown as Prisma.InputJsonValue,
        status: nextStep >= steps.length ? 'COMPLETED' : 'IN_PROGRESS',
      },
      include: {
        listing: { include: { media: true } },
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

    return updated;
  }

  private async complete(transaction: { id: string; agentId: string }, actor: ActorRef) {
    const updated = await db(this.prisma).transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
      include: {
        listing: { include: { media: true } },
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

    if (updated.listing) {
      await this.prisma.listing.update({
        where: { id: updated.listingId },
        data: { status: 'SOLD' },
      });
    }

    this.activityService
      .awardForUser(transaction.agentId, actor.role, 'transaction_completed', actor, { transactionId: transaction.id })
      .catch(() => {});
    if (updated.listing) {
      const owner = await this.prisma.user.findUnique({
        where: { id: updated.listing.ownerId },
        select: { role: true },
      });
      this.activityService
        .awardForUser(updated.listing.ownerId, owner?.role ?? 'BUYER', 'listing_sold', actor, { listingId: updated.listingId })
        .catch(() => {});
    }

    this.referralsService
      .attributeOnDealCompleted({
        referredUserId: transaction.agentId,
        transactionId: transaction.id,
        dealAmount: Number(updated.listing?.price ?? 0),
        currency: updated.listing?.currency ?? 'NGN',
        actor,
      })
      .catch(() => {});

    this.analyticsService
      .track({
        event: 'transaction_completed',
        userId: updated.buyerId,
        agentId: updated.agentId,
        listingId: updated.listingId,
        metadata: { transactionId: updated.id },
      })
      .catch(() => {});

    return updated;
  }

  async reject(id: string, dto: RejectTransactionDto, userId: string, actor: ActorRef) {
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id } });
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

    const updated = await db(this.prisma).transaction.update({
      where: { id },
      data: { status: 'REJECTED', stepsJson: steps as unknown as Prisma.InputJsonValue },
      include: {
        listing: { include: { media: true } },
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

    return updated;
  }

  async cancel(id: string, userId: string, actor: ActorRef) {
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId && transaction.buyerId !== userId) {
      throw new ForbiddenException('Not your transaction');
    }
    if (transaction.status === 'COMPLETED' || transaction.status === 'REJECTED' || transaction.status === 'CANCELLED') {
      throw new BadRequestException('Transaction already finalised');
    }

    const updated = await db(this.prisma).transaction.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        listing: { include: { media: true } },
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

    return updated;
  }

  // ─── PAYMENTS ───────────────────────────────────────────

  async addPayment(dto: UpdatePaymentDto, userId: string, actor: ActorRef) {
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id: dto.transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.agentId !== userId && transaction.buyerId !== userId) {
      throw new ForbiddenException('Not your transaction');
    }

    const payment = await db(this.prisma).paymentRecord.create({
      data: {
        transactionId: dto.transactionId,
        amount: dto.amount,
        currency: dto.currency ?? 'NGN',
        type: dto.type,
        status: 'pending',
        evidenceUrl: dto.evidenceUrl ?? null,
      },
    });

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
    const payment = await db(this.prisma).paymentRecord.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await db(this.prisma).paymentRecord.update({
      where: { id: dto.paymentId },
      data: {
        status: dto.status,
        confirmedBy: dto.confirmedBy,
        confirmedAt: new Date(),
      },
    });

    await this.audit.log({
      entityType: 'PaymentRecord',
      entityId: dto.paymentId,
      action: `PAYMENT_${dto.status === 'confirmed' ? 'CONFIRMED' : 'REJECTED'}`,
      actor,
      metadata: { status: dto.status },
    });

    return updated;
  }

  async getTransactionsByBuyer(buyerId: string) {
    return db(this.prisma).transaction.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { media: { where: { isPrimary: true }, take: 1 } } },
        payments: true,
      },
    });
  }

  async getPendingPayments(role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can view pending payments');
    }

    return db(this.prisma).paymentRecord.findMany({
      where: { status: 'pending' },
      include: {
        transaction: {
          include: {
            listing: { include: { media: { where: { isPrimary: true }, take: 1 } } },
            buyer: true,
            agent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async attachEvidence(paymentId: string, evidenceUrl: string, userId: string, actor: ActorRef) {
    const payment = await db(this.prisma).paymentRecord.findUnique({
      where: { id: paymentId },
      include: { transaction: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.transaction.buyerId !== userId && payment.transaction.agentId !== userId) {
      throw new ForbiddenException('Not your payment');
    }

    const updated = await db(this.prisma).paymentRecord.update({
      where: { id: paymentId },
      data: { evidenceUrl },
    });

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
