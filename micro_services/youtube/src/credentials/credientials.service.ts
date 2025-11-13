import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CredentialsService {
    private readonly logger = new Logger(CredentialsService.name);
    private readonly serviceId: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.serviceId = parseInt(
            this.configService.get<string>('SERVICE_ID') || '1',
        );
    }

    async saveCredentials(
        userId: number,
        token: string,
        refreshToken?: string,
        expiresIn?: number,
    ) {
        const expiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 1000)
            : null;

        const credential = await this.prisma.credential.upsert({
            where: {
                userId_serviceId: {
                    userId,
                    serviceId: this.serviceId,
                },
            },
            update: {
                token,
                refreshToken: refreshToken || undefined,
                expiresAt,
                updatedAt: new Date(),
            },
            create: {
                userId,
                serviceId: this.serviceId,
                token,
                refreshToken,
                expiresAt,
            },
        });

        this.logger.log(`Credentials saved for user ${userId}`);
        return credential;
    }

    async getCredentials(userId: number) {
        const credential = await this.prisma.credential.findUnique({
            where: {
                userId_serviceId: {
                    userId,
                    serviceId: this.serviceId,
                },
            },
        });

        if (!credential) {
            throw new NotFoundException(
                `No credentials found for user ${userId}`,
            );
        }

        return credential;
    }

    isTokenExpired(credential: any): boolean {
        if (!credential.expiresAt) {
            return false;
        }
        return new Date(credential.expiresAt) <= new Date();
    }

    async deleteCredentials(userId: number) {
        await this.prisma.credential.delete({
            where: {
                userId_serviceId: {
                    userId,
                    serviceId: this.serviceId,
                },
            },
        });

        this.logger.log(`Credentials deleted for user ${userId}`);
    }

    async getAllUsersWithCredentials(): Promise<number[]> {
        const credentials = await this.prisma.credential.findMany({
            where: {
                serviceId: this.serviceId,
            },
        });

        return credentials.map((c) => c.userId);
    }
}
