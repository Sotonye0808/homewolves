import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

/**
 * Config-driven transactional email module (Resend).
 *
 * `@Global` so feature services (auth, transactions, subscriptions, etc.) can
 * inject `EmailService` without importing the module. Templates live in the
 * `EmailTemplate` table (admin-editable via the web GUI) with hardcoded
 * fallbacks; every send is recorded in `EmailLog`.
 */
@Global()
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}