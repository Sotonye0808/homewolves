import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { EmailService } from './modules/email/email.service';
import { Logger } from '@nestjs/common';
import { resolveJwtSecret } from './common/config/env';

async function bootstrap() {
  // Fail fast on missing security-critical config in production.
  resolveJwtSecret();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Seed default config-driven email templates (guarded — no-op when stable).
  try {
    const emailService = app.get(EmailService);
    const seeded = await emailService.seedDefaultsIfEmpty();
    if (seeded > 0) Logger.log(`Seeded ${seeded} default email template(s)`, 'Bootstrap');
  } catch {
    // DB unavailable at boot — fallback templates will be used until it is.
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Homewolves API running on http://localhost:${port}`);
}
bootstrap();
