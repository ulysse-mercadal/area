import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNodeConnectionDto, UpdateNodeConnectionDto } from './dto/node-connect.dto';

@Injectable()
export class NodeConnectionService {
    constructor(private prisma: PrismaService) { }
    async create(workflowId: number, createNodeConnectionDto: CreateNodeConnectionDto, userId?: number) {
        try {
            await this.verifyWorkflowAccess(workflowId, userId);
            const [sourceNode, targetNode] = await Promise.all([
                this.prisma.node.findFirst({
                    where: {
                        id: createNodeConnectionDto.sourceNodeId,
                        workflowId,
                    },
                }),
                this.prisma.node.findFirst({
                    where: {
                        id: createNodeConnectionDto.targetNodeId,
                        workflowId,
                    },
                }),
            ]);
            if (!sourceNode) {
                throw new NotFoundException(`Source node with ID ${createNodeConnectionDto.sourceNodeId} not found in workflow ${workflowId}`);
            }
            if (!targetNode) {
                throw new NotFoundException(`Target node with ID ${createNodeConnectionDto.targetNodeId} not found in workflow ${workflowId}`);
            }
            const existingConnection = await this.prisma.nodeConnection.findUnique({
                where: {
                    sourceNodeId_targetNodeId_channel: {
                        sourceNodeId: createNodeConnectionDto.sourceNodeId,
                        targetNodeId: createNodeConnectionDto.targetNodeId,
                        channel: createNodeConnectionDto.channel || 'success',
                    },
                },
            });
            if (existingConnection) {
                throw new ConflictException(`Connection between nodes ${createNodeConnectionDto.sourceNodeId} and ${createNodeConnectionDto.targetNodeId} with channel '${createNodeConnectionDto.channel || 'success'}' already exists`);
            }
            if (createNodeConnectionDto.sourceNodeId === createNodeConnectionDto.targetNodeId) {
                throw new BadRequestException('A node cannot be connected to itself');
            }
            const connection = await this.prisma.nodeConnection.create({
                data: {
                    workflowId,
                    sourceNodeId: createNodeConnectionDto.sourceNodeId,
                    targetNodeId: createNodeConnectionDto.targetNodeId,
                    condition: createNodeConnectionDto.condition,
                    channel: createNodeConnectionDto.channel || 'success',
                },
                include: {
                    sourceNode: {
                        include: {
                            action: true,
                            reaction: true,
                        },
                    },
                    targetNode: {
                        include: {
                            action: true,
                            reaction: true,
                        },
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
            return connection;
        } catch (error) {
            throw error;
        }
    }

    async findAll(workflowId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        return this.prisma.nodeConnection.findMany({
            where: { workflowId },
            include: {
                sourceNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                targetNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findOne(workflowId: number, connectionId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        const connection = await this.prisma.nodeConnection.findFirst({
            where: {
                id: connectionId,
                workflowId,
            },
            include: {
                sourceNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                targetNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
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
        if (!connection) {
            throw new NotFoundException(`Connection with ID ${connectionId} not found in workflow ${workflowId}`);
        }
        return connection;
    }

    async update(workflowId: number, connectionId: number, updateNodeConnectionDto: UpdateNodeConnectionDto, userId?: number) {
        try {
            const existingConnection = await this.findOne(workflowId, connectionId, userId);
            if (updateNodeConnectionDto.targetNodeId) {
                const targetNode = await this.prisma.node.findFirst({
                    where: {
                        id: updateNodeConnectionDto.targetNodeId,
                        workflowId,
                    },
                });
                if (!targetNode) {
                    throw new NotFoundException(`Target node with ID ${updateNodeConnectionDto.targetNodeId} not found in workflow ${workflowId}`);
                }
            }
            if (updateNodeConnectionDto.sourceNodeId) {
                const sourceNode = await this.prisma.node.findFirst({
                    where: {
                        id: updateNodeConnectionDto.sourceNodeId,
                        workflowId,
                    },
                });
                if (!sourceNode) {
                    throw new NotFoundException(`Source node with ID ${updateNodeConnectionDto.sourceNodeId} not found in workflow ${workflowId}`);
                }
            }
            const sourceId = updateNodeConnectionDto.sourceNodeId || existingConnection.sourceNodeId;
            const targetId = updateNodeConnectionDto.targetNodeId || existingConnection.targetNodeId;
            const channel = updateNodeConnectionDto.channel || existingConnection.channel;
            if (sourceId === targetId) {
                throw new BadRequestException('A node cannot be connected to itself');
            }
            if (updateNodeConnectionDto.sourceNodeId || updateNodeConnectionDto.targetNodeId || updateNodeConnectionDto.channel) {
                const conflictingConnection = await this.prisma.nodeConnection.findUnique({
                    where: {
                        sourceNodeId_targetNodeId_channel: {
                            sourceNodeId: sourceId,
                            targetNodeId: targetId,
                            channel: channel,
                        },
                    },
                });
                if (conflictingConnection && conflictingConnection.id !== connectionId) {
                    throw new ConflictException(`Connection between nodes ${sourceId} and ${targetId} with channel '${channel}' already exists`);
                }
            }
            const connection = await this.prisma.nodeConnection.update({
                where: { id: connectionId },
                data: {
                    ...updateNodeConnectionDto,
                    channel: updateNodeConnectionDto.channel || existingConnection.channel,
                },
                include: {
                    sourceNode: {
                        include: {
                            action: true,
                            reaction: true,
                        },
                    },
                    targetNode: {
                        include: {
                            action: true,
                            reaction: true,
                        },
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
            return connection;
        } catch (error) {
            throw error;
        }
    }

    async remove(workflowId: number, connectionId: number, userId?: number) {
        try {
            await this.findOne(workflowId, connectionId, userId);
            await this.prisma.nodeConnection.delete({
                where: { id: connectionId },
            });
            return { message: `Connection with ID ${connectionId} deleted successfully` };
        } catch (error) {
            throw error;
        }
    }

    async findByChannel(workflowId: number, channel: string, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        return this.prisma.nodeConnection.findMany({
            where: {
                workflowId,
                channel,
            },
            include: {
                sourceNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                targetNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findBySourceNode(workflowId: number, sourceNodeId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        return this.prisma.nodeConnection.findMany({
            where: {
                workflowId,
                sourceNodeId,
            },
            include: {
                sourceNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                targetNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findByTargetNode(workflowId: number, targetNodeId: number, userId?: number) {
        await this.verifyWorkflowAccess(workflowId, userId);
        return this.prisma.nodeConnection.findMany({
            where: {
                workflowId,
                targetNodeId,
            },
            include: {
                sourceNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                targetNode: {
                    include: {
                        action: true,
                        reaction: true,
                    },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
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
            throw new ForbiddenException('You can only access connections from your own workflows');
        }
        return workflow;
    }
}
