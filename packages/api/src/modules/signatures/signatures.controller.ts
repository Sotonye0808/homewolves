import { Controller, Get, Post, Param, Body, UseGuards, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import { DocuSealClient } from '../../common/integrations/docuseal.client';
import { z } from 'zod';

const createRequestSchema = z
  .object({
    transactionId: z.string().min(1).max(64),
    documentId: z.string().min(1).max(64).optional(),
    signerId: z.string().min(1).max(64),
    signerEmail: z.string().trim().email().max(255),
    signerName: z.string().trim().min(1).max(200),
  })
  .strict();

const webhookSchema = z
  .object({
    external_id: z.string().min(1).max(200),
    status: z.enum(['completed', 'declined']).or(z.string().min(1).max(50)),
  })
  .passthrough();

@Controller('signatures')
export class SignaturesController {
  private readonly logger = new Logger(SignaturesController.name);

  constructor(
    private signaturesService: SignaturesService,
    private docuseal: DocuSealClient,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  createRequest(
    @Body(new ZodValidationPipe(createRequestSchema))
    body: {
      transactionId: string;
      documentId?: string;
      signerId: string;
      signerEmail: string;
      signerName: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.signaturesService.createRequest(body, toActor(req));
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtGuard)
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.signaturesService.findByTransaction(transactionId);
  }

  @Get('provider-status')
  getProviderStatus() {
    return { configured: this.signaturesService.providerConfigured };
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.signaturesService.findById(id);
  }

  @Get(':id/embed')
  @UseGuards(JwtGuard)
  getEmbedUrl(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.signaturesService.getEmbedUrl(id, req.user.sub);
  }

  @Post(':id/cancel')
  @UseGuards(JwtGuard)
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.signaturesService.cancelRequest(id, toActor(req));
  }

  @Post('webhook')
  async webhook(
    @Body(new ZodValidationPipe(webhookSchema)) body: { external_id: string; status: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    const signature = req.headers?.['x-docuseal-signature'];

    if (!this.docuseal.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Rejected DocuSeal webhook with invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.signaturesService.webhookCompleted(body.external_id, body.status);
  }
}
