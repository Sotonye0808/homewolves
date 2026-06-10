import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PlatformConfigService implements OnModuleInit {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly TTL = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.warmCache();
  }

  private async warmCache() {
    try {
      const configs = await this.prisma.platformConfig.findMany();
      for (const config of configs) {
        this.cache.set(config.key, {
          value: config.value,
          expiresAt: Date.now() + this.TTL,
        });
      }
    } catch {
      // DB not available — cache stays cold, fallbacks will be used
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    try {
      const config = await this.prisma.platformConfig.findUnique({ where: { key } });
      if (config) {
        this.cache.set(key, {
          value: config.value,
          expiresAt: Date.now() + this.TTL,
        });
        return config.value as T;
      }
    } catch {
      return null;
    }

    return null;
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const configs = await this.prisma.platformConfig.findMany();
      return configs.reduce(
        (acc, c) => {
          acc[c.key] = c.value;
          return acc;
        },
        {} as Record<string, unknown>,
      );
    } catch {
      return {};
    }
  }

  async set(key: string, value: unknown, updatedById: string): Promise<void> {
    const json = value as Prisma.InputJsonValue;
    await this.prisma.platformConfig.upsert({
      where: { key },
      update: { value: json, updatedById },
      create: { key, value: json, updatedById },
    });
    this.cache.set(key, { value, expiresAt: Date.now() + this.TTL });
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}
