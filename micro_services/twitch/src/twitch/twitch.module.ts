import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TwitchAuthController } from './auth/twitch-auth.controller';
import { TwitchAuthService } from './auth/twitch-auth.service';
import { ExecutorController } from './executor/executor.controller';
import { ExecutorService } from './executor/executor.service';
import { TwitchEventSubService } from './webhook/twitch-eventsub.service';
import { TwitchEventSubController } from './webhook/twitch-eventsub.controller';

@Module({
    imports: [HttpModule],
    controllers: [TwitchAuthController, ExecutorController, TwitchEventSubController],
    providers: [
        TwitchAuthService,
        ExecutorService,
        TwitchEventSubService
    ],
    exports: [TwitchAuthService],
})
export class TwitchModule { }
