import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [MicrosoftController],
  providers: [MicrosoftService],
  exports: [MicrosoftService],
})
export class MicrosoftAuthModule {}
