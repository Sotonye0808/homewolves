import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    const parsed = limit ? Math.min(parseInt(limit) || 20, 100) : 20;
    return this.activityService.getLeaderboard(parsed);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  getMyStats(@Req() req: AuthenticatedRequest) {
    return this.activityService.getAgentStats(req.user.sub);
  }

  @Get('stats/:agentId')
  getAgentStats(@Param('agentId') agentId: string) {
    return this.activityService.getAgentStats(agentId);
  }

  @Get('tiers')
  getTiers() {
    return this.activityService.getTierInfo();
  }

  @Post('seed')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async seed() {
    await this.activityService.ensureRules();
    return { message: 'Activity rules seeded' };
  }

  @Post('award/:ruleKey')
  @UseGuards(JwtGuard)
  award(@Param('ruleKey') ruleKey: string, @Req() req: AuthenticatedRequest) {
    return this.activityService.award(req.user.sub, ruleKey, toActor(req));
  }
}
