import { Controller, Post, Param, Body, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NodeService } from '../nodes/node.service';

@Controller('workflows/trigger')
export class WorkflowTriggerController {
    private readonly logger = new Logger(WorkflowTriggerController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly nodeService: NodeService,
    ) {}

    @Post(':serviceId/:actionName')
    async triggerWorkflows(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Param('actionName') actionName: string,
        @Body() body: { userId: number; data: any },
    ) {
        try {
            this.logger.log(`Trigger received from service ${serviceId}`);
            this.logger.log(`   Action: ${actionName}`);
            this.logger.log(`   User: ${body.userId}`);
            const action = await this.prisma.actions.findUnique({
                where: {
                    name_serviceId: {
                        name: actionName,
                        serviceId: serviceId,
                    },
                },
            });
            if (!action) {
                this.logger.warn(`Action not found: ${actionName} for service ${serviceId}`);
                return {
                    success: false,
                    error: 'Action not found',
                    triggeredCount: 0,
                };
            }
            this.logger.log(`   Action ID: ${action.id}`);
            const workflows = await this.prisma.workflow.findMany({
                where: {
                    userId: body.userId,
                    isActive: true,
                },
                include: {
                    nodes: {
                        where: {
                            actionId: action.id,
                            isTriggered: true,
                        },
                    },
                },
            });
            this.logger.log(`   Found ${workflows.length} active workflow(s)`);
            const results: any[] = [];
            for (const workflow of workflows) {
                for (const triggerNode of workflow.nodes) {
                    try {
                        this.logger.log(`   Executing workflow ${workflow.id}, node ${triggerNode.id}`);
                        const executionResult = await this.nodeService.execute(
                            workflow.id,
                            triggerNode.id,
                            { input: body.data },
                            body.userId,
                        );
                        results.push({
                            workflowId: workflow.id,
                            workflowName: workflow.name,
                            nodeId: triggerNode.id,
                            success: true,
                            result: executionResult,
                        });
                        this.logger.log(`Workflow ${workflow.id} executed successfully`);
                    } catch (error: any) {
                        this.logger.error(`Workflow ${workflow.id} failed:`, error.message);
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
            return {
                success: false,
                error: error.message,
                triggeredCount: 0,
            };
        }
    }

    @Post('test/:serviceId/:actionName')
    async testTrigger(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Param('actionName') actionName: string,
        @Body() body: { userId: number; data: any },
    ) {
        this.logger.log('TEST TRIGGER');
        this.logger.log(`Service: ${serviceId}, Action: ${actionName}`);
        this.logger.log(`User: ${body.userId}`);
        this.logger.log(`Data:`, body.data);
        return {
            success: true,
            message: 'Test trigger received',
            received: { serviceId, actionName, ...body },
        };
    }
}
