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
    Logger,
    
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { AuthService } from '../auth/auth.service';
import { ServiceAuthService } from '../auth/service-auth.service';
import { Role } from '../users/dto/user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { NodeService } from '../nodes/node.service';

@Controller('workflow')
export class WorkflowController {
    private readonly logger = new Logger(WorkflowController.name);
    constructor(
        private readonly workflowService: WorkflowService,
        private readonly authService: AuthService,
        private readonly serviceAuthService: ServiceAuthService,
        private readonly prisma: PrismaService,
        private readonly nodeService: NodeService,
    ) { }

    @Post()
    async create(
        @Body() createWorkflowDto: CreateWorkflowDto,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.workflowService.create(createWorkflowDto, payload.sub);
    }

    @Get()
    async findAll(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.workflowService.findAll();
        }
        return this.workflowService.findAll(payload.sub);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.workflowService.findOne(id);
        }
        return this.workflowService.findOne(id, payload.sub);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateWorkflowDto: UpdateWorkflowDto,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.workflowService.update(id, updateWorkflowDto);
        }
        return this.workflowService.update(id, updateWorkflowDto, payload.sub);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.workflowService.remove(id);
        }
        return this.workflowService.remove(id, payload.sub);
    }

    @Patch(':id/toggle')
    async toggleActive(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role === Role.ADMIN) {
            return this.workflowService.toggleActive(id);
        }
        return this.workflowService.toggleActive(id, payload.sub);
    }

    @Post('trigger/:userId/:actionName')
    async triggerWorkflows(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('actionName') actionName: string,
        @Body() body: { data: any },
    ) {
        try {
            this.logger.log(`   Action: ${actionName}`);
            this.logger.log(`   User: ${userId}`);
            const actions = await this.prisma.actions.findMany({
                where: {
                    name: actionName,
                },
            });
            if (actions.length === 0) {
                this.logger.warn(`No action found with name: ${actionName}`);
                return {
                    success: false,
                    error: 'Action not found',
                    triggeredCount: 0,
                };
            }
            this.logger.log(`   Found ${actions.length} action(s) with name "${actionName}"`);
            const actionIds = actions.map(a => a.id);
            const workflows = await this.prisma.workflow.findMany({
                where: {
                    userId: userId,
                    isActive: true,
                },
                include: {
                    nodes: {
                        where: {
                            actionId: {
                                in: actionIds,
                            },
                        },
                    },
                },
            });
            const workflowsWithTriggers = workflows.filter(w => w.nodes.length > 0);
            this.logger.log(
                `   Found ${workflowsWithTriggers.length} active workflow(s) with ` +
                `${workflowsWithTriggers.reduce((acc, w) => acc + w.nodes.length, 0)} trigger node(s)`
            );
            if (workflowsWithTriggers.length === 0) {
                return {
                    success: true,
                    triggeredCount: 0,
                    totalWorkflows: 0,
                    results: [],
                };
            }
            const results: any[] = [];
            for (const workflow of workflowsWithTriggers) {
                for (const triggerNode of workflow.nodes) {
                    try {
                        this.logger.log(
                            `   Executing workflow "${workflow.name}" (ID: ${workflow.id}), node ${triggerNode.id}`
                        );
                        const executionResult = await this.nodeService.execute(
                            workflow.id,
                            triggerNode.id,
                            { input: body.data },
                            userId,
                        );
                        results.push({
                            workflowId: workflow.id,
                            workflowName: workflow.name,
                            nodeId: triggerNode.id,
                            success: true,
                            result: executionResult,
                        });
                    } catch (error: any) {
                        this.logger.error(
                            `Error executing workflow ${workflow.id}:`,
                            error.message
                        );
                        results.push({
                            workflowId: workflow.id,
                            workflowName: workflow.name,
                            nodeId: triggerNode.id,
                            success: false,
                            error: error.message,
                        });
                    }
                }
            }
            const successCount = results.filter(r => r.success).length;
            this.logger.log(`Trigger complete: ${successCount}/${results.length} workflows succeeded`);
            return {
                success: true,
                triggeredCount: successCount,
                totalWorkflows: results.length,
                results,
            };
        } catch (error: any) {
            this.logger.error('Trigger error:', error.message);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            return {
                success: false,
                error: error.message,
                triggeredCount: 0,
            };
        }
    }

    @Post('trigger/test/:serviceId/:actionName')
    async testTrigger(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Param('actionName') actionName: string,
        @Body() body: { userId: number; data: any },
        @Headers('authorization') authorization: string,
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        let payload: any;
        try {
            payload = await this.authService.validateToken(token);
            if (payload.role !== Role.ADMIN) {
                throw new UnauthorizedException('Admin access required for test endpoint');
            }
        } catch {
            payload = await this.serviceAuthService.validateToken(token);
        }
        return this.triggerWorkflows(serviceId, actionName, body);
    }

    @Get('executions')
    async getAllExecutions(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new UnauthorizedException('Admin access required');
        }
        return this.workflowService.getAllExecutions();
    }
}
