import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, count } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { notifications, users } from '../../drizzle/schema';

export type NotificationRow = typeof notifications.$inferSelect;

@Injectable()
export class NotificationsService {
  constructor(private db: DrizzleService) {}

  async findByUser(userId: string, limit = 50, offset = 0) {
    const [rows, total] = await Promise.all([
      this.db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: desc(notifications.createdAt),
        limit,
        offset,
      }),
      this.db.select({ value: count() }).from(notifications).where(eq(notifications.userId, userId)),
    ]);
    return { notifications: rows as NotificationRow[], total: total[0]?.value ?? 0 };
  }

  async getUnreadCount(userId: string) {    const [result] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.value ?? 0;
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(and(inArray(notifications.id, notificationIds), eq(notifications.userId, userId)));
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: string;
  }) {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ?? {},
        channel: data.channel ?? 'in_app',
      })
      .returning();
    return notification as NotificationRow;
  }

  async createAndDispatch(
    data: {
      userId: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
    emitSocketEvent?: (userId: string, notification: NotificationRow) => void,
  ) {
    const notification = await this.create({ ...data, channel: 'in_app' });
    if (emitSocketEvent) {
      emitSocketEvent(data.userId, notification);
    }
    return notification;
  }

  async getPreferences(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user) return {};
    const prefs = (user.preferences as Record<string, unknown>) ?? {};
    return (prefs.notifications as Record<string, boolean>) ?? {};
  }

  async updatePreferences(userId: string, preferences: Record<string, boolean>) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    const currentPrefs = (user?.preferences as Record<string, unknown>) ?? {};
    await this.db
      .update(users)
      .set({ preferences: { ...currentPrefs, notifications: preferences } })
      .where(eq(users.id, userId));
  }
}

