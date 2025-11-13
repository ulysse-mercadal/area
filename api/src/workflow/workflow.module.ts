import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NodeModule } from '../nodes/node.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        NodeModule,
        HttpModule,
    ],
    controllers: [WorkflowController],
    providers: [WorkflowService],
    exports: [WorkflowService],
})
export class WorkflowModule {}
