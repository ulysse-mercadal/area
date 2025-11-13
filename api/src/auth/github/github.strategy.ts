import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_REDIRECT_URI, // ex: http://localhost:3000/api/auth/github/callback
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { id, username, photos, emails } = profile;
    const user = {
      githubId: id,
      username,
      email: emails?.[0]?.value,
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
