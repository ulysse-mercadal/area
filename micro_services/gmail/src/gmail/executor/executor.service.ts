import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GmailAuthService } from '../auth/gmail-auth.service';
import { mergeConfigAndInput } from './parameter-resolver';

@Injectable()
export class GmailExecutorService {
    private readonly logger = new Logger(GmailExecutorService.name);
    private readonly baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    private readonly driveBaseUrl = 'https://www.googleapis.com/drive/v3';

    constructor(
        private httpService: HttpService,
        private gmailAuth: GmailAuthService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    private async getAccessToken(userId: number): Promise<string> {
        const serviceId = parseInt(this.configService.get<string>('SERVICE_ID') || '6');
        const credential = await this.prisma.credential.findFirst({
            where: {
                userId,
                serviceId,
            },
        });
        if (!credential) {
            throw new BadRequestException(`Gmail credentials not found for user ${userId} (service ${serviceId})`);
        }
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            this.logger.log(`Token expired for user ${userId}, refreshing...`);
            if (!credential.refreshToken) {
                throw new BadRequestException('No refresh token available');
            }
            const refreshed = await this.gmailAuth.refreshAccessToken(credential.refreshToken);
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

    async executeAction(
        actionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing action: ${actionName}`);
        switch (actionName) {
            case 'email_received':
                return input
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
        this.logger.log(`Config: ${JSON.stringify(config)}`);
        this.logger.log(`Input: ${JSON.stringify(input)}`);
        const accessToken = await this.getAccessToken(userId);
        const params = mergeConfigAndInput(config, input);
        switch (reactionName) {
            case 'send_email':
                return await this.sendEmail(params, accessToken);
            case 'create_draft':
                return await this.createDraft(params, accessToken);
            case 'add_label':
                return await this.addLabel(params, accessToken);
            case 'flag_email':
                return await this.flagEmail(params, accessToken);
            case 'reply_email':
                return await this.replyEmail(params, accessToken);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }

    private async sendEmail(params: any, accessToken: string) {
        const { to, subject, body } = params;

        if (!to || !subject || !body) {
            throw new BadRequestException('Missing parameters: to, subject, and body are required for send_email');
        }

        this.logger.log(`Sending email to: ${to}`);

        try {
            const prefixedSubject = subject && subject.startsWith('[AREA]') ? subject : `[AREA] ${subject}`;

            const rawMessage = [
                `To: ${to}`,
                `X-Area-Generated: true`,
                `Subject: ${prefixedSubject}`,
                'Content-Type: text/html; charset=UTF-8',
                '',
                body,
            ].join('\n');

            const encodedMessage = Buffer.from(rawMessage)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await firstValueFrom(
                this.httpService.post(
                    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                    { raw: encodedMessage },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                id: data.id,
                threadId: data.threadId,
                message: `Email successfully sent to ${to}`,
            };
        } catch (error) {
            this.logger.error('Error sending email via Gmail:', error.response?.data || error.message);
            throw new BadRequestException('Failed to send email');
        }
    }

    private async createDraft(params: any, accessToken: string) {
        const { to, subject, body } = params;

        if (!to || !subject || !body) {
            throw new BadRequestException(
            'Missing parameters: to, subject, and body are required for create_draft',
            );
        }

        if (typeof to !== 'string' || !to.includes('@')) {
            throw new BadRequestException(`Invalid 'to' address resolved for draft: ${String(to)}`);
        }

        this.logger.log(`Creating Gmail draft for: ${to}`);

        try {
            const result = await this.gmailAuth.createDraft(to, subject, body, accessToken);

            return {
            success: true,
            draftId: result.id,
            threadId: result.message?.threadId,
            message: `Draft created successfully for ${to}`,
            };
        } catch (error) {
            this.logger.error(
            'Error creating Gmail draft:',
            error.response?.data || error.message,
            );
            throw new BadRequestException('Failed to create Gmail draft');
        }
    }

    private async addLabel(params: any, accessToken: string) {
        const { id, labelName } = params;

        if (!id || !labelName) {
            throw new BadRequestException('Missing parameters: id and labelName are required for add_label');
        }

        this.logger.log(`Adding label "${labelName}" to message: ${id}`);

        try {
            const result = await this.gmailAuth.addLabelToEmail(id, labelName, accessToken);
            return {
                success: true,
                id: result.id,
                labels: result.labelIds,
                message: `Label "${labelName}" successfully applied to message ${id}`,
            };
        } catch (error) {
            const msg = error?.response?.data?.error?.message || error.message || 'Unknown Gmail error';
            this.logger.error('Error adding Gmail label:', msg);
            throw new BadRequestException(`Failed to add Gmail label: ${msg}`);
        }
    }

    private async flagEmail(params: any, accessToken: string) {
        const { id } = params;

        if (!id) {
            throw new BadRequestException('Missing parameter: id is required for flag_email');
        }

        this.logger.log(`Flagging email as important: ${id}`);

        try {
            const result = await this.gmailAuth.flagEmail(id, accessToken);
            return {
            success: true,
            id: result.id,
            flagged: result.flagged,
            message: `Email ${id} flagged as important`
            };
        } catch (error) {
            this.logger.error('Error flagging email via Gmail:', error.response?.data || error.message);
            throw new BadRequestException('Failed to flag email');
        }
    }

    private async replyEmail(params: any, accessToken: string) {
    const { id, body } = params;

    if (!id || !body) {
            throw new BadRequestException('Missing parameters: id and body are required for reply_email');
        }

        this.logger.log(`Replying to email ${id}`);

        try {
            const result = await this.gmailAuth.replyEmail(id, body, accessToken);
            return {
            success: true,
            id: result.id,
            threadId: result.threadId,
            message: `Reply sent for email ${id}`
            };
        } catch (error) {
            this.logger.error('Error replying to email via Gmail:', error.response?.data || error.message);
            throw new BadRequestException('Failed to reply to email');
        }
    }


}
