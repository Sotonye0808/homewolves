import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const applyCodeSchema = z
  .object({
    code: z.string().trim().min(3).max(20),
  })
  .strict();

@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  getMyReferral(@Req() req: any) {
    return this.referralsService.getMyReferral(req.user.sub);
  }

  @Get('commissions')
  @UseGuards(JwtGuard)
  getCommissions(@Req() req: any) {
    return this.referralsService.getCommissions(req.user.sub);
  }

  @Get('resolve')
  resolve(@Query('code') code: string, @Req() req: any) {
    const userId = req?.user?.sub;
    return this.referralsService.resolveCode(code ?? '', userId);
  }

  @Post('apply')
  @UseGuards(JwtGuard)
  apply(@Body(new ZodValidationPipe(applyCodeSchema)) body: { code: string }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.referralsService.applyCode(req.user.sub, body.code, actor);
  }

  @Get('stats')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getStats() {
    return this.referralsService.getReferralStats();
  }

  @Get('all')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAll(@Query() query: any) {
    return this.referralsService.listAll({
      page: query.page ? Math.max(parseInt(query.page) || 1, 1) : undefined,
      limit: query.limit ? Math.min(parseInt(query.limit) || 20, 100) : undefined,
    });
  }
}
