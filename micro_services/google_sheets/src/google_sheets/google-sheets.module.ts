import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleSheetsAuthController } from './auth/google-sheets-auth.controller';
import { GoogleSheetsAuthService } from './auth/google-sheets-auth.service';
import { GoogleSheetsExecutorController } from './executor/executor.controller';
import { GoogleSheetsExecutorService } from './executor/executor.service';

@Module({
    imports: [HttpModule],
    controllers: [GoogleSheetsAuthController, GoogleSheetsExecutorController],
    providers: [GoogleSheetsAuthService, GoogleSheetsExecutorService],
    exports: [GoogleSheetsAuthService],
})
export class googleSheetsModule { }
