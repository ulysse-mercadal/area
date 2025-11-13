import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNodeDto, UpdateNodeDto, ExecuteNodeDto, LogicType, ExecutionStatus, NodeLogicConfig } from './dto/node.dto';
import { LogicExecutionResult, LogicExecutorService } from '../logic-executor/logic-executor.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NodeService {
    constructor(
        private prisma: PrismaService,
        private logicExecutor: LogicExecutorService,
        private httpService: HttpService
    ) { }

    async create(workflowId: number, createNodeDto: CreateNodeDto, userId?: number) {
        try {
            await this.verifyWorkflowAccess(workflowId, userId);
            if (!createNodeDto.actionId && !createNodeDto.reactionId && !createNodeDto.logicType) {
                throw new BadRequestException('Node must have either actionId, reactionId, or logicType');
            }
            const node = await this.prisma.node.create({
                data: {
                    workflowId,
                    name: createNodeDto.name,
                    actionId: createNodeDto.actionId,
                    reactionId: createNodeDto.reactionId,
                    logicType: createNodeDto.logicType,
                    conf: createNodeDto.conf,
                    isTriggered: createNodeDto.isTriggered ?? false,
                    positionX: createNodeDto.positionX,
                    positionY: createNodeDto.positionY,
                },
                include: {
                    action: {
                        include: { service: true },
                    },
                    reaction: {
                        include: { service: true },
                    },
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                            userId: true,
                        },
                    },
                },
            });
            return node;
        } catch (error) {
            throw error;
        }
    }

    async findAll(workflowId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        return this.prisma.node.findMany({
            where: { workflowId },
            include: {
                action: {
                    include: { service: true },
                },
                reaction: {
                    include: { service: true },
                },
                outConnect: {
                    include: {
                        targetNode: true,
                    },
                },
                inConnect: {
                    include: {
                        sourceNode: true,
                    },
                },
                _count: {
                    select: {
                        executions: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findOne(workflowId: number, nodeId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        const node = await this.prisma.node.findFirst({
            where: {
                id: nodeId,
                workflowId,
            },
            include: {
                action: {
                    include: { service: true },
                },
                reaction: {
                    include: { service: true },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                    },
                },
                outConnect: {
                    include: {
                        targetNode: {
                            include: {
                                action: {
                                    include: { service: true },
                                },
                                reaction: {
                                    include: { service: true },
                                },
                            },
                        },
                    },
                },
                inConnect: {
                    include: {
                        sourceNode: {
                            include: {
                                action: {
                                    include: { service: true },
                                },
                                reaction: {
                                    include: { service: true },
                                },
                            },
                        },
                    },
                },
                executions: {
                    take: 10,
                    orderBy: {
                        startedAt: 'desc',
                    },
                },
            },
        });
        if (!node) {
            throw new NotFoundException(`Node with ID ${nodeId} not found in workflow ${workflowId}`);
        }
        return node;
    }

    async update(workflowId: number, nodeId: number, updateNodeDto: UpdateNodeDto, userId?: number) {
        try {
            await this.findOne(workflowId, nodeId, userId);
            const node = await this.prisma.node.update({
                where: { id: nodeId },
                data: updateNodeDto,
                include: {
                    action: {
                        include: { service: true },
                    },
                    reaction: {
                        include: { service: true },
                    },
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                            userId: true,
                        },
                    },
                },
            });
            return node;
        } catch (error) {
            throw error;
        }
    }

    async remove(workflowId: number, nodeId: number, userId?: number) {
        try {
            await this.findOne(workflowId, nodeId, userId);
            await this.prisma.node.delete({
                where: { id: nodeId },
            });
            return { message: `Node with ID ${nodeId} deleted successfully` };
        } catch (error) {
            throw error;
        }
    }

    async toggleTrigger(workflowId: number, nodeId: number, userId?: number) {
        const node = await this.findOne(workflowId, nodeId, userId);
        return this.prisma.node.update({
            where: { id: nodeId },
            data: {
                isTriggered: !node.isTriggered,
            },
            include: {
                action: {
                    include: { service: true },
                },
                reaction: {
                    include: { service: true },
                },
            },
        });
    }

    async triggerWorkflowsByActionId(actionId: number, userId: number, triggerData: any) {
        const workflows = await this.prisma.workflow.findMany({
            where: {
                userId,
                isActive: true,
            },
            include: {
                nodes: {
                    where: {
                        actionId,
                    },
                },
            },
        });
        const results: any[] = [];
        for (const workflow of workflows) {
            for (const triggerNode of workflow.nodes) {
                try {
                    const executionResult = await this.execute(
                        workflow.id,
                        triggerNode.id,
                        { input: triggerData },
                        userId
                    );
                    results.push({
                        workflowId: workflow.id,
                        nodeId: triggerNode.id,
                        success: true,
                        result: executionResult,
                    });
                } catch (error: any) {
                    results.push({
                        workflowId: workflow.id,
                        nodeId: triggerNode.id,
                        success: false,
                        error: error.message,
                    });
                }
            }
        }
        return {
            triggeredCount: results.filter(r => r.success).length,
            results,
        };
    }

    private interpolateVariables(config: any, input: any): any {
        if (!config) return config;
        const configStr = JSON.stringify(config);
        const interpolated = configStr.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const value = input[varName.trim()];
            return value !== undefined ? JSON.stringify(value).slice(1, -1) : match;
        });
        return JSON.parse(interpolated);
    }

    async execute(workflowId: number, nodeId: number, executeNodeDto: ExecuteNodeDto, userId?: number) {
        try {
            await this.verifyWorkflowAccess(workflowId, userId);
            const node = await this.prisma.node.findFirst({
                where: {
                    id: nodeId,
                    workflowId,
                },
                include: {
                    action: {
                        include: { service: true },
                    },
                    reaction: {
                        include: { service: true },
                    },
                    outConnect: {
                        include: {
                            targetNode: true,
                        },
                    },
                },
            });
            if (!node) {
                throw new NotFoundException(`Node with ID ${nodeId} not found in workflow ${workflowId}`);
            }
            let executionId = executeNodeDto.executionId;
            if (!executionId) {
                const workflowExecution = await this.prisma.workflowExecution.create({
                    data: {
                        workflowId,
                        triggeredBy: nodeId,
                        status: ExecutionStatus.RUNNING,
                    },
                });
                executionId = workflowExecution.id;
            }
            const nodeExecution = await this.prisma.nodeExecution.create({
                data: {
                    nodeId,
                    executionId,
                    status: ExecutionStatus.RUNNING,
                    startedAt: new Date(),
                },
            });
            let output: any = executeNodeDto.input || {};
            let logs = '';
            let executionStatus: ExecutionStatus = ExecutionStatus.SUCCESS;
            let executionChannel = 'success';
            try {
                const nodeName = node.name || `Node ${nodeId}`;
                console.log(`Executing node: ${nodeName}`);
                logs += `Executing node: ${nodeName}\n`;
                if (node.reactionId) {
                    logs += `Type: Reaction - ${node.reaction?.name}\n`;
                    try {
                        if (!node.reaction) {
                            throw new BadRequestException('Reaction not found on node');
                        }
                        const reactionUrl = node.reaction.service?.microServiceUrl;
                        if (!reactionUrl) {
                            throw new BadRequestException('Reaction microservice URL not configured');
                        }
                        const workflow = await this.prisma.workflow.findUnique({
                            where: { id: workflowId },
                            select: { userId: true },
                        });
                        if (!workflow) {
                            throw new BadRequestException('Workflow not found');
                        }
                        const interpolatedConfig = this.interpolateVariables(node.conf, executeNodeDto.input);
                        logs += `Sending to microservice:\n`;
                        logs += `  - Original Config: ${JSON.stringify(node.conf)}\n`;
                        logs += `  - Interpolated Config: ${JSON.stringify(interpolatedConfig)}\n`;
                        logs += `  - Input: ${JSON.stringify(executeNodeDto.input)}\n`;
                        const response = await firstValueFrom(
                            this.httpService.post(`${reactionUrl}/execute`, {
                                type: 'reaction',
                                name: node.reaction.name,
                                userId: workflow.userId,
                                config: interpolatedConfig || {},
                                input: executeNodeDto.input || {},
                            })
                        );
                        if (!response.data.success) {
                            throw new Error(response.data.error || 'Reaction execution failed');
                        }
                        output = response.data.result;
                        logs += `Microservice response: ${JSON.stringify(response.data.result)}\n`;
                    } catch (reactionError: any) {
                        executionStatus = ExecutionStatus.FAILED;
                        logs += `Reaction microservice error: ${reactionError.message}\n`;
                        output = { error: reactionError.message };
                        executionChannel = 'failed';
                    }
                }
                else if (node.logicType) {
                    logs += `Type: Logic - ${node.logicType}\n`;
                    const conf = node.conf as NodeLogicConfig;
                    let incomingNodes: Array<{ status: string; output: any; executionChannel: string }> | undefined;
                    if (node.logicType === LogicType.AND || node.logicType === LogicType.NOT) {
                        const inConnections = await this.prisma.nodeConnection.findMany({
                            where: { targetNodeId: nodeId },
                            include: {
                                sourceNode: true,
                            },
                        });
                        incomingNodes = await Promise.all(
                            inConnections.map(async (conn) => {
                                const lastExecution = await this.prisma.nodeExecution.findFirst({
                                    where: {
                                        nodeId: conn.sourceNodeId,
                                    },
                                    orderBy: {
                                        startedAt: 'desc',
                                    },
                                });
                                return {
                                    status: lastExecution?.status || 'UNKNOWN',
                                    output: lastExecution?.output || {},
                                    executionChannel: lastExecution?.executionChannel || 'unknown',
                                };
                            })
                        );
                        logs += `Found ${incomingNodes.length} incoming node(s)\n`;
                        logs += `Incoming nodes channels: ${incomingNodes.map(node => node.executionChannel).join(', ')}\n`;
                    }
                    const logicInput = {
                        condition: conf?.condition,
                        input: executeNodeDto.input,
                        maxIterations: conf?.maxIterations,
                        incomingNodes,
                    };
                    let logicResult: LogicExecutionResult;
                    switch (node.logicType) {
                        case LogicType.IF:
                            logicResult = await this.logicExecutor.executeIf(logicInput);
                            break;
                        case LogicType.AND:
                            logicResult = await this.logicExecutor.executeAnd(logicInput);
                            break;
                        case LogicType.NOT:
                            logicResult = await this.logicExecutor.executeNot(logicInput);
                            break;
                        default:
                            throw new BadRequestException(`Unknown logic type: ${node.logicType}`);
                    }
                    logs += logicResult.logs;
                    output = logicResult.output;
                    executionChannel = logicResult.channel;
                    logs += `Execution channel: ${executionChannel}\n`;
                }
                logs += `Input: ${JSON.stringify(executeNodeDto.input)}\n`;
                logs += `Output: ${JSON.stringify(output)}\n`;
                await this.prisma.node.update({
                    where: { id: nodeId },
                    data: {
                        lastExecuted: new Date(),
                        executionCount: {
                            increment: 1,
                        },
                    },
                });
            } catch (error: any) {
                executionStatus = ExecutionStatus.FAILED;
                logs += `Error: ${error.message}\n`;
                output = { error: error.message };
                executionChannel = 'failed';
            }
            const finalNodeExecution = await this.prisma.nodeExecution.update({
                where: { id: nodeExecution.id },
                data: {
                    status: executionStatus,
                    completedAt: new Date(),
                    output,
                    logs,
                    executionChannel,
                },
            });
            if (executionStatus === ExecutionStatus.SUCCESS && node.outConnect.length > 0) {
                const nextExecutions: Promise<any>[] = [];
                const connectionsToExecute = node.outConnect.filter(conn =>
                    conn.channel === executionChannel
                );
                logs += `Found ${connectionsToExecute.length} connection(s) for channel "${executionChannel}"\n`;
                for (const connection of connectionsToExecute) {
                    nextExecutions.push(
                        this.execute(
                            workflowId,
                            connection.targetNodeId,
                            { executionId, input: output },
                            userId
                        ).catch((err: any) => {
                            console.error(`Error executing next node ${connection.targetNodeId}: ${err.message}`);
                            return { error: err.message };
                        })
                    );
                }
                const results = await Promise.all(nextExecutions);
                if (executionId) {
                    const allCompleted = await this.checkWorkflowExecutionComplete(executionId);
                    if (allCompleted) {
                        await this.prisma.workflowExecution.update({
                            where: { id: executionId },
                            data: {
                                status: ExecutionStatus.SUCCESS,
                                completedAt: new Date(),
                            },
                        });
                    }
                }
                return {
                    nodeExecution: finalNodeExecution,
                    nextNodes: results,
                };
            }
            return {
                nodeExecution: finalNodeExecution,
            };
        } catch (error: any) {
            if (executeNodeDto.executionId) {
                await this.prisma.workflowExecution.update({
                    where: { id: executeNodeDto.executionId },
                    data: {
                        status: ExecutionStatus.FAILED,
                        completedAt: new Date(),
                        errorMessage: error.message,
                    },
                }).catch(() => { });
            }
            throw error;
        }
    }

    private async checkWorkflowExecutionComplete(executionId: number): Promise<boolean> {
        const nodeExecutions = await this.prisma.nodeExecution.findMany({
            where: { executionId },
        });
        const hasRunning = nodeExecutions.some(
            ne => ne.status === ExecutionStatus.RUNNING || ne.status === ExecutionStatus.PENDING
        );
        return !hasRunning;
    }

    private async verifyWorkflowAccess(workflowId: number, userId?: number) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            select: {
                id: true,
                userId: true,
            },
        });
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
        }
        if (userId && workflow.userId !== userId) {
            throw new ForbiddenException('You can only access nodes from your own workflows');
        }
        return workflow;
    }
}
