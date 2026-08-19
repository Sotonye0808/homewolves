import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { transactions, transactionDocuments } from '../../drizzle/schema';

@Injectable()
export class DocumentsService {
  constructor(
    private db: DrizzleService,
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
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, dto.transactionId));
    if (!transaction) throw new NotFoundException('Transaction not found');

    const [doc] = await this.db
      .insert(transactionDocuments)
      .values({
        transactionId: dto.transactionId,
        name: dto.name,
        type: dto.type,
        url: dto.url,
        size: dto.size ?? 0,
        visibility: dto.visibility ?? 'shared',
        uploadedById: dto.uploadedById,
        uploadedBy: actor.name,
      })
      .returning();
    if (!doc) throw new Error('Failed to upload document');

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
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, transactionId));
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isAgent = transaction.agentId === userId;
    const isBuyer = transaction.buyerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAgent && !isBuyer && !isAdmin) throw new ForbiddenException('Not your transaction');

    const docs = await this.db.query.transactionDocuments.findMany({
      where: eq(transactionDocuments.transactionId, transactionId),
      orderBy: desc(transactionDocuments.createdAt),
    });

    if (isBuyer) {
      return docs.filter((d) => d.visibility === 'shared' || d.uploadedById === userId);
    }
    return docs;
  }

  async findById(id: string, userId: string, role: string) {
    const [doc] = await this.db.select().from(transactionDocuments).where(eq(transactionDocuments.id, id));
    if (!doc) throw new NotFoundException('Document not found');

    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, doc.transactionId));
    if (!transaction) throw new NotFoundException('Transaction not found');

    const isAgent = transaction.agentId === userId;
    const isBuyer = transaction.buyerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAgent && !isBuyer && !isAdmin) throw new ForbiddenException('Not your transaction');

    return doc;
  }

  async delete(id: string, userId: string, actor: ActorRef) {
    const [doc] = await this.db.select().from(transactionDocuments).where(eq(transactionDocuments.id, id));
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.uploadedById !== userId) throw new ForbiddenException('Only uploader can delete');

    await this.db.delete(transactionDocuments).where(eq(transactionDocuments.id, id));

    await this.audit.log({
      entityType: 'TransactionDocument',
      entityId: id,
      action: 'DOCUMENT_DELETED',
      actor,
      metadata: { name: doc.name },
    });
  }

  async updateVisibility(id: string, visibility: string, userId: string, role: string, actor: ActorRef) {
    const [doc] = await this.db.select().from(transactionDocuments).where(eq(transactionDocuments.id, id));
    if (!doc) throw new NotFoundException('Document not found');

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (doc.uploadedById !== userId && !isAdmin) throw new ForbiddenException('Not authorized');

    const [updated] = await this.db
      .update(transactionDocuments)
      .set({ visibility })
      .where(eq(transactionDocuments.id, id))
      .returning();

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
    await this.db.update(transactionDocuments).set({ virusScanStatus: status }).where(eq(transactionDocuments.id, id));
  }
}
