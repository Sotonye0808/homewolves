import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async upload(dto: {
    transactionId: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    visibility?: string;
    uploadedById: string;
  }, actor: ActorRef) {
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id: dto.transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const doc = await db(this.prisma).transactionDocument.create({
      data: {
        transactionId: dto.transactionId,
        name: dto.name,
        type: dto.type,
        url: dto.url,
        size: dto.size ?? 0,
        visibility: dto.visibility ?? 'shared',
        uploadedById: dto.uploadedById,
        uploadedBy: actor.name,
      },
    });

    await this.audit.log({
      entityType: 'TransactionDocument',
      entityId: doc.id,
      action: 'DOCUMENT_UPLOADED',
      actor,
      metadata: { transactionId: dto.transactionId, name: dto.name, type: dto.type },
    });

    return doc;
  }

  async findByTransaction(transactionId: string, userId: string, role: string) {
    const transaction = await db(this.prisma).transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isAgent = transaction.agentId === userId;
    const isBuyer = transaction.buyerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAgent && !isBuyer && !isAdmin) throw new ForbiddenException('Not your transaction');

    const docs = await db(this.prisma).transactionDocument.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });

    if (isBuyer) {
      return docs.filter((d: any) => d.visibility === 'shared' || d.uploadedById === userId);
    }
    return docs;
  }

  async findById(id: string, userId: string, role: string) {
    const doc = await db(this.prisma).transactionDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    const transaction = await db(this.prisma).transaction.findUnique({ where: { id: doc.transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isAgent = transaction.agentId === userId;
    const isBuyer = transaction.buyerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAgent && !isBuyer && !isAdmin) throw new ForbiddenException('Not your transaction');

    return doc;
  }

  async delete(id: string, userId: string, actor: ActorRef) {
    const doc = await db(this.prisma).transactionDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.uploadedById !== userId) throw new ForbiddenException('Only uploader can delete');

    await db(this.prisma).transactionDocument.delete({ where: { id } });

    await this.audit.log({
      entityType: 'TransactionDocument',
      entityId: id,
      action: 'DOCUMENT_DELETED',
      actor,
      metadata: { name: doc.name },
    });
  }

  async updateVisibility(id: string, visibility: string, userId: string, role: string, actor: ActorRef) {
    const doc = await db(this.prisma).transactionDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (doc.uploadedById !== userId && !isAdmin) throw new ForbiddenException('Not authorized');

    const updated = await db(this.prisma).transactionDocument.update({
      where: { id },
      data: { visibility },
    });

    await this.audit.log({
      entityType: 'TransactionDocument',
      entityId: id,
      action: 'DOCUMENT_VISIBILITY_UPDATED',
      actor,
      metadata: { visibility },
    });

    return updated;
  }

  async getUploadUrl(filename: string, _contentType: string) {
    return {
      uploadUrl: `https://storage.homewolves.africa/documents/${filename}`,
      publicUrl: `https://storage.homewolves.africa/documents/${filename}`,
      expiresIn: 3600,
    };
  }

  async scanResult(id: string, status: string) {
    await db(this.prisma).transactionDocument.update({
      where: { id },
      data: { virusScanStatus: status },
    });
  }
}
