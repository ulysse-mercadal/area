import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GoogleAuthController } from './googleauth.controller';
import { GoogleAuthService } from './googleauth.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './googleauth.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService, GoogleStrategy],
  exports: [GoogleAuthService],
})
export class GoogleauthModule {}
