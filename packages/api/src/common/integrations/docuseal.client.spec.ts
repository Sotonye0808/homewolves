import { describe, it, expect, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import { DocuSealClient } from './docuseal.client';

const SECRET = 'whsec_test_secret';

function sign(rawBody: string, timestampSec?: number): string {
  const ts = timestampSec ?? Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', SECRET).update(`${ts}.${rawBody}`).digest('hex');
  return `${ts}.${sig}`;
}

describe('DocuSealClient.verifyWebhookSignature', () => {
  let client: DocuSealClient;

  beforeEach(() => {
    process.env.DOCUSEAL_WEBHOOK_SECRET = SECRET;
    client = new DocuSealClient();
  });

  it('accepts a valid signature', () => {
    const body = JSON.stringify({ external_id: 'sub-1', status: 'completed' });
    expect(client.verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ external_id: 'sub-1', status: 'completed' });
    const tampered = JSON.stringify({ external_id: 'sub-1', status: 'declined' });
    expect(client.verifyWebhookSignature(tampered, sign(body))).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(client.verifyWebhookSignature('{}', undefined)).toBe(false);
  });

  it('rejects a stale timestamp (replay) older than 5 minutes', () => {
    const body = JSON.stringify({ external_id: 'sub-1', status: 'completed' });
    const stale = sign(body, Math.floor(Date.now() / 1000) - 301);
    expect(client.verifyWebhookSignature(body, stale)).toBe(false);
  });

  it('accepts a recent timestamp inside the 5 minute window', () => {
    const body = JSON.stringify({ external_id: 'sub-1', status: 'completed' });
    const fresh = sign(body, Math.floor(Date.now() / 1000) - 120);
    expect(client.verifyWebhookSignature(body, fresh)).toBe(true);
  });

  it('does not enforce the signature when the secret is unset (dev mode)', () => {
    delete process.env.DOCUSEAL_WEBHOOK_SECRET;
    const devClient = new DocuSealClient();
    expect(devClient.verifyWebhookSignature('{}', 'garbage')).toBe(true);
  });

  it('rejects malformed header format', () => {
    const body = JSON.stringify({ external_id: 'sub-1', status: 'completed' });
    expect(client.verifyWebhookSignature(body, 'not-a-signature')).toBe(false);
  });
});