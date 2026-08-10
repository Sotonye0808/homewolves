import { Injectable, Logger, BadGatewayException } from '@nestjs/common';

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
 *
 * When either is absent the client is disabled (`isConfigured === false`).
 * Callers must branch on `isConfigured` and fall back to the local
 * signature-request flow so the platform degrades gracefully.
 */
@Injectable()
export class DocuSealClient {
  private readonly logger = new Logger(DocuSealClient.name);
  private readonly apiUrl = (process.env.DOCUSEAL_API_URL ?? '').replace(/\/$/, '');
  private readonly apiKey = process.env.DOCUSEAL_API_KEY ?? '';

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
}
