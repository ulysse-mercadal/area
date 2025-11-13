import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, Role, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }


    async create(createUserDto: CreateUserDto) {
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: createUserDto.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
            const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
            const user = await this.prisma.user.create({
                data: {
                    email: createUserDto.email,
                    pwd_hash: hashedPassword,
                    name: createUserDto.name,
                    surname: createUserDto.surname,
                    role: createUserDto.role || Role.USER,
                },
            });
            const { pwd_hash, ...userNoPWD } = user;
            return userNoPWD;
        } catch (error) {
            throw error;
        }
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                role: true,
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                role: true,
            },
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        try {
            await this.findOne(id);
            const user = await this.prisma.user.update({
                where: { id },
                data: updateUserDto,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    surname: true,
                    role: true,
                },
            });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async remove(id: number) {
        try {
            await this.findOne(id);
            await this.prisma.user.delete({
                where: { id },
            });
            return { message: `User with ID ${id} deleted successfully` };
        } catch (error) {
            throw error;
        }
    }
}
