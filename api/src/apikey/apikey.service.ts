import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/apikey.dto';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyService {
    private readonly logger = new Logger(ApiKeyService.name);
    constructor(private readonly prisma: PrismaService) {}

    private generateApiKey(): string {
        const randomPart = randomBytes(32).toString('hex');
        return `area_live_${randomPart}`;
    }

    async validateApiKey(plainKey: string) {
        try {
            const apiKeys = await this.prisma.apiKey.findMany({
                where: { isActive: true },
                include: {
                    services: {
                        where: { isActive: true }
                    },
                },
            });
            for (const apiKey of apiKeys) {
                const isValid = await bcrypt.compare(plainKey, apiKey.key);
                if (isValid) {
                    await this.updateLastUsed(apiKey.id);
                    return apiKey;
                }
            }
            this.logger.warn(`Invalid API key attempted: ${plainKey.substring(0, 15)}...`);
            return null;
        } catch (error) {
            this.logger.error('Error validating API key:', error.message);
            return null;
        }
    }

    async create(createApiKeyDto: CreateApiKeyDto) {
        const existing = await this.prisma.apiKey.findFirst({
            where: { name: createApiKeyDto.name }
        });
        if (existing) {
            throw new ConflictException(
                `API Key with name ${createApiKeyDto.name} already exists`
            );
        }
        const plainApiKey = this.generateApiKey();
        const hashedApiKey = await bcrypt.hash(plainApiKey, 12);
        const apiKey = await this.prisma.apiKey.create({
            data: {
                name: createApiKeyDto.name,
                key: hashedApiKey,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return {
            ...apiKey,
            apiKey: plainApiKey,
            warning: 'Store this API key securely. It will not be shown again.',
        };
    }

    async findAll() {
        return this.prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastUsedAt: true,
                _count: {
                    select: {
                        services: true,
                    }
                }
            }
        });
    }

    async findOne(id: number) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastUsedAt: true,
                services: {
                    select: {
                        id: true,
                        name: true,
                        microServiceUrl: true,
                        isActive: true,
                        lastSeenAt: true,
                    }
                }
            }
        });
        if (!apiKey) {
            throw new NotFoundException(`API Key with ID ${id} not found`);
        }
        return apiKey;
    }

    async update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
        await this.findOne(id);
        if (updateApiKeyDto.name) {
            const existing = await this.prisma.apiKey.findFirst({
                where: {
                    name: updateApiKeyDto.name,
                    NOT: { id }
                }
            });
            if (existing) {
                throw new ConflictException(
                    `API Key with name ${updateApiKeyDto.name} already exists`
                );
            }
        }
        return this.prisma.apiKey.update({
            where: { id },
            data: updateApiKeyDto,
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async regenerate(id: number) {
        const apiKey = await this.findOne(id);
        const plainApiKey = this.generateApiKey();
        const hashedApiKey = await bcrypt.hash(plainApiKey, 12);
        const updatedApiKey = await this.prisma.apiKey.update({
            where: { id },
            data: { key: hashedApiKey },
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return {
            ...updatedApiKey,
            apiKey: plainApiKey,
            warning: 'Store this API key securely. The old key is now invalid.',
        };
    }

    async remove(id: number) {
        await this.findOne(id);
        const servicesCount = await this.prisma.service.count({
            where: {
                apiKeyId: id,
                isActive: true
            }
        });
        if (servicesCount > 0) {
            throw new ConflictException(
                `Cannot delete API key: ${servicesCount} active services are still using it`
            );
        }
        return this.prisma.apiKey.delete({
            where: { id }
        });
    }

    async updateLastUsed(id: number) {
        await this.prisma.apiKey.update({
            where: { id },
            data: { lastUsedAt: new Date() }
        });
    }
}
