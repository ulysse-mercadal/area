import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Delete,
    Query,
    Post,
    HttpCode,
    HttpStatus,
    Headers,
    UnauthorizedException,
    ForbiddenException,
    ParseIntPipe
} from '@nestjs/common';
import { ServicesService } from './service.service';
import { UpdateServiceDto, ChangeApiKeyDto } from './dto/service.dto';
import { AuthService } from '../auth/auth.service';
import { Role } from '../users/dto/user.dto';

@Controller('services')
export class ServicesController {
    constructor(
        private readonly servicesService: ServicesService,
        private readonly authService: AuthService
    ) {}

    @Get()
    async findAll() {
        return this.servicesService.findAll();
    }

    @Get('stats')
    async getStats(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can view service stats');
        }
        return this.servicesService.getStats();
    }

    @Get('inactive')
    async findInactive(
        @Query('days') days: string = '30',
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can view inactive services');
        }
        return this.servicesService.findInactiveServices(+days);
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
            throw new ForbiddenException('Only admins can view services');
        }
        return this.servicesService.findOne(id);
    }

    @Get('by-name/:name')
    async findByName(
        @Param('name') name: string,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can view services');
        }
        return this.servicesService.findByName(name);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateServiceDto: UpdateServiceDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can update services');
        }
        return this.servicesService.update(id, updateServiceDto);
    }

    @Patch(':id/api-key')
    async changeApiKey(
        @Param('id', ParseIntPipe) id: number,
        @Body() changeApiKeyDto: ChangeApiKeyDto,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can change service API keys');
        }
        return this.servicesService.changeApiKey(id, changeApiKeyDto.newApiKeyId);
    }

    @Post('deactivate-by-key/:apiKeyId')
    @HttpCode(HttpStatus.OK)
    async deactivateByApiKey(
        @Param('apiKeyId', ParseIntPipe) apiKeyId: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can deactivate services');
        }
        return this.servicesService.deactivateServicesByApiKey(apiKeyId);
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
            throw new ForbiddenException('Only admins can delete services');
        }
        return this.servicesService.remove(id);
    }
}
