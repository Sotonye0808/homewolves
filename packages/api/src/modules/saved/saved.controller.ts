import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { SavedService } from './saved.service';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthenticatedRequest } from '../../common/types/request.types';

@Controller('saved')
export class SavedController {
  constructor(private service: SavedService) {}

  @Post(':listingId/toggle')
  @UseGuards(JwtGuard)
  toggle(@Param('listingId') listingId: string, @Req() req: AuthenticatedRequest) {
    return this.service.toggle(req.user.sub, listingId);
  }

  @Get()
  @UseGuards(JwtGuard)
  getSaved(@Req() req: AuthenticatedRequest) {
    return this.service.getSaved(req.user.sub);
  }

  @Get(':listingId/check')
  @UseGuards(JwtGuard)
  isSaved(@Param('listingId') listingId: string, @Req() req: AuthenticatedRequest) {
    return this.service.isSaved(req.user.sub, listingId);
  }
}
