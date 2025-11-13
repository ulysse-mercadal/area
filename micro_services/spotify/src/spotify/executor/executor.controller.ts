import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ExecutorService } from './executor.service';

interface ExecuteRequestDto {
    type: 'action' | 'reaction';
    name: string;
    userId: number;
    config: any;
    input: any;
}

interface ExecuteResponseDto {
    success: boolean;
    result?: any;
    error?: string;
}

@Controller()
export class ExecutorController {
    private readonly logger = new Logger(ExecutorController.name);
    constructor(private readonly executorService: ExecutorService) { }

    @Post('execute')
    async execute(@Body() body: ExecuteRequestDto): Promise<ExecuteResponseDto> {
        try {
            this.logger.log(
                `Execute request: ${body.type} - ${body.name} for user ${body.userId}`,
            );
            let result;
            if (body.type === 'action') {
                result = await this.executorService.executeAction(
                    body.name,
                    body.userId,
                    body.config,
                    body.input,
                );
            } else if (body.type === 'reaction') {
                result = await this.executorService.executeReaction(
                    body.name,
                    body.userId,
                    body.config,
                    body.input,
                );
            } else {
                return {
                    success: false,
                    error: 'Invalid type. Must be "action" or "reaction"',
                };
            }
            return {
                success: true,
                result,
            };
        } catch (error) {
            this.logger.error('Execution error:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
