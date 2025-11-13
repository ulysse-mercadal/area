import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceLoginDto {
    @ApiProperty({
        description: 'API key for service authentication',
        example: 'sk_1234567890abcdef'
    })
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @ApiProperty({
        description: 'Name of the service',
        example: 'Weather Service'
    })
    @IsString()
    @IsNotEmpty()
    serviceName: string;

    @ApiProperty({
        description: 'URL of the microservice',
        example: 'http://weather-service:3000'
    })
    @IsUrl({ require_tld: false })
    @IsNotEmpty()
    microServiceUrl: string;

    @ApiPropertyOptional({
        description: 'URL of the service icon',
        example: 'https://example.com/icon.png'
    })
    @IsUrl({ require_tld: false })
    @IsOptional()
    iconUrl?: string;
}

export class ServiceAuthResponseDto {
    @ApiProperty({
        description: 'JWT access token for the service',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string;

    @ApiProperty({
        description: 'Service information',
        example: {
            id: 1,
            name: 'Weather Service',
            microServiceUrl: 'http://weather-service:3000',
            iconUrl: 'https://example.com/icon.png',
            isNewService: true
        }
    })
    service: {
        id: number;
        name: string;
        microServiceUrl: string;
        iconUrl?: string;
        isNewService: boolean;
    };
}

export class RefreshServiceDto {
    @ApiPropertyOptional({
        description: 'Updated microservice URL',
        example: 'http://weather-service-v2:3000'
    })
    @IsUrl({ require_tld: false })
    @IsOptional()
    microServiceUrl?: string;

    @ApiPropertyOptional({
        description: 'Updated service icon URL',
        example: 'https://example.com/new-icon.png'
    })
    @IsUrl({ require_tld: false })
    @IsOptional()
    iconUrl?: string;
}
