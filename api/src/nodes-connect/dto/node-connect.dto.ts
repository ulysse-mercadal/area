import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNodeConnectionDto {
    @ApiProperty({
        description: 'ID of the source node',
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    sourceNodeId: number;

    @ApiProperty({
        description: 'ID of the target node',
        example: 2
    })
    @IsInt()
    @IsNotEmpty()
    targetNodeId: number;

    @ApiPropertyOptional({
        description: 'Condition for the connection',
        example: {
            type: 'equals',
            left: 'data.temperature',
            right: 30
        }
    })
    @IsOptional()
    condition?: any;

    @ApiPropertyOptional({
        description: 'Channel for the connection',
        example: 'success',
        default: 'success'
    })
    @IsString()
    @IsOptional()
    channel?: string = 'success';
}

export class UpdateNodeConnectionDto {
    @ApiPropertyOptional({
        description: 'ID of the source node',
        example: 1
    })
    @IsInt()
    @IsOptional()
    sourceNodeId?: number;

    @ApiPropertyOptional({
        description: 'ID of the target node',
        example: 2
    })
    @IsInt()
    @IsOptional()
    targetNodeId?: number;

    @ApiPropertyOptional({
        description: 'Condition for the connection',
        example: '{ type: greaterThan, left: data.value, right: 100}'
    })
    @IsOptional()
    condition?: any;

    @ApiPropertyOptional({
        description: 'Channel for the connection',
        example: 'error'
    })
    @IsString()
    @IsOptional()
    channel?: string;
}
