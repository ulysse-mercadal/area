import { Controller, Get, Post, Query, Res, BadRequestException, Redirect, Param } from '@nestjs/common';
import { SpotifyService } from './spotifyAuth.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('login')
  @Redirect()
  login() {
    const url = this.spotifyService.getAuthUrl();
    return { url };
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
  const token = await this.spotifyService.exchangeCodeForToken(code);
  await this.spotifyService.addSpotifyToken(1, token.access_token, token.refresh_token, token.expires_in);
    const tokenData = await this.spotifyService.getValidAccessToken(1);

    return {
      Status: "redirected by spotify",
    }
  }

  @Get('music/:itemname')
  async getMusic(@Param('itemname') itemname: string) {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const song_id = await this.spotifyService.getMusic(itemname, tokenData);
    return {
      song: song_id,
    };
  }

  @Get('follow/:itemname')
  async followPlaylist(@Param('itemname') itemname: string) {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    await this.spotifyService.followPlaylist(itemname, tokenData);
    return {
      status: "ok",
    };
  }

  @Get('unfollow/:itemname')
  async unfollowPlaylist(@Param('itemname') itemname: string) {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    await this.spotifyService.unfollowPlaylist(itemname, tokenData);
    return {
      status: "ok",
    };
  }

  @Get('playlist/:itemname')
  async getPlaylist(@Param('itemname') itemname: string) {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const playlist_id = await this.spotifyService.getPlaylist(itemname, tokenData);
    return {
      playlist: playlist_id,
    };
  }

  @Get('album/:itemname')
  async getAlbum(@Param('itemname') itemname: string) {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const album_id = await this.spotifyService.getAlbum(itemname, tokenData);
    return {
      album: album_id,
    };
  }


  @Get('user/tracks')
  async getUserTracks() {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const tracks = await this.spotifyService.getTopTracks(tokenData);
    return { tracks: tracks }
  }

  @Get('user/artists')
  async getUserArtists() {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const artist = await this.spotifyService.getTopArtists(tokenData);
    return { artist: artist }
  }

  @Get('user/player')
  async getPlayerState() {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const info = await this.spotifyService.getPlayerState(tokenData);
    return { PlayerState: info }
  }

  @Get('user/profile')
  async getUserProfile() {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    const profile = await this.spotifyService.getUserProfile(tokenData);
    return { user: profile }
  }

  @Get('user/player/skip')
  async SkipTrack() {
    const tokenData = await this.spotifyService.getValidAccessToken(1);
    await this.spotifyService.skipMusic(tokenData);
    return { status: "ok" }

  }

}
