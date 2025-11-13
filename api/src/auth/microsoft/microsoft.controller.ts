import { Controller, Get, Req, Res } from '@nestjs/common';
import { cca } from './msal.client';
import { MicrosoftService } from './microsoft.service';

const FRONT_URL = process.env.FRONTEND_URL;
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!;
const SCOPES = ['openid','profile','User.Read','offline_access'];

@Controller('auth')
export class MicrosoftController {
  constructor(private readonly microsoftService: MicrosoftService) {}

  @Get('microsoft')
  async microsoftLogin(@Res() res) {
    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    };
    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
    return res.redirect(authUrl);
  }

  @Get('microsoft/callback')
  async microsoftCallback(@Req() req, @Res() res) {
    const { default: fetch } = await import('node-fetch');
    const tokenRequest = {
      code: req.query.code as string,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    };

    try {
      const tokenResponse = await cca.acquireTokenByCode(tokenRequest);
      const accessToken = tokenResponse?.accessToken;
      const r = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await r.json();

      const jwt = await this.microsoftService.loginWithMicrosoft(profile);

      res.redirect(`${FRONT_URL}/login/authorize?token=${jwt}`);
    } catch (e) {
      console.error(e);
      return res.redirect(`${FRONT_URL}/login?error=auth_failed`);
    }
  }
}
