import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: { origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true },
  namespace: '/ws',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join:conversation')
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(client: Socket, payload: { conversationId: string; content: string; type?: string; mediaUrl?: string }) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    try {
      const message = await this.messagingService.sendMessage(
        payload.conversationId,
        userId,
        payload.content,
        payload.type ?? 'text',
        payload.mediaUrl,
      );

      this.server.to(`conversation:${payload.conversationId}`).emit('message:new', message);
    } catch (err) {
      client.emit('error', { message: err instanceof Error ? err.message : 'Message failed to send' });
    }
  }

  @SubscribeMessage('message:mark-read')
  async handleMarkRead(client: Socket, conversationId: string) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    await this.messagingService.markAsRead(conversationId, userId);
    this.server.to(`conversation:${conversationId}`).emit('message:read', { conversationId, userId });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, conversationId: string) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;
    client.to(`conversation:${conversationId}`).emit('typing:update', { userId, typing: true });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, conversationId: string) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;
    client.to(`conversation:${conversationId}`).emit('typing:update', { userId, typing: false });
  }
}
