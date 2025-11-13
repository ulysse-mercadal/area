import { Controller, Post, Body, Headers, Logger, HttpCode, Req } from '@nestjs/common';
import { TwitchEventSubService } from './twitch-eventsub.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';

@Controller('')
export class TwitchEventSubController {
    private readonly logger = new Logger(TwitchEventSubController.name);

    constructor(
        private readonly eventSubService: TwitchEventSubService,
        private readonly authService: AuthService,
        private readonly prisma: PrismaService,
    ) {}

    @Post('twitch/eventsub/callback')
    @HttpCode(200)
    async handleEventSubCallback(
        @Headers('twitch-eventsub-message-id') messageId: string,
        @Headers('twitch-eventsub-message-timestamp') timestamp: string,
        @Headers('twitch-eventsub-message-signature') signature: string,
        @Headers('twitch-eventsub-message-type') messageType: string,
        @Body() body: any,
        @Req() req: Request,
    ) {
        const rawBody = JSON.stringify(body);
        const isValid = this.eventSubService.verifySignature(
            messageId,
            timestamp,
            rawBody,
            signature
        );
        if (!isValid) {
            this.logger.error('Invalid signature for EventSub webhook');
            return { error: 'Invalid signature' };
        }
        if (messageType === 'webhook_callback_verification') {
            this.logger.log('EventSub verification challenge received');
            return body.challenge;
        }
        if (messageType === 'revocation') {
            this.logger.warn('EventSub subscription revoked:', body);
            return;
        }
        if (messageType === 'notification') {
            await this.handleNotification(body);
        }
        return;
    }

    private async handleNotification(body: any) {
        const { subscription, event } = body;
        const subscriptionType = subscription.type;
        this.logger.log(`EventSub notification: ${subscriptionType}`);
        this.logger.log(`Event data: ${JSON.stringify(event)}`);
        const broadcasterId = event.broadcaster_user_id;
        const userId = await this.getUserIdFromBroadcasterId(broadcasterId);
        if (!userId) {
            this.logger.error(`No user found for broadcaster ${broadcasterId}`);
            return;
        }
        switch (subscriptionType) {
            case 'stream.online':
                await this.handleStreamOnline(event, userId);
                break;
            case 'stream.offline':
                await this.handleStreamOffline(event, userId);
                break;
            case 'channel.follow':
                await this.handleChannelFollow(event, userId);
                break;
            case 'channel.update':
                await this.handleChannelUpdate(event, userId);
                break;
            default:
                this.logger.warn(`Unhandled subscription type: ${subscriptionType}`);
        }
    }

    private async handleStreamOnline(event: any, userId: number) {
        this.logger.log(`Stream online for user ${userId}`);
        await this.authService.triggerWorkflows(
            'stream_started',
            userId,
            {
                streamId: event.id,
                streamTitle: event.broadcaster_user_name + ' is live',
                gameName: event.type || 'live',
                viewerCount: 0,
                startedAt: event.started_at,
            }
        );
    }

    private async handleStreamOffline(event: any, userId: number) {
        this.logger.log(`Stream offline for user ${userId}`);
        await this.authService.triggerWorkflows(
            'stream_ended',
            userId,
            {
                streamId: event.broadcaster_user_id,
                endedAt: new Date().toISOString(),
            }
        );
    }

    private async handleChannelFollow(event: any, userId: number) {
        this.logger.log(`New follower for user ${userId}: ${event.user_name}`);
        await this.authService.triggerWorkflows(
            'new_follower',
            userId,
            {
                followerName: event.user_name,
                followerId: event.user_id,
                followedAt: event.followed_at,
            }
        );
    }

    private async handleChannelUpdate(event: any, userId: number) {
        this.logger.log(`Channel updated for user ${userId}`);
    }

    private async getUserIdFromBroadcasterId(broadcasterId: string): Promise<number | null> {
        try {
            const twitchUser = await this.prisma.twitchUser.findFirst({
                where: {
                    broadcasterId: broadcasterId,
                },
                select: {
                    userId: true,
                },
            });
            if (!twitchUser) {
                this.logger.warn(`No TwitchUser found for broadcasterId: ${broadcasterId}`);
                return null;
            }
            this.logger.log(`Found userId: ${twitchUser.userId} for broadcasterId: ${broadcasterId}`);
            return twitchUser.userId;
        } catch (error) {
            this.logger.error(`Error finding userId for broadcasterId ${broadcasterId}:`, error);
            return null;
        }
    }

    @Post('twitch/eventsub/setup')
    async setupWebhooks(
        @Body() body: { userId: number; broadcasterId: string; accessToken: string }
    ) {
        try {
            await this.eventSubService.setupUserWebhooks(
                body.broadcasterId,
                body.accessToken
            );
            return {
                success: true,
                message: 'Webhooks configured successfully',
            };
        } catch (error) {
            this.logger.error('Failed to setup webhooks:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Post('twitch/eventsub/cleanup')
    async cleanupWebhooks(
        @Body() body: { broadcasterId: string }
    ) {
        try {
            await this.eventSubService.removeUserWebhooks(body.broadcasterId);
            return {
                success: true,
                message: 'Webhooks cleaned up successfully',
            };
        } catch (error) {
            this.logger.error('Failed to cleanup webhooks:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Post('twitch/eventsub/list')
    async listSubscriptions() {
        try {
            const appToken = await this.eventSubService.getAppAccessToken();
            const subscriptions = await this.eventSubService.listSubscriptions(appToken);
            return {
                success: true,
                subscriptions: subscriptions.data,
                total: subscriptions.total,
            };
        } catch (error) {
            this.logger.error('Failed to list subscriptions:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
