import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleSheetsPollingService } from './google-sheet-polling.service';
import { googleSheetsModule } from '../google_sheets/google-sheets.module';

@Module({
    imports: [HttpModule, googleSheetsModule],
    providers: [GoogleSheetsPollingService],
})
export class PollingModule { }
