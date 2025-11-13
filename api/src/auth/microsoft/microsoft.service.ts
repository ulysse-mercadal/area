import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../users/dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MicrosoftService {
  constructor(private readonly jwtService: JwtService, private prisma: PrismaService) {}

  async loginWithMicrosoft(user: any) {
    console.log(user);
    let dbuser = await this.prisma.user.findUnique({
      where: { email: user.mail },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
      },
    });
    // Si l'utilisateur n'existe pas, le créer
    if (!dbuser) {
      dbuser = await this.prisma.user.create({
        data: {
          email: user.mail,
          pwd_hash: '', // Pas de mot de passe pour OAuth
          name: user.displayName || user.login || 'Microsoft User',
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
    const payload = { sub: dbuser.id, email: dbuser.email };
    return this.jwtService.sign(payload);
  }
}
