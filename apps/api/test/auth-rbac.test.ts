import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AuthService } from '../src/modules/auth/auth.service';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { WorkService } from '../src/modules/work/work.service';
import { PlatformService } from '../src/modules/platform/platform.service';

type RoleName = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';

function dbUser(role: RoleName, passwordHash: string) {
  return {
    id: `user-${role.toLowerCase()}`,
    companyId: role === 'SUPER_ADMIN' ? null : 'company-1',
    email: `${role.toLowerCase()}@example.com`,
    name: `${role} User`,
    title: null,
    passwordHash,
    isActive: true,
    archivedAt: null,
    company: role === 'SUPER_ADMIN' ? null : { id: 'company-1', name: 'Acme', slug: 'acme' },
    roles: [{ role: { name: role, permissions: [] } }],
  };
}

function authServiceWithUser(user: ReturnType<typeof dbUser> | null) {
  let signedPayload: unknown;
  const prisma = {
    user: {
      findUnique: async () => user,
      update: async () => user,
    },
  };
  const jwt = {
    signAsync: async (payload: unknown) => {
      signedPayload = payload;
      return 'signed-token';
    },
  };

  return {
    service: new AuthService(prisma as never, jwt as never),
    getSignedPayload: () => signedPayload,
  };
}

function executionContext(userRoles: string[], requiredRoles: string[]) {
  return {
    reflector: {
      getAllAndOverride: () => requiredRoles,
    },
    context: {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: userRoles } }),
      }),
    },
  };
}

describe('AuthService login', () => {
  it('returns a JWT, user, role, and company for a successful company login', async () => {
    const passwordHash = await hash('workpulse-dev-pass', 4);
    const { service, getSignedPayload } = authServiceWithUser(
      dbUser('COMPANY_ADMIN', passwordHash),
    );

    const result = await service.login({
      email: 'company_admin@example.com',
      password: 'workpulse-dev-pass',
    });

    assert.equal(result.accessToken, 'signed-token');
    assert.equal(result.tokenType, 'Bearer');
    assert.equal(result.user.companyId, 'company-1');
    assert.deepEqual(
      result.user.roles.map((role) => role.name),
      ['COMPANY_ADMIN'],
    );
    assert.deepEqual(getSignedPayload(), {
      sub: 'user-company_admin',
      companyId: 'company-1',
      email: 'company_admin@example.com',
      roles: ['COMPANY_ADMIN'],
    });
  });

  it('rejects invalid login credentials', async () => {
    const { service } = authServiceWithUser(null);

    await assert.rejects(
      () => service.login({ email: 'missing@example.com', password: 'workpulse-dev-pass' }),
      UnauthorizedException,
    );
  });

  it('supports SUPER_ADMIN login without a company', async () => {
    const passwordHash = await hash('workpulse-dev-pass', 4);
    const { service } = authServiceWithUser(dbUser('SUPER_ADMIN', passwordHash));
    const result = await service.login({
      email: 'super_admin@example.com',
      password: 'workpulse-dev-pass',
    });

    assert.equal(result.user.companyId, null);
    assert.deepEqual(
      result.user.roles.map((role) => role.name),
      ['SUPER_ADMIN'],
    );
  });

  it('supports TEAM_LEADER login', async () => {
    const passwordHash = await hash('workpulse-dev-pass', 4);
    const { service } = authServiceWithUser(dbUser('TEAM_LEADER', passwordHash));
    const result = await service.login({
      email: 'team_leader@example.com',
      password: 'workpulse-dev-pass',
    });

    assert.deepEqual(
      result.user.roles.map((role) => role.name),
      ['TEAM_LEADER'],
    );
  });

  it('supports EMPLOYEE login', async () => {
    const passwordHash = await hash('workpulse-dev-pass', 4);
    const { service } = authServiceWithUser(dbUser('EMPLOYEE', passwordHash));
    const result = await service.login({
      email: 'employee@example.com',
      password: 'workpulse-dev-pass',
    });

    assert.deepEqual(
      result.user.roles.map((role) => role.name),
      ['EMPLOYEE'],
    );
  });
});

