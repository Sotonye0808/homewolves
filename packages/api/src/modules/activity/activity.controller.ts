import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    return this.activityService.getLeaderboard(limit ? parseInt(limit) : 20);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  getMyStats(@Req() req: any) {
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
  async seed() {
    await this.activityService.ensureRules();
    return { message: 'Activity rules seeded' };
  }

  @Post('award/:ruleKey')
  @UseGuards(JwtGuard)
  award(@Param('ruleKey') ruleKey: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.activityService.award(req.user.sub, ruleKey, actor);
  }
}
