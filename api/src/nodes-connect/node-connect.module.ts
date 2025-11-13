import { Module } from '@nestjs/common';
import { NodeConnectionService } from './node-connect.service';
import { NodeConnectionController } from './node-connect.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [NodeConnectionController],
    providers: [NodeConnectionService],
    exports: [NodeConnectionService],
})
export class NodeConectionModule { }
