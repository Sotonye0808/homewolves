import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('signatures')
export class SignaturesController {
  constructor(private signaturesService: SignaturesService) {}

  @Post()
  @UseGuards(JwtGuard)
  createRequest(@Body() body: {
    transactionId: string;
    documentId?: string;
    signerId: string;
    signerEmail: string;
    signerName: string;
  }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.signaturesService.createRequest(body, actor);
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtGuard)
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.signaturesService.findByTransaction(transactionId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.signaturesService.findById(id);
  }

  @Get(':id/embed')
  @UseGuards(JwtGuard)
  getEmbedUrl(@Param('id') id: string, @Req() req: any) {
    return this.signaturesService.getEmbedUrl(id, req.user.sub);
  }

  @Post('webhook')
  async webhook(@Body() body: { external_id: string; status: string }) {
    if (body.status === 'completed') {
      return this.signaturesService.webhookCompleted(body.external_id);
    }
    return { received: true };
  }
}
