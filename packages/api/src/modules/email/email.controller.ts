import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  UpsertEmailTemplateDto,
  PreviewEmailTemplateDto,
  upsertEmailTemplateSchema,
  previewEmailTemplateSchema,
} from './dto/email-template.dto';

@Controller('email-templates')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('seed')
  seed() {
    return this.emailService.seedDefaultsIfEmpty();
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  list() {
    return this.emailService.listTemplates();
  }

  @Post('preview')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  preview(@Body(new ZodValidationPipe(previewEmailTemplateSchema)) dto: PreviewEmailTemplateDto) {
    return this.emailService.renderPreview(dto);
  }

  @Put(':key')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  upsert(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(upsertEmailTemplateSchema)) dto: UpsertEmailTemplateDto,
  ) {
    return this.emailService.upsertTemplate({ ...dto, key });
  }
}