import { Controller, Get, Post, Body, Query, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DiscordAuthService } from './discord-auth.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { CredentialsService } from 'src/credentials/credientials.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('discord/auth')
export class DiscordAuthController {
    private readonly logger = new Logger(DiscordAuthController.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor(
        private readonly discordAuthService: DiscordAuthService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly credentialsService: CredentialsService,
        private readonly prisma: PrismaService,
    ) {
        this.apiUrl = this.configService.get<string>('MAIN_API_URL') || 'http://localhost:8080';
        this.apiKey = this.configService.get<string>('API_KEY');
        if (!this.apiKey) {
            throw new Error('API_KEY not configured');
        }
    }

    @Post('initiate')
    async initiateAuth(@Body('userId') userId: number) {
        try {
            const authUrl = this.discordAuthService.getAuthUrl(userId.toString());
            return {
                success: true,
                authUrl,
                message: 'Redirect user to this URL to authenticate with Discord',
            };
        } catch (error) {
            this.logger.error('Failed to initiate Discord auth:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Get('callback')
    async handleCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3500';
        const botInviteLink = this.configService.get<string>('DISCORD_BOT_LINK');
        try {
            if (!code) {
                return res.redirect(`${frontendUrl}/settings/services?discord=error&reason=no_code`);
            }
            const userId = parseInt(state, 10);
            if (isNaN(userId)) {
                return res.redirect(`${frontendUrl}/settings/services?discord=error&reason=invalid_user`);
            }
            const tokenResponse = await this.discordAuthService.exchangeCodeForToken(code);
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
            const userInfo = await this.discordAuthService.getUserInfo(tokenResponse.access_token);
            const discordUserId = userInfo.id;
            await this.prisma.discordUser.upsert({
                where: { userId },
                update: { discordUserId },
                create: { userId, discordUserId },
            });
            await this.saveCredentialsToMainApi(
                userId,
                tokenResponse.access_token,
                tokenResponse.refresh_token,
                expiresAt
            );
            try {
                const guilds = await this.discordAuthService.getUserGuilds(tokenResponse.access_token);
                for (const guild of guilds) {
                    await this.prisma.discordGuild.upsert({
                        where: {
                            userId_guildId: {
                                userId,
                                guildId: guild.id,
                            },
                        },
                        update: {
                            guildName: guild.name,
                        },
                        create: {
                            userId,
                            guildId: guild.id,
                            guildName: guild.name,
                        },
                    });
                }
                this.logger.log(`Saved ${guilds.length} guilds for user ${userId}`);
            } catch (guildError) {
                this.logger.error('Failed to save guilds:', guildError.message);
            }
            this.logger.log(`Successfully saved Discord credentials for user ${userId}`);
            if (botInviteLink) {
                return res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Discord Setup - Step 2</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .container {
                                background: white;
                                padding: 3rem;
                                border-radius: 16px;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                text-align: center;
                                max-width: 500px;
                            }
                            h1 {
                                color: #5865F2;
                                margin-bottom: 1rem;
                                font-size: 2rem;
                            }
                            p {
                                color: #4f5660;
                                line-height: 1.6;
                                margin-bottom: 2rem;
                            }
                            .step {
                                background: #f6f6f7;
                                padding: 1rem;
                                border-radius: 8px;
                                margin-bottom: 1.5rem;
                            }
                            .step-number {
                                display: inline-block;
                                background: #5865F2;
                                color: white;
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                line-height: 30px;
                                margin-right: 10px;
                                font-weight: bold;
                            }
                            button {
                                background: #5865F2;
                                color: white;
                                border: none;
                                padding: 1rem 2rem;
                                border-radius: 8px;
                                font-size: 1.1rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                                width: 100%;
                                margin-bottom: 1rem;
                            }
                            button:hover {
                                background: #4752C4;
                                transform: translateY(-2px);
                                box-shadow: 0 5px 15px rgba(88, 101, 242, 0.4);
                            }
                            .skip {
                                background: transparent;
                                color: #5865F2;
                                text-decoration: underline;
                                font-size: 0.9rem;
                                padding: 0.5rem;
                            }
                            .skip:hover {
                                background: transparent;
                                transform: none;
                                box-shadow: none;
                            }
                            .icon {
                                font-size: 3rem;
                                margin-bottom: 1rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="icon">🤖</div>
                            <h1>Almost Done!</h1>
                            <p>To complete the Discord integration, you need to invite our bot to your server.</p>
                            <div class="step">
                                <span class="step-number">1</span>
                                <strong>Click the button below to invite the bot</strong>
                            </div>
                            <div class="step">
                                <span class="step-number">2</span>
                                <strong>Select your Discord server</strong>
                            </div>
                            <div class="step">
                                <span class="step-number">3</span>
                                <strong>Authorize the bot permissions</strong>
                            </div>
                            <button onclick="window.open('${botInviteLink}', '_blank'); setTimeout(() => window.location.href = '${frontendUrl}/settings/services?discord=success', 2000);">
                                Invite Bot to Server
                            </button>
                            <button class="skip" onclick="window.location.href = '${frontendUrl}/settings/services?discord=success'">
                                Skip (I already invited the bot)
                            </button>
                        </div>
                    </body>
                    </html>
                `);
            }
            return res.redirect(`${frontendUrl}/settings/services?discord=success`);
        } catch (error) {
            this.logger.error('Discord callback error:', error.message, error.stack);
            return res.redirect(`${frontendUrl}/settings/services?discord=error&reason=callback_failed`);
        }
    }

    private async saveCredentialsToMainApi(
        userId: number,
        accessToken: string,
        refreshToken: string,
        expiresAt: Date
    ) {
        try {
            const serviceId = this.authService.getServiceId();
            if (!serviceId) {
                throw new Error('Service not registered with main API. ServiceId is null.');
            }
            const payload = {
                userId,
                serviceId,
                token: accessToken,
                refreshToken,
                expiresAt: expiresAt.toISOString(),
            };
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.apiUrl}/credentials/microservice`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': this.apiKey,
                        },
                        timeout: 10000,
                    }
                )
            );
            const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            await this.credentialsService.saveCredentials(
                userId,
                accessToken,
                refreshToken,
                expiresIn
            );
            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to save credentials to main API: ${error.message}`,
                error.response?.data
            );
            throw new Error(`Failed to save credentials: ${error.message}`);
        }
    }

    @Post('refresh-token')
    async refreshToken(@Body('userId') userId: number) {
        try {
            const credentials = await this.getCredentialsFromMainApi(userId);
            if (!credentials.refreshToken) {
                return {
                    success: false,
                    error: 'No refresh token available',
                    needsAuth: true,
                };
            }
            const tokenData = await this.discordAuthService.refreshAccessToken(
                credentials.refreshToken
            );
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
            await this.saveCredentialsToMainApi(
                userId,
                tokenData.access_token,
                tokenData.refresh_token || credentials.refreshToken,
                expiresAt
            );
            return {
                success: true,
                token: tokenData.access_token,
            };
        } catch (error) {
            this.logger.error('Failed to refresh token:', error.message);
            return {
                success: false,
                error: error.message,
                needsAuth: true,
            };
        }
    }

    private async getCredentialsFromMainApi(userId: number) {
        try {
            const serviceId = this.authService.getServiceId();
            if (!serviceId) {
                throw new Error('Service not registered with main API');
            }
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.apiUrl}/credentials/user/${userId}/service/${serviceId}`,
                    {
                        headers: {
                            'x-api-key': this.apiKey,
                        },
                    }
                )
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get credentials from main API: ${error.message}`);
            throw error;
        }
    }

    @Post('disconnect')
    async disconnect(@Body('userId') userId: number) {
        try {
            const serviceId = this.authService.getServiceId();
            if (!serviceId) {
                throw new Error('Service not registered with main API');
            }
            const discordUser = await this.prisma.discordUser.findUnique({
                where: { userId },
            });
            await firstValueFrom(
                this.httpService.delete(
                    `${this.apiUrl}/credentials/user/${userId}/service/${serviceId}`,
                    {
                        headers: {
                            'x-api-key': this.apiKey,
                        },
                    }
                )
            );
            if (discordUser) {
                await this.prisma.discordUser.delete({
                    where: { userId },
                });
            }
            return {
                success: true,
                message: 'User disconnected from Discord',
            };
        } catch (error) {
            this.logger.error('Failed to disconnect user:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Post('debug/check-permissions')
    async checkPermissions(@Body() body: { guildId: string; roleId: string }) {
        try {
            const botToken = this.configService.get<string>('DISCORD_BOT_TOKEN');
            if (!botToken) {
                return { success: false, error: 'Bot token not configured' };
            }
            const botUser = await firstValueFrom(
                this.httpService.get('https://discord.com/api/users/@me', {
                    headers: { 'Authorization': `Bot ${botToken}` }
                })
            );
            const roles = await firstValueFrom(
                this.httpService.get(`https://discord.com/api/guilds/${body.guildId}/roles`, {
                    headers: { 'Authorization': `Bot ${botToken}` }
                })
            );
            const member = await firstValueFrom(
                this.httpService.get(
                    `https://discord.com/api/guilds/${body.guildId}/members/${botUser.data.id}`,
                    { headers: { 'Authorization': `Bot ${botToken}` } }
                )
            );
            const botRoles = member.data.roles;
            const allRoles = roles.data.sort((a, b) => b.position - a.position);
            const targetRole = allRoles.find(r => r.id === body.roleId);
            const botHighestRole = allRoles.find(r => botRoles.includes(r.id));
            return {
                success: true,
                bot: {
                    id: botUser.data.id,
                    username: botUser.data.username,
                    highestRole: botHighestRole ? {
                        id: botHighestRole.id,
                        name: botHighestRole.name,
                        position: botHighestRole.position
                    } : null
                },
                targetRole: targetRole ? {
                    id: targetRole.id,
                    name: targetRole.name,
                    position: targetRole.position
                } : null,
                canManage: botHighestRole && targetRole ?
                    botHighestRole.position > targetRole.position : false,
                message: botHighestRole && targetRole ?
                    (botHighestRole.position > targetRole.position ?
                        ' Bot can manage this role' :
                        ` Bot role (position ${botHighestRole.position}) is below target role (position ${targetRole.position}). Move the bot role higher in Server Settings > Roles.`
                    ) : 'Could not determine role positions'
            };
        } catch (error) {
            this.logger.error('Failed to check permissions:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
