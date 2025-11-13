import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ApiKeyModule } from '../apikey/apikey.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        ApiKeyModule,
        HttpModule
    ],
    controllers: [CredentialsController],
    providers: [CredentialsService],
    exports: [CredentialsService]
})
export class CredentialsModule {}
