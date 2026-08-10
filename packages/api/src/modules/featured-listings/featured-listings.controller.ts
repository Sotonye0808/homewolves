import { Controller, Get, Post, Param, Query, Body, UseGuards, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { FeaturedListingsService } from './featured-listings.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { z } from 'zod';

const purchaseSchema = z
  .object({
    listingId: z.string().min(1).max(64),
    days: z.coerce.number().int().min(1).max(90),
  })
  .strict();

const webhookSchema = z
  .object({
    event: z.string().min(1).max(100),
    data: z.object({ reference: z.string().min(1).max(200) }).passthrough(),
  })
  .passthrough();

@Controller('featured-listings')
export class FeaturedListingsController {
  private readonly logger = new Logger(FeaturedListingsController.name);

  constructor(
    private featuredListingsService: FeaturedListingsService,
    private paystack: PaystackClient,
  ) {}

  @Get()
  getActive(@Query('take') take?: string) {
    return this.featuredListingsService.getActivePlacements(take ? Math.min(parseInt(take) || 6, 12) : 6);
  }

  @Get('my')
  @UseGuards(JwtGuard)
  getMy(@Req() req: any) {
    return this.featuredListingsService.getMyPlacements(req.user.sub);
  }

  @Get('all')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAll(@Query() query: any) {
    return this.featuredListingsService.listAll({
      status: query.status,
      page: query.page ? Math.max(parseInt(query.page) || 1, 1) : undefined,
      limit: query.limit ? Math.min(parseInt(query.limit) || 20, 100) : undefined,
    });
  }

  @Get('provider-status')
  getProviderStatus() {
    return { configured: this.featuredListingsService.paymentsConfigured };
  }

  @Post('purchase')
  @UseGuards(JwtGuard)
  purchase(@Body(new ZodValidationPipe(purchaseSchema)) body: { listingId: string; days: number }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.featuredListingsService.purchase(body.listingId, req.user.sub, body.days, actor);
  }

  @Post('webhook')
  async webhook(@Body(new ZodValidationPipe(webhookSchema)) body: { event: string; data: { reference: string } }, @Req() req: any) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    const signature = req.headers?.['x-paystack-signature'];

    if (!this.paystack.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Rejected featured-listings webhook with invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (body.event === 'charge.success') {
      return this.featuredListingsService.activateByReference(body.data.reference);
    }
    return { received: true };
  }

  @Post(':id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  cancel(@Param('id') id: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.featuredListingsService.cancel(id, actor);
  }

  @Post('admin/expire')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  expire() {
    return this.featuredListingsService.expireExpired();
  }
}
