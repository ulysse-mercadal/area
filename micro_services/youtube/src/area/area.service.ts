import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface Parameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
}

export interface AreaItem {
    id: number;
    name: string;
    description: string;
    serviceType: string;
    parameters: Parameter[];
}

export interface AreaResponse {
    actions: AreaItem[];
    reactions: AreaItem[];
}

@Injectable()
export class AreaService {
    private readonly logger = new Logger(AreaService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getAvailableArea(): Promise<AreaResponse> {
        const actions = await this.prisma.action.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                configSchema: true,
            },
        });
        const reactions = await this.prisma.reaction.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                configSchema: true,
            },
        });
        return {
            actions: actions.map((action) => ({
                id: action.id,
                name: action.name,
                description: action.description || '',
                serviceType: 'YOUTUBE',
                parameters: this.extractParametersFromSchema(action.configSchema),
            })),
            reactions: reactions.map((reaction) => ({
                id: reaction.id,
                name: reaction.name,
                description: reaction.description || '',
                serviceType: 'YOUTUBE',
                parameters: this.extractParametersFromSchema(reaction.configSchema),
            })),
        };
    }

    private extractParametersFromSchema(configSchema: any): Parameter[] {
        if (!configSchema || typeof configSchema !== 'object') {
            return [];
        }
        if (configSchema.parameters && Array.isArray(configSchema.parameters)) {
            return configSchema.parameters;
        }
        if (
            configSchema.properties &&
            typeof configSchema.properties === 'object'
        ) {
            return Object.entries(configSchema.properties).map(
                ([name, schema]: [string, any]) => ({
                    name,
                    type: schema.type || 'string',
                    description: schema.description || '',
                    required: configSchema.required?.includes(name) || false,
                }),
            );
        }
        return [];
    }
}
