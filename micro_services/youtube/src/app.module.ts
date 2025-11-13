import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AreaModule } from './area/area.module';
import { CredentialsModule } from './credentials/credentials.module';
import { YoutubeModule } from './youtube/youtube.module';

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
        YoutubeModule,
    ],
})
export class AppModule { }
