import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser, JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.findUserByEmail(credentials.email);

    if (!user || !user.isActive || user.archivedAt) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.passwordMatches(credentials.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = this.toAuthUser(user);
    const payload: JwtPayload = {
      sub: authUser.id,
      companyId: authUser.companyId,
      email: authUser.email,
      roles: authUser.roles.map((role) => role.name),
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer' as const,
      user: authUser,
    };
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true, slug: true } },
        roles: {
          include: {
            role: { select: { name: true, permissions: true } },
          },
        },
      },
    });

    if (!user || !user.isActive || user.archivedAt) {
      throw new UnauthorizedException('User session is no longer valid.');
    }

    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    companyId: string | null;
    email: string;
    name: string;
    title: string | null;
    company: { id: string; name: string; slug: string } | null;
    roles: { role: { name: string; permissions: string[] } }[];
  }): AuthUser {
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      title: user.title,
      company: user.company,
      roles: user.roles.map(({ role }) => ({
        name: role.name,
        permissions: role.permissions,
      })),
    };
  }

  private async passwordMatches(password: string, passwordHash: string): Promise<boolean> {
    try {
      return await compare(password, passwordHash);
    } catch {
      return false;
    }
  }

  private async findUserByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          roles: {
            include: {
              role: { select: { name: true, permissions: true } },
            },
          },
        },
      });
    } catch (error) {
      if (this.isDatabaseAuthError(error)) {
        throw new ServiceUnavailableException(
          'Database credentials are not valid for the configured connection.',
        );
      }

      throw error;
    }
  }

  private isDatabaseAuthError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P1000';
  }
}
