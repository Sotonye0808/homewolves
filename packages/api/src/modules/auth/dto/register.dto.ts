export class RegisterDto {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  referralCode?: string;
  role?: string;
}

export class VerifyOtpDto {
  email: string;
  otp: string;
}

export class LoginDto {
  email: string;
}

export class CompleteProfileDto {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}
