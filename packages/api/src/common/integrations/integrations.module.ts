import { Module, Global } from '@nestjs/common';
import { PaystackClient } from './paystack.client';
import { DocuSealClient } from './docuseal.client';

/**
 * Shared external-provider clients (Paystack, DocuSeal).
 *
 * Each client reads its own env configuration and reports `isConfigured`.
 * Feature modules consume them through DI and are expected to degrade
 * gracefully when a provider is not configured.
 */
@Global()
@Module({
  providers: [PaystackClient, DocuSealClient],
  exports: [PaystackClient, DocuSealClient],
})
export class IntegrationsModule {}
