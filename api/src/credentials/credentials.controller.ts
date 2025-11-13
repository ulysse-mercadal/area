import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Headers,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto, UpdateCredentialDto } from './dto/credentials.dto';
import { AuthService } from '../auth/auth.service';
import { ServiceAuthService } from '../auth/service-auth.service';
import { ApiKeyService } from '../apikey/apikey.service';
import { Role } from '../users/dto/user.dto';

@Controller('credentials')
export class CredentialsController {
    private readonly logger = new Logger(CredentialsController.name);

    constructor(
        private readonly credentialsService: CredentialsService,
        private readonly authService: AuthService,
        private readonly serviceAuthService: ServiceAuthService,
        private readonly apiKeyService: ApiKeyService,
    ) {}

    @Post('connect/:serviceId')
    async connectService(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.credentialsService.connectService(payload.sub, serviceId);
    }

    @Post('microservice')
    async createFromMicroservice(
        @Body() createCredentialDto: CreateCredentialDto,
        @Headers('x-api-key') apiKey: string
    ) {
        if (!apiKey) {
            throw new UnauthorizedException('No API key provided');
        }
        const validApiKey = await this.apiKeyService.validateApiKey(apiKey);
        if (!validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }
        const service = validApiKey.services.find(
            s => s.id === createCredentialDto.serviceId
        );
        if (!service) {
            throw new ForbiddenException(
                `API key does not have access to service ${createCredentialDto.serviceId}`
            );
        }
        return this.credentialsService.create(createCredentialDto);
    }

    @Post()
    async create(
        @Body() createCredentialDto: CreateCredentialDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        let isServiceToken = false;
        let payload: any;
        try {
            payload = await this.serviceAuthService.validateToken(token);
            isServiceToken = true;
            if (payload.sub !== createCredentialDto.serviceId) {
                throw new ForbiddenException(
                    `Service ${payload.sub} cannot create credentials for service ${createCredentialDto.serviceId}`
                );
            }
            this.logger.log(
                `Service ${payload.name} (ID: ${payload.sub}) creating credentials for user ${createCredentialDto.userId}`
            );
        } catch (serviceError) {
            try {
                payload = await this.authService.validateToken(token);
                if (payload.role !== Role.ADMIN && payload.sub !== createCredentialDto.userId) {
                    throw new ForbiddenException('You can only create credentials for yourself');
                }
                this.logger.log(
                    `User ${payload.sub} creating credentials for service ${createCredentialDto.serviceId}`
                );
            } catch (userError) {
                throw new UnauthorizedException('Invalid token');
            }
        }
        return this.credentialsService.create(createCredentialDto);
    }

    @Get()
    async findAll(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can access all credentials');
        }
        return this.credentialsService.findAll();
    }

    @Get('user/:userId')
    async findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        let payload: any;
        try {
            payload = await this.authService.validateToken(token);
            if (payload.role !== Role.ADMIN && payload.sub !== userId) {
                throw new ForbiddenException('You can only access your own credentials');
            }
        } catch {
            payload = await this.serviceAuthService.validateToken(token);
        }
        return this.credentialsService.findByUser(userId);
    }

    @Get('user/:userId/service/:serviceId')
    async findByUserAndService(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Headers('authorization') authorization?: string,
        @Headers('x-api-key') apiKey?: string
    ) {
        if (apiKey) {
            const validApiKey = await this.apiKeyService.validateApiKey(apiKey);
            if (!validApiKey) {
                throw new UnauthorizedException('Invalid API key');
            }
            const service = validApiKey.services.find(s => s.id === serviceId);
            if (!service) {
                throw new ForbiddenException(
                    `API key does not have access to service ${serviceId}`
                );
            }
            return this.credentialsService.findByUserAndService(userId, serviceId);
        }
        if (!authorization) {
            throw new UnauthorizedException('No authorization header or API key');
        }
        const token = authorization.replace('Bearer ', '');
        let payload: any;
        try {
            payload = await this.authService.validateToken(token);
            if (payload.role !== Role.ADMIN && payload.sub !== userId) {
                throw new ForbiddenException('You can only access your own credentials');
            }
        } catch {
            payload = await this.serviceAuthService.validateToken(token);
        }
        return this.credentialsService.findByUserAndService(userId, serviceId);
    }

    @Get('user/:userId/service-name/:serviceName')
    async findByUserAndServiceName(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('serviceName') serviceName: string,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        let payload: any;
        try {
            payload = await this.authService.validateToken(token);
            if (payload.role !== Role.ADMIN && payload.sub !== userId) {
                throw new ForbiddenException('You can only access your own credentials');
            }
        } catch {
            payload = await this.serviceAuthService.validateToken(token);
        }
        return this.credentialsService.findByUserAndServiceName(userId, serviceName);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        const credential = await this.credentialsService.findOne(id);
        if (payload.role !== Role.ADMIN && payload.sub !== credential.userId) {
            throw new ForbiddenException('You can only access your own credentials');
        }
        return credential;
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCredentialDto: UpdateCredentialDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const credential = await this.credentialsService.findOne(id);
        try {
            const payload = await this.authService.validateToken(token);
            if (payload.role !== Role.ADMIN && payload.sub !== credential.userId) {
                throw new ForbiddenException('You can only update your own credentials');
            }
        } catch {
            const payload = await this.serviceAuthService.validateToken(token);
            if (payload.sub !== credential.serviceId) {
                throw new ForbiddenException(
                    `Service ${payload.sub} cannot update credentials for service ${credential.serviceId}`
                );
            }
        }
        return this.credentialsService.update(id, updateCredentialDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        const credential = await this.credentialsService.findOne(id);
        if (payload.role !== Role.ADMIN && payload.sub !== credential.userId) {
            throw new ForbiddenException('You can only delete your own credentials');
        }
        return this.credentialsService.remove(id);
    }

    @Get('check/:userId/:serviceId')
    async checkCredentials(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN && payload.sub !== userId) {
            throw new ForbiddenException('You can only check your own credentials');
        }
        return this.credentialsService.checkCredentials(userId, serviceId);
    }

    @Delete('user/:userId/service/:serviceId')
    async revokeCredentials(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Headers('authorization') authorization?: string,
        @Headers('x-api-key') apiKey?: string
    ) {
        if (apiKey) {
            const validApiKey = await this.apiKeyService.validateApiKey(apiKey);
            if (!validApiKey) {
                throw new UnauthorizedException('Invalid API key');
            }
            const service = validApiKey.services.find(s => s.id === serviceId);
            if (!service) {
                throw new ForbiddenException(
                    `API key does not have access to service ${serviceId}`
                );
            }
            return this.credentialsService.revokeCredentials(userId, serviceId);
        }
        if (!authorization) {
            throw new UnauthorizedException('No authorization header or API key');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN && payload.sub !== userId) {
            throw new ForbiddenException('You can only revoke your own credentials');
        }
        return this.credentialsService.revokeCredentials(userId, serviceId);
    }
}
