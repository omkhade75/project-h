import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterUserSchema, LoginUserSchema, RefreshTokenSchema } from '../validators/auth.validator';
import { ResponseUtil } from '../utils/response.util';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    const validated = RegisterUserSchema.parse(body);
    const result = await this.authService.register(validated as any);
    return ResponseUtil.success(result, 'Registration successful');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const validated = LoginUserSchema.parse(body);
    const result = await this.authService.login(validated as any);
    return ResponseUtil.success(result, 'Login successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    const validated = RefreshTokenSchema.parse(body);
    const result = await this.authService.refreshToken(validated.refreshToken);
    return ResponseUtil.success(result, 'Access token refreshed successfully');
  }
}
