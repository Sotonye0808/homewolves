import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const checkoutSchema = z
  .object({
    planId: z.string().min(1).max(64),
  })
  .strict();

const webhookSchema = z
  .object({
    event: z.string().min(1).max(100),
    data: z.object({ reference: z.string().min(1).max(200) }).strict(),
  })
  .strict();

const featureSchema = z
  .object({
    feature: z.string().trim().min(1).max(100),
  })
  .strict();

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

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
  getMySubscription(@Req() req: any) {
    return this.subscriptionsService.getUserSubscription(req.user.sub);
  }

  @Post('checkout')
  @UseGuards(JwtGuard)
  initiateCheckout(@Body(new ZodValidationPipe(checkoutSchema)) body: { planId: string }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.subscriptionsService.initiateCheckout(req.user.sub, body.planId, actor);
  }

  @Post('webhook')
  async webhook(@Body(new ZodValidationPipe(webhookSchema)) body: { event: string; data: { reference: string } }) {
    if (body.event === 'charge.success') {
      return this.subscriptionsService.webhookActivate(body.data.reference);
    }
    return { received: true };
  }

  @Post('cancel')
  @UseGuards(JwtGuard)
  cancel(@Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.subscriptionsService.cancel(req.user.sub, actor);
  }

  @Post('check-feature')
  @UseGuards(JwtGuard)
  checkFeature(@Body(new ZodValidationPipe(featureSchema)) body: { feature: string }, @Req() req: any) {
    return this.subscriptionsService.checkFeatureAccess(req.user.sub, body.feature);
  }
}
