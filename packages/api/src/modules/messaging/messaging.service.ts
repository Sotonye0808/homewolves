import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    return db(this.prisma).conversation.findMany({
      where: { participantIds: { has: userId } },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversationById(id: string, userId: string) {
    const conversation = await db(this.prisma).conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }
    return conversation;
  }

  async createConversation(participantIds: string[], propertyId?: string) {
    const conversation = await db(this.prisma).conversation.create({
      data: {
        participantIds,
        propertyId,
      },
    });
    return conversation;
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text', mediaUrl?: string) {
    const conversation = await db(this.prisma).conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(senderId)) {
      throw new ForbiddenException('Not a participant');
    }

    const message = await db(this.prisma).message.create({
      data: { conversationId, senderId, content, type, mediaUrl },
      include: { sender: true },
    });

    await db(this.prisma).conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await db(this.prisma).conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }

    return db(this.prisma).message.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await db(this.prisma).conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }

    await db(this.prisma).message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    const conversations = await db(this.prisma).conversation.findMany({
      where: { participantIds: { has: userId } },
      select: { id: true },
    });

    const ids = conversations.map((c: any) => c.id);
    if (ids.length === 0) return 0;

    return db(this.prisma).message.count({
      where: { conversationId: { in: ids }, senderId: { not: userId }, readAt: null },
    });
  }
}
