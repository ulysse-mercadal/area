import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LogicExecutorController } from './logic-executor.controller';
import { LogicExecutorService } from './logic-executor.service';

@Module({
    imports: [HttpModule],
    controllers: [LogicExecutorController],
    providers: [LogicExecutorService],
    exports: [LogicExecutorService],
})
export class LogicExecutorModule {}
