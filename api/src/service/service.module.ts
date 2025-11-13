import { Module } from '@nestjs/common';
import { ServicesController } from './service.controller';
import { ServicesService } from './service.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Module({
    controllers: [ServicesController],
    providers: [ServicesService, PrismaService, AuthService],
    exports: [ServicesService],
})
export class ServicesModule {}
