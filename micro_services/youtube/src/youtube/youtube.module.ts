import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { youtubeAuthController } from './auth/youtube-auth.controller';
import { youtubeAuthService } from './auth/youtube-auth.service';
import { ExecutorController } from './executor/executor.controller';
import { ExecutorService } from './executor/executor.service';

@Module({
    imports: [HttpModule],
    controllers: [youtubeAuthController, ExecutorController],
    providers: [youtubeAuthService, ExecutorService],
    exports: [youtubeAuthService],
})
export class YoutubeModule { }
