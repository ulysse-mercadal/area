import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DiscordAuthService } from '../auth/discord-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { mergeConfigAndInput, resolveValue } from './parameter-resolver';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExecutorService {
    private readonly logger = new Logger(ExecutorService.name);
    private readonly botToken: string;

    constructor(
        private discordAuth: DiscordAuthService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.botToken = this.configService.get<string>('DISCORD_BOT_TOKEN', '');
        if (!this.botToken) {
            this.logger.warn('Discord bot token not configured');
        }
    }

    private async getAccessToken(userId: number): Promise<string> {
        const credential = await this.prisma.credential.findFirst({
            where: {
                userId,
                serviceId: 5,
            },
        });
        if (!credential) {
            throw new BadRequestException('Discord credentials not found for user');
        }
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            this.logger.log(`Token expired for user ${userId}, refreshing...`);
            if (!credential.refreshToken) {
                throw new BadRequestException('No refresh token available');
            }
            const refreshed = await this.discordAuth.refreshAccessToken(credential.refreshToken);
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

    private async getDiscordUserId(userId: number): Promise<string> {
        const discordUser = await this.prisma.discordUser.findUnique({
            where: { userId },
        });
        if (!discordUser) {
            throw new BadRequestException('Discord user not found');
        }
        return discordUser.discordUserId;
    }

    async executeAction(
        actionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing action: ${actionName}`);
        switch (actionName) {
            case 'message_received':
            case 'member_joined':
            case 'member_left':
            case 'role_assigned':
            case 'reaction_added':
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
        const params = mergeConfigAndInput(config, input);
        if (!this.botToken) {
            throw new BadRequestException('Discord bot token is not configured. Please set DISCORD_BOT_TOKEN in your .env file');
        }
        switch (reactionName) {
            case 'send_message':
                return await this.sendMessage(params);
            case 'send_dm':
                return await this.sendDM(params, userId);
            case 'add_role':
                return await this.addRole(params);
            case 'remove_role':
                return await this.removeRole(params);
            case 'create_role':
                return await this.createRole(params);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }

    private async sendMessage(params: any) {
        const channelId = params.channelId || resolveValue('channelId', params);
        const content = params.content || resolveValue('content', params);
        const embed = params.embed;
        if (!channelId) {
            throw new BadRequestException('channelId is required for send_message');
        }
        if (!content && !embed) {
            throw new BadRequestException('content or embed is required for send_message');
        }
        this.logger.log(`Sending message to channel ${channelId} with bot`);
        try {
            const result = await this.discordAuth.sendMessage(
                channelId,
                content || '',
                this.botToken,
                embed
            );
            return {
                success: true,
                messageId: result.id,
                channelId: channelId,
                message: 'Message sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`);
            throw new BadRequestException(`Failed to send Discord message: ${error.message}. Make sure the bot has access to this channel.`);
        }
    }

    private async sendDM(params: any, userId: number) {
        const content = params.content || resolveValue('content', params);
        let targetUserId = params.userId || resolveValue('userId', params);
        if (!content) {
            throw new BadRequestException('content is required for send_dm');
        }
        if (!targetUserId) {
            targetUserId = await this.getDiscordUserId(userId);
        }
        this.logger.log(`Sending DM to user ${targetUserId}`);
        try {
            const dmChannel = await this.createDMChannel(targetUserId);
            const result = await this.discordAuth.sendMessage(
                dmChannel.id,
                content,
                this.botToken
            );
            return {
                success: true,
                messageId: result.id,
                message: 'DM sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send DM: ${error.message}`);
            throw new BadRequestException(`Failed to send DM: ${error.message}. Make sure the bot shares a server with this user.`);
        }
    }

    private async createDMChannel(userId: string) {
        const response = await fetch('https://discord.com/api/users/@me/channels', {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${this.botToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient_id: userId })
        });
        if (!response.ok) {
            throw new Error('Failed to create DM channel');
        }
        return await response.json();
    }

    private async addRole(params: any) {
        const guildId = params.guildId || resolveValue('guildId', params);
        const userId = params.userId || resolveValue('userId', params);
        const roleId = params.roleId || resolveValue('roleId', params);
        if (!guildId || !userId || !roleId) {
            throw new BadRequestException('guildId, userId, and roleId are required for add_role');
        }
        this.logger.log(`Adding role ${roleId} to user ${userId} in guild ${guildId}`);
        try {
            await this.discordAuth.addRoleToMember(guildId, userId, roleId, this.botToken);
            return {
                success: true,
                message: `Role ${roleId} added to user ${userId}`,
            };
        } catch (error) {
            this.logger.error(`Failed to add role: ${error.message}`);
            throw new BadRequestException(`Failed to add role: ${error.message}`);
        }
    }

    private async removeRole(params: any) {
        const guildId = params.guildId || resolveValue('guildId', params);
        const userId = params.userId || resolveValue('userId', params);
        const roleId = params.roleId || resolveValue('roleId', params);
        if (!guildId || !userId || !roleId) {
            throw new BadRequestException('guildId, userId, and roleId are required for remove_role');
        }
        this.logger.log(`Removing role ${roleId} from user ${userId} in guild ${guildId}`);
        try {
            await this.discordAuth.removeRoleFromMember(guildId, userId, roleId, this.botToken);
            return {
                success: true,
                message: `Role ${roleId} removed from user ${userId}`,
            };
        } catch (error) {
            this.logger.error(`Failed to remove role: ${error.message}`);
            throw new BadRequestException(`Failed to remove role: ${error.message}`);
        }
    }

    private async createRole(params: any) {
        const guildId = params.guildId || resolveValue('guildId', params);
        const name = params.name || resolveValue('name', params);
        const color = params.color || resolveValue('color', params) || 0;
        if (!guildId || !name) {
            throw new BadRequestException('guildId and name are required for create_role');
        }
        this.logger.log(`Creating role ${name} in guild ${guildId}`);
        try {
            const role = await this.discordAuth.createRole(guildId, name, color, this.botToken);
            return {
                success: true,
                roleId: role.id,
                roleName: role.name,
                message: `Role ${name} created successfully`,
            };
        } catch (error) {
            this.logger.error(`Failed to create role: ${error.message}`);
            throw new BadRequestException(`Failed to create role: ${error.message}`);
        }
    }
}
