import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CredentialsService } from '../credentials/credientials.service';
import { SpotifyAuthService } from '../spotify/auth/spotify-auth.service';

interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string };
    uri: string;
}

interface SpotifyTrackItem {
    track: SpotifyTrack;
    added_at: string;
}

interface SpotifyRecentlyPlayedItem {
    track: SpotifyTrack;
    played_at: string;
}

@Injectable()
export class SpotifyPollingService implements OnModuleInit {
    private readonly logger = new Logger(SpotifyPollingService.name);
    private readonly lastLikedSongsCache = new Map<number, Set<string>>();
    private readonly lastPlayedTracksCache = new Map<number, Set<string>>();
    private readonly pollInterval = 10000;
    private isPolling = false;

    constructor(
        private readonly credentialsService: CredentialsService,
        private readonly spotifyAuthService: SpotifyAuthService,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit() {
        const enablePolling =
            this.configService.get<string>('ENABLE_POLLING', 'true') === 'true';
        if (enablePolling) {
            this.logger.log('Starting Spotify polling service');
            await this.startPolling();
        }
    }

    async startPolling() {
        if (this.isPolling) {
            this.logger.warn('Polling already running');
            return;
        }
        this.isPolling = true;
        this.logger.log(
            `Polling every ${this.pollInterval / 1000} seconds`,
        );
        await this.pollAllUsers();
        setInterval(async () => {
            await this.pollAllUsers();
        }, this.pollInterval);
    }

    stopPolling() {
        this.isPolling = false;
        this.logger.log('Polling stopped');
    }

    private async pollAllUsers() {
        try {
            const userIds =
                await this.credentialsService.getAllUsersWithCredentials();
            if (userIds.length === 0) {
                this.logger.debug('No users to poll');
                return;
            }
            this.logger.debug(`Polling ${userIds.length} users`);
            await Promise.allSettled(
                userIds.map((userId) => this.checkUserActivity(userId)),
            );
        } catch (error) {
            this.logger.error('Error in pollAllUsers:', error.message);
        }
    }

    private async checkUserActivity(userId: number) {
        try {
            const credentials =
                await this.credentialsService.getCredentials(userId);
            let token = credentials.token;
            if (this.credentialsService.isTokenExpired(credentials)) {
                if (!credentials.refreshToken) {
                    this.logger.warn(
                        `Token expired for user ${userId}, no refresh token`,
                    );
                    return;
                }
                const newToken = await this.refreshToken(
                    userId,
                    credentials.refreshToken,
                );
                token = newToken;
            }
            await Promise.allSettled([
                this.checkUserLikedSongs(userId, token),
                this.checkUserRecentlyPlayed(userId, token),
            ]);
        } catch (error) {
            this.logger.error(
                `Error checking user ${userId}:`,
                error.message,
            );
        }
    }

    private async checkUserLikedSongs(userId: number, token: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    'https://api.spotify.com/v1/me/tracks?limit=50',
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                ),
            );
            const currentLikedTracks: SpotifyTrackItem[] =
                response.data.items;
            const currentTrackIds = new Set<string>(
                currentLikedTracks.map((item) => item.track.id),
            );
            const previousTrackIds = this.lastLikedSongsCache.get(userId);
            if (!previousTrackIds) {
                this.lastLikedSongsCache.set(userId, currentTrackIds);
                this.logger.debug(
                    `Liked songs cache initialized for user ${userId} with ${currentTrackIds.size} tracks`,
                );
                return;
            }            const newLikedTracks = currentLikedTracks.filter(
                (item) => !previousTrackIds.has(item.track.id),
            );
            this.lastLikedSongsCache.set(userId, currentTrackIds);
            if (newLikedTracks.length > 0) {
                for (const item of newLikedTracks) {
                    const track = item.track;
                    this.logger.log(
                        `User ${userId} liked: ${track.name} - ${track.artists[0].name}`,
                    );
                    await this.triggerWebhook(userId, track, 'new_liked_song');
                }
            }
        } catch (error) {
            this.logger.error(
                `Error checking liked songs for user ${userId}:`,
                error.message,
            );
        }
    }

    private async checkUserRecentlyPlayed(userId: number, token: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    'https://api.spotify.com/v1/me/player/recently-played?limit=50',
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                ),
            );
            const recentlyPlayedItems: SpotifyRecentlyPlayedItem[] =
                response.data.items;
            const currentPlayedIds = new Set<string>(
                recentlyPlayedItems.map((item) => `${item.played_at}_${item.track.id}`),
            );
            const previousPlayedIds = this.lastPlayedTracksCache.get(userId);
            if (!previousPlayedIds) {
                this.lastPlayedTracksCache.set(userId, currentPlayedIds);
                this.logger.debug(
                    `Recently played cache initialized for user ${userId} with ${currentPlayedIds.size} tracks`,
                );
                return;
            }
            const newPlayedTracks = recentlyPlayedItems.filter(
                (item) => !previousPlayedIds.has(`${item.played_at}_${item.track.id}`),
            );
            this.lastPlayedTracksCache.set(userId, currentPlayedIds);
            if (newPlayedTracks.length > 0) {
                for (const item of newPlayedTracks) {
                    const track = item.track;
                    this.logger.log(
                        `User ${userId} played: ${track.name} - ${track.artists[0].name} at ${item.played_at}`,
                    );
                    await this.triggerWebhook(userId, track, 'new_track_played', item.played_at);
                }
            }
        } catch (error) {
            this.logger.error(
                `Error checking recently played for user ${userId}:`,
                error.message,
            );
        }
    }

    private async refreshToken(
        userId: number,
        refreshToken: string,
    ): Promise<string> {
        const tokenData =
            await this.spotifyAuthService.refreshAccessToken(refreshToken);
        await this.credentialsService.saveCredentials(
            userId,
            tokenData.access_token,
            tokenData.refresh_token || refreshToken,
            tokenData.expires_in,
        );
        return tokenData.access_token;
    }

    private async triggerWebhook(
        userId: number,
        track: SpotifyTrack,
        eventType: 'new_liked_song' | 'new_track_played',
        playedAt?: string,
    ) {
        try {
            const mainApiUrl = this.configService.get<string>('MAIN_API_URL');
            const serviceToken =
                this.configService.get<string>('SERVICE_TOKEN');
            const url = `${mainApiUrl}/workflow/trigger/${userId}/${eventType}`;
            const payload = {
                userId,
                data: {
                    trackId: track.id,
                    trackName: track.name,
                    artistName: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri,
                    ...(eventType === 'new_liked_song'
                        ? { likedAt: new Date().toISOString() }
                        : { playedAt: playedAt || new Date().toISOString() }
                    ),
                },
            };
            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: {
                        Authorization: `Bearer ${serviceToken}`,
                        'Content-Type': 'application/json',
                    },
                }),
            );
            this.logger.log(
                `Webhook ${eventType} triggered successfully for user ${userId}: ${response.status}`,
            );
            this.logger.debug(`Response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            this.logger.error(
                `Failed to trigger webhook ${eventType} for user ${userId}:`,
                error.message,
            );
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}`);
                this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}
