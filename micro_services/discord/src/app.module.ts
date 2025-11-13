import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AreaModule } from './area/area.module';
import { CredentialsModule } from './credentials/credentials.module';
import { DiscordModule } from './discord/discord.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        HttpModule,
        PrismaModule,
        AuthModule,
        AreaModule,
        CredentialsModule,
        DiscordModule,
    ],
})
export class AppModule { }
