import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Response } from 'express';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAllFiltered({
      entityType,
      entityId,
      actorId,
      action,
      dateFrom,
      dateTo,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('export/csv')
  @UseGuards(JwtGuard)
  async exportCsv(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.auditService.exportCsv({ entityType, entityId, actorId, action, dateFrom, dateTo });
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
      res.send(csv);
    }
    return csv;
  }

  @Get('export/pdf')
  @UseGuards(JwtGuard)
  async exportPdf(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditService.exportPdf({ entityType, entityId, actorId, action, dateFrom, dateTo });
  }

  @Get('entity')
  @UseGuards(JwtGuard)
  findByEntity(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    if (!entityType || !entityId) return { events: [] };
    return this.auditService.findByEntity(entityType, entityId);
  }
}
