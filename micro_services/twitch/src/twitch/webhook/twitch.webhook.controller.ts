import { Controller, Post, Body, Logger, Headers } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Controller('webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly authService: AuthService) {}

    @Post('twitch/stream-started')
    async handleStreamStarted(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: stream-started`);
            this.logger.log(`   User: ${userId}`);
            this.logger.log(`   Stream: ${data.streamTitle}`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'stream_started',
                userIdNum,
                {
                    streamId: data.streamId,
                    streamTitle: data.streamTitle,
                    gameName: data.gameName,
                    viewerCount: data.viewerCount || 0,
                    startedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('twitch/stream-ended')
    async handleStreamEnded(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: stream-ended`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'stream_ended',
                userIdNum,
                {
                    streamId: data.streamId,
                    duration: data.duration,
                    endedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('twitch/new-follower')
    async handleNewFollower(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: new-follower`);
            this.logger.log(`   Follower: ${data.followerName}`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'new_follower',
                userIdNum,
                {
                    followerName: data.followerName,
                    followerId: data.followerId,
                    followedAt: data.followedAt || new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('twitch/viewer-threshold')
    async handleViewerThreshold(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: viewer-threshold`);
            this.logger.log(`   Viewers: ${data.viewerCount}`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'viewer_count_threshold',
                userIdNum,
                {
                    viewerCount: data.viewerCount,
                    streamTitle: data.streamTitle,
                    threshold: data.threshold,
                    triggeredAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('trigger')
    async handleGenericTrigger(
        @Body() body: {
            actionName: string;
            userId: number;
            data: any;
        },
    ) {
        try {
            this.logger.log(`Generic webhook: ${body.actionName} for user ${body.userId}`);
            await this.authService.triggerWorkflows(
                body.actionName,
                body.userId,
                body.data,
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('test')
    async testWebhook(@Body() body: any) {
        this.logger.log('Test webhook received:', JSON.stringify(body, null, 2));
        return {
            success: true,
            message: 'Test webhook received',
            serviceId: this.authService.getServiceId(),
            received: body,
        };
    }
}
