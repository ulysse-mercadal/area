import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCredentialDto, UpdateCredentialDto } from './dto/credentials.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CredentialsService {
    private readonly logger = new Logger(CredentialsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
    ) {}

    async create(createCredentialDto: CreateCredentialDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: createCredentialDto.userId }
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${createCredentialDto.userId} not found`);
        }
        const service = await this.prisma.service.findUnique({
            where: { id: createCredentialDto.serviceId }
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${createCredentialDto.serviceId} not found`);
        }
        const existing = await this.prisma.credentials.findUnique({
            where: {
                userId_serviceId: {
                    userId: createCredentialDto.userId,
                    serviceId: createCredentialDto.serviceId
                }
            }
        });
        if (existing) {
            return this.prisma.credentials.update({
                where: { id: existing.id },
                data: {
                    token: createCredentialDto.token,
                    refreshToken: createCredentialDto.refreshToken,
                    expiresAt: createCredentialDto.expiresAt,
                    lastUsed: new Date(),
                },
                include: {
                    service: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            surname: true
                        }
                    }
                }
            });
        }
        return this.prisma.credentials.create({
            data: createCredentialDto,
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
    }

    async findAll() {
        return this.prisma.credentials.findMany({
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
    }

    async findOne(id: number) {
        const credential = await this.prisma.credentials.findUnique({
            where: { id },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
        if (!credential) {
            throw new NotFoundException(`Credential with ID ${id} not found`);
        }
        return credential;
    }

    async findByUser(userId: number) {
        return this.prisma.credentials.findMany({
            where: { userId },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
    }

    async findByUserAndService(userId: number, serviceId: number) {
        const credential = await this.prisma.credentials.findUnique({
            where: {
                userId_serviceId: {
                    userId,
                    serviceId
                }
            },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
        if (!credential) {
            throw new NotFoundException(
                `Credential for service ID ${serviceId} not found for user ${userId}`
            );
        }
        return credential;
    }

    async findByUserAndServiceName(userId: number, serviceName: string) {
        const service = await this.prisma.service.findUnique({
            where: { name: serviceName }
        });
        if (!service) {
            throw new NotFoundException(`Service ${serviceName} not found`);
        }
        return this.findByUserAndService(userId, service.id);
    }

    async update(id: number, updateCredentialDto: UpdateCredentialDto) {
        await this.findOne(id);
        return this.prisma.credentials.update({
            where: { id },
            data: updateCredentialDto,
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true
                    }
                }
            }
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.credentials.delete({
            where: { id }
        });
    }

    async connectService(userId: number, serviceId: number) {
        this.logger.log(`User ${userId} wants to connect to service ${serviceId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${serviceId} not found`);
        }
        if (!service.isActive) {
            throw new BadRequestException(`Service ${service.name} is not active`);
        }
        try {
            const serviceName = service.name.toLowerCase();
            const initiateUrl = `${service.microServiceUrl}/${serviceName}/auth/initiate`;
            this.logger.log(`Calling microservice: ${initiateUrl}`);
            const response = await firstValueFrom(
                this.httpService.post(
                    initiateUrl,
                    { userId },
                    { timeout: 5000 },
                ),
            );
            if (!response.data.success || !response.data.authUrl) {
                throw new Error('Microservice did not return a valid auth URL');
            }
            this.logger.log(`OAuth URL generated: ${response.data.authUrl}`);
            return {
                success: true,
                authUrl: response.data.authUrl,
                serviceName: service.name,
                message: 'Redirect user to authUrl to authenticate',
            };
        } catch (error: any) {
            this.logger.error(
                `Failed to initiate auth with ${service.name}:`,
                error.response?.data || error.message
            );
            throw new BadRequestException(
                `Failed to initiate auth with ${service.name}: ${error.message}`,
            );
        }
    }

    async checkCredentials(userId: number, serviceId: number) {
        try {
            const credential = await this.findByUserAndService(userId, serviceId);
            return {
                exists: true,
                hasRefreshToken: !!credential.refreshToken,
                expiresAt: credential.expiresAt,
                isExpired: credential.expiresAt
                    ? new Date(credential.expiresAt) <= new Date()
                    : false,
                lastUsed: credential.lastUsed,
                serviceName: credential.service.name,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                return {
                    exists: false,
                };
            }
            throw error;
        }
    }

    async revokeCredentials(userId: number, serviceId: number) {
        const credential = await this.findByUserAndService(userId, serviceId);
        await this.remove(credential.id);
        this.logger.log(`Credentials revoked for user ${userId} and service ${serviceId}`);
        return {
            success: true,
            message: 'Credentials revoked successfully',
        };
    }
}
