import { Controller, Post, Body, Logger, Headers } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Controller('webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);
    constructor(private readonly authService: AuthService) {}

    @Post('spotify/track-played')
    async handleTrackPlayed(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: track-played`);
            this.logger.log(`   User: ${userId}`);
            this.logger.log(`   Track: ${data.trackName} by ${data.artistName}`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'new_track_played',
                userIdNum,
                {
                    trackName: data.trackName,
                    artistName: data.artistName,
                    albumName: data.albumName,
                    duration: data.duration,
                    playedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('spotify/playlist-updated')
    async handlePlaylistUpdated(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: playlist-updated`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'playlist_updated',
                userIdNum,
                {
                    playlistId: data.playlistId,
                    playlistName: data.playlistName,
                    tracksAdded: data.tracksAdded,
                    tracksRemoved: data.tracksRemoved,
                    updatedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('spotify/new-liked-song')
    async handleNewLikedSong(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: new-liked-song`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'new_liked_song',
                userIdNum,
                {
                    trackName: data.trackName,
                    artistName: data.artistName,
                    trackId: data.trackId,
                    likedAt: new Date().toISOString(),
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
