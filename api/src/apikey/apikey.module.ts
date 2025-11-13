import { Module } from '@nestjs/common';
import { ApiKeyController } from './apikey.controller';
import { ApiKeyService } from './apikey.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
    controllers: [ApiKeyController],
    providers: [ApiKeyService, AuthService, PrismaService],
    exports: [ApiKeyService],
})
export class ApiKeyModule {}
