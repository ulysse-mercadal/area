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
} from '@nestjs/common';
import { NodeConnectionService } from './node-connect.service';
import { CreateNodeConnectionDto, UpdateNodeConnectionDto } from './dto/node-connect.dto';
import { AuthService } from '../auth/auth.service';
import { Role } from '../users/dto/user.dto';

@Controller('workflow/:workflowId/connection')
export class NodeConnectionController {
    constructor(private readonly nodeConnectionService: NodeConnectionService, private readonly authService: AuthService) {}

    @Post()
    async create(@Param('workflowId', ParseIntPipe) workflowId: number, @Body() createNodeConnectionDto: CreateNodeConnectionDto, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeConnectionService.create(workflowId, createNodeConnectionDto);
        }
        return this.nodeConnectionService.create(workflowId, createNodeConnectionDto, payload.sub);
    }

    @Get()
    async findAll(@Param('workflowId', ParseIntPipe) workflowId: number, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeConnectionService.findAll(workflowId);
        }
        return this.nodeConnectionService.findAll(workflowId, payload.sub);
    }

    @Get(':id')
    async findOne(@Param('workflowId', ParseIntPipe) workflowId: number, @Param('id', ParseIntPipe) id: number, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeConnectionService.findOne(workflowId, id);
        }
        return this.nodeConnectionService.findOne(workflowId, id, payload.sub);
    }

    @Patch(':id')
    async update(@Param('workflowId', ParseIntPipe) workflowId: number, @Param('id', ParseIntPipe) id: number, @Body() updateNodeConnectionDto: UpdateNodeConnectionDto, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeConnectionService.update(workflowId, id, updateNodeConnectionDto);
        }
        return this.nodeConnectionService.update(workflowId, id, updateNodeConnectionDto, payload.sub);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('workflowId', ParseIntPipe) workflowId: number, @Param('id', ParseIntPipe) id: number, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeConnectionService.remove(workflowId, id);
        }
        return this.nodeConnectionService.remove(workflowId, id, payload.sub);
    }
}
