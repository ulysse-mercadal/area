import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ServiceAuthController } from './service-auth.controller';
import { ServiceAuthService } from './service-auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        HttpModule
    ],
    controllers: [AuthController, ServiceAuthController],
    providers: [AuthService, ServiceAuthService, PrismaService],
    exports: [AuthService, ServiceAuthService],
})
export class AuthModule {}
