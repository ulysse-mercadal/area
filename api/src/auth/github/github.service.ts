import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../users/dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';

interface GitHubUser {
  email: string;
  username?: string;
  login: string;
  id: number;
  surname?: string;
}

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async loginWithGithub(user: GitHubUser) {
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
          name: user.username || user.login || 'GitHub User',
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