import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpotifyService } from './spotifyAuth.service';
import { SpotifyController } from './spotifyAuth.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [SpotifyService],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
