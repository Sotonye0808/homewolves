import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AdvanceTransactionDto } from './dto/advance-transaction.dto';
import { RejectTransactionDto } from './dto/reject-transaction.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() dto: CreateTransactionDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.create(dto, req.user.sub, actor);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findAll(req.user.sub, req.user.role, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('my')
  @UseGuards(JwtGuard)
  getMyTransactions(@Req() req: any) {
    if (req.user.role === 'BUYER') {
      return this.transactionsService.getTransactionsByBuyer(req.user.sub);
    }
    return this.transactionsService.findAll(req.user.sub, req.user.role, {});
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.findById(id, req.user.sub, req.user.role);
  }

  @Put(':id/advance')
  @UseGuards(JwtGuard)
  advance(@Param('id') id: string, @Body() dto: AdvanceTransactionDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.advance(id, dto, req.user.sub, actor);
  }

  @Put(':id/reject')
  @UseGuards(JwtGuard)
  reject(@Param('id') id: string, @Body() dto: RejectTransactionDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.reject(id, dto, req.user.sub, actor);
  }

  @Put(':id/cancel')
  @UseGuards(JwtGuard)
  cancel(@Param('id') id: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.cancel(id, req.user.sub, actor);
  }

  @Post('payments')
  @UseGuards(JwtGuard)
  addPayment(@Body() dto: UpdatePaymentDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.addPayment(dto, req.user.sub, actor);
  }

  @Put('payments/confirm')
  @UseGuards(JwtGuard)
  confirmPayment(@Body() dto: ConfirmPaymentDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.confirmPayment(dto, actor);
  }

  @Get('payments/pending')
  @UseGuards(JwtGuard)
  getPendingPayments(@Req() req: any) {
    return this.transactionsService.getPendingPayments(req.user.role);
  }

  @Post('payments/upload-url')
  @UseGuards(JwtGuard)
  getUploadUrl(@Body() body: { filename: string; contentType: string }) {
    return this.transactionsService.getUploadUrl(body.filename, body.contentType);
  }

  @Put('payments/:paymentId/evidence')
  @UseGuards(JwtGuard)
  attachEvidence(@Param('paymentId') paymentId: string, @Body() body: { evidenceUrl: string }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.transactionsService.attachEvidence(paymentId, body.evidenceUrl, req.user.sub, actor);
  }
}
