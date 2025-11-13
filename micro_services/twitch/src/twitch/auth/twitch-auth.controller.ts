import { Controller, Get, Post, Body, Query, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TwitchAuthService } from './twitch-auth.service';
import { TwitchEventSubService } from '../webhook/twitch-eventsub.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { CredentialsService } from 'src/credentials/credientials.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('twitch/auth')
export class TwitchAuthController {
    private readonly logger = new Logger(TwitchAuthController.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor(
        private readonly twitchAuthService: TwitchAuthService,
        private readonly twitchEventSubService: TwitchEventSubService,
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
            const authUrl = this.twitchAuthService.getAuthUrl(userId.toString());
            return {
                success: true,
                authUrl,
                message: 'Redirect user to this URL to authenticate with Twitch',
            };
        } catch (error) {
            this.logger.error('Failed to initiate Twitch auth:', error.message);
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
        try {
            if (!code) {
                return res.redirect(`${frontendUrl}/settings/services?twitch=error&reason=no_code`);
            }
            const userId = parseInt(state, 10);
            if (isNaN(userId)) {
                return res.redirect(`${frontendUrl}/settings/services?twitch=error&reason=invalid_user`);
            }
            const tokenResponse = await this.twitchAuthService.exchangeCodeForToken(code);
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
            const userInfo = await this.twitchAuthService.getUserInfo(tokenResponse.access_token);
            const broadcasterId = userInfo.data[0].id;
            await this.prisma.twitchUser.upsert({
                where: { userId },
                update: { broadcasterId },
                create: { userId, broadcasterId },
            });
            await this.saveCredentialsToMainApi(
                userId,
                tokenResponse.access_token,
                tokenResponse.refresh_token,
                expiresAt
            );
            try {
                await this.twitchEventSubService.setupUserWebhooks(
                    broadcasterId,
                    tokenResponse.access_token
                );
                this.logger.log(`EventSub webhooks configured for user ${userId}`);
            } catch (webhookError) {
                this.logger.error(`Failed to setup webhooks: ${webhookError.message}`);
            }
            this.logger.log(`Successfully saved Twitch credentials for user ${userId}`);
            return res.redirect(`${frontendUrl}/settings/services?twitch=success`);
        } catch (error) {
            this.logger.error('Twitch callback error:', error.message, error.stack);
            return res.redirect(`${frontendUrl}/settings/services?twitch=error&reason=callback_failed`);
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
            const tokenData = await this.twitchAuthService.refreshAccessToken(
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
            const twitchUser = await this.prisma.twitchUser.findUnique({
                where: { userId },
            });
            if (twitchUser?.broadcasterId) {
                try {
                    await this.twitchEventSubService.removeUserWebhooks(
                        twitchUser.broadcasterId
                    );
                    this.logger.log(`Removed EventSub webhooks for user ${userId}`);
                } catch (webhookError) {
                    this.logger.error(`Failed to remove webhooks: ${webhookError.message}`);
                }
            }
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
            if (twitchUser) {
                await this.prisma.twitchUser.delete({
                    where: { userId },
                });
            }
            return {
                success: true,
                message: 'User disconnected from Twitch',
            };
        } catch (error) {
            this.logger.error('Failed to disconnect user:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
