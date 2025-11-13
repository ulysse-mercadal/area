import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
    @ApiProperty({
        description: 'Name of the API key',
        example: 'Weather Service Key'
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class UpdateApiKeyDto {
    @ApiPropertyOptional({
        description: 'Name of the API key',
        example: 'Updated API Key Name'
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Whether the API key is active',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ApiKeyResponseDto {
    @ApiProperty({
        description: 'API key ID',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'API key name',
        example: 'Weather Service Key'
    })
    name: string;

    @ApiPropertyOptional({
        description: 'API key value (only shown on creation)',
        example: 'sk_1234567890abcdef'
    })
    apiKey?: string;

    @ApiProperty({
        description: 'Whether the API key is active',
        example: true
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Creation date',
        example: '2024-01-15T10:00:00.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update date',
        example: '2024-10-31T12:00:00.000Z'
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        description: 'Last used date',
        example: '2024-10-31T15:30:00.000Z'
    })
    lastUsedAt?: Date;

    @ApiPropertyOptional({
        description: 'Warning message',
        example: 'This API key will expire in 7 days'
    })
    warning?: string;
}
