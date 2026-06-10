import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const db = (prisma: PrismaService) => prisma as any;

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string, limit = 50, offset = 0) {
    const [notifications, total] = await Promise.all([
      db(this.prisma).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db(this.prisma).notification.count({ where: { userId } }),
    ]);
    return { notifications: notifications as Notification[], total };
  }

  async getUnreadCount(userId: string) {
    return db(this.prisma).notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    await db(this.prisma).notification.updateMany({
      where: { id: { in: notificationIds }, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await db(this.prisma).notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: string;
  }) {
    const notification = await db(this.prisma).notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ?? {},
        channel: data.channel ?? 'in_app',
      },
    });
    return notification as Notification;
  }

  async createAndDispatch(
    data: {
      userId: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
    emitSocketEvent?: (userId: string, notification: Notification) => void,
  ) {
    const notification = await this.create({ ...data, channel: 'in_app' });
    if (emitSocketEvent) {
      emitSocketEvent(data.userId, notification);
    }
    return notification;
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return {};
    const prefs = (user.preferences as Record<string, unknown>) ?? {};
    return (prefs.notifications as Record<string, boolean>) ?? {};
  }

  async updatePreferences(userId: string, preferences: Record<string, boolean>) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentPrefs = (user?.preferences as Record<string, unknown>) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...currentPrefs, notifications: preferences },
      },
    });
  }
}
