import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const updateConfigSchema = z
  .object({
    value: z.unknown(),
    updatedById: z.string().min(1).max(64),
  })
  .strict();

@Controller('config')
export class PlatformConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  @Get()
  async getAll(): Promise<Record<string, unknown>> {
    return this.configService.getAll();
  }

  @Get(':key')
  async get(@Param('key') key: string): Promise<unknown> {
    const value = await this.configService.get<unknown>(key);
    return { key, value };
  }

  @Put(':key')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateConfigSchema))
    body: { value: unknown; updatedById: string },
  ): Promise<void> {
    await this.configService.set(key, body.value, body.updatedById);
  }
}
