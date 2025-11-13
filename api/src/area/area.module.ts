import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { AuthService } from '../auth/auth.service';
import { CredentialsService } from '../credentials/credentials.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AreaController],
    providers: [AreaService, AuthService, CredentialsService, PrismaService],
})
export class AreaModule {}
