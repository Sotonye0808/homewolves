import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtGuard } from '../auth/jwt.guard';

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
  initiateCheckout(@Body() body: { planId: string }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.subscriptionsService.initiateCheckout(req.user.sub, body.planId, actor);
  }

  @Post('webhook')
  async webhook(@Body() body: { event: string; data: { reference: string } }) {
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
  checkFeature(@Body() body: { feature: string }, @Req() req: any) {
    return this.subscriptionsService.checkFeatureAccess(req.user.sub, body.feature);
  }
}
