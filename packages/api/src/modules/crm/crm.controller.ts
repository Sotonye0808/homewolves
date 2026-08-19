import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateClientDto, createClientSchema } from './dto/create-client.dto';
import { UpdateClientDto, updateClientSchema } from './dto/update-client.dto';
import { CreateNoteDto, createNoteSchema } from './dto/create-note.dto';
import { CreateRatingDto, createRatingSchema } from './dto/create-rating.dto';
import { CreateInspectionDto, createInspectionSchema } from './dto/create-inspection.dto';
import { UpdateInspectionDto, updateInspectionSchema } from './dto/update-inspection.dto';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';

@Controller('crm')
@UseGuards(JwtGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  // ─── CLIENTS ─────────────────────────────────────────────

  @Post('clients')
  createClient(@Body(new ZodValidationPipe(createClientSchema)) dto: CreateClientDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.createClient(dto, req.user.sub, toActor(req));
  }

  @Get('clients')
  getClients(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.crmService.getClients(req.user.sub, { status, search });
  }

  @Get('clients/:id')
  getClient(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.crmService.getClientById(id, req.user.sub);
  }

  @Put('clients/:id')
  updateClient(@Param('id') id: string, @Body(new ZodValidationPipe(updateClientSchema)) dto: UpdateClientDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.updateClient(id, dto, req.user.sub, toActor(req));
  }

  // ─── NOTES ───────────────────────────────────────────────

  @Post('clients/:clientId/notes')
  addNote(@Param('clientId') clientId: string, @Body(new ZodValidationPipe(createNoteSchema)) dto: CreateNoteDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.addNote(clientId, dto, req.user.sub, toActor(req));
  }

  @Get('clients/:clientId/notes')
  getNotes(@Param('clientId') clientId: string, @Req() req: AuthenticatedRequest) {
    return this.crmService.getNotes(clientId, req.user.sub);
  }

  // ─── RATINGS ─────────────────────────────────────────────

  @Post('clients/:clientId/ratings')
  addRating(@Param('clientId') clientId: string, @Body(new ZodValidationPipe(createRatingSchema)) dto: CreateRatingDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.addRating(clientId, dto, req.user.sub, toActor(req));
  }

  @Get('clients/:clientId/ratings')
  getRatings(@Param('clientId') clientId: string, @Req() req: AuthenticatedRequest) {
    return this.crmService.getRatings(clientId, req.user.sub);
  }

  // ─── INSPECTIONS ─────────────────────────────────────────

  @Post('inspections')
  createInspection(@Body(new ZodValidationPipe(createInspectionSchema)) dto: CreateInspectionDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.createInspection(dto, req.user.sub, toActor(req));
  }

  @Get('inspections')
  getInspections(@Req() req: AuthenticatedRequest, @Query('date') date?: string) {
    return this.crmService.getInspections(req.user.sub, date);
  }

  @Put('inspections/:id')
  updateInspection(@Param('id') id: string, @Body(new ZodValidationPipe(updateInspectionSchema)) dto: UpdateInspectionDto, @Req() req: AuthenticatedRequest) {
    return this.crmService.updateInspection(id, dto, req.user.sub, toActor(req));
  }

  // ─── DASHBOARD ───────────────────────────────────────────

  @Get('dashboard/stats')
  getDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.crmService.getDashboardStats(req.user.sub);
  }

  @Get('dashboard/recent-clients')
  getRecentClients(@Req() req: AuthenticatedRequest) {
    return this.crmService.getRecentClients(req.user.sub);
  }
}
