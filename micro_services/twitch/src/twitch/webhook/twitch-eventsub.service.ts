import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class TwitchEventSubService {
    private readonly logger = new Logger(TwitchEventSubService.name);
    private readonly clientID: string;
    private readonly clientSecret: string;
    private readonly webhookSecret: string;
    private readonly callbackUrl: string;

    constructor(
        private configService: ConfigService,
        private http: HttpService,
    ) {
        this.clientID = this.configService.get<string>('TWITCH_CLIENT_ID', '');
        this.clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET', '');
        this.webhookSecret = this.configService.get<string>('TWITCH_WEBHOOK_SECRET', '');
        this.callbackUrl = this.configService.get<string>('TWITCH_WEBHOOK_CALLBACK_URL', '');
    }

    async getAppAccessToken(): Promise<string> {
        const params = new URLSearchParams();
        params.append('client_id', this.clientID);
        params.append('client_secret', this.clientSecret);
        params.append('grant_type', 'client_credentials');
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: params,
        });
        const data = await response.json();
        return data.access_token;
    }

    verifySignature(
        messageId: string,
        timestamp: string,
        body: string,
        signature: string
    ): boolean {
        const message = messageId + timestamp + body;
        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        hmac.update(message);
        const expectedSignature = 'sha256=' + hmac.digest('hex');
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    }

    async subscribeToEvent(
        type: string,
        version: string,
        condition: any,
        accessToken: string
    ) {
        try {
            const response = await firstValueFrom(
                this.http.post(
                    'https://api.twitch.tv/helix/eventsub/subscriptions',
                    {
                        type,
                        version,
                        condition,
                        transport: {
                            method: 'webhook',
                            callback: this.callbackUrl,
                            secret: this.webhookSecret,
                        },
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Client-Id': this.clientID,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            this.logger.log(`Subscribed to ${type} for condition ${JSON.stringify(condition)}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to subscribe to ${type}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async listSubscriptions(accessToken: string) {
        const response = await firstValueFrom(
            this.http.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientID,
                },
            })
        );
        return response.data;
    }

    async deleteSubscription(subscriptionId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.delete(
                `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': this.clientID,
                    },
                }
            )
        );
        return response.data;
    }

    async setupUserWebhooks(broadcasterId: string, accessToken: string) {
        const appToken = await this.getAppAccessToken();
        await this.subscribeToEvent(
            'stream.online',
            '1',
            { broadcaster_user_id: broadcasterId },
            appToken
        );
        await this.subscribeToEvent(
            'stream.offline',
            '1',
            { broadcaster_user_id: broadcasterId },
            appToken
        );
        await this.subscribeToEvent(
            'channel.follow',
            '2',
            {
                broadcaster_user_id: broadcasterId,
                moderator_user_id: broadcasterId
            },
            appToken
        );
        await this.subscribeToEvent(
            'channel.update',
            '2',
            { broadcaster_user_id: broadcasterId },
            appToken
        );
        this.logger.log(`Setup webhooks completed for broadcaster ${broadcasterId}`);
    }

    async removeUserWebhooks(broadcasterId: string) {
        const appToken = await this.getAppAccessToken();
        const subscriptions = await this.listSubscriptions(appToken);
        for (const sub of subscriptions.data) {
            if (sub.condition.broadcaster_user_id === broadcasterId) {
                await this.deleteSubscription(sub.id, appToken);
                this.logger.log(`Deleted subscription ${sub.id} for broadcaster ${broadcasterId}`);
            }
        }
    }
}
