import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Throttle, AUTH_THROTTLE } from '../../common/rate-limit/throttle.decorator';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  CompleteProfileDto,
  RefreshTokenDto,
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  completeProfileSchema,
  refreshTokenSchema,
} from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @Throttle(AUTH_THROTTLE)
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('complete-profile')
  @Throttle(AUTH_THROTTLE)
  completeProfile(@Body(new ZodValidationPipe(completeProfileSchema)) dto: CompleteProfileDto) {
    return this.authService.completeProfile(dto);
  }

  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@Req() req: any) {
    return this.authService.logout(req.user?.sub);
  }
}
