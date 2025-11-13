import { Controller, Post, Body, Logger, Headers } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Controller('webhooks')
export class GoogleSheetsWebhookController {
    private readonly logger = new Logger(GoogleSheetsWebhookController.name);
    constructor(private readonly authService: AuthService) {}

    @Post('google-sheets/row-added')
    async handleRowAdded(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: row-added`);
            this.logger.log(`   User: ${userId}`);
            this.logger.log(`   Spreadsheet: ${data.spreadsheetId}`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'new_row_added',
                userIdNum,
                {
                    spreadsheetId: data.spreadsheetId,
                    spreadsheetName: data.spreadsheetName,
                    sheetName: data.sheetName,
                    rowData: data.rowData,
                    rowIndex: data.rowIndex,
                    addedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('google-sheets/spreadsheet-created')
    async handleSpreadsheetCreated(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: spreadsheet-created`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'spreadsheet_created',
                userIdNum,
                {
                    spreadsheetId: data.spreadsheetId,
                    spreadsheetName: data.spreadsheetName,
                    spreadsheetUrl: data.spreadsheetUrl,
                    createdAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('google-sheets/cell-updated')
    async handleCellUpdated(
        @Body() data: any,
        @Headers('x-user-id') userId: string,
    ) {
        try {
            this.logger.log(`Webhook received: cell-updated`);
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return { success: false, error: 'Invalid user ID' };
            }
            await this.authService.triggerWorkflows(
                'cell_updated',
                userIdNum,
                {
                    spreadsheetId: data.spreadsheetId,
                    spreadsheetName: data.spreadsheetName,
                    sheetName: data.sheetName,
                    cellRange: data.cellRange,
                    oldValue: data.oldValue,
                    newValue: data.newValue,
                    updatedAt: new Date().toISOString(),
                },
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('trigger')
    async handleGenericTrigger(
        @Body() body: {
            actionName: string;
            userId: number;
            data: any;
        },
    ) {
        try {
            this.logger.log(`Generic webhook: ${body.actionName} for user ${body.userId}`);
            await this.authService.triggerWorkflows(
                body.actionName,
                body.userId,
                body.data,
            );
            return { success: true, message: 'Workflows triggered' };
        } catch (error: any) {
            this.logger.error('Webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    @Post('test')
    async testWebhook(@Body() body: any) {
        this.logger.log('Test webhook received:', JSON.stringify(body, null, 2));
        return {
            success: true,
            message: 'Test webhook received',
            serviceId: this.authService.getServiceId(),
            received: body,
        };
    }
}
