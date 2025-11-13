import { IsString, IsNotEmpty, IsUrl, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
    @ApiPropertyOptional({
        description: 'Name of the service',
        example: 'Weather Service v2'
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'URL of the microservice',
        example: 'https://weather-service-v2.example.com'
    })
    @IsUrl()
    @IsOptional()
    microServiceUrl?: string;

    @ApiPropertyOptional({
        description: 'URL of the service icon',
        example: 'https://example.com/new-icon.png'
    })
    @IsUrl()
    @IsOptional()
    iconUrl?: string;

    @ApiPropertyOptional({
        description: 'Whether the service is active',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ChangeApiKeyDto {
    @ApiProperty({
        description: 'ID of the new API key to assign to the service',
        example: 2
    })
    @IsInt()
    @IsNotEmpty()
    newApiKeyId: number;
}

export class ServiceResponseDto {
    @ApiProperty({
        description: 'Service ID',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'Service name',
        example: 'Weather Service'
    })
    name: string;

    @ApiProperty({
        description: 'Microservice URL',
        example: 'https://weather-service.example.com'
    })
    microServiceUrl: string;

    @ApiPropertyOptional({
        description: 'Service icon URL',
        example: 'https://example.com/icon.png'
    })
    iconUrl?: string;

    @ApiProperty({
        description: 'Whether the service is active',
        example: true
    })
    isActive: boolean;

    @ApiPropertyOptional({
        description: 'Last seen date',
        example: '2024-10-31T15:30:00.000Z'
    })
    lastSeenAt?: Date;

    @ApiProperty({
        description: 'API key information',
        example: {
            id: 1,
            name: 'Weather Service Key',
            isActive: true
        }
    })
    apiKey: {
        id: number;
        name: string;
        isActive: boolean;
    };

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
}
