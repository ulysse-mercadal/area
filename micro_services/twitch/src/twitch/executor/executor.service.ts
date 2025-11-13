import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { TwitchAuthService } from '../auth/twitch-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { mergeConfigAndInput, resolveValue } from './parameter-resolver';

@Injectable()
export class ExecutorService {
    private readonly logger = new Logger(ExecutorService.name);
    constructor(
        private twitchAuth: TwitchAuthService,
        private prisma: PrismaService,
    ) { }

    private async getAccessToken(userId: number): Promise<string> {
        const credential = await this.prisma.credential.findFirst({
            where: {
                userId,
                serviceId: 4,
            },
        });
        if (!credential) {
            throw new BadRequestException('Twitch credentials not found for user');
        }
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            this.logger.log(`Token expired for user ${userId}, refreshing...`);
            if (!credential.refreshToken) {
                throw new BadRequestException('No refresh token available');
            }
            const refreshed = await this.twitchAuth.refreshAccessToken(credential.refreshToken);
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

    private async getUserId(userId: number): Promise<string> {
        const accessToken = await this.getAccessToken(userId);
        const userInfo = await this.twitchAuth.getUserInfo(accessToken);
        return userInfo.data[0].id;
    }

    async executeAction(
        actionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing action: ${actionName}`);
        switch (actionName) {
            case 'stream_started':
            case 'stream_ended':
            case 'new_follower':
            case 'viewer_count_threshold':
                return input;
            default:
                throw new BadRequestException(`Unknown action: ${actionName}`);
        }
    }

    private async ensureStreamIsLive(broadcasterId: string, accessToken: string, actionName: string) {
        const streamInfo = await this.twitchAuth.getStreamInfo(broadcasterId, accessToken);
        if (!streamInfo || streamInfo.data.length === 0) {
            throw new BadRequestException(
                `Cannot execute "${actionName}": stream is offline. This action requires an active stream.`
            );
        }
        return streamInfo.data[0];
    }

    async executeReaction(
        reactionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing reaction: ${reactionName}`);
        const accessToken = await this.getAccessToken(userId);
        const broadcasterId = await this.getUserId(userId);
        const params = mergeConfigAndInput(config, input);
        const requiresLiveStream = [
            'send_chat_message',
            'create_clip',
            'start_commercial',
            'create_stream_marker'
        ];
        if (requiresLiveStream.includes(reactionName)) {
            await this.ensureStreamIsLive(broadcasterId, accessToken, reactionName);
        }
        switch (reactionName) {
            case 'update_stream_title':
                return await this.updateStreamTitle(params, broadcasterId, accessToken);
            case 'update_stream_game':
                return await this.updateStreamGame(params, broadcasterId, accessToken);
            case 'send_chat_message':
                return await this.sendChatMessage(params, broadcasterId, accessToken);
            case 'create_clip':
                return await this.createClip(params, broadcasterId, accessToken);
            case 'start_commercial':
                return await this.startCommercial(params, broadcasterId, accessToken);
            case 'create_stream_marker':
                return await this.createStreamMarker(params, broadcasterId, accessToken);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }

    private async updateStreamTitle(params: any, broadcasterId: string, accessToken: string) {
        const title = params.title || resolveValue('title', params);
        if (!title) {
            throw new BadRequestException('title is required for update_stream_title');
        }
        this.logger.log(`Updating stream title to: ${title}`);
        await this.twitchAuth.updateChannelInfo(
            broadcasterId,
            { title },
            accessToken
        );
        return {
            success: true,
            title,
            message: `Stream title updated to: ${title}`,
        };
    }

    private async updateStreamGame(params: any, broadcasterId: string, accessToken: string) {
        const gameName = params.gameName || resolveValue('gameName', params);
        if (!gameName) {
            throw new BadRequestException('gameName is required for update_stream_game');
        }
        this.logger.log(`Updating stream game to: ${gameName}`);
        const game = await this.twitchAuth.getGameByName(gameName, accessToken);
        if (!game) {
            throw new BadRequestException(`Game not found: ${gameName}`);
        }
        await this.twitchAuth.updateChannelInfo(
            broadcasterId,
            { game_id: game.id },
            accessToken
        );
        return {
            success: true,
            gameName: game.name,
            gameId: game.id,
            message: `Stream game updated to: ${game.name}`,
        };
    }

    private async sendChatMessage(params: any, broadcasterId: string, accessToken: string) {
        const message = params.message || resolveValue('message', params);
        if (!message) {
            throw new BadRequestException('message is required for send_chat_message');
        }
        this.logger.log(`Sending chat message: ${message}`);
        await this.twitchAuth.sendChatMessage(
            broadcasterId,
            broadcasterId,
            message,
            accessToken
        );
        return {
            success: true,
            message: `Chat message sent: ${message}`,
        };
    }
    private async createClip(params: any, broadcasterId: string, accessToken: string) {
        const hasDelay = params.hasDelay !== undefined ? params.hasDelay : false;
        this.logger.log(`Creating clip (hasDelay: ${hasDelay})`);
        const result = await this.twitchAuth.createClip(broadcasterId, hasDelay, accessToken);
        return {
            success: true,
            clipId: result.data[0].id,
            editUrl: result.data[0].edit_url,
            message: 'Clip created successfully',
        };
    }

    private async startCommercial(params: any, broadcasterId: string, accessToken: string) {
        const length = params.length || 30;
        const validLengths = [30, 60, 90, 120, 150, 180];
        if (!validLengths.includes(length)) {
            throw new BadRequestException(`Invalid commercial length. Must be one of: ${validLengths.join(', ')}`);
        }
        this.logger.log(`Starting ${length}s commercial`);
        const result = await this.twitchAuth.startCommercial(broadcasterId, length, accessToken);
        return {
            success: true,
            length: result.data[0].length,
            retryAfter: result.data[0].retry_after,
            message: `Commercial started (${length}s)`,
        };
    }

    private async createStreamMarker(params: any, broadcasterId: string, accessToken: string) {
        const description = params.description || 'Stream marker';
        this.logger.log(`Creating stream marker: ${description}`);
        const result = await this.twitchAuth.createStreamMarker(
            broadcasterId,
            description,
            accessToken
        );
        return {
            success: true,
            markerId: result.data[0].id,
            positionSeconds: result.data[0].position_seconds,
            description: result.data[0].description,
            message: 'Stream marker created',
        };
    }
}
