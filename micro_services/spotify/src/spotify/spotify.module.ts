import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpotifyAuthController } from './auth/spotify-auth.controller';
import { SpotifyAuthService } from './auth/spotify-auth.service';
import { ExecutorController } from './executor/executor.controller';
import { ExecutorService } from './executor/executor.service';

@Module({
    imports: [HttpModule],
    controllers: [SpotifyAuthController, ExecutorController],
    providers: [SpotifyAuthService, ExecutorService],
    exports: [SpotifyAuthService],
})
export class SpotifyModule { }
