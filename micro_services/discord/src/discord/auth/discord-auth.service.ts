import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DiscordAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;

    constructor(
        private configService: ConfigService,
        private http: HttpService,
    ) {
        this.clientID = this.configService.get<string>('DISCORD_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('Discord client ID undefined');
        this.clientSecret = this.configService.get<string>('DISCORD_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('Discord client secret undefined');
        this.redirectUrl = this.configService.get<string>('DISCORD_REDIRECT_URI', '');
        if (this.redirectUrl === '') throw new Error('Discord redirect URL undefined');
    }

    getAuthUrl(userId?: string): string {
        const scope = 'identify guilds guilds.members.read messages.read';
        return (
            `https://discord.com/api/oauth2/authorize?` +
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
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Discord token exchange failed:', errText);
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
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        const text = await response.text();
        if (!response.ok) {
            console.error('Discord refresh token failed', response.status, text);
            throw new Error('Failed to refresh Discord token');
        }
        let body: any;
        try {
            body = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid response from Discord');
        }
        return {
            access_token: body.access_token,
            refresh_token: body.refresh_token,
            expires_in: body.expires_in,
        };
    }

    async getUserInfo(accessToken: string) {
        const response = await firstValueFrom(
            this.http.get('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            })
        );
        return response.data;
    }

    async getUserGuilds(accessToken: string) {
        const response = await firstValueFrom(
            this.http.get('https://discord.com/api/users/@me/guilds', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            })
        );
        return response.data;
    }

    async getGuildChannels(guildId: string, botToken: string) {
        const response = await firstValueFrom(
            this.http.get(`https://discord.com/api/guilds/${guildId}/channels`, {
                headers: {
                    'Authorization': `Bot ${botToken}`,
                }
            })
        );
        return response.data;
    }

    async sendMessage(channelId: string, content: string, botToken: string, embed?: any) {
        const payload: any = { content };
        if (embed) {
            payload.embeds = [embed];
        }
        const response = await firstValueFrom(
            this.http.post(
                `https://discord.com/api/channels/${channelId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }

    async createWebhook(channelId: string, name: string, botToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://discord.com/api/channels/${channelId}/webhooks`,
                { name },
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }

    async executeWebhook(webhookId: string, webhookToken: string, content: string, username?: string, avatarUrl?: string) {
        const payload: any = { content };
        if (username) payload.username = username;
        if (avatarUrl) payload.avatar_url = avatarUrl;
        const response = await fetch(
            `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );
        if (!response.ok) {
            const errText = await response.text();
            console.error('Discord webhook execution failed:', errText);
            throw new Error('Failed to execute webhook');
        }
        return response.status === 204 ? { success: true } : await response.json();
    }

    async addRoleToMember(guildId: string, userId: string, roleId: string, botToken: string) {
        const response = await firstValueFrom(
            this.http.put(
                `https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                    }
                }
            )
        );
        return response.data;
    }

    async removeRoleFromMember(guildId: string, userId: string, roleId: string, botToken: string) {
        const response = await firstValueFrom(
            this.http.delete(
                `https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`,
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                    }
                }
            )
        );
        return response.data;
    }

    async createRole(guildId: string, name: string, color: number, botToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://discord.com/api/guilds/${guildId}/roles`,
                { name, color },
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
        return response.data;
    }
}
