import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Get,
    Headers,
    UnauthorizedException,
    Patch
} from '@nestjs/common';
import { ServiceAuthService } from './service-auth.service';
import { ServiceLoginDto, RefreshServiceDto } from './dto/service-auth.dto';

@Controller('auth/services')
export class ServiceAuthController {
    constructor(private readonly serviceAuthService: ServiceAuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: ServiceLoginDto) {
        return this.serviceAuthService.login(loginDto);
    }

    @Get('me')
    async getCurrentService(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.serviceAuthService.validateToken(token);
        if (payload.type !== 'service') {
            throw new UnauthorizedException('Invalid token type');
        }
        return this.serviceAuthService.getCurrentService(payload.sub);
    }

    @Patch('refresh')
    async refreshService(
        @Headers('authorization') authorization: string,
        @Body() refreshDto: RefreshServiceDto
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.serviceAuthService.validateToken(token);
        if (payload.type !== 'service') {
            throw new UnauthorizedException('Invalid token type');
        }
        return this.serviceAuthService.refreshService(
            payload.sub,
            refreshDto.microServiceUrl,
            refreshDto.iconUrl
        );
    }
}
