import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);
    private accessToken: string | null = null;
    private serviceId: number | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) {}

    async onModuleInit() {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.registerWithMainApi();
    }

    async registerWithMainApi(): Promise<void> {
        try {
            const mainApiUrl = this.configService.get<string>('MAIN_API_URL');
            const apiKey = this.configService.get<string>('API_KEY');
            const serviceName = this.configService.get<string>('SERVICE_NAME');
            const microServiceUrl = this.configService.get<string>('MICROSERVICE_URL');
            this.logger.log(`Registering with main API: ${mainApiUrl}`);
            const iconUrl = this.configService.get<string>('SERVICE_ICON_URL');
            const response = await firstValueFrom(
                this.httpService.post(`${mainApiUrl}/auth/services/login`, {
                    apiKey,
                    serviceName,
                    microServiceUrl,
                    iconUrl,
                }),
            );
            this.accessToken = response.data.access_token;
            this.serviceId = response.data.service.id;
            this.logger.log(`   Service ID: ${this.serviceId}`);
            this.logger.log(`   Service Name: ${serviceName}`);
            this.logger.log(`   Is New Service: ${response.data.service.isNewService}`);
        } catch (error) {
            this.logger.error('\u274c Failed to register with main API:', error.response?.data || error.message);
            throw error;
        }
    }

    async triggerWorkflows(actionName: string, userId: number, triggerData: any): Promise<void> {
        try {
            if (!this.serviceId) {
                this.logger.error('Service ID not available. Registration may have failed.');
                return;
            }
            const mainApiUrl = this.configService.get<string>('MAIN_API_URL');
            this.logger.log(`Triggering workflows for action: ${actionName}`);
            this.logger.log(`   User ID: ${userId}`);
            this.logger.log(`   Service ID: ${this.serviceId}`);
            await firstValueFrom(
                this.httpService.post(
                    `${mainApiUrl}/workflow/trigger/${this.serviceId}/${actionName}`,
                    {
                        userId,
                        data: triggerData,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`,
                        },
                    },
                ),
            );
        } catch (error) {
            this.logger.error(
                `\u274c Failed to trigger workflows for action ${actionName}:`,
                error.response?.data || error.message
            );
        }
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    getServiceId(): number | null {
        return this.serviceId;
    }

    async forceReconnect(): Promise<void> {
        await this.registerWithMainApi();
    }
}
