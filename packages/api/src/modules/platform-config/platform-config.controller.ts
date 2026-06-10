import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';

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
  async update(
    @Param('key') key: string,
    @Body() body: { value: unknown; updatedById: string },
  ): Promise<void> {
    await this.configService.set(key, body.value, body.updatedById);
  }
}
