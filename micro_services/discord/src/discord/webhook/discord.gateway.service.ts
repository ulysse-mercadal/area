import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import WebSocket from 'ws';

@Injectable()
export class DiscordGatewayService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DiscordGatewayService.name);
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private sessionId: string | null = null;
    private sequenceNumber: number | null = null;
    private readonly botToken: string;

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
        private prisma: PrismaService,
    ) {
        this.botToken = this.configService.get<string>('DISCORD_BOT_TOKEN', '');
        if (!this.botToken) {
            this.logger.error('DISCORD_BOT_TOKEN not configured!');
        }
    }

    async onModuleInit() {
        if (this.botToken) {
            this.logger.log('Connecting to Discord Gateway...');
            await this.connect();
        } else {
            this.logger.warn('Discord bot token not configured, gateway will not connect');
        }
    }

    async onModuleDestroy() {
        this.disconnect();
    }

    private async connect() {
        try {
            this.ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
            this.ws.on('open', () => {
                this.logger.log('Connected to Discord Gateway');
            });
            this.ws.on('message', (data: WebSocket.Data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });
            this.ws.on('close', (code: number, reason: string) => {
                this.logger.warn(`Discord Gateway closed: ${code} - ${reason}`);
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                }
                setTimeout(() => this.connect(), 5000);
            });
            this.ws.on('error', (error: Error) => {
                this.logger.error('Discord Gateway error:', error);
            });
        } catch (error) {
            this.logger.error('Failed to connect to Discord Gateway:', error);
        }
    }

    private disconnect() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
    }

    private handleMessage(payload: any) {
        const { op, d, s, t } = payload;
        if (s !== null) {
            this.sequenceNumber = s;
        }
        switch (op) {
            case 10:
                this.startHeartbeat(d.heartbeat_interval);
                this.identify();
                break;
            case 11:
                this.logger.debug('Heartbeat ACK received');
                break;
            case 0:
                this.handleEvent(t, d);
                break;
            case 7:
                this.logger.warn('Discord requested reconnect');
                this.disconnect();
                this.connect();
                break;
            case 9:
                this.logger.warn('Invalid session, reconnecting...');
                this.sessionId = null;
                setTimeout(() => this.identify(), 2000);
                break;
        }
    }

    private startHeartbeat(interval: number) {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    op: 1,
                    d: this.sequenceNumber
                }));
                this.logger.debug('Heartbeat sent');
            }
        }, interval);
    }

    private identify() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                op: 2,
                d: {
                    token: this.botToken,
                    intents:
                        (1 << 0) |
                        (1 << 1) |
                        (1 << 9) |
                        (1 << 10) |
                        (1 << 15),
                    properties: {
                        os: 'linux',
                        browser: 'autoflow',
                        device: 'autoflow'
                    }
                }
            }));
            this.logger.log('Sent identify payload');
        }
    }

    private async handleEvent(eventType: string, data: any) {
        this.logger.log(`Discord Event: ${eventType}`);
        switch (eventType) {
            case 'READY':
                this.sessionId = data.session_id;
                this.logger.log(`Bot ready as ${data.user.username}#${data.user.discriminator}`);
                break;
            case 'MESSAGE_CREATE':
                await this.handleMessageCreate(data);
                break;
            case 'GUILD_MEMBER_ADD':
                await this.handleMemberJoin(data);
                break;
            case 'GUILD_MEMBER_REMOVE':
                await this.handleMemberLeave(data);
                break;
            case 'GUILD_MEMBER_UPDATE':
                await this.handleMemberUpdate(data);
                break;
            case 'MESSAGE_REACTION_ADD':
                await this.handleReactionAdd(data);
                break;
            default:
                this.logger.debug(`Unhandled event: ${eventType}`);
        }
    }

    private async handleMessageCreate(data: any) {
        if (data.author.bot) return;
        this.logger.log(`Message from ${data.author.username}: ${data.content}`);
        const userIds = await this.getUserIdsFromGuildId(data.guild_id);
        if (userIds.length === 0) {
            this.logger.debug(`No users monitoring guild ${data.guild_id}`);
            return;
        }
        this.logger.log(`Triggering workflows for ${userIds.length} user(s)`);
        for (const userId of userIds) {
            await this.authService.triggerWorkflows(
                'message_received',
                userId,
                {
                    messageId: data.id,
                    content: data.content,
                    authorId: data.author.id,
                    authorName: data.author.username,
                    channelId: data.channel_id,
                    guildId: data.guild_id,
                    timestamp: data.timestamp,
                }
            );
        }
    }

    private async handleMemberJoin(data: any) {
        this.logger.log(`Member joined: ${data.user.username} in guild ${data.guild_id}`);
        const userIds = await this.getUserIdsFromGuildId(data.guild_id);
        if (userIds.length === 0) {
            this.logger.debug(`No users monitoring guild ${data.guild_id}`);
            return;
        }
        for (const userId of userIds) {
            await this.authService.triggerWorkflows(
                'member_joined',
                userId,
                {
                    userId: data.user.id,
                    username: data.user.username,
                    discriminator: data.user.discriminator,
                    guildId: data.guild_id,
                    joinedAt: data.joined_at,
                }
            );
        }
    }

    private async handleMemberLeave(data: any) {
        this.logger.log(`Member left: ${data.user.username} from guild ${data.guild_id}`);
        const userIds = await this.getUserIdsFromGuildId(data.guild_id);
        if (userIds.length === 0) {
            this.logger.debug(`No users monitoring guild ${data.guild_id}`);
            return;
        }
        for (const userId of userIds) {
            await this.authService.triggerWorkflows(
                'member_left',
                userId,
                {
                    userId: data.user.id,
                    username: data.user.username,
                    guildId: data.guild_id,
                    leftAt: new Date().toISOString(),
                }
            );
        }
    }

    private async handleMemberUpdate(data: any) {
        this.logger.log(`Member updated: ${data.user.username} in guild ${data.guild_id}`);
        const userIds = await this.getUserIdsFromGuildId(data.guild_id);
        if (userIds.length === 0) {
            this.logger.debug(`No users monitoring guild ${data.guild_id}`);
            return;
        }
        for (const userId of userIds) {
            for (const roleId of data.roles) {
                await this.authService.triggerWorkflows(
                    'role_assigned',
                    userId,
                    {
                        userId: data.user.id,
                        username: data.user.username,
                        roleId: roleId,
                        roleName: 'Unknown',
                        guildId: data.guild_id,
                    }
                );
            }
        }
    }

    private async handleReactionAdd(data: any) {
        this.logger.log(`Reaction added: ${data.emoji.name} on message ${data.message_id}`);
        const userIds = await this.getUserIdsFromGuildId(data.guild_id);
        if (userIds.length === 0) {
            this.logger.debug(`No users monitoring guild ${data.guild_id}`);
            return;
        }
        for (const userId of userIds) {
            await this.authService.triggerWorkflows(
                'reaction_added',
                userId,
                {
                    messageId: data.message_id,
                    userId: data.user_id,
                    emoji: data.emoji.name,
                    channelId: data.channel_id,
                    guildId: data.guild_id,
                }
            );
        }
    }

    private async getUserIdsFromGuildId(guildId: string): Promise<number[]> {
        try {
            const guilds = await this.prisma.discordGuild.findMany({
                where: { guildId: guildId },
                select: { userId: true }
            });
            return guilds.map(g => g.userId);
        } catch (error) {
            this.logger.error(`Error finding users for Guild ID ${guildId}:`, error);
            return [];
        }
    }
}
