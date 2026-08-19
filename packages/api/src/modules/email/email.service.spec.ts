import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from './email.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { DEFAULT_EMAIL_TEMPLATES } from './email-templates.defaults';

describe('EmailService', () => {
  let service: EmailService;
  let mocks: ReturnType<typeof createDrizzleMock>;

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.SUPABASE_JWT_SECRET;
    mocks = createDrizzleMock();
    service = new EmailService(mocks.db);
  });

  describe('providerConfigured', () => {
    it('is false when RESEND_API_KEY is not set', () => {
      expect(service.providerConfigured).toBe(false);
    });

    it('is true after onModuleInit with RESEND_API_KEY set', () => {
      process.env.RESEND_API_KEY = 're_test';
      service.onModuleInit();
      expect(service.providerConfigured).toBe(true);
    });
  });

  describe('render', () => {
    it('replaces {{var}} placeholders case-insensitively', () => {
      const out = service.render('Hi {{firstName}}, code {{OTP}}', { firstName: 'Ada', otp: '123456' });
      expect(out).toBe('Hi Ada, code 123456');
    });

    it('renders missing variables as empty string', () => {
      expect(service.render('{{a}} {{b}}', { a: 'x' })).toBe('x ');
    });
  });

  describe('resolveTemplate', () => {
    it('falls back to DEFAULT_EMAIL_TEMPLATES when the DB has no row', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const t = await (service as unknown as { resolveTemplate: (k: string) => Promise<unknown> }).resolveTemplate('otp_code');
      expect((t as { id: string }).id).toBe('fallback-otp_code');
    });
  });

  describe('send', () => {
    it('skips when the template is missing or inactive', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.send('a@b.com', 'nope', {});
      expect(result.status).toBe('skipped');
    });

    it('simulates delivery when the provider is not configured', async () => {
      mocks.select.mockReturnValue(createChain([]));
      mocks.insert.mockReturnValue(createChain([{ id: 'log-1' }]));
      const result = await service.send('a@b.com', 'otp_code', { otp: '123456', firstName: 'Ada', expiresInMinutes: 10 });
      expect(result.status).toBe('simulated');
      expect(result.providerStatus).toBe('fallback');
      expect(result.emailLogId).toBe('log-1');
    });

    it('does not throw when email logging fails', async () => {
      mocks.select.mockReturnValue(createChain([]));
      mocks.insert.mockImplementation(() => {
        throw new Error('db down');
      });
      await expect(service.send('a@b.com', 'otp_code', { otp: '1', firstName: 'Ada' })).resolves.toMatchObject({
        status: 'simulated',
      });
    });
  });

  describe('seedDefaultsIfEmpty', () => {
    it('seeds all missing defaults and returns the count', async () => {
      mocks.select.mockReturnValue(createChain([{ key: 'welcome' }]));
      mocks.insert.mockReturnValue(createChain([{ id: 'x' }]));
      const count = await service.seedDefaultsIfEmpty();
      expect(count).toBe(DEFAULT_EMAIL_TEMPLATES.length - 1);
      expect(mocks.insert).toHaveBeenCalled();
    });

    it('returns 0 when every default already exists', async () => {
      mocks.select.mockReturnValue(createChain(DEFAULT_EMAIL_TEMPLATES.map((t) => ({ key: t.key }))));
      const count = await service.seedDefaultsIfEmpty();
      expect(count).toBe(0);
      expect(mocks.insert).not.toHaveBeenCalled();
    });
  });

  describe('listTemplates', () => {
    it('returns DB rows', async () => {
      mocks.select.mockReturnValue(createChain([{ key: 'otp_code' }]));
      const rows = await service.listTemplates();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.key).toBe('otp_code');
    });

    it('falls back to defaults when the DB is unreachable', async () => {
      mocks.select.mockImplementation(() => {
        throw new Error('db down');
      });
      const rows = await service.listTemplates();
      expect(rows[0]?.id).toBe('fallback-otp_code');
    });
  });
});
