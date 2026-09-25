import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { RoleName } from '../../../prisma/generated/client';
import { PrismaService } from '../database/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import type { CreateCompanyDto } from './dto/create-company.dto';
import type { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import type { UpdateCompanyStatusDto } from './dto/update-company-status.dto';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(user: JwtPayload) {
    this.requirePlatformAdmin(user);

    return this.withDatabaseAvailability(async () => {
      const [
        totalCompanies,
        activeCompanies,
        trialCompanies,
        suspendedCompanies,
        totalUsers,
        totalReports,
        totalAiMessages,
        companies,
        recentAuditLogs,
      ] = await Promise.all([
        this.prisma.company.count({ where: { archivedAt: null } }),
        this.prisma.company.count({ where: { archivedAt: null, status: 'ACTIVE' } }),
        this.prisma.company.count({ where: { archivedAt: null, status: 'TRIAL' } }),
        this.prisma.company.count({ where: { archivedAt: null, status: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { archivedAt: null } }),
        this.prisma.generatedReport.count(),
        this.prisma.aIMessage.count(),
        this.prisma.company.findMany({
          where: { archivedAt: null },
          orderBy: [{ status: 'asc' }, { name: 'asc' }],
          take: 25,
          include: {
            _count: {
              select: {
                users: true,
                projects: true,
                tasks: true,
                blockers: true,
                generatedReports: true,
                aiConversations: true,
              },
            },
          },
        }),
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            company: { select: { id: true, name: true, slug: true } },
            actor: { select: { id: true, name: true, email: true } },
          },
        }),
      ]);

      return {
        metrics: {
          totalCompanies,
          activeCompanies,
          trialCompanies,
          suspendedCompanies,
          totalUsers,
          totalReports,
          totalAiMessages,
        },
        companies: companies.map((company) => this.serializeCompany(company)),
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          metadata: log.metadata,
          createdAt: log.createdAt.toISOString(),
          company: log.company,
          actor: log.actor,
        })),
      };
    });
  }

  async createCompany(user: JwtPayload, dto: CreateCompanyDto) {
    this.requirePlatformAdmin(user);

    const name = dto.name.trim();
    const slug = (dto.slug?.trim() || this.slugify(name)).toLowerCase();
    const timezone = dto.timezone?.trim() || 'UTC';
    const dailyCutoff = dto.dailyCutoff ?? '18:00';

    if (!slug) {
      throw new BadRequestException('Company slug could not be generated from the name.');
    }

    return this.withDatabaseAvailability(async () => {
      try {
        const company = await this.prisma.$transaction(async (tx) => {
          const created = await tx.company.create({
            data: {
              name,
              slug,
              timezone,
              dailyCutoff,
              status: 'TRIAL',
            },
            include: this.companyInclude(),
          });

          await Promise.all(
            this.companyRoleDefinitions().map((role) =>
              tx.role.create({
                data: {
                  companyId: created.id,
                  name: role.name,
                  description: role.description,
                  permissions: role.permissions,
                },
              }),
            ),
          );

          await tx.auditLog.create({
            data: {
              actorId: user.sub,
              companyId: created.id,
              action: 'PLATFORM_COMPANY_CREATED',
              entityType: 'Company',
              entityId: created.id,
              metadata: { name: created.name, slug: created.slug },
            },
          });

          return created;
        });

        return this.serializeCompany(company);
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException('A company with this slug already exists.');
        }

        throw error;
      }
    });
  }

  async updateCompanyStatus(user: JwtPayload, companyId: string, dto: UpdateCompanyStatusDto) {
    this.requirePlatformAdmin(user);

    return this.withDatabaseAvailability(async () => {
      const existing = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true, name: true },
      });

      if (!existing) {
        throw new NotFoundException('Tenant company was not found.');
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.update({
          where: { id: companyId },
          data: {
            status: dto.status,
            archivedAt: dto.status === 'ARCHIVED' ? new Date() : null,
          },
          include: this.companyInclude(),
        });

        await tx.auditLog.create({
          data: {
            actorId: user.sub,
            companyId: company.id,
            action: 'PLATFORM_COMPANY_STATUS_UPDATED',
            entityType: 'Company',
            entityId: company.id,
            metadata: {
              previousStatus: existing.status,
              nextStatus: dto.status,
            },
          },
        });

        return company;
      });

      return this.serializeCompany(updated);
    });
  }

  async createCompanyAdmin(user: JwtPayload, companyId: string, dto: CreateCompanyAdminDto) {
    this.requirePlatformAdmin(user);

    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    const title = dto.title?.trim() || 'Company Administrator';

    return this.withDatabaseAvailability(async () => {
      const [company, role] = await Promise.all([
        this.prisma.company.findFirst({
          where: { id: companyId, archivedAt: null },
          select: { id: true, name: true },
        }),
        this.prisma.role.findUnique({
          where: { companyId_name: { companyId, name: RoleName.COMPANY_ADMIN } },
          select: { id: true },
        }),
      ]);

      if (!company) {
        throw new NotFoundException('Tenant company was not found.');
      }

      if (!role) {
        throw new NotFoundException('Company admin role was not found for this tenant.');
      }

      try {
        const companyAdmin = await this.prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              companyId: company.id,
              email,
              name,
              title,
              passwordHash: await hash(dto.temporaryPassword, 12),
              roles: { create: { roleId: role.id } },
            },
            include: {
              company: { select: { id: true, name: true, slug: true } },
              roles: { include: { role: { select: { name: true, permissions: true } } } },
            },
          });

          await tx.auditLog.create({
            data: {
              actorId: user.sub,
              companyId: company.id,
              action: 'PLATFORM_COMPANY_ADMIN_CREATED',
              entityType: 'User',
              entityId: created.id,
              metadata: { email: created.email, role: RoleName.COMPANY_ADMIN },
            },
          });

          return created;
        });

        return {
          id: companyAdmin.id,
          companyId: companyAdmin.companyId,
          email: companyAdmin.email,
          name: companyAdmin.name,
          title: companyAdmin.title,
          company: companyAdmin.company,
          roles: companyAdmin.roles.map(({ role }) => ({
            name: role.name,
            permissions: role.permissions,
          })),
        };
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException('A user with this email already exists.');
        }

        throw error;
      }
    });
  }

  private requirePlatformAdmin(user: JwtPayload) {
    if (!user.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('This endpoint requires a platform administrator.');
    }
  }

  private companyInclude() {
    return {
      _count: {
        select: {
          users: true,
          projects: true,
          tasks: true,
          blockers: true,
          generatedReports: true,
          aiConversations: true,
        },
      },
    };
  }

  private companyRoleDefinitions() {
    return [
      {
        name: RoleName.COMPANY_ADMIN,
        description: 'company admin permissions',
        permissions: [
          'company:*',
          'department:*',
          'team:*',
          'project:*',
          'task:*',
          'progress:read',
          'report:*',
        ],
      },
      {
        name: RoleName.TEAM_LEADER,
        description: 'team leader permissions',
        permissions: [
          'team:read',
          'team:update',
          'project:read',
          'task:*',
          'progress:review',
          'blocker:*',
          'report:read',
        ],
      },
      {
        name: RoleName.EMPLOYEE,
        description: 'employee permissions',
        permissions: [
          'task:read',
          'progress:create',
          'progress:read:own',
          'blocker:create',
          'comment:create',
        ],
      },
    ];
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private serializeCompany(company: {
    id: string;
    name: string;
    slug: string;
    status: string;
    timezone: string;
    dailyCutoff: string;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      users: number;
      projects: number;
      tasks: number;
      blockers: number;
      generatedReports: number;
      aiConversations: number;
    };
  }) {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
      timezone: company.timezone,
      dailyCutoff: company.dailyCutoff,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      counts: {
        users: company._count.users,
        projects: company._count.projects,
        tasks: company._count.tasks,
        blockers: company._count.blockers,
        reports: company._count.generatedReports,
        aiConversations: company._count.aiConversations,
      },
    };
  }

  private async withDatabaseAvailability<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
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

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
