import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SpotifyAuthService } from '../auth/spotify-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { mergeConfigAndInput, resolveValue } from './parameter-resolver';

@Injectable()
export class ExecutorService {
    private readonly logger = new Logger(ExecutorService.name);

    constructor(
        private spotifyAuth: SpotifyAuthService,
        private prisma: PrismaService,
    ) {}

    private async getAccessToken(userId: number): Promise<string> {
        const credential = await this.prisma.credential.findFirst({
            where: {
                userId,
                serviceId: 1,
            },
        });
        if (!credential) {
            throw new BadRequestException('Spotify credentials not found for user');
        }
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            this.logger.log(`Token expired for user ${userId}, refreshing...`);
            if (!credential.refreshToken) {
                throw new BadRequestException('No refresh token available');
            }
            const refreshed = await this.spotifyAuth.refreshAccessToken(credential.refreshToken);
            await this.prisma.credential.update({
                where: { id: credential.id },
                data: {
                    token: refreshed.access_token,
                    refreshToken: refreshed.refresh_token || credential.refreshToken,
                    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
                },
            });

            return refreshed.access_token;
        }

        return credential.token;
    }

    async executeAction(
        actionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing action: ${actionName}`);
        const accessToken = await this.getAccessToken(userId);
        switch (actionName) {
            case 'new_track_played':
                return input;
            case 'new_liked_song':
                return input;
            default:
                throw new BadRequestException(`Unknown action: ${actionName}`);
        }
    }

    async executeReaction(
        reactionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing reaction: ${reactionName}`);
        this.logger.log(`Config: ${JSON.stringify(config)}`);
        this.logger.log(`Input: ${JSON.stringify(input)}`);
        const accessToken = await this.getAccessToken(userId);
        const params = mergeConfigAndInput(config, input);
        switch (reactionName) {
            case 'play_music':
                return await this.playMusic(params, accessToken);
            case 'add_to_playlist':
                return await this.addToPlaylist(params, accessToken);
            case 'create_playlist':
                return await this.createPlaylist(params, userId, accessToken);
            case 'skip_track':
                return await this.skipTrack(accessToken);
            case 'pause_playback':
                return await this.pausePlayback(accessToken);
            case 'like_current_track':
                return await this.likeCurrentTrack(accessToken);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }


    private async playMusic(params: any, accessToken: string) {        const trackName = params.trackName || resolveValue('track.name', params);

        if (!trackName) {
            throw new BadRequestException('trackName is required for play_music');
        }
        this.logger.log(`Playing track: ${trackName}`);
        const trackUri = await this.spotifyAuth.getMusic(trackName, accessToken);

        if (!trackUri) {
            throw new BadRequestException(`Track not found: ${trackName}`);
        }
        await this.spotifyAuth.playTrack(trackUri, accessToken);
        return {
            success: true,
            trackName,
            trackUri,
            message: `Now playing: ${trackName}`,
        };
    }

    private async addToPlaylist(params: any, accessToken: string) {
        const playlistName = params.playlistName;
        const trackName = params.trackName || resolveValue('track.name', params);
        const trackUri = params.trackUri || resolveValue('track.uri', params);
        if (!playlistName) {
            throw new BadRequestException('playlistName is required for add_to_playlist');
        }
        this.logger.log(`Adding to playlist: ${playlistName}`);
        const playlist = await this.spotifyAuth.getPlaylist(playlistName, accessToken);
        let uriToAdd = trackUri;
        if (!uriToAdd && trackName) {
            this.logger.log(`Searching for track: ${trackName}`);
            uriToAdd = await this.spotifyAuth.getMusic(trackName, accessToken);
        }
        if (!uriToAdd) {
            throw new BadRequestException('Could not determine track to add. Provide trackUri or trackName');
        }
        await this.spotifyAuth.addTracksToPlaylist(playlist.id, [uriToAdd], accessToken);
        return {
            success: true,
            playlist: playlist.name,
            playlistId: playlist.id,
            trackAdded: uriToAdd,
            message: `Track added to playlist: ${playlist.name}`,
        };
    }

    private async createPlaylist(params: any, userId: number, accessToken: string) {
        const playlistName = params.playlistName || params.name;
        const description = params.description || '';
        if (!playlistName) {
            throw new BadRequestException('playlistName is required for create_playlist');
        }
        this.logger.log(`Creating playlist: ${playlistName}`);
        const profile = await this.spotifyAuth.getUserProfile(accessToken);
        const playlist = await this.spotifyAuth.createPlaylist(
            profile.id,
            playlistName,
            description,
            accessToken,
        );
        return {
            success: true,
            playlist: {
                id: playlist.id,
                name: playlist.name,
                url: playlist.external_urls?.spotify,
            },
            message: `Playlist created: ${playlistName}`,
        };
    }

    private async skipTrack(accessToken: string) {
        this.logger.log('Skipping track');
        await this.spotifyAuth.skipMusic(accessToken);
        return {
            success: true,
            message: 'Track skipped',
        };
    }

    private async pausePlayback(accessToken: string) {
        this.logger.log('Pausing playback');
        await this.spotifyAuth.pausePlayback(accessToken);
        return {
            success: true,
            message: 'Playback paused',
        };
    }

    private async likeCurrentTrack(accessToken: string) {
        this.logger.log('Liking current track');
        const playerState = await this.spotifyAuth.getPlayerState(accessToken);
        if (!playerState || !playerState.trackUri) {
            throw new BadRequestException('No track currently playing');
        }
        const trackId = playerState.trackUri.split(':')[2];
        await this.spotifyAuth.likeTrack(trackId, accessToken);
        return {
            success: true,
            trackName: playerState.trackName,
            artistName: playerState.artistName,
            message: `Liked: ${playerState.trackName} by ${playerState.artistName}`,
        };
    }
}
