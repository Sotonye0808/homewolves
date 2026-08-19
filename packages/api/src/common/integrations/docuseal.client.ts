import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface DocuSealSigner {
  email: string;
  name: string;
  role?: string;
}

export interface DocuSealCreateParams {
  documentId?: string;
  templateId?: string;
  signers: DocuSealSigner[];
  message?: string;
}

export interface DocuSealSubmissionResult {
  submissionId: string;
  embedUrl: string;
  status: string;
}

/**
 * Thin wrapper around the DocuSeal REST API for e-signature submissions.
 *
 * Configuration is driven entirely by environment variables:
 *  - `DOCUSEAL_API_URL` — base URL of the DocuSeal instance
 *  - `DOCUSEAL_API_KEY` — API key for the DocuSeal instance
 *  - `DOCUSEAL_WEBHOOK_SECRET` — HMAC secret used to verify inbound webhooks
 *
 * When either API var is absent the client is disabled (`isConfigured === false`).
 * Callers must branch on `isConfigured` and fall back to the local
 * signature-request flow so the platform degrades gracefully.
 */
@Injectable()
export class DocuSealClient {
  private readonly logger = new Logger(DocuSealClient.name);
  private readonly apiUrl = (process.env.DOCUSEAL_API_URL ?? '').replace(/\/$/, '');
  private readonly apiKey = process.env.DOCUSEAL_API_KEY ?? '';
  private readonly webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET ?? '';

  get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.isConfigured) {
      throw new BadGatewayException('DocuSeal is not configured');
    }

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
    } catch {
      throw new BadGatewayException('DocuSeal is unreachable');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`DocuSeal request failed (${res.status}): ${text.slice(0, 300)}`);
      throw new BadGatewayException('DocuSeal request failed');
    }

    return res.json() as Promise<T>;
  }

  async createSubmission(params: DocuSealCreateParams): Promise<DocuSealSubmissionResult | null> {
    if (!this.isConfigured) return null;

    const payload: Record<string, unknown> = {
      signers: params.signers.map((s) => ({
        email: s.email,
        name: s.name,
        ...(s.role ? { role: s.role } : {}),
      })),
      ...(params.message ? { message: params.message } : {}),
    };
    if (params.templateId) {
      payload.template_id = params.templateId;
    } else if (params.documentId) {
      payload.document_id = params.documentId;
    } else {
      throw new BadGatewayException('DocuSeal submission requires a document or template id');
    }

    const json = await this.request<{ id: string; status: string; url?: string }>('/api/v1/submissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const embedUrl = json.url ?? `${this.apiUrl}/s/${json.id}`;
    return { submissionId: json.id, embedUrl, status: json.status };
  }

  async getSubmission(submissionId: string): Promise<{ id: string; status: string } | null> {
    if (!this.isConfigured) return null;

    const json = await this.request<{ id: string; status: string }>(`/api/v1/submissions/${encodeURIComponent(submissionId)}`);
    return { id: json.id, status: json.status };
  }

  /**
   * Verifies a DocuSeal webhook `X-Docuseal-Signature` header against the raw
   * request body.
   *
   * DocuSeal signs every webhook as `[timestamp].[signature]` where the
   * signature is the hex HMAC-SHA256 of `${timestamp}.${rawBody}` using the
   * webhook secret (`whsec_…`). Requests older than 5 minutes are rejected to
   * block replay attacks. When `DOCUSEAL_WEBHOOK_SECRET` is unset the signature
   * is not enforced (dev mode) — callers should log this state.
   */
  verifyWebhookSignature(rawBody: string, signature?: string | string[]): boolean {
    if (!this.webhookSecret) return true;
    if (!signature) return false;

    const header = Array.isArray(signature) ? signature[0] : signature;
    if (!header) return false;
    const [timestamp, sig] = header.split('.', 2);
    if (!timestamp || !sig) return false;

    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (Number.isNaN(age) || age > 300) return false;

    const expected = crypto.createHmac('sha256', this.webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
