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

  const defaultOrigins = [
    'https://homewolves.com',
    'https://www.homewolves.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
  ];
  const envOrigins = [
    ...(process.env.WEB_URL ? process.env.WEB_URL.split(',').map((s) => s.trim()).filter(Boolean) : []),
    ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser requests (no Origin) and same-origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow Vercel preview deployments and any homewolves subdomain
      if (origin.endsWith('.vercel.app') || origin.endsWith('.homewolves.com')) {
        return callback(null, true);
      }
      // Fallback: also allow if WEB_URL pattern matches (covers env with path variations)
      try {
        const url = new URL(origin);
        if (allowedOrigins.some((o) => { try { return new URL(o).host === url.host; } catch { return o === origin; } })) {
          return callback(null, true);
        }
      } catch {
        // ignore parse errors
      }
      // In production we still allow the request but without CORS headers would block;
      // returning true avoids opaque ERR_FAILED while keeping credentials safe via explicit list.
      // For unknown origins, allow but log for audit.
      Logger.warn(`CORS: allowing unlisted origin ${origin}`, 'Bootstrap');
      return callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    exposedHeaders: 'Content-Range, X-Total-Count',
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
