import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceLoginDto } from './dto/service-auth.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServiceAuthService {
    private readonly logger = new Logger(ServiceAuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private httpService: HttpService,
    ) { }

    async login(loginDto: ServiceLoginDto) {
        const apiKeys = await this.prisma.apiKey.findMany({
            where: { isActive: true }
        });
        let validApiKey: { id: number; name: string; key: string; isActive: boolean } | null = null;
        for (const apiKey of apiKeys) {
            const isValid = await bcrypt.compare(loginDto.apiKey, apiKey.key);
            if (isValid) {
                validApiKey = apiKey;
                break;
            }
        }
        if (!validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }
        await this.prisma.apiKey.update({
            where: { id: validApiKey.id },
            data: { lastUsedAt: new Date() }
        });
        let service = await this.prisma.service.findUnique({
            where: { name: loginDto.serviceName }
        });
        const isNewService = !service;
        if (service) {
            service = await this.prisma.service.update({
                where: { id: service.id },
                data: {
                    microServiceUrl: loginDto.microServiceUrl,
                    iconUrl: loginDto.iconUrl,
                    apiKeyId: validApiKey.id,
                    lastSeenAt: new Date(),
                    isActive: true,
                }
            });
        } else {
            service = await this.prisma.service.create({
                data: {
                    name: loginDto.serviceName,
                    microServiceUrl: loginDto.microServiceUrl,
                    iconUrl: loginDto.iconUrl,
                    apiKeyId: validApiKey.id,
                    isActive: true,
                    lastSeenAt: new Date(),
                }
            });
        }
        setTimeout(() => {
            this.syncServiceActionsReactions(service.id, service.microServiceUrl).catch(err => {
                this.logger.error(`Background sync failed for service ${service.id}:`, err.message);
            });
        }, 5000);
        const payload = {
            sub: service.id,
            name: service.name,
            type: 'service',
            apiKeyId: validApiKey.id,
        };

        const access_token = await this.jwtService.signAsync(payload, {
            expiresIn: '30d',
        });

        return {
            access_token,
            service: {
                id: service.id,
                name: service.name,
                microServiceUrl: service.microServiceUrl,
                iconUrl: service.iconUrl,
                isNewService,
            },
        };
    }

    private async syncServiceActionsReactions(serviceId: number, microServiceUrl: string): Promise<void> {
        const maxRetries = 3;
        const retryDelay = 5000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.log(`Syncing actions/reactions for service ${serviceId} from ${microServiceUrl} (attempt ${attempt}/${maxRetries})`);
                const response = await firstValueFrom(
                    this.httpService.get(`${microServiceUrl}/area`, {
                        timeout: 5000,
                    })
                );
                const { actions, reactions } = response.data;
                this.logger.log(`Received ${actions?.length || 0} actions and ${reactions?.length || 0} reactions`);
                if (actions && Array.isArray(actions)) {
                    for (const action of actions) {
                        await this.prisma.actions.upsert({
                            where: {
                                name_serviceId: {
                                    name: action.name,
                                    serviceId: serviceId
                                }
                            },
                            create: {
                                name: action.name,
                                description: action.description,
                                serviceId: serviceId,
                                configSchema: {
                                    parameters: action.parameters || [],
                                    output: action.output || []
                                } as any
                            },
                            update: {
                                description: action.description,
                                configSchema: {
                                    parameters: action.parameters || [],
                                    output: action.output || []
                                } as any
                            }
                        });
                    }
                }
                if (reactions && Array.isArray(reactions)) {
                    for (const reaction of reactions) {
                        await this.prisma.reactions.upsert({
                            where: {
                                name_serviceId: {
                                    name: reaction.name,
                                    serviceId: serviceId
                                }
                            },
                            create: {
                                name: reaction.name,
                                description: reaction.description,
                                serviceId: serviceId,
                                configSchema: {
                                    parameters: reaction.parameters || []
                                } as any
                            },
                            update: {
                                description: reaction.description,
                                configSchema: {
                                    parameters: reaction.parameters || []
                                } as any
                            }
                        });
                    }
                }
                await this.prisma.service.update({
                    where: { id: serviceId },
                    data: { lastSeenAt: new Date() }
                });
                return;
            } catch (error) {
                this.logger.warn(`Sync attempt ${attempt}/${maxRetries} failed for service ${serviceId}: ${error.message}`);
                if (attempt < maxRetries) {
                    this.logger.log(`Retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    this.logger.error(`Failed to sync service ${serviceId} after ${maxRetries} attempts`);
                }
            }
        }
    }

    async validateToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async getCurrentService(serviceId: number) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                lastSeenAt: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    }
                }
            },
        });
        if (!service) {
            throw new UnauthorizedException('Service not found');
        }
        if (!service.isActive) {
            throw new UnauthorizedException('Service is disabled');
        }
        if (!service.apiKey.isActive) {
            throw new UnauthorizedException('API key is disabled');
        }
        await this.prisma.service.update({
            where: { id: serviceId },
            data: { lastSeenAt: new Date() }
        });
        return service;
    }

    async refreshService(serviceId: number, microServiceUrl?: string, iconUrl?: string) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new UnauthorizedException('Service not found');
        }
        const updateData: any = {
            lastSeenAt: new Date()
        };
        if (microServiceUrl && microServiceUrl !== service.microServiceUrl) {
            updateData.microServiceUrl = microServiceUrl;
        }
        if (iconUrl && iconUrl !== service.iconUrl) {
            updateData.iconUrl = iconUrl;
        }
        return this.prisma.service.update({
            where: { id: serviceId },
            data: updateData,
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                lastSeenAt: true,
            }
        });
    }
}
