import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Headers,
    UnauthorizedException,
    ForbiddenException,
    ParseIntPipe
} from '@nestjs/common';
import { ApiKeyService } from './apikey.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/apikey.dto';
import { AuthService } from '../auth/auth.service';
import { Role } from '../users/dto/user.dto';

@Controller('admin/api-keys')
export class ApiKeyController {
    constructor(
        private readonly apiKeyService: ApiKeyService,
        private readonly authService: AuthService
    ) {}

    @Post()
    async create(
        @Body() createApiKeyDto: CreateApiKeyDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can create API keys');
        }
        return this.apiKeyService.create(createApiKeyDto);
    }

    @Get()
    async findAll(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can view API keys');
        }
        return this.apiKeyService.findAll();
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
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can view API keys');
        }
        return this.apiKeyService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateApiKeyDto: UpdateApiKeyDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can update API keys');
        }
        return this.apiKeyService.update(id, updateApiKeyDto);
    }

    @Post(':id/regenerate')
    @HttpCode(HttpStatus.OK)
    async regenerate(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can regenerate API keys');
        }
        return this.apiKeyService.regenerate(id);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can delete API keys');
        }
        return this.apiKeyService.remove(id);
    }
}
