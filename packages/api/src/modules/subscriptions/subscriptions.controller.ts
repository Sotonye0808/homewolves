import { Controller, Get, Post, Param, Body, UseGuards, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import { z } from 'zod';

const checkoutSchema = z
  .object({
    planId: z.string().min(1).max(64),
  })
  .strict();

const webhookSchema = z
  .object({
    event: z.string().min(1).max(100),
    data: z.object({ reference: z.string().min(1).max(200) }).passthrough(),
  })
  .passthrough();

const featureSchema = z
  .object({
    feature: z.string().trim().min(1).max(100),
  })
  .strict();

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private subscriptionsService: SubscriptionsService,
    private paystack: PaystackClient,
  ) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:slug')
  getPlan(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlan(slug);
  }

  @Get('my')
  @UseGuards(JwtGuard)
  getMySubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.getUserSubscription(req.user.sub);
  }

  @Get('provider-status')
  getProviderStatus() {
    return { configured: this.subscriptionsService.paymentsConfigured };
  }

  @Post('checkout')
  @UseGuards(JwtGuard)
  initiateCheckout(@Body(new ZodValidationPipe(checkoutSchema)) body: { planId: string }, @Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.initiateCheckout(req.user.sub, body.planId, toActor(req));
  }

  @Post('webhook')
  async webhook(@Body(new ZodValidationPipe(webhookSchema)) body: { event: string; data: { reference: string } }, @Req() req: AuthenticatedRequest) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    const signature = req.headers?.['x-paystack-signature'];

    if (!this.paystack.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Rejected Paystack webhook with invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.subscriptionsService.processWebhook(body.event, body.data.reference);
  }

  @Post('cancel')
  @UseGuards(JwtGuard)
  cancel(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.cancel(req.user.sub, toActor(req));
  }

  @Post('check-feature')
  @UseGuards(JwtGuard)
  checkFeature(@Body(new ZodValidationPipe(featureSchema)) body: { feature: string }, @Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.checkFeatureAccess(req.user.sub, body.feature);
  }
}
