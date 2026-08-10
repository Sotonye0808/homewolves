import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RecentlyViewedService } from './recently-viewed.service';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const recordSchema = z
  .object({
    listingId: z.string().min(1).max(64),
    sessionId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private service: RecentlyViewedService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  record(
    @Body(new ZodValidationPipe(recordSchema)) body: { listingId: string; sessionId?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    return this.service.record(userId, body.sessionId ?? null, body.listingId);
  }

  @Get()
  @UseGuards(OptionalJwtGuard)
  getRecent(
    @Req() req: any,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = req.user?.sub ?? null;
    return this.service.getRecent(userId, sessionId ?? null);
  }
}
