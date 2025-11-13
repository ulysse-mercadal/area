import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';

@Injectable()
export class WorkflowService {
    constructor(private prisma: PrismaService) { }
    async create(createWorkflowDto: CreateWorkflowDto, userId: number) {
        try {
            const workflow = await this.prisma.workflow.create({
                data: {
                    name: createWorkflowDto.name,
                    description: createWorkflowDto.description,
                    isActive: createWorkflowDto.isActive ?? true,
                    userId: userId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            surname: true,
                        },
                    },
                    nodes: true,
                    nodeConnections: true,
                },
            });
            return workflow;
        } catch (error) {
            throw error;
        }
    }

    async findAll(userId?: number) {
        const where = userId ? { userId } : {};
        return this.prisma.workflow.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true,
                    },
                },
                nodes: true,
                nodeConnections: true,
                _count: {
                    select: {
                        executions: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    }

    async findOne(id: number, userId?: number) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true,
                    },
                },
                nodes: {
                    include: {
                        action: true,
                        reaction: true,
                        outConnect: true,
                        inConnect: true,
                    },
                },
                nodeConnections: {
                    include: {
                        sourceNode: true,
                        targetNode: true,
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
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        if (userId && workflow.userId !== userId) {
            throw new ForbiddenException('You can only access your own workflows');
        }
        return workflow;
    }

    async update(id: number, updateWorkflowDto: UpdateWorkflowDto, userId?: number) {
        try {
            await this.findOne(id, userId);
            const workflow = await this.prisma.workflow.update({
                where: { id },
                data: updateWorkflowDto,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            surname: true,
                        },
                    },
                    nodes: true,
                    nodeConnections: true,
                },
            });
            return workflow;
        } catch (error) {
            throw error;
        }
    }

    async remove(id: number, userId?: number) {
        try {
            await this.findOne(id, userId);
            await this.prisma.workflow.delete({
                where: { id },
            });
            return { message: `Workflow with ID ${id} deleted successfully` };
        } catch (error) {
            throw error;
        }
    }

    async toggleActive(id: number, userId?: number) {
        const workflow = await this.findOne(id, userId);
        return this.prisma.workflow.update({
            where: { id },
            data: {
                isActive: !workflow.isActive,
            },
        });
    }
    async getUserWorkflows(userId: number) {
        return this.findAll(userId);
    }

    async getAllExecutions(filters?: any, paging?: { take?: number; skip?: number }) {
        const where: any = {};
        if (filters) {
            if (typeof filters.workflowId !== 'undefined' && !Number.isNaN(Number(filters.workflowId))) {
                where.workflowId = Number(filters.workflowId);
            }
            if (typeof filters.triggeredBy !== 'undefined' && !Number.isNaN(Number(filters.triggeredBy))) {
                where.triggeredBy = Number(filters.triggeredBy);
            }
            if (typeof filters.status === 'string' && filters.status.length > 0) {
                where.status = filters.status;
            }
            if (filters.startedAt) {
                where.startedAt = {};
                if (filters.startedAt.gte) {
                    where.startedAt.gte = filters.startedAt.gte;
                }
                if (filters.startedAt.lte) {
                    where.startedAt.lte = filters.startedAt.lte;
                }
            }
        }

        const findOptions: any = {
            select: {
                id: true,
                workflowId: true,
                triggeredBy: true,
                status: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true,
            },
            where,
            orderBy: { startedAt: 'desc' },
        };

        if (paging) {
            if (typeof paging.take === 'number') findOptions.take = paging.take;
            if (typeof paging.skip === 'number') findOptions.skip = paging.skip;
        }

        return this.prisma.workflowExecution.findMany(findOptions);
    }
}
