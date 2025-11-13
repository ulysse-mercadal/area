import { Module } from '@nestjs/common';
import { NodeService } from './node.service';
import { NodeController } from './node.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { LogicExecutorModule } from 'src/logic-executor/logic-executor.module';

@Module({
    imports: [PrismaModule, AuthModule, HttpModule, LogicExecutorModule],
    controllers: [NodeController],
    providers: [NodeService],
    exports: [NodeService],
})
export class NodeModule { }
