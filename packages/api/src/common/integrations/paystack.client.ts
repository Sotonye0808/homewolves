import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PaystackInitializeParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerificationResult {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paidAt?: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Thin wrapper around the Paystack REST API.
 *
 * Configuration is driven entirely by environment variables:
 *  - `PAYSTACK_SECRET_KEY` — enables live/mock provider calls
 *  - `PAYSTACK_CALLBACK_URL` — optional callback used on initialize
 *
 * When the secret key is absent the client is disabled (`isConfigured === false`).
 * All callers must branch on `isConfigured` so the platform degrades gracefully
 * in development/staging rather than failing hard.
 */
@Injectable()
export class PaystackClient {
  private readonly logger = new Logger(PaystackClient.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';

  get isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.isConfigured) {
      throw new BadGatewayException('Paystack is not configured');
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
    } catch {
      throw new BadGatewayException('Paystack is unreachable');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`Paystack request failed (${res.status}): ${text.slice(0, 300)}`);
      throw new BadGatewayException('Paystack request failed');
    }

    return res.json() as Promise<T>;
  }

  async initializeTransaction(params: PaystackInitializeParams): Promise<PaystackInitResult | null> {
    if (!this.isConfigured) return null;

    const json = await this.request<{ status: boolean; data?: PaystackInitResult }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        callback_url: params.callbackUrl ?? process.env.PAYSTACK_CALLBACK_URL,
        metadata: params.metadata,
      }),
    });

    if (!json.status || !json.data) {
      throw new BadGatewayException('Paystack could not initialize transaction');
    }

    return json.data;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerificationResult | null> {
    if (!this.isConfigured) return null;

    const json = await this.request<{ status: boolean; data?: PaystackVerificationResult }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (!json.status || !json.data) {
      throw new BadGatewayException('Paystack could not verify transaction');
    }

    return json.data;
  }

  /**
   * Verifies a Paystack webhook `x-paystack-signature` header against the raw
   * request body using HMAC-SHA512. When the client is not configured the
   * signature is not enforced (dev mode) — callers should log this state.
   */
  verifyWebhookSignature(rawBody: string, signature?: string | string[]): boolean {
    if (!this.isConfigured) return true;
    if (!signature) return false;

    const provided = Array.isArray(signature) ? signature[0] : signature;
    const hash = crypto.createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    return hash === provided;
  }
}
