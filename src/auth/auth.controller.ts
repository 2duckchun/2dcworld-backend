import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('github')
  async loginGithubOauth(@Body('authCode') authCode: string) {
    return this.authService.loginGithubOauth(authCode);
  }
}
