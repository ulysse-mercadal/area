import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleSheetsAuthService } from '../auth/google-sheets-auth.service';
import { mergeConfigAndInput } from './parameter-resolver';

@Injectable()
export class GoogleSheetsExecutorService {
    private readonly logger = new Logger(GoogleSheetsExecutorService.name);
    private readonly baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    private readonly driveBaseUrl = 'https://www.googleapis.com/drive/v3';

    constructor(
        private httpService: HttpService,
        private sheetsAuth: GoogleSheetsAuthService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    private async getAccessToken(userId: number): Promise<string> {
        const credential = await this.prisma.credential.findFirst({
            where: {
                userId,
                serviceId: 2,
            },
        });
        if (!credential) {
            throw new BadRequestException('Google Sheets credentials not found for user');
        }
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            this.logger.log(`Token expired for user ${userId}, refreshing...`);
            if (!credential.refreshToken) {
                throw new BadRequestException('No refresh token available');
            }
            const refreshed = await this.sheetsAuth.refreshAccessToken(credential.refreshToken);
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
            case 'new_row_added':
                return input;
            case 'spreadsheet_created':
                return input;
            case 'cell_updated':
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
        this.logger.log(`Config: ${JSON.stringify(config)}`);
        this.logger.log(`Input: ${JSON.stringify(input)}`);
        const accessToken = await this.getAccessToken(userId);
        const params = mergeConfigAndInput(config, input);
        switch (reactionName) {
            case 'create_spreadsheet':
                return await this.createSpreadsheet(params, accessToken);
            case 'add_row':
                return await this.appendRow(params, accessToken);
            case 'write_in_cell':
                return await this.updateCell(params, accessToken);
            case 'read_in_range':
                return await this.readRange(params, accessToken);
            case 'create_sheet':
                return await this.createSheet(params, accessToken);
            case 'clear_in_range':
                return await this.clearRange(params, accessToken);
            case 'duplicate_sheet':
                return await this.duplicateSheet(params, accessToken);
            case 'find_to_replace':
                return await this.findReplace(params, accessToken);
            case 'sort_data_in_range':
                return await this.sortRange(params, accessToken);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }

    private async createSpreadsheet(params: any, accessToken: string) {
        const title = params.title || params.spreadsheetTitle;
        if (!title) {
            throw new BadRequestException('title is required for create_spreadsheet');
        }
        this.logger.log(`Creating spreadsheet: ${title}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    this.baseUrl,
                    {
                        properties: { title },
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId: data.spreadsheetId,
                spreadsheetUrl: data.spreadsheetUrl,
                title: data.properties?.title,
                message: `Spreadsheet created: ${title}`,
            };
        } catch (error) {
            this.logger.error('Error creating spreadsheet:', error.response?.data || error.message);
            throw new BadRequestException('Failed to create spreadsheet');
        }
    }

    private async appendRow(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        let sheetName = params.sheetName;
        if (!sheetName) {
            try {
                const metadata = await firstValueFrom(
                    this.httpService.get(
                        `${this.baseUrl}/${spreadsheetId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                            },
                            params: {
                                fields: 'sheets.properties.title'
                            }
                        }
                    )
                );
                sheetName = metadata.data.sheets?.[0]?.properties?.title || 'Sheet1';
                this.logger.log(`Auto-detected sheet name: ${sheetName}`);
            } catch (error) {
                this.logger.warn('Failed to get sheet name, using default');
                sheetName = 'Sheet1';
            }
        }
        let values: any[];
        if (params.rowData) {
            if (typeof params.rowData === 'string') {
                values = params.rowData
                    .split(',')
                    .map(v => v.trim().replace(/^["']|["']$/g, ''));
                this.logger.log(`Parsing rowData string to array: ${JSON.stringify(values)}`);
            } else if (typeof params.rowData === 'object' && !Array.isArray(params.rowData)) {
                values = Object.values(params.rowData);
                this.logger.log(`Converting rowData object to array: ${JSON.stringify(values)}`);
            } else if (Array.isArray(params.rowData)) {
                values = params.rowData;
            } else {
                throw new BadRequestException('rowData must be a string, object, or array');
            }
        } else if (params.values && Array.isArray(params.values)) {
            values = params.values;
        } else {
            throw new BadRequestException('rowData or values is required for add_row');
        }
        if (!spreadsheetId) {
            throw new BadRequestException('spreadsheetId is required for add_row');
        }
        if (!values || values.length === 0) {
            throw new BadRequestException('rowData/values cannot be empty');
        }
        this.logger.log(`Appending row to ${spreadsheetId}:${sheetName} - Values: ${JSON.stringify(values)}`);
        const range = `${sheetName}!A:Z`;
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
                    {
                        values: [values],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        params: {
                            valueInputOption: 'USER_ENTERED',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId,
                updatedRange: data.updates?.updatedRange,
                updatedRows: data.updates?.updatedRows,
                message: `Row appended to ${sheetName}`,
            };
        } catch (error) {
            this.logger.error('Error appending row:', error.response?.data || error.message);
            throw new BadRequestException('Failed to append row');
        }
    }

    private async updateCell(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        const value = params.value;
        if (!spreadsheetId || !range || value === undefined) {
            throw new BadRequestException('spreadsheetId, range, and value are required for write_in_cell');
        }
        this.logger.log(`Updating cell ${range} in ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.put(
                    `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
                    {
                        values: [[value]],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        params: {
                            valueInputOption: 'USER_ENTERED',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId,
                updatedRange: data.updatedRange,
                updatedCells: data.updatedCells,
                message: `Cell ${range} updated`,
            };
        } catch (error) {
            this.logger.error('Error updating cell:', error.response?.data || error.message);
            throw new BadRequestException('Failed to update cell');
        }
    }

    private async readRange(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        if (!spreadsheetId || !range) {
            throw new BadRequestException('spreadsheetId and range are required for read_in_range');
        }
        this.logger.log(`Reading range ${range} from ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId,
                range: data.range,
                values: data.values || [],
                message: `Read ${data.values?.length || 0} rows from ${range}`,
            };
        } catch (error) {
            this.logger.error('Error reading range:', error.response?.data || error.message);
            throw new BadRequestException('Failed to read range');
        }
    }

    private async createSheet(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const sheetTitle = params.sheetTitle || params.sheetName;
        if (!spreadsheetId || !sheetTitle) {
            throw new BadRequestException('spreadsheetId and sheetTitle are required for create_sheet');
        }
        this.logger.log(`Creating sheet ${sheetTitle} in ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/${spreadsheetId}:batchUpdate`,
                    {
                        requests: [
                            {
                                addSheet: {
                                    properties: { title: sheetTitle },
                                },
                            },
                        ],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId,
                sheetTitle,
                sheetId: data.replies?.[0]?.addSheet?.properties?.sheetId,
                message: `Sheet ${sheetTitle} created`,
            };
        } catch (error) {
            this.logger.error('Error creating sheet:', error.response?.data || error.message);
            throw new BadRequestException('Failed to create sheet');
        }
    }

    private async clearRange(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        if (!spreadsheetId || !range) {
            throw new BadRequestException('spreadsheetId and range are required for clear_in_range');
        }
        this.logger.log(`Clearing range ${range} in ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            return {
                success: true,
                spreadsheetId,
                clearedRange: range,
                message: `Range ${range} cleared`,
            };
        } catch (error) {
            this.logger.error('Error clearing range:', error.response?.data || error.message);
            throw new BadRequestException('Failed to clear range');
        }
    }

    private async duplicateSheet(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const newTitle = params.newTitle;
        if (!spreadsheetId || !newTitle) {
            throw new BadRequestException('spreadsheetId and newTitle are required for duplicate_sheet');
        }
        this.logger.log(`Duplicating spreadsheet ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.driveBaseUrl}/files/${spreadsheetId}/copy`,
                    {
                        name: newTitle,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                originalSpreadsheetId: spreadsheetId,
                newSpreadsheetId: data.id,
                newTitle: data.name,
                message: `Spreadsheet duplicated as ${newTitle}`,
            };
        } catch (error) {
            this.logger.error('Error duplicating spreadsheet:', error.response?.data || error.message);
            throw new BadRequestException('Failed to duplicate spreadsheet');
        }
    }

    private async findReplace(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const find = params.find;
        const replacement = params.replacement;
        const sheetId = params.sheetId;
        if (!spreadsheetId || !find || replacement === undefined) {
            throw new BadRequestException('spreadsheetId, find, and replacement are required for find_to_replace');
        }
        this.logger.log(`Finding and replacing "${find}" with "${replacement}" in ${spreadsheetId}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/${spreadsheetId}:batchUpdate`,
                    {
                        requests: [
                            {
                                findReplace: {
                                    find,
                                    replacement,
                                    allSheets: !sheetId,
                                    sheetId,
                                },
                            },
                        ],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            const data = response.data;
            return {
                success: true,
                spreadsheetId,
                replacements: data.replies?.[0]?.findReplace?.occurrencesChanged || 0,
                message: `Replaced ${data.replies?.[0]?.findReplace?.occurrencesChanged || 0} occurrences`,
            };
        } catch (error) {
            this.logger.error('Error in find/replace:', error.response?.data || error.message);
            throw new BadRequestException('Failed to find/replace');
        }
    }

    private async sortRange(params: any, accessToken: string) {
        const spreadsheetId = params.spreadsheetId;
        const sheetId = params.sheetId || 0;
        const ascending = params.ascending !== false;

        if (!spreadsheetId || !params.range) {
            throw new BadRequestException('spreadsheetId and range are required for sort_data_in_range');
        }
        const { startRow, endRow, startCol, endCol } = this.parseRange(params.range);
        let sortColumnIndex: number;
        if (params.sortColumn) {
            sortColumnIndex = this.columnLetterToIndex(params.sortColumn);
            if (sortColumnIndex < startCol || sortColumnIndex >= endCol) {
                throw new BadRequestException(`Sort column ${params.sortColumn} is outside the specified range`);
            }
        } else {
            sortColumnIndex = startCol;
        }
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/${spreadsheetId}:batchUpdate`,
                    {
                        requests: [
                            {
                                sortRange: {
                                    range: {
                                        sheetId,
                                        startRowIndex: startRow,
                                        endRowIndex: endRow,
                                        startColumnIndex: startCol,
                                        endColumnIndex: endCol,
                                    },
                                    sortSpecs: [
                                        {
                                            dimensionIndex: sortColumnIndex,
                                            sortOrder: ascending ? 'ASCENDING' : 'DESCENDING',
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );
            return {
                success: true,
                spreadsheetId,
                message: `Range ${params.range} sorted by column ${params.sortColumn || String.fromCharCode(65 + startCol)} (${ascending ? 'ascending' : 'descending'})`,
            };
        } catch (error) {
            this.logger.error('Error sorting range:', error.response?.data || error.message);
            throw new BadRequestException('Failed to sort range');
        }
    }

    private a1ToIndex(a1: string): { row: number; col: number } {
        const match = a1.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            throw new BadRequestException(`Invalid A1 notation: ${a1}`);
        }
        const colLetters = match[1];
        const rowNumber = parseInt(match[2], 10);
        let col = 0;
        for (let i = 0; i < colLetters.length; i++) {
            col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        col -= 1;
        return {
            row: rowNumber - 1,
            col: col
        };
    }

    private parseRange(range: string): { startRow: number; endRow: number; startCol: number; endCol: number } {
        const parts = range.split(':');
        if (parts.length !== 2) {
            throw new BadRequestException(`Invalid range format: ${range}. Expected format: A1:C10`);
        }
        const start = this.a1ToIndex(parts[0]);
        const end = this.a1ToIndex(parts[1]);
        return {
            startRow: start.row,
            endRow: end.row + 1,
            startCol: start.col,
            endCol: end.col + 1
        };
    }

    private columnLetterToIndex(letter: string): number {
        let col = 0;
        for (let i = 0; i < letter.length; i++) {
            col = col * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return col - 1;
    }
}
