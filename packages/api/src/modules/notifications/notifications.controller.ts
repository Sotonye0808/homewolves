import { Controller, Get, Post, Put, Body, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) return { notifications: [], total: 0 };
    return this.notificationsService.findByUser(userId, Number(limit) || 50, Number(offset) || 0);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { count: 0 };
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Post('mark-read')
  async markRead(@Req() req: any, @Body() dto: MarkReadDto) {
    const userId = req.user?.id;
    if (!userId) return { success: false };
    await this.notificationsService.markAsRead(userId, dto.notificationIds);
    return { success: true };
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { success: false };
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return {};
    return this.notificationsService.getPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    const userId = req.user?.id;
    if (!userId) return { success: false };
    await this.notificationsService.updatePreferences(userId, dto.preferences);
    return { success: true };
  }
}
