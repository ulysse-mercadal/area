import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { GoogleSheetsExecutorService } from './executor.service';

@Controller()
export class GoogleSheetsExecutorController {
    private readonly logger = new Logger(GoogleSheetsExecutorController.name);

    constructor(
        private readonly executorService: GoogleSheetsExecutorService,
    ) {}

    @Post('execute')
    async execute(@Body() body: any) {
        this.logger.log(`Received execute request`);
        this.logger.debug(`Body: ${JSON.stringify(body)}`);
        try {
            const actionType = body.actionType || body.type;
            const actionName = body.actionName || body.name;
            const { userId, config, input } = body;
            this.logger.log(`Executing: ${actionType} - ${actionName} for user ${userId}`);
            if (!actionType || !actionName || !userId) {
                return {
                    success: false,
                    error: 'Missing required fields: actionType/type, actionName/name, and userId are required',
                };
            }
            let result;
            if (actionType === 'action') {
                result = await this.executorService.executeAction(
                    actionName,
                    userId,
                    config,
                    input
                );
            } else if (actionType === 'reaction') {
                result = await this.executorService.executeReaction(
                    actionName,
                    userId,
                    config,
                    input
                );
            } else {
                return {
                    success: false,
                    error: `Unknown actionType: ${actionType}`,
                };
            }
            this.logger.log(`Execution successful: ${actionName}`);
            return {
                success: true,
                result,
            };
        } catch (error) {
            this.logger.error('Execution failed:', error);
            return {
                success: false,
                error: error.message,
                details: error.response?.data || error.stack,
            };
        }
    }

    @Post('test/execute')
    async testExecute(@Body() body: any) {
        this.logger.log('Test execute endpoint called');
        this.logger.log(`Body: ${JSON.stringify(body, null, 2)}`);
        return {
            success: true,
            message: 'Test endpoint working',
            receivedBody: body,
        };
    }
}
