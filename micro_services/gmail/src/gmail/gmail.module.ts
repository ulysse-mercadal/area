import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GmailAuthController } from './auth/gmail-auth.controller';
import { GmailAuthService } from './auth/gmail-auth.service';
import { GmailExecutorController } from './executor/executor.controller';
import { GmailExecutorService } from './executor/executor.service';

@Module({
    imports: [HttpModule],
    controllers: [GmailAuthController, GmailExecutorController],
    providers: [GmailAuthService, GmailExecutorService],
    exports: [GmailAuthService],
})
export class googleSheetsModule { }
