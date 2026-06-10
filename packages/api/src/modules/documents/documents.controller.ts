import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtGuard)
  upload(@Body() body: {
    transactionId: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    visibility?: string;
  }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.documentsService.upload({
      ...body,
      uploadedById: req.user.sub,
    }, actor);
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtGuard)
  findByTransaction(@Param('transactionId') transactionId: string, @Req() req: any) {
    return this.documentsService.findByTransaction(transactionId, req.user.sub, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findById(id, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  delete(@Param('id') id: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.documentsService.delete(id, req.user.sub, actor);
  }

  @Put(':id/visibility')
  @UseGuards(JwtGuard)
  updateVisibility(@Param('id') id: string, @Body() body: { visibility: string }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.documentsService.updateVisibility(id, body.visibility, req.user.sub, req.user.role, actor);
  }

  @Post('upload-url')
  @UseGuards(JwtGuard)
  getUploadUrl(@Body() body: { filename: string; contentType: string }) {
    return this.documentsService.getUploadUrl(body.filename, body.contentType);
  }
}
