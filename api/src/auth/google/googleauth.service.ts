import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../users/dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GoogleAuthService {
  constructor(private readonly jwtService: JwtService, private prisma : PrismaService) {}

  async loginWithGoogle(user: any) {
    let dbuser = await this.prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
      },
    });

    if (!dbuser) {
      dbuser = await this.prisma.user.create({
        data: {
          email: user.email,
          pwd_hash: '',
          name: user.name || user.login || 'Google user',
          surname: user.surname || '',
          role: Role.USER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
        },
      });
    }

    const payload = {
      sub: dbuser.id,
      email: dbuser.email,
      role: dbuser.role,
    };
    return this.jwtService.sign(payload);
  }
}
