import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AreaModule } from './area/area.module';
import { CredentialsModule } from './credentials/credentials.module';
import { SpotifyModule } from './spotify/spotify.module';
import { PollingModule } from './polling/spotify-polling.module';

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
        SpotifyModule,
        PollingModule,
    ],
})
export class AppModule { }
