import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialsService } from '../credentials/credentials.service';
import { ActionDto, ReactionDto, AreaResponseDto, ServiceAreasDto } from './dto/area.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AreaService {
    private readonly logger = new Logger(AreaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly credentialsService: CredentialsService,
        private readonly httpService: HttpService,
    ) { }

    async syncWithMicroservices(): Promise<void> {
        const services = await this.prisma.service.findMany({
            where: { isActive: true },
            select: { id: true, name: true, microServiceUrl: true }
        });
        for (const service of services) {
            try {
                const response = await firstValueFrom(
                    this.httpService.get<{ actions: ActionDto[], reactions: ReactionDto[] }>(`${service.microServiceUrl}/area`, {
                        timeout: 10000,
                    })
                );
                const { actions, reactions } = response.data;
                this.logger.log(`Response from ${service.name}:`);
                this.logger.log(JSON.stringify(response.data, null, 2));
                for (const action of actions) {
                    this.logger.log(`Syncing action: ${action.name}`);
                    this.logger.log(`Action output: ${JSON.stringify(action.output)}`); // LOG ICI
                        await this.prisma.actions.upsert({
                            where: {
                                name_serviceId: {
                                    name: action.name,
                                    serviceId: service.id
                                }
                            },
                            create: {
                                name: action.name,
                                description: action.description,
                                serviceId: service.id,
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
                    for (const reaction of reactions) {
                        await this.prisma.reactions.upsert({
                            where: {
                                name_serviceId: {
                                    name: reaction.name,
                                    serviceId: service.id
                                }
                            },
                            create: {
                                name: reaction.name,
                                description: reaction.description,
                                serviceId: service.id,
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
                    await this.prisma.service.update({
                        where: { id: service.id },
                        data: { lastSeenAt: new Date() }
                    });
                    this.logger.log(`Successfully synced with ${service.name}`);
                } catch (error) {
                    this.logger.error(`Failed to sync with ${service.name}: ${error.message}`);
                }
            }
    }

    async getAvailableArea(userId: number): Promise < AreaResponseDto > {
            const userCredentials = await this.credentialsService.findByUser(userId);
            const connectedServiceIds = userCredentials.map(cred => cred.serviceId);
            this.logger.log(`User ${userId} connected service IDs: ${connectedServiceIds.join(', ')}`);
            const allServices = await this.prisma.service.findMany({
                select: { id: true, name: true }
            });
            const notConnectedServiceIds = allServices
                .filter(service => !connectedServiceIds.includes(service.id))
                .map(service => service.id);
            this.logger.log(`User ${userId} NOT connected service IDs: ${notConnectedServiceIds.join(', ')}`);
            const connectedActions = connectedServiceIds.length > 0
                ? await this.prisma.actions.findMany({
                    where: { serviceId: { in: connectedServiceIds } },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        configSchema: true,
                        service: {
                            select: {
                                name: true,
                                microServiceUrl: true
                            }
                        }
                    }
                })
                : [];
            const connectedReactions = connectedServiceIds.length > 0
                ? await this.prisma.reactions.findMany({
                    where: { serviceId: { in: connectedServiceIds } },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        configSchema: true,
                        service: {
                            select: {
                                name: true,
                                microServiceUrl: true
                            }
                        }
                    }
                })
                : [];
            const notConnectedActions = notConnectedServiceIds.length > 0
                ? await this.prisma.actions.findMany({
                    where: { serviceId: { in: notConnectedServiceIds } },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        configSchema: true,
                        serviceId: true,
                        service: {
                            select: {
                                name: true
                            }
                        }
                    }
                })
                : [];
            const notConnectedReactions = notConnectedServiceIds.length > 0
                ? await this.prisma.reactions.findMany({
                    where: { serviceId: { in: notConnectedServiceIds } },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        configSchema: true,
                        serviceId: true,
                        service: {
                            select: {
                                name: true
                            }
                        }
                    }
                })
                : [];
            const actions: ActionDto[] = connectedActions.map(action => ({
                id: action.id,
                name: action.name,
                description: action.description || '',
                serviceType: action.service.name,
                parameters: this.extractParametersFromSchema(action.configSchema),
                output: this.extractOutputFromSchema(action.configSchema),
            }));
            const reactions: ReactionDto[] = connectedReactions.map(reaction => ({
                id: reaction.id,
                name: reaction.name,
                description: reaction.description || '',
                serviceType: reaction.service.name,
                parameters: this.extractParametersFromSchema(reaction.configSchema),
            }));
            const userNotConnectedTo: ServiceAreasDto[] = [];
            for(const serviceId of notConnectedServiceIds) {
                const service = allServices.find(s => s.id === serviceId);
                if (!service) continue;
                const serviceActions = notConnectedActions
                    .filter(action => action.serviceId === serviceId)
                    .map(action => ({
                        id: action.id,
                        name: action.name,
                        description: action.description || '',
                        serviceType: action.service.name,
                        parameters: this.extractParametersFromSchema(action.configSchema),
                        output: this.extractOutputFromSchema(action.configSchema),
                    }));
                const serviceReactions = notConnectedReactions
                    .filter(reaction => reaction.serviceId === serviceId)
                    .map(reaction => ({
                        id: reaction.id,
                        name: reaction.name,
                        description: reaction.description || '',
                        serviceType: reaction.service.name,
                        parameters: this.extractParametersFromSchema(reaction.configSchema),
                    }));
                userNotConnectedTo.push({
                    serviceName: service.name,
                    actions: serviceActions,
                    reactions: serviceReactions
                });
            }
        return {
                actions,
                reactions,
                userNotConnectedTo
            };
        }

    private extractParametersFromSchema(configSchema: any): any[] {
        if (!configSchema || typeof configSchema !== 'object') {
            return [];
        }
        if (configSchema.parameters && Array.isArray(configSchema.parameters)) {
            return configSchema.parameters;
        }
        if (configSchema.properties && typeof configSchema.properties === 'object') {
            return Object.entries(configSchema.properties).map(([name, schema]: [string, any]) => ({
                name,
                type: schema.type || 'string',
                description: schema.description || '',
                required: configSchema.required?.includes(name) || false,
            }));
        }
        return [];
    }

    private extractOutputFromSchema(configSchema: any): any[] {
        if (!configSchema || typeof configSchema !== 'object') {
            return [];
        }
        if (configSchema.output && Array.isArray(configSchema.output)) {
            return configSchema.output;
        }
        return [];
    }

    async getAllAvailableServices(): Promise<string[]> {
        const services = await this.prisma.service.findMany({
            select: { name: true }
        });
        return services.map(s => s.name.toLowerCase());
    }
}
