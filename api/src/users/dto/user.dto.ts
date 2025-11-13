import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SERVICE = 'SERVICE',
}

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password (min 8 characters)',
        minLength: 8,
        example: 'mySecurePassword123'
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John'
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe'
    })
    @IsString()
    surname: string;

    @ApiPropertyOptional({
        enum: Role,
        description: 'User role',
        example: Role.USER
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }
