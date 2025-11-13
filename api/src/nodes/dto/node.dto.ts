import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LogicType {
    IF = 'IF',
    AND = 'AND',
    NOT = 'NOT'
}

export interface NodeLogicConfig {
    condition?: any;
    trueOutput?: any;
    falseOutput?: any;
    maxIterations?: number;
}

export enum ExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED"
}

export class CreateNodeDto {
    @ApiPropertyOptional({
        description: 'Name of the node',
        example: 'Email Notification'
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'ID of the action',
        example: 1
    })
    @IsInt()
    @IsOptional()
    actionId?: number;

    @ApiPropertyOptional({
        description: 'ID of the reaction',
        example: 2
    })
    @IsInt()
    @IsOptional()
    reactionId?: number;

    @ApiPropertyOptional({
        enum: LogicType,
        description: 'Type of logic node',
        example: LogicType.IF
    })
    @IsEnum(LogicType)
    @IsOptional()
    logicType?: LogicType;

    @ApiPropertyOptional({
        description: 'Configuration object for the node',
        example: {
            condition: 'data.temperature > 30',
            trueOutput: { message: 'It\'s hot!' },
            falseOutput: { message: 'Temperature is normal' }
        }
    })
    @IsObject()
    @IsOptional()
    conf?: any;

    @ApiPropertyOptional({
        description: 'Whether the node is triggered',
        example: false
    })
    @IsBoolean()
    @IsOptional()
    isTriggered?: boolean;

    @ApiPropertyOptional({
        description: 'X position in the workflow editor',
        example: 100
    })
    @IsNumber()
    @IsOptional()
    positionX?: number;

    @ApiPropertyOptional({
        description: 'Y position in the workflow editor',
        example: 150
    })
    @IsNumber()
    @IsOptional()
    positionY?: number;
}

export class UpdateNodeDto {
    @ApiPropertyOptional({
        description: 'Name of the node',
        example: 'Updated Node Name'
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'ID of the action',
        example: 1
    })
    @IsInt()
    @IsOptional()
    actionId?: number;

    @ApiPropertyOptional({
        description: 'ID of the reaction',
        example: 2
    })
    @IsInt()
    @IsOptional()
    reactionId?: number;

    @ApiPropertyOptional({
        enum: LogicType,
        description: 'Type of logic node',
        example: LogicType.IF
    })
    @IsEnum(LogicType)
    @IsOptional()
    logicType?: LogicType;

    @ApiPropertyOptional({
        description: 'Configuration object for the node',
        example: {
            maxIterations: 5,
            condition: 'data.count < 10'
        }
    })
    @IsObject()
    @IsOptional()
    conf?: any;

    @ApiPropertyOptional({
        description: 'Whether the node is triggered',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    isTriggered?: boolean;

    @ApiPropertyOptional({
        description: 'X position in the workflow editor',
        example: 200
    })
    @IsNumber()
    @IsOptional()
    positionX?: number;

    @ApiPropertyOptional({
        description: 'Y position in the workflow editor',
        example: 250
    })
    @IsNumber()
    @IsOptional()
    positionY?: number;
}

export class ExecuteNodeDto {
    @ApiPropertyOptional({
        description: 'ID of the execution',
        example: 123
    })
    @IsInt()
    @IsOptional()
    executionId?: number;

    @ApiPropertyOptional({
        description: 'Input data for node execution',
        example: {
            temperature: 25,
            humidity: 60,
            user: { id: 1, name: 'John' }
        }
    })
    @IsObject()
    @IsOptional()
    input?: any;
}
