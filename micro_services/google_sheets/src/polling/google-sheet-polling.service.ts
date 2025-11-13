import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CredentialsService } from '../credentials/credientials.service';
import { GoogleSheetsAuthService } from '../google_sheets/auth/google-sheets-auth.service';

interface SpreadsheetSnapshot {
    id: string;
    name: string;
    modifiedTime: string;
    sheets: Map<string, any[][]>;
}

@Injectable()
export class GoogleSheetsPollingService implements OnModuleInit {
    private readonly logger = new Logger(GoogleSheetsPollingService.name);
    private readonly spreadsheetsCache = new Map<number, Map<string, SpreadsheetSnapshot>>();
    private readonly pollInterval = 5000;
    private isPolling = false;
    private readonly initializedUsers = new Set<number>();

    constructor(
        private readonly credentialsService: CredentialsService,
        private readonly googleSheetsAuthService: GoogleSheetsAuthService,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit() {
        this.logger.log('Starting Google Sheets polling service');
        await this.startPolling();
    }

    async startPolling() {
        if (this.isPolling) {
            this.logger.warn('Polling already running');
            return;
        }
        this.isPolling = true;
        this.logger.log(`Polling every ${this.pollInterval / 1000} seconds`);
        await this.pollAllUsers();
        setInterval(async () => {
            await this.pollAllUsers();
        }, this.pollInterval);
    }

    stopPolling() {
        this.isPolling = false;
        this.logger.log('Polling stopped');
    }

    private async pollAllUsers() {
        try {
            const userIds = await this.credentialsService.getAllUsersWithCredentials();
            if (userIds.length === 0) {
                this.logger.debug('No users to poll');
                return;
            }
            this.logger.debug(`Polling ${userIds.length} users`);
            await Promise.allSettled(
                userIds.map((userId) => this.checkUserSpreadsheets(userId)),
            );
        } catch (error) {
            this.logger.error('Error in pollAllUsers:', error.message);
        }
    }

    private async checkUserSpreadsheets(userId: number) {
        try {
            const credentials = await this.credentialsService.getCredentials(userId);
            let token = credentials.token;
            if (this.credentialsService.isTokenExpired(credentials)) {
                if (!credentials.refreshToken) {
                    this.logger.warn(
                        `Token expired for user ${userId}, no refresh token`,
                    );
                    return;
                }
                const newToken = await this.refreshToken(
                    userId,
                    credentials.refreshToken,
                );
                token = newToken;
            }
            const spreadsheetsResponse = await this.googleSheetsAuthService.listSpreadsheets(
                token,
                100
            );
            const spreadsheets = spreadsheetsResponse.files || [];
            this.logger.debug(`Found ${spreadsheets.length} spreadsheets for user ${userId}`);
            await Promise.allSettled(
                spreadsheets.map((spreadsheet) =>
                    this.checkSpreadsheetChanges(userId, spreadsheet, token)
                )
            );
            if (!this.initializedUsers.has(userId)) {
                this.initializedUsers.add(userId);
                this.logger.log(`User ${userId} initialization complete`);
            }
        } catch (error) {
            this.logger.error(
                `Error checking user ${userId}:`,
                error.message,
            );
        }
    }

    private async checkSpreadsheetChanges(userId: number, spreadsheet: any, token: string) {
        try {
            const spreadsheetId = spreadsheet.id;
            const spreadsheetName = spreadsheet.name;
            const modifiedTime = spreadsheet.modifiedTime;
            if (!this.spreadsheetsCache.has(userId)) {
                this.spreadsheetsCache.set(userId, new Map());
            }
            const userCache = this.spreadsheetsCache.get(userId)!;
            const previousSnapshot = userCache.get(spreadsheetId);
            const isUserInitialized = this.initializedUsers.has(userId);
            if (!previousSnapshot) {
                this.logger.debug(`Initializing snapshot for: ${spreadsheetName} (user ${userId})`);
                const currentSnapshot = await this.getSpreadsheetSnapshot(
                    spreadsheetId,
                    spreadsheetName,
                    modifiedTime,
                    token
                );
                userCache.set(spreadsheetId, currentSnapshot);
                if (isUserInitialized) {
                    this.logger.log(`New spreadsheet created: ${spreadsheetName} for user ${userId}`);
                    await this.triggerWebhook(userId, 'spreadsheet_created', {
                        spreadsheetId,
                        spreadsheetName,
                        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                        createdAt: spreadsheet.createdTime,
                    });
                }
                return;
            }
            if (previousSnapshot.modifiedTime === modifiedTime) {
                return;
            }
            this.logger.log(`Spreadsheet modified: ${spreadsheetName} for user ${userId}`);
            const currentSnapshot = await this.getSpreadsheetSnapshot(
                spreadsheetId,
                spreadsheetName,
                modifiedTime,
                token
            );
            await this.detectChanges(userId, previousSnapshot, currentSnapshot);
            userCache.set(spreadsheetId, currentSnapshot);
        } catch (error) {
            this.logger.error(
                `Error checking spreadsheet ${spreadsheet.name}:`,
                error.message,
            );
        }
    }

    private async getSpreadsheetSnapshot(
        spreadsheetId: string,
        spreadsheetName: string,
        modifiedTime: string,
        token: string
    ): Promise<SpreadsheetSnapshot> {
        const sheets = new Map<string, any[][]>();
        try {
            const metadata = await this.googleSheetsAuthService.getSpreadsheetMetadata(
                spreadsheetId,
                token
            );
            for (const sheet of metadata.sheets || []) {
                const sheetName = sheet.properties?.title;
                if (!sheetName) continue;
                try {
                    const response = await this.googleSheetsAuthService.readRange(
                        spreadsheetId,
                        sheetName,
                        token
                    );
                    sheets.set(sheetName, response.values || []);
                } catch (error) {
                    this.logger.warn(`Could not read sheet ${sheetName}:`, error.message);
                }
            }
        } catch (error) {
            this.logger.error('Error getting spreadsheet snapshot:', error.message);
        }
        return {
            id: spreadsheetId,
            name: spreadsheetName,
            modifiedTime,
            sheets,
        };
    }
    private async detectChanges(
        userId: number,
        previousSnapshot: SpreadsheetSnapshot,
        currentSnapshot: SpreadsheetSnapshot
    ) {
        for (const [sheetName, currentRows] of currentSnapshot.sheets.entries()) {
            const previousRows = previousSnapshot.sheets.get(sheetName) || [];
            if (currentRows.length > previousRows.length) {
                const newRows = currentRows.slice(previousRows.length);
                for (let i = 0; i < newRows.length; i++) {
                    const rowIndex = previousRows.length + i + 1;
                    this.logger.log(
                        `User ${userId} added row ${rowIndex} in ${currentSnapshot.name}/${sheetName}`
                    );
                    await this.triggerWebhook(userId, 'new_row_added', {
                        spreadsheetId: currentSnapshot.id,
                        spreadsheetName: currentSnapshot.name,
                        sheetName,
                        rowData: newRows[i],
                        rowIndex,
                        addedAt: new Date().toISOString(),
                    });
                }
            }
            const minLength = Math.min(currentRows.length, previousRows.length);
            for (let rowIndex = 0; rowIndex < minLength; rowIndex++) {
                const currentRow = currentRows[rowIndex] || [];
                const previousRow = previousRows[rowIndex] || [];
                for (let colIndex = 0; colIndex < Math.max(currentRow.length, previousRow.length); colIndex++) {
                    const currentValue = currentRow[colIndex];
                    const previousValue = previousRow[colIndex];
                    if (currentValue !== previousValue) {
                        const cellRange = this.getCellNotation(rowIndex, colIndex);
                        this.logger.log(
                            `User ${userId} updated cell ${cellRange} in ${currentSnapshot.name}/${sheetName}`
                        );
                        await this.triggerWebhook(userId, 'cell_updated', {
                            spreadsheetId: currentSnapshot.id,
                            spreadsheetName: currentSnapshot.name,
                            sheetName,
                            cellRange,
                            oldValue: previousValue,
                            newValue: currentValue,
                            updatedAt: new Date().toISOString(),
                        });
                    }
                }
            }
        }
        for (const sheetName of currentSnapshot.sheets.keys()) {
            if (!previousSnapshot.sheets.has(sheetName)) {
                this.logger.log(
                    `User ${userId} created sheet ${sheetName} in ${currentSnapshot.name}`
                );
                await this.triggerWebhook(userId, 'sheet_created', {
                    spreadsheetId: currentSnapshot.id,
                    spreadsheetName: currentSnapshot.name,
                    sheetName,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    }

    private getCellNotation(rowIndex: number, colIndex: number): string {
        let col = '';
        let n = colIndex;
        while (n >= 0) {
            col = String.fromCharCode(65 + (n % 26)) + col;
            n = Math.floor(n / 26) - 1;
        }
        const row = rowIndex + 1;
        return `${col}${row}`;
    }

    private async refreshToken(
        userId: number,
        refreshToken: string,
    ): Promise<string> {
        const tokenData = await this.googleSheetsAuthService.refreshAccessToken(refreshToken);
        await this.credentialsService.saveCredentials(
            userId,
            tokenData.access_token,
            tokenData.refresh_token || refreshToken,
            tokenData.expires_in,
        );
        return tokenData.access_token;
    }

    private async triggerWebhook(
        userId: number,
        eventType: string,
        data: any,
    ) {
        try {
            const mainApiUrl = this.configService.get<string>('MAIN_API_URL');
            const apiKey = this.configService.get<string>('API_KEY');
            const url = `${mainApiUrl}/workflow/trigger/${userId}/${eventType}`;

            const payload = {
                userId,
                data,
            };

            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json',
                    },
                }),
            );

            this.logger.log(
                `Webhook ${eventType} triggered successfully for user ${userId}: ${response.status}`,
            );
            this.logger.debug(`Response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            this.logger.error(
                `Failed to trigger webhook ${eventType} for user ${userId}:`,
                error.message,
            );
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}`);
                this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}
