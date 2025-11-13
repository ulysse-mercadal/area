import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { GithubAuthService } from './github.service';
import { AuthGuard } from '@nestjs/passport';

const FRONT_URL = process.env.FRONTEND_URL;

@Controller('auth')
export class GithubAuthController {
  constructor(private readonly githubAuthService: GithubAuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res) {
    const jwt = await this.githubAuthService.loginWithGithub(req.user);
    res.redirect(`${FRONT_URL}/login/authorize?token=${jwt}`);
  }
}
