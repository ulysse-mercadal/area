import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TwitchAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;

    constructor(
        private configService: ConfigService,
        private http: HttpService,
    ) {
        this.clientID = this.configService.get<string>('TWITCH_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('Twitch client ID undefined');
        this.clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('Twitch client secret undefined');
        this.redirectUrl = this.configService.get<string>('TWITCH_REDIRECT_URI', '');
        if (this.redirectUrl === '') throw new Error('Twitch redirect URL undefined');
    }

    getAuthUrl(userId?: string): string {
        const scope = 'user:read:email chat:read chat:edit channel:read:editors moderator:read:followers channel:manage:broadcast clips:edit';
        return (
            `https://id.twitch.tv/oauth2/authorize?` +
            `response_type=code&client_id=${this.clientID}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&redirect_uri=${encodeURIComponent(this.redirectUrl)}` +
            (userId ? `&state=${userId}` : '')
        );
    }

    async exchangeCodeForToken(code: string) {
        const params = new URLSearchParams();
        params.append('client_id', this.clientID);
        params.append('client_secret', this.clientSecret);
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', this.redirectUrl);
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Twitch token exchange failed:', errText);
            throw new InternalServerErrorException('Failed to exchange code for token');
        }
        const tokenResponse = await response.json();
        return tokenResponse;
    }

    async refreshAccessToken(refreshToken: string) {
        const params = new URLSearchParams();
        params.append('client_id', this.clientID);
        params.append('client_secret', this.clientSecret);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        const text = await response.text();
        if (!response.ok) {
            console.error('Twitch refresh token failed', response.status, text);
            throw new Error('Failed to refresh Twitch token');
        }
        let body: any;
        try {
            body = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid response from Twitch');
        }
        return {
            access_token: body.access_token,
            refresh_token: body.refresh_token,
            expires_in: body.expires_in,
        };
    }

    async getUserInfo(accessToken: string) {
        const response = await firstValueFrom(
            this.http.get('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data;
    }

    async getStreamInfo(userId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data;
    }

    async getChannelInfo(broadcasterId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data;
    }

    async updateChannelInfo(broadcasterId: string, data: any, accessToken: string) {
        const response = await firstValueFrom(
            this.http.patch(
                `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }

    async getFollowers(broadcasterId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data;
    }

    async getVideos(userId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.get(`https://api.twitch.tv/helix/videos?user_id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data;
    }

    async createClip(broadcasterId: string, hasDelay: boolean, accessToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&has_delay=${hasDelay}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                    }
                }
            )
        );
        return response.data;
    }

    async startCommercial(broadcasterId: string, length: number, accessToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://api.twitch.tv/helix/channels/commercial`,
                {
                    broadcaster_id: broadcasterId,
                    length: length
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }

    async createStreamMarker(userId: string, description: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://api.twitch.tv/helix/streams/markers`,
                {
                    user_id: userId,
                    description: description || 'Stream marker'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }

    async getGameByName(gameName: string, accessToken: string) {
        const encoded = encodeURIComponent(gameName);
        const response = await firstValueFrom(
            this.http.get(`https://api.twitch.tv/helix/games?name=${encoded}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                }
            })
        );
        return response.data?.data?.[0];
    }

    async sendChatMessage(broadcasterId: string, senderId: string, message: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://api.twitch.tv/helix/chat/messages`,
                {
                    broadcaster_id: broadcasterId,
                    sender_id: senderId,
                    message: message
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }
}
