import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.service.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        lastUsedAt: true,
                    }
                },
                _count: {
                    select: {
                        credentials: true,
                        actions: true,
                        reactions: true
                    }
                }
            }
        });
    }

    async findOne(id: number) {
        const service = await this.prisma.service.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        lastUsedAt: true,
                    }
                },
                _count: {
                    select: {
                        credentials: true,
                        actions: true,
                        reactions: true
                    }
                }
            }
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
        return service;
    }

    async findByName(name: string) {
        const service = await this.prisma.service.findUnique({
            where: { name },
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        lastUsedAt: true,
                    }
                },
                _count: {
                    select: {
                        credentials: true,
                        actions: true,
                        reactions: true
                    }
                }
            }
        });
        if (!service) {
            throw new NotFoundException(`Service ${name} not found`);
        }
        return service;
    }

    async update(id: number, updateServiceDto: UpdateServiceDto) {
        await this.findOne(id);
        if (updateServiceDto.name) {
            const existing = await this.prisma.service.findUnique({
                where: { name: updateServiceDto.name }
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(
                    `Service with name ${updateServiceDto.name} already exists`
                );
            }
        }
        return this.prisma.service.update({
            where: { id },
            data: updateServiceDto,
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    }
                }
            }
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        const credentialsCount = await this.prisma.credentials.count({
            where: { serviceId: id }
        });
        if (credentialsCount > 0) {
            throw new ConflictException(
                `Cannot delete service: ${credentialsCount} credentials are still using it`
            );
        }
        const actionsCount = await this.prisma.actions.count({
            where: { serviceId: id }
        });
        if (actionsCount > 0) {
            throw new ConflictException(
                `Cannot delete service: ${actionsCount} actions are still using it`
            );
        }
        const reactionsCount = await this.prisma.reactions.count({
            where: { serviceId: id }
        });
        if (reactionsCount > 0) {
            throw new ConflictException(
                `Cannot delete service: ${reactionsCount} reactions are still using it`
            );
        }
        return this.prisma.service.delete({
            where: { id }
        });
    }

    async changeApiKey(serviceId: number, newApiKeyId: number) {
        await this.findOne(serviceId);
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id: newApiKeyId }
        });
        if (!apiKey) {
            throw new NotFoundException(`API Key with ID ${newApiKeyId} not found`);
        }
        if (!apiKey.isActive) {
            throw new ConflictException('Cannot assign inactive API key');
        }
        return this.prisma.service.update({
            where: { id: serviceId },
            data: {
                apiKeyId: newApiKeyId
            },
            select: {
                id: true,
                name: true,
                microServiceUrl: true,
                iconUrl: true,
                isActive: true,
                apiKey: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    }
                }
            }
        });
    }

    async deactivateServicesByApiKey(apiKeyId: number) {
        return this.prisma.service.updateMany({
            where: { apiKeyId },
            data: { isActive: false }
        });
    }

    async findInactiveServices(daysSinceLastSeen: number) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastSeen);
        return this.prisma.service.findMany({
            where: {
                OR: [
                    { lastSeenAt: { lt: cutoffDate } },
                    { lastSeenAt: null }
                ]
            },
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
                    }
                }
            },
            orderBy: {
                lastSeenAt: 'asc'
            }
        });
    }

    async getStats() {
        const total = await this.prisma.service.count();
        const active = await this.prisma.service.count({
            where: { isActive: true }
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentlyActive = await this.prisma.service.count({
            where: {
                lastSeenAt: {
                    gte: thirtyDaysAgo
                }
            }
        });
        return {
            total,
            active,
            inactive: total - active,
            recentlyActive,
            dormant: total - recentlyActive
        };
    }
}
