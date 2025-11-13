import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from "../../users/dto/user.dto";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
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
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe'
    })
    @IsString()
    @IsNotEmpty()
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

export class LoginDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'mySecurePassword123'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class AuthResponseDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string;

    @ApiProperty({
        description: 'User information',
        example: {
            id: 1,
            email: 'john.doe@example.com',
            name: 'John',
            surname: 'Doe'
        }
    })
    user: {
        id: number;
        email: string;
        name: string;
        surname: string;
    };
}
