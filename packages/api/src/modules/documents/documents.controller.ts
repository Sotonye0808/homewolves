import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import { z } from 'zod';

const uploadDocumentSchema = z
  .object({
    transactionId: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    type: z.string().trim().min(1).max(50),
    url: z.string().trim().min(1).max(2000),
    size: z.number().int().nonnegative().max(1_000_000_000).optional(),
    visibility: z.enum(['shared', 'private']).optional(),
  })
  .strict();

const uploadUrlSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(100),
  })
  .strict();

const visibilitySchema = z
  .object({
    visibility: z.enum(['shared', 'private']),
  })
  .strict();

@Controller('documents')
@UseGuards(JwtGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  upload(
    @Body(new ZodValidationPipe(uploadDocumentSchema))
    body: {
      transactionId: string;
      name: string;
      type: string;
      url: string;
      size?: number;
      visibility?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.upload(
      {
        ...body,
        uploadedById: req.user.sub,
      },
      toActor(req),
    );
  }

  @Get('transaction/:transactionId')
  findByTransaction(@Param('transactionId') transactionId: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.findByTransaction(transactionId, req.user.sub, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.findById(id, req.user.sub, req.user.role);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.delete(id, req.user.sub, toActor(req));
  }

  @Put(':id/visibility')
  updateVisibility(@Param('id') id: string, @Body(new ZodValidationPipe(visibilitySchema)) body: { visibility: string }, @Req() req: AuthenticatedRequest) {
    return this.documentsService.updateVisibility(id, body.visibility, req.user.sub, req.user.role, toActor(req));
  }

  @Post('upload-url')
  getUploadUrl(@Body(new ZodValidationPipe(uploadUrlSchema)) body: { filename: string; contentType: string }) {
    return this.documentsService.getUploadUrl(body.filename, body.contentType);
  }
}
