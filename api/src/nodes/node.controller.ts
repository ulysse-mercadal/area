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
import { NodeService } from './node.service';
import { CreateNodeDto, UpdateNodeDto, ExecuteNodeDto } from './dto/node.dto';
import { AuthService } from '../auth/auth.service';
import { Role } from '../users/dto/user.dto';

@Controller('workflow')
export class NodeController {
    constructor(
        private readonly nodeService: NodeService,
        private readonly authService: AuthService,
    ) { }

    @Post('trigger/:triggerId')
    async triggerWorkflows(
        @Param('triggerId', ParseIntPipe) triggerId: number,
        @Body() triggerData: any,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.nodeService.triggerWorkflowsByActionId(triggerId, payload.sub, triggerData);
    }

    @Post(':workflowId/node')
    async create(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Body() createNodeDto: CreateNodeDto,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.create(workflowId, createNodeDto);
        }
        return this.nodeService.create(workflowId, createNodeDto, payload.sub);
    }

    @Get(':workflowId/node')
    async findAll(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.findAll(workflowId);
        }
        return this.nodeService.findAll(workflowId, payload.sub);
    }

    @Get(':workflowId/node/:id')
    async findOne(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.findOne(workflowId, id);
        }
        return this.nodeService.findOne(workflowId, id, payload.sub);
    }

    @Patch(':workflowId/node/:id')
    async update(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateNodeDto: UpdateNodeDto,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.update(workflowId, id, updateNodeDto);
        }
        return this.nodeService.update(workflowId, id, updateNodeDto, payload.sub);
    }

    @Delete(':workflowId/node/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.remove(workflowId, id);
        }
        return this.nodeService.remove(workflowId, id, payload.sub);
    }

    @Patch(':workflowId/node/:id/toggle')
    async toggleTrigger(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.toggleTrigger(workflowId, id);
        }
        return this.nodeService.toggleTrigger(workflowId, id, payload.sub);
    }

    @Post(':workflowId/node/:id/execute')
    async execute(
        @Param('workflowId', ParseIntPipe) workflowId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() executeNodeDto: ExecuteNodeDto,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.nodeService.execute(workflowId, id, executeNodeDto);
        }
        return this.nodeService.execute(workflowId, id, executeNodeDto, payload.sub);
    }
}
