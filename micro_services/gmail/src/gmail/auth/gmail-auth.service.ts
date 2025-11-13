import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GmailAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;
    private lastHistoryIds = new Map<number, string>();



    constructor(private configService: ConfigService, private prisma: PrismaService,) {
        this.clientID = this.configService.get<string>('GMAIL_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('Google client ID undefined');
        this.clientSecret = this.configService.get<string>('GMAIL_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('Google clientSecret undefined');
        this.redirectUrl = this.configService.get<string>('GMAIL_REDIRECT_URI', '');
        if (this.redirectUrl === '') throw new Error('Google redirectURL undefined');
    }

    private getOAuth2Client() {
        return new google.auth.OAuth2(
            this.clientID,
            this.clientSecret,
            this.redirectUrl
        );
    }

    getAuthUrl(userId?: string): string {
        const oauth2Client = this.getOAuth2Client();
        const scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.send',
        ];
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId || '',
            prompt: 'consent',
        });
    }

    async exchangeCodeForToken(code: string) {
        try {
            const oauth2Client = this.getOAuth2Client();
            const { tokens } = await oauth2Client.getToken(code);
            return {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.expiry_date
                    ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
                    : 3600,
            };
        } catch (error) {
            console.error('Google token exchange failed:', error);
            throw new InternalServerErrorException('Failed to exchange code for token');
        }
    }

    async refreshAccessToken(refreshToken: string) {
        try {
            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await oauth2Client.refreshAccessToken();
            return {
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token || refreshToken,
                expires_in: credentials.expiry_date
                    ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
                    : 3600,
            };
        } catch (error) {
            console.error('Google refresh token failed', error);
            throw new Error('Failed to refresh Google token');
        }
    }

    async getAccessTokenForUser(userId: number): Promise<string> {
        const serviceId = parseInt(this.configService.get<string>('SERVICE_ID') || '2');
        const creds = await this.prisma.credential.findUnique({
            where: {
                userId_serviceId: {
                    userId,
                    serviceId,
                },
            },
        });

        if (!creds) {
            throw new Error(`No credentials found for user ${userId} (service ${serviceId})`);
        }

        return creds.token;
    }

    async getNewEmails(userId: number, historyId: string, accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const historyResponse = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: historyId,
            historyTypes: ['messageAdded'],
        });

        const messages: any[] = [];

        let selfEmail: string | null = null;
        try {
            const profileResp = await gmail.users.getProfile({ userId: 'me' });
            selfEmail = profileResp?.data?.emailAddress || null;
        } catch (err) {
            console.warn('Failed to get profile email for filtering:', err?.message || err);
            selfEmail = null;
        }

        if (historyResponse.data.history) {
            for (const history of historyResponse.data.history) {
            const historyId = history.id?.toString();
            if (history.messagesAdded) {
                for (const msg of history.messagesAdded) {
                const message = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.message.id,
                    format: 'full',
                });

                const headers = message.data.payload.headers.reduce(
                    (acc, h) => ({ ...acc, [h.name.toLowerCase()]: h.value }),
                    {} as Record<string, string>,
                );

                const generatedHeader = headers['x-area-generated'];
                if (generatedHeader) {
                    continue;
                }

                if (selfEmail && headers['from'] && headers['from'].includes(selfEmail)) {
                    continue;
                }

                const bodyData = message.data.payload.parts?.[0]?.body?.data;
                const body = bodyData
                    ? Buffer.from(bodyData, 'base64').toString('utf-8')
                    : message.data.snippet;

                messages.push({
                    id: message.data.id,
                    threadId: message.data.threadId,
                    from: headers['from'],
                    to: headers['to'],
                    subject: headers['subject'],
                    body,
                    receivedAt: message.data.internalDate,
                    historyId,
                });
                }
            }
            }
        }

        return messages;
        }

    async getProfileHistoryId(accessToken: string): Promise<string | null> {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const profileResponse = await gmail.users.getProfile({ userId: 'me' });
        if (profileResponse && profileResponse.data && profileResponse.data.historyId) {
            return profileResponse.data.historyId as string;
        }
        return null;
    }


    async sendEmail(to: string, subject: string, body: string, accessToken: string) {
        const gmail = google.gmail({ version: 'v1', auth: accessToken });

        const rawMessage = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            body,
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });

        return response.data;
    }


    async createDraft(to: string, subject: string, body: string, accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const rawMessage = [
            `To: ${to}`,
            `X-Area-Generated: true`,
            `Subject: ${subject}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            body,
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
            message: { raw: encodedMessage },
            },
        });

        return response.data;
    }

    async addLabelToEmail(id: string, labelName: string, accessToken: string) {
        if (!id || !labelName) {
            throw new Error('Missing parameters: id and labelName are required');
        }

        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
        const existingLabel = labelsResponse.data.labels?.find(l => l.name === labelName);

        let labelId = existingLabel?.id;

        if (!labelId) {
            const newLabel = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show',
                },
            });
            labelId = newLabel.data.id;
        }

        const response = await gmail.users.messages.modify({
            userId: 'me',
            id: id,
            requestBody: {
                addLabelIds: [labelId],
            },
        });

        return response.data;
    }

    async flagEmail(id: string, accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const response = await gmail.users.messages.modify({
            userId: 'me',
            id: id,
            requestBody: {
                addLabelIds: ['IMPORTANT'],
            },
        });

        return {
            id: response.data.id,
            flagged: response.data.labelIds?.includes('IMPORTANT') || false,
        };
    }

    async replyEmail(id: string, body: string, accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const original = await gmail.users.messages.get({
            userId: 'me',
            id: id,
            format: 'full'
        });

        const headers = original.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const idHeader = headers.find(h => h.name === 'Message-ID')?.value || '';
        const threadId = original.data.threadId;

        const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

        const rawMessage = [
            `To: ${from}`,
            `Subject: ${replySubject}`,
            `In-Reply-To: ${idHeader}`,
            `References: ${idHeader}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            body
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage, threadId }
        });

        return {
            id: response.data.id,
            threadId: response.data.threadId
        };
    }

}
