import {Controller, Post, Body, Logger, Headers, HttpCode, HttpStatus, BadRequestException} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

export class GmailWebhookDto {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
}

@Controller('webhooks')
export class GmailWebhookController {
  private readonly logger = new Logger(GmailWebhookController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('gmail/email-received')
  @HttpCode(HttpStatus.OK)
  async handleEmailReceived(
    @Body() data: GmailWebhookDto,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      this.logger.warn('Webhook received without user ID header');
      throw new BadRequestException('Missing x-user-id header');
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      this.logger.warn(`Invalid user ID received: ${userId}`);
      throw new BadRequestException('Invalid user ID format');
    }

    this.logger.log(
      `Webhook received: email-received for user ${userIdNum}`,
    );

    try {
      const result = await this.authService.triggerWorkflows(
        'email_received',
        userIdNum,
        data,
      );

      return {
        success: true,
        userId: userIdNum,
        result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to trigger workflows for user ${userIdNum}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        userId: userIdNum,
        error: error.message,
      };
    }
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: any) {
    this.logger.log('Test webhook received:', JSON.stringify(body, null, 2));

    return {
      success: true,
      message: 'Test webhook received',
      timestamp: new Date().toISOString(),
      received: body,
    };
  }
}