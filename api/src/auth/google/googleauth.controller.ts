import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { GoogleAuthService } from './googleauth.service';
import { AuthGuard } from '@nestjs/passport';

const FRONT_URL = process.env.FRONTEND_URL;

@Controller('auth')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirige vers Google automatiquement
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const jwt = await this.googleAuthService.loginWithGoogle(req.user);
    res.redirect(`${FRONT_URL}/login/authorize?token=${jwt}`);
  }
}
