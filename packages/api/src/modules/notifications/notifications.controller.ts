import { Controller, Get, Post, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MarkReadDto, markReadSchema } from './dto/mark-read.dto';
import { UpdatePreferencesDto, updatePreferencesSchema } from './dto/update-preferences.dto';
import { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.notificationsService.findByUser(
      req.user.sub,
      Math.min(Number(limit) || 50, 100),
      Math.max(Number(offset) || 0, 0),
    );
  }

  @Get('unread-count')
  async unreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Post('mark-read')
  async markRead(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(markReadSchema)) dto: MarkReadDto) {
    await this.notificationsService.markAsRead(req.user.sub, dto.notificationIds);
    return { success: true };
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: AuthenticatedRequest) {
    await this.notificationsService.markAllAsRead(req.user.sub);
    return { success: true };
  }

  @Get('preferences')
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getPreferences(req.user.sub);
  }

  @Put('preferences')
  async updatePreferences(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(updatePreferencesSchema)) dto: UpdatePreferencesDto) {
    await this.notificationsService.updatePreferences(req.user.sub, dto.preferences);
    return { success: true };
  }
}
