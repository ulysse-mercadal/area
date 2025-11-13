import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;

    constructor(private configService: ConfigService) {
        this.clientID = this.configService.get<string>('GOOGLE_SHEETS_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('Google client ID undefined');
        this.clientSecret = this.configService.get<string>('GOOGLE_SHEETS_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('Google clientSecret undefined');
        this.redirectUrl = this.configService.get<string>('GOOGLE_SHEETS_REDIRECT_URI', '');
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
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
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

    private getSheetsClient(accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.sheets({ version: 'v4', auth: oauth2Client });
    }

    private getDriveClient(accessToken: string) {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    async createSpreadsheet(title: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: { title },
            },
        });
        return response.data;
    }

    async appendRow(spreadsheetId: string, range: string, values: any[][], accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        return response.data;
    }

    async readRange(spreadsheetId: string, range: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data;
    }

    async updateRange(spreadsheetId: string, range: string, values: any[][], accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        return response.data;
    }

    async createSheet(spreadsheetId: string, sheetTitle: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: { title: sheetTitle },
                    },
                }],
            },
        });
        return response.data;
    }

    async deleteSheet(spreadsheetId: string, sheetId: number, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteSheet: { sheetId },
                }],
            },
        });
        return response.data;
    }

    async clearRange(spreadsheetId: string, range: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range,
        });
        return response.data;
    }

    async getSpreadsheetMetadata(spreadsheetId: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        return response.data;
    }

    async formatCells(spreadsheetId: string, sheetId: number, startRow: number, endRow: number, startCol: number, endCol: number, format: any, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: startRow,
                            endRowIndex: endRow,
                            startColumnIndex: startCol,
                            endColumnIndex: endCol,
                        },
                        cell: { userEnteredFormat: format },
                        fields: 'userEnteredFormat',
                    },
                }],
            },
        });
        return response.data;
    }

    async copySheet(sourceSpreadsheetId: string, sheetId: number, destinationSpreadsheetId: string, accessToken: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.sheets.copyTo({
            spreadsheetId: sourceSpreadsheetId,
            sheetId,
            requestBody: {
                destinationSpreadsheetId,
            },
        });
        return response.data;
    }

    async findAndReplace(spreadsheetId: string, find: string, replacement: string, sheetId?: number, accessToken?: string) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    findReplace: {
                        find,
                        replacement,
                        allSheets: !sheetId,
                        sheetId,
                    },
                }],
            },
        });
        return response.data;
    }

    async sortRange(
        spreadsheetId: string,
        startRow: number,
        endRow: number,
        startCol: number,
        endCol: number,
        ascending: boolean,
        accessToken: string,
        sheetId: number = 0,
        sortColumnIndex: number = 0
    ) {
        const sheets = this.getSheetsClient(accessToken);
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    sortRange: {
                        range: {
                            sheetId,
                            startRowIndex: startRow - 1,
                            endRowIndex: endRow,
                            startColumnIndex: startCol - 1,
                            endColumnIndex: endCol,
                        },
                        sortSpecs: [{
                            dimensionIndex: sortColumnIndex,
                            sortOrder: ascending ? 'ASCENDING' : 'DESCENDING',
                        }],
                    },
                }],
            },
        });
        return response.data;
    }

    async listSpreadsheets(accessToken: string, pageSize: number = 10) {
        const drive = this.getDriveClient(accessToken);
        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            pageSize,
            fields: 'files(id, name, createdTime, modifiedTime)',
        });
        return response.data;
    }

    async duplicateSpreadsheet(spreadsheetId: string, newTitle: string, accessToken: string) {
        const drive = this.getDriveClient(accessToken);
        const response = await drive.files.copy({
            fileId: spreadsheetId,
            requestBody: { name: newTitle },
        });
        return response.data;
    }
}
