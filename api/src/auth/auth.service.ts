import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from "../users/dto/user.dto";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(registerDto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                pwd_hash: hashedPassword,
                name: registerDto.name,
                surname: registerDto.surname,
                role: registerDto.role || Role.USER,
            },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                role: true,
            },
        });
        const payload = {sub: user.id, email: user.email, role: user.role};
        const access_token = await this.jwtService.signAsync(payload);
        return {
            access_token,
            user,
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.pwd_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {sub: user.id, email: user.email, role: user.role};
        const access_token = await this.jwtService.signAsync(payload);
        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
            },
        };
    }

    async validateToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async getCurrentUser(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                role: true,
            },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}
