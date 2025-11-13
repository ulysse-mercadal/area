import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AreaService } from './area.service';
import { AuthService } from '../auth/auth.service';
import { AreaResponseDto } from './dto/area.dto';

@Controller('area')
export class AreaController {
    constructor(
        private readonly areaService: AreaService,
        private readonly authService: AuthService
    ) {}

    @Get()
    async getAvailableArea(@Headers('authorization') authorization: string): Promise<AreaResponseDto> {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);

        return this.areaService.getAvailableArea(payload.sub);
    }

    @Get('services')
    async getAllServices(@Headers('authorization') authorization: string): Promise<{ services: string[] }> {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        await this.authService.validateToken(token);

        const services = await this.areaService.getAllAvailableServices();
        return { services };
    }
}
