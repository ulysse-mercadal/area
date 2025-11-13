import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpotifyPollingService } from './spotify-polling.service';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [HttpModule, SpotifyModule],
  providers: [SpotifyPollingService],
})
export class PollingModule {}
