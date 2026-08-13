import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DocuSealClient } from '../../common/integrations/docuseal.client';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class SignaturesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private docuseal: DocuSealClient,
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
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id: dto.transactionId } });
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

    const request = await db(this.prisma).signatureRequest.create({
      data: {
        transactionId: dto.transactionId,
        documentId: dto.documentId ?? null,
        signerId: dto.signerId,
        signerEmail: dto.signerEmail,
        signerName: dto.signerName,
        externalId,
        embedUrl: embedUrl ?? `${process.env.WEB_URL ?? 'https://homewolves.africa'}/messages`,
      },
    });

    await this.audit.log({
      entityType: 'SignatureRequest',
      entityId: request.id,
      action: 'SIGNATURE_REQUESTED',
      actor,
      metadata: { transactionId: dto.transactionId, signerEmail: dto.signerEmail, providerStatus },
    });

    return { ...request, providerStatus };
  }

  async findByTransaction(transactionId: string) {
    return db(this.prisma).signatureRequest.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const request = await db(this.prisma).signatureRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Signature request not found');
    return request;
  }

  async webhookCompleted(externalId: string, status = 'completed') {
    const request = await db(this.prisma).signatureRequest.findFirst({ where: { externalId } });
    if (!request) throw new NotFoundException('Signature request not found');

    if (status === 'completed') {
      const updated = await db(this.prisma).signatureRequest.update({
        where: { id: request.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      await this.audit.log({
        entityType: 'SignatureRequest',
        entityId: request.id,
        action: 'SIGNATURE_COMPLETED',
        actor: { id: 'system', role: 'SYSTEM', name: 'DocuSeal Webhook' },
        metadata: { transactionId: request.transactionId, externalId },
      });

      const transaction = await db(this.prisma).transaction.findUnique({ where: { id: request.transactionId } });
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
          await db(this.prisma).transaction.update({
            where: { id: transaction.id },
            data: {
              stepsJson: steps as unknown as Prisma.InputJsonValue,
              currentStep: stepIdx + 1,
              status: stepIdx + 1 >= steps.length ? 'COMPLETED' : 'IN_PROGRESS',
            },
          });
        }
      }

      return updated;
    }

    if (status === 'declined') {
      await db(this.prisma).signatureRequest.update({
        where: { id: request.id },
        data: { status: 'declined' },
      });
      return { received: true, status };
    }

    return { received: true, status };
  }

  async getEmbedUrl(id: string, userId: string) {
    const request = await db(this.prisma).signatureRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.signerId !== userId) throw new ForbiddenException('Not your signature request');
    return { embedUrl: request.embedUrl };
  }

  async cancelRequest(id: string, actor: ActorRef) {
    const request = await db(this.prisma).signatureRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.status === 'completed') throw new BadRequestException('Signature already completed');

    const updated = await db(this.prisma).signatureRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    await this.audit.log({
      entityType: 'SignatureRequest',
      entityId: id,
      action: 'SIGNATURE_CANCELLED',
      actor,
    });

    return updated;
  }
}
