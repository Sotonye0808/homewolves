import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { users, referrals } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('AuthService', () => {
  let service: AuthService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let referralsService: { ensureCodeForNewUser: MockFn };
  let jwtService: { sign: MockFn };

  const user = {
    id: 'u-1',
    email: 'a@b.com',
    role: 'BUYER',
    firstName: 'A',
    lastName: 'B',
    verified: true,
    avatar: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    referralsService = { ensureCodeForNewUser: vi.fn().mockResolvedValue('CODE1234') };
    jwtService = { sign: vi.fn().mockReturnValue('access-token') };
    service = new AuthService(
      mocks.db,
      jwtService as never,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      referralsService as unknown as ReferralsService,
    );
  });

  describe('register', () => {
    it('throws ConflictException for a duplicate email', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'u-1' }]));
      await expect(service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' })).rejects.toThrow('Email already registered');
    });

    it('issues an OTP for a new email', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      expect(result.message).toBe('OTP sent');
      expect(result.otp).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyOtp', () => {
    it('rejects an unknown email', async () => {
      await expect(service.verifyOtp({ email: 'x@y.com', otp: '123456' })).rejects.toThrow('OTP expired or not found');
    });

    it('rejects a wrong OTP', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      await expect(service.verifyOtp({ email: 'a@b.com', otp: '000000' })).rejects.toThrow('Invalid OTP');
    });

    it('verifies a valid OTP and returns tokens', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const result = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OTP_VERIFIED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('u-1', 'BUYER', 'daily_login', expect.anything());
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeTruthy();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await expect(service.login({ email: 'x@y.com' })).rejects.toThrow('No account found with this email');
    });

    it('issues an OTP for an existing user', async () => {
      mocks.select.mockReturnValue(createChain([user]));
      const result = await service.login({ email: 'a@b.com' });
      expect(result.message).toBe('OTP sent');
      expect(result.otp).toMatch(/^\d{6}$/);
    });
  });

  describe('completeProfile', () => {
    it('updates an existing user with a chosen role', async () => {
      mocks.select.mockReturnValue(createChain([{ ...user, role: 'AGENT' }]));
      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([{ ...user, role: 'AGENT', firstName: 'Ada', lastName: 'Okon' }], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.completeProfile({
        email: 'a@b.com',
        firstName: 'Ada',
        lastName: 'Okon',
        phone: '0801',
        role: 'AGENT',
      });

      expect(mocks.update).toHaveBeenCalledWith(users);
      expect(setArgs[0]).toMatchObject({ role: 'AGENT' });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_COMPLETED' }));
      expect(result.accessToken).toBe('access-token');
    });

    it('creates a new user, ensures a referral code, and applies an optional referral', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValueOnce(createChain([{ id: 'agent-9', firstName: 'Agent', lastName: 'Nine', role: 'AGENT', referralCode: 'AGENT999' }]));

      const updateSet: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') updateSet.push(args[0] as Record<string, unknown>);
        }),
      );

      const insertValues: Array<Record<string, unknown>> = [];
      mocks.insert
        .mockReturnValueOnce(
          createChain([{ ...user, id: 'u-new', email: 'new@b.com', referralCode: 'CODE1234' }], (method, args) => {
            if (method === 'values') insertValues.push(args[0] as Record<string, unknown>);
          }),
        )
        .mockReturnValueOnce(
          createChain([{ id: 'r-1', code: 'AGENT999', referrerId: 'agent-9', referredId: 'u-new', status: 'active' }], (method, args) => {
            if (method === 'values') insertValues.push(args[0] as Record<string, unknown>);
          }),
        );

      const result = await service.completeProfile({
        email: 'new@b.com',
        firstName: 'New',
        lastName: 'User',
        phone: '0802',
        referralCode: 'agent999',
      });

      expect(mocks.insert).toHaveBeenNthCalledWith(1, users);
      expect(mocks.insert).toHaveBeenNthCalledWith(2, referrals);
      expect(insertValues[0]).toMatchObject({ referralCode: 'CODE1234' });
      expect(updateSet[0]).toEqual({ referredById: 'agent-9' });
      expect(insertValues[1]).toMatchObject({ code: 'AGENT999', referrerId: 'agent-9', referredId: 'u-new' });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_COMPLETED' }));
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an invalid referral code', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([]));
      mocks.insert.mockReturnValue(createChain([{ ...user, id: 'u-new', role: 'BUYER' }]));

      await expect(
        service.completeProfile({
          email: 'new@b.com',
          firstName: 'New',
          lastName: 'User',
          phone: '0802',
          referralCode: 'NOPE123',
        }),
      ).rejects.toThrow('Invalid referral code');
    });
  });

  describe('refreshToken / logout', () => {
    it('throws for an unknown refresh token', async () => {
      await expect(service.refreshToken('not-a-token')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('rotates a valid refresh token', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      const rotated = await service.refreshToken(verified.refreshToken);

      expect(rotated.accessToken).toBe('access-token');
      expect(rotated.refreshToken).toBeTruthy();
      expect(rotated.refreshToken).not.toBe(verified.refreshToken);
    });

    it('logs out by revoking the users refresh tokens', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      await service.logout('u-1');
      await expect(service.refreshToken(verified.refreshToken)).rejects.toThrow('Invalid or expired refresh token');
    });
  });
});
