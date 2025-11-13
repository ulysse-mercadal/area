import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GithubAuthController } from './github.controller';
import { GithubAuthService } from './github.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { GithubStrategy } from './github.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [GithubAuthController],
  providers: [GithubAuthService, GithubStrategy],
  exports: [GithubAuthService],
})
export class GithubauthService {}
