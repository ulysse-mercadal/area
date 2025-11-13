import { Controller, Get } from '@nestjs/common';
import { AreaService } from './area.service';

@Controller('area')
export class AreaController {
    constructor(private readonly areaService: AreaService) { }

    @Get()
    async getArea() {
        return this.areaService.getAvailableArea();
    }
}
