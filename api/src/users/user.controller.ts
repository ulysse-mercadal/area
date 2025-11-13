import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, Headers, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, Role } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get()
    async findAll(@Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN) {
            throw new ForbiddenException(`Only admins can access all users, and you are ${payload.role}`);
        }
        return this.userService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN && payload.sub !== id) {
            throw new ForbiddenException('You can only access your own information');
        }
        return this.userService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Headers('authorization') authorization: string) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN && payload.sub !== id) {
            throw new ForbiddenException('You can only update your own information');
        }
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('authorization') authorization: string
    ) {
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token = authorization.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        if (payload.role !== Role.ADMIN && payload.sub !== id) {
            throw new ForbiddenException('You can only delete your own account');
        }
        return this.userService.remove(id);
    }
}
