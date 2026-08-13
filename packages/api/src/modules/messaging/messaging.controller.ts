import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/types/request.types';
import { z } from 'zod';

const createConversationSchema = z
  .object({
    participantIds: z.array(z.string().min(1).max(64)).min(1).max(50),
    propertyId: z.string().min(1).max(64).optional(),
  })
  .strict();

@Controller('messaging')
@UseGuards(JwtGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('conversations')
  getConversations(@Req() req: AuthenticatedRequest) {
    return this.messagingService.getConversations(req.user.sub);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.getConversationById(id, req.user.sub);
  }

  @Post('conversations')
  createConversation(
    @Body(new ZodValidationPipe(createConversationSchema)) body: { participantIds: string[]; propertyId?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const participantIds = Array.from(new Set([...body.participantIds, req.user.sub]));
    return this.messagingService.createConversation(participantIds, body.propertyId, req.user.sub);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.getMessages(id, req.user.sub);
  }

  @Post('conversations/:id/read')
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.markAsRead(id, req.user.sub);
  }

  @Get('unread')
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.messagingService.getUnreadCount(req.user.sub);
  }
}
