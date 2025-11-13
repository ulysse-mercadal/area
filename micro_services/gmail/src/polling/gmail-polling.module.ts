import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GmailPollingService } from './gmail-polling.service';
import { googleSheetsModule } from '../gmail/gmail.module';

@Module({
    imports: [HttpModule, googleSheetsModule],
    providers: [GmailPollingService],
})
export class PollingModule { }
