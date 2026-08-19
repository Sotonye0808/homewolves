import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { DocuSealClient } from '../../common/integrations/docuseal.client';
import { EmailService } from '../email/email.service';
import { transactions, signatureRequests } from '../../drizzle/schema';

interface TransactionStep {
  id: string;
  label: string;
  order: number;
  status: string;
  completedAt?: Date;
  completedBy?: { id: string; role: string; name: string };
  notes?: string;
}

@Injectable()
export class SignaturesService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private docuseal: DocuSealClient,
    private emailService: EmailService,
  ) {}

  get providerConfigured(): boolean {
    return this.docuseal.isConfigured;
  }

  async createRequest(dto: {
    transactionId: string;
    documentId?: string;
    signerId: string;
    signerEmail: string;
    signerName: string;
  }, actor: ActorRef) {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, dto.transactionId));
    if (!transaction) throw new NotFoundException('Transaction not found');

    const externalId = `hw_${dto.transactionId}_${Date.now()}`;

    let embedUrl: string | null = null;
    let providerStatus: 'configured' | 'fallback' = 'fallback';

    if (this.docuseal.isConfigured) {
      try {
        const submission = await this.docuseal.createSubmission({
          documentId: dto.documentId,
          signers: [{ email: dto.signerEmail, name: dto.signerName }],
          message: 'Please review and sign the document',
        });
        if (submission) {
          embedUrl = submission.embedUrl;
          providerStatus = 'configured';
        }
      } catch {
        embedUrl = null;
      }
    }

    const [request] = await this.db
      .insert(signatureRequests)
      .values({
        transactionId: dto.transactionId,
        documentId: dto.documentId ?? null,
        signerId: dto.signerId,
        signerEmail: dto.signerEmail,
        signerName: dto.signerName,
        externalId,
        embedUrl: embedUrl ?? `${process.env.WEB_URL ?? 'https://homewolves.africa'}/messages`,
      })
      .returning();
    if (!request) throw new Error('Failed to create signature request');

    await this.audit.log({
      entityType: 'SignatureRequest',
      entityId: request.id,
      action: 'SIGNATURE_REQUESTED',
      actor,
      metadata: { transactionId: dto.transactionId, signerEmail: dto.signerEmail, providerStatus },
    });

    void this.emailService.send(dto.signerEmail, 'signature_requested', {
      firstName: dto.signerName.split(' ')[0] || 'there',
      signerName: dto.signerName,
      signUrl: request.embedUrl ?? `${process.env.WEB_URL ?? 'https://homewolves.africa'}/messages`,
      documentId: dto.documentId ?? '',
      transactionId: dto.transactionId,
    });

    return { ...request, providerStatus };
  }

  async findByTransaction(transactionId: string) {
    return this.db.query.signatureRequests.findMany({
      where: eq(signatureRequests.transactionId, transactionId),
      orderBy: desc(signatureRequests.createdAt),
    });
  }

  async findById(id: string) {
    const [request] = await this.db.select().from(signatureRequests).where(eq(signatureRequests.id, id));
    if (!request) throw new NotFoundException('Signature request not found');
    return request;
  }

  async webhookCompleted(externalId: string, status = 'completed') {
    const [request] = await this.db.select().from(signatureRequests).where(eq(signatureRequests.externalId, externalId));
    if (!request) throw new NotFoundException('Signature request not found');

    if (status === 'completed') {
      const [updated] = await this.db
        .update(signatureRequests)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(signatureRequests.id, request.id))
        .returning();

      await this.audit.log({
        entityType: 'SignatureRequest',
        entityId: request.id,
        action: 'SIGNATURE_COMPLETED',
        actor: { id: 'system', role: 'SYSTEM', name: 'DocuSeal Webhook' },
        metadata: { transactionId: request.transactionId, externalId },
      });

      const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, request.transactionId));
      if (transaction) {
        const steps = transaction.stepsJson as unknown as TransactionStep[];
        const stepIdx = transaction.currentStep;
        if (stepIdx < steps.length) {
          const current = steps[stepIdx] ?? { id: '', label: '', order: stepIdx };
          steps[stepIdx] = {
            id: current.id,
            label: current.label,
            order: current.order,
            status: 'completed',
            completedAt: new Date(),
            completedBy: { id: 'system', role: 'SYSTEM', name: 'DocuSeal' },
            notes: 'Document signed via e-signature',
          };
          await this.db
            .update(transactions)
            .set({
              stepsJson: steps,
              currentStep: stepIdx + 1,
              status: stepIdx + 1 >= steps.length ? 'COMPLETED' : 'IN_PROGRESS',
            })
            .where(eq(transactions.id, transaction.id));

          if (stepIdx + 1 >= steps.length) {
            const full = await this.db.query.transactions.findFirst({
              where: eq(transactions.id, transaction.id),
              with: { listing: true, buyer: true, agent: true },
            });
            const vars = {
              listingTitle: full?.listing?.title ?? '',
              transactionId: transaction.id,
              amount: full?.listing ? String(Number(full.listing.price ?? 0)) : '',
              currency: full?.listing?.currency ?? 'NGN',
            };
            if (full?.buyer?.email) {
              void this.emailService.send(full.buyer.email, 'transaction_completed', { ...vars, firstName: full.buyer.firstName ?? 'there' });
            }
            if (full?.agent?.email) {
              void this.emailService.send(full.agent.email, 'transaction_completed', { ...vars, firstName: full.agent.firstName ?? 'there' });
            }
          }
        }
      }

      return updated;
    }

    if (status === 'declined') {
      await this.db.update(signatureRequests).set({ status: 'declined' }).where(eq(signatureRequests.id, request.id));
      return { received: true, status };
    }

    return { received: true, status };
  }

  async getEmbedUrl(id: string, userId: string) {
    const [request] = await this.db.select().from(signatureRequests).where(eq(signatureRequests.id, id));
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.signerId !== userId) throw new ForbiddenException('Not your signature request');
    return { embedUrl: request.embedUrl };
  }

  async cancelRequest(id: string, actor: ActorRef) {
    const [request] = await this.db.select().from(signatureRequests).where(eq(signatureRequests.id, id));
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.status === 'completed') throw new BadRequestException('Signature already completed');

    const [updated] = await this.db
      .update(signatureRequests)
      .set({ status: 'cancelled' })
      .where(eq(signatureRequests.id, id))
      .returning();

    await this.audit.log({
      entityType: 'SignatureRequest',
      entityId: id,
      action: 'SIGNATURE_CANCELLED',
      actor,
    });

    return updated;
  }
}
