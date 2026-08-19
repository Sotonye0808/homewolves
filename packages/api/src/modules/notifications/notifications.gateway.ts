import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { NotificationRow } from './notifications.service';

@WebSocketGateway({
  cors: { origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true },
  namespace: '/ws',
})
export class NotificationsGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('notification:ack')
  handleAck(client: Socket, notificationId: string) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.emit('notification:acked', { notificationId });
    }
  }

  sendNotification(userId: string, notification: NotificationRow) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }
}
