import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class SignaturesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

    const request = await db(this.prisma).signatureRequest.create({
      data: {
        transactionId: dto.transactionId,
        documentId: dto.documentId ?? null,
        signerId: dto.signerId,
        signerEmail: dto.signerEmail,
        signerName: dto.signerName,
        externalId,
        embedUrl: `https://docuseal.homewolves.africa/sign/${externalId}`,
      },
    });

    await this.audit.log({
      entityType: 'SignatureRequest',
      entityId: request.id,
      action: 'SIGNATURE_REQUESTED',
      actor,
      metadata: { transactionId: dto.transactionId, signerEmail: dto.signerEmail },
    });

    return request;
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

  async webhookCompleted(externalId: string) {
    const request = await db(this.prisma).signatureRequest.findFirst({ where: { externalId } });
    if (!request) throw new NotFoundException('Signature request not found');

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
      const steps = transaction.stepsJson as any[];
      const stepIdx = transaction.currentStep;
      if (stepIdx < steps.length) {
        steps[stepIdx] = {
          ...steps[stepIdx],
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: { id: 'system', role: 'SYSTEM', name: 'DocuSeal' },
          notes: 'Document signed via e-signature',
        };
        await db(this.prisma).transaction.update({
          where: { id: transaction.id },
          data: {
            stepsJson: steps,
            currentStep: stepIdx + 1,
            status: stepIdx + 1 >= steps.length ? 'COMPLETED' : 'IN_PROGRESS',
          },
        });
      }
    }

    return updated;
  }

  async getEmbedUrl(id: string, userId: string) {
    const request = await db(this.prisma).signatureRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.signerId !== userId) throw new ForbiddenException('Not your signature request');
    return { embedUrl: request.embedUrl };
  }
}
