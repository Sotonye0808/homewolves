import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { RecentlyViewedService } from './recently-viewed.service';

@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private service: RecentlyViewedService) {}

  @Post()
  record(
    @Body() body: { listingId: string; userId?: string; sessionId?: string },
  ) {
    return this.service.record(body.userId ?? null, body.sessionId ?? null, body.listingId);
  }

  @Get()
  getRecent(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.getRecent(userId ?? null, sessionId ?? null);
  }
}
