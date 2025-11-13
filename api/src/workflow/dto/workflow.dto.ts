import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowDto {
    @ApiProperty({
        description: 'Name of the workflow',
        example: 'Daily Weather Report'
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Description of the workflow',
        example: 'Sends daily weather reports via email'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Whether the workflow is active',
        example: true,
        default: true
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateWorkflowDto {
    @ApiPropertyOptional({
        description: 'Name of the workflow',
        example: 'Updated Workflow Name'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Description of the workflow',
        example: 'Updated workflow description'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Whether the workflow is active',
        example: false
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
