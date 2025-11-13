import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCredentialDto {
    @ApiProperty({
        description: 'Access token for the service',
        example: 'ya29.a0AfB_byz...'
    })
    @IsString()
    token: string;

    @ApiPropertyOptional({
        description: 'Refresh token for the service',
        example: '1//03e...'
    })
    @IsOptional()
    @IsString()
    refreshToken?: string;

    @ApiPropertyOptional({
        description: 'Token expiration date',
        example: '2024-12-31T23:59:59.999Z'
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: Date;

    @ApiProperty({
        description: 'ID of the service',
        example: 1
    })
    @IsInt()
    serviceId: number;

    @ApiProperty({
        description: 'ID of the user',
        example: 123
    })
    @IsInt()
    userId: number;

    @ApiPropertyOptional({
        description: 'Last used date',
        example: '2024-10-31T15:30:00.000Z'
    })
    @IsOptional()
    @IsDateString()
    lastUsed?: Date;
}

export class UpdateCredentialDto {
    @ApiPropertyOptional({
        description: 'Updated access token',
        example: 'ya29.a0AfB_byz...'
    })
    @IsOptional()
    @IsString()
    token?: string;

    @ApiPropertyOptional({
        description: 'Updated refresh token',
        example: '1//03e...'
    })
    @IsOptional()
    @IsString()
    refreshToken?: string;

    @ApiPropertyOptional({
        description: 'Updated expiration date',
        example: '2024-12-31T23:59:59.999Z'
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: Date;

    @ApiPropertyOptional({
        description: 'Updated last used date',
        example: '2024-10-31T15:30:00.000Z'
    })
    @IsOptional()
    @IsDateString()
    lastUsed?: Date;
}
