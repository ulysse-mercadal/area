import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DiscordAuthController } from './auth/discord-auth.controller';
import { DiscordAuthService } from './auth/discord-auth.service';
import { ExecutorController } from './executor/executor.controller';
import { ExecutorService } from './executor/executor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CredentialsService } from '../credentials/credientials.service';
import { DiscordGatewayService } from './webhook/discord.gateway.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        HttpModule.register({
            timeout: 10000,
            maxRedirects: 5,
        }),
    ],
    controllers: [
        DiscordAuthController,
        ExecutorController,
    ],
    providers: [
        DiscordAuthService,
        ExecutorService,
        PrismaService,
        AuthService,
        CredentialsService,
        DiscordGatewayService
    ],
})
export class DiscordModule { }