describe('RolesGuard', () => {
  it('allows access when the authenticated user has a required role', () => {
    const { reflector, context } = executionContext(['COMPANY_ADMIN'], ['COMPANY_ADMIN']);
    const guard = new RolesGuard(reflector as never);

    assert.equal(guard.canActivate(context as never), true);
  });

  it('rejects access when the authenticated user lacks the required role', () => {
    const { reflector, context } = executionContext(['EMPLOYEE'], ['COMPANY_ADMIN']);
    const guard = new RolesGuard(reflector as never);

    assert.throws(() => guard.canActivate(context as never), ForbiddenException);
  });
});

describe('company admin person creation rules', () => {
  const companyAdmin = {
    sub: 'admin-1',
    companyId: 'company-1',
    email: 'admin@example.com',
    roles: ['COMPANY_ADMIN'],
  };

  it('prevents Company Admin from creating another Company Admin', async () => {
    const service = new WorkService({} as never);

    await assert.rejects(
      () =>
        service.createEmployee(companyAdmin, {
          name: 'Second Admin',
          email: 'second@example.com',
          temporaryPassword: 'password123',
          role: 'COMPANY_ADMIN' as never,
        }),
      /team leader or employee/,
    );
  });

  it('prevents Company Admin from creating a Super Admin', async () => {
    const service = new WorkService({} as never);

    await assert.rejects(
      () =>
        service.createEmployee(companyAdmin, {
          name: 'Super Admin',
          email: 'super@example.com',
          temporaryPassword: 'password123',
          role: 'SUPER_ADMIN' as never,
        }),
      /team leader or employee/,
    );
  });
});

describe('PlatformService super-admin provisioning', () => {
  it('creates a company with default company roles', async () => {
    const createdRoles: string[] = [];
    const service = new PlatformService({
      $transaction: async (callback: (tx: unknown) => unknown) =>
        callback({
          company: {
            create: async () => ({
              id: 'company-new',
              name: 'New Company',
              slug: 'new-company',
              status: 'TRIAL',
              timezone: 'UTC',
              dailyCutoff: '18:00',
              createdAt: new Date('2026-09-11T00:00:00.000Z'),
              updatedAt: new Date('2026-09-11T00:00:00.000Z'),
              _count: {
                users: 0,
                projects: 0,
                tasks: 0,
                blockers: 0,
                generatedReports: 0,
                aiConversations: 0,
              },
            }),
          },
          role: {
            create: async ({ data }: { data: { name: string } }) => {
              createdRoles.push(data.name);
              return data;
            },
          },
          auditLog: { create: async () => ({}) },
        }),
    } as never);

    const result = await service.createCompany(
      { sub: 'super-1', companyId: null, email: 'super@example.com', roles: ['SUPER_ADMIN'] },
      { name: 'New Company' },
    );

    assert.equal(result.id, 'company-new');
    assert.deepEqual(createdRoles, ['COMPANY_ADMIN', 'TEAM_LEADER', 'EMPLOYEE']);
  });

  it('allows Super Admin to create a Company Admin for a company', async () => {
    const service = new PlatformService({
      company: {
        findFirst: async () => ({ id: 'company-1', name: 'Acme' }),
      },
      role: {
        findUnique: async () => ({ id: 'role-company-admin' }),
      },
      $transaction: async (callback: (tx: unknown) => unknown) =>
        callback({
          user: {
            create: async () => ({
              id: 'admin-1',
              companyId: 'company-1',
              email: 'admin@example.com',
              name: 'Admin User',
              title: 'Company Administrator',
              company: { id: 'company-1', name: 'Acme', slug: 'acme' },
              roles: [{ role: { name: 'COMPANY_ADMIN', permissions: ['company:*'] } }],
            }),
          },
          auditLog: { create: async () => ({}) },
        }),
    } as never);

    const result = await service.createCompanyAdmin(
      { sub: 'super-1', companyId: null, email: 'super@example.com', roles: ['SUPER_ADMIN'] },
      'company-1',
      {
        name: 'Admin User',
        email: 'admin@example.com',
        temporaryPassword: 'password123',
      },
    );

    assert.equal(result.companyId, 'company-1');
    assert.deepEqual(
      result.roles.map((role) => role.name),
      ['COMPANY_ADMIN'],
    );
  });
});
