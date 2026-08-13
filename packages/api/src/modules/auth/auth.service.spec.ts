import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let referralsService: { ensureCodeForNewUser: MockFn };
  let jwtService: { sign: MockFn };

  const userFindUnique = vi.fn();
  const userCreate = vi.fn();
  const userUpdate = vi.fn();
  const referralCreate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      user: { findUnique: userFindUnique, create: userCreate, update: userUpdate },
      referral: { create: referralCreate },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    referralsService = { ensureCodeForNewUser: vi.fn().mockResolvedValue('CODE1234') };
    jwtService = { sign: vi.fn().mockReturnValue('access-token') };
    service = new AuthService(
      prisma,
      jwtService as never,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      referralsService as unknown as ReferralsService,
    );
  });

  describe('register', () => {
    it('throws ConflictException for a duplicate email', async () => {
      userFindUnique.mockResolvedValue({ id: 'u-1' });
      await expect(service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' })).rejects.toThrow('Email already registered');
    });

    it('issues an OTP for a new email', async () => {
      userFindUnique.mockResolvedValue(null);
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
      await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      await expect(service.verifyOtp({ email: 'a@b.com', otp: '000000' })).rejects.toThrow('Invalid OTP');
    });

    it('verifies a valid OTP and returns tokens', async () => {
      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'BUYER', firstName: 'A', lastName: 'B' });

      const result = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OTP_VERIFIED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('u-1', 'BUYER', 'daily_login', expect.anything());
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeTruthy();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      userFindUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@y.com' })).rejects.toThrow('No account found with this email');
    });

    it('issues an OTP for an existing user', async () => {
      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com' });
      const result = await service.login({ email: 'a@b.com' });
      expect(result.message).toBe('OTP sent');
      expect(result.otp).toMatch(/^\d{6}$/);
    });
  });

  describe('completeProfile', () => {
    it('updates an existing user with a chosen role', async () => {
      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'BUYER', firstName: 'A', lastName: 'B' });
      userUpdate.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'AGENT', firstName: 'A', lastName: 'B' });
      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'AGENT', firstName: 'A', lastName: 'B' });

      const result = await service.completeProfile({
        email: 'a@b.com',
        firstName: 'Ada',
        lastName: 'Okon',
        phone: '0801',
        role: 'AGENT',
      });

      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u-1' }, data: expect.objectContaining({ role: 'AGENT' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_COMPLETED' }));
      expect(result.accessToken).toBe('access-token');
    });

    it('creates a new user, ensures a referral code, and applies an optional referral', async () => {
      userFindUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'agent-9', referralCode: 'AGENT999' })
        .mockResolvedValue({ id: 'u-new', email: 'new@b.com', role: 'BUYER', firstName: 'New', lastName: 'User' });
      userCreate.mockResolvedValue({ id: 'u-new', email: 'new@b.com', role: 'BUYER', firstName: 'New', lastName: 'User' });
      referralCreate.mockResolvedValue({ id: 'r-1' });

      const result = await service.completeProfile({
        email: 'new@b.com',
        firstName: 'New',
        lastName: 'User',
        phone: '0802',
        referralCode: 'agent999',
      });

      expect(userCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ referralCode: 'CODE1234' }) }),
      );
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u-new' }, data: expect.objectContaining({ referredById: 'agent-9' }) }),
      );
      expect(referralCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: 'AGENT999', referrerId: 'agent-9', referredId: 'u-new' }) }),
      );
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an invalid referral code', async () => {
      userFindUnique.mockResolvedValueOnce(null).mockResolvedValue(null);
      userCreate.mockResolvedValue({ id: 'u-new', role: 'BUYER' });

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
      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'BUYER', firstName: 'A', lastName: 'B' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      userFindUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'BUYER' });
      const rotated = await service.refreshToken(verified.refreshToken);

      expect(rotated.accessToken).toBe('access-token');
      expect(rotated.refreshToken).toBeTruthy();
      expect(rotated.refreshToken).not.toBe(verified.refreshToken);
    });

    it('logs out by revoking the users refresh tokens', async () => {
      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      userFindUnique.mockResolvedValue({ id: 'u-1', role: 'BUYER' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp });

      await service.logout('u-1');
      await expect(service.refreshToken(verified.refreshToken)).rejects.toThrow('Invalid or expired refresh token');
    });
  });
});
