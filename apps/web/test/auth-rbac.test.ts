import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roleKeyFromUser } from '../src/lib/auth-rbac';
import type { AuthUser } from '../src/lib/api';

function userWithRoles(roles: string[]): AuthUser {
  return {
    id: 'user-1',
    companyId: roles.includes('SUPER_ADMIN') ? null : 'company-1',
    email: 'user@example.com',
    name: 'Test User',
    title: null,
    company: roles.includes('SUPER_ADMIN') ? null : { id: 'company-1', name: 'Acme', slug: 'acme' },
    roles: roles.map((name) => ({ name, permissions: [] })),
  };
}

describe('frontend role routing', () => {
  it('routes SUPER_ADMIN users to the platform dashboard role', () => {
    assert.equal(roleKeyFromUser(userWithRoles(['SUPER_ADMIN'])), 'super-admin');
  });

  it('routes COMPANY_ADMIN users to the company dashboard role', () => {
    assert.equal(roleKeyFromUser(userWithRoles(['COMPANY_ADMIN'])), 'company-admin');
  });

  it('routes TEAM_LEADER users to the team dashboard role', () => {
    assert.equal(roleKeyFromUser(userWithRoles(['TEAM_LEADER'])), 'team-leader');
  });

  it('routes EMPLOYEE users to the employee dashboard role', () => {
    assert.equal(roleKeyFromUser(userWithRoles(['EMPLOYEE'])), 'employee');
  });

  it('uses the highest-priority role when a user has multiple roles', () => {
    assert.equal(roleKeyFromUser(userWithRoles(['EMPLOYEE', 'COMPANY_ADMIN'])), 'company-admin');
  });

  it('routes unauthenticated users to the login role', () => {
    assert.equal(roleKeyFromUser(undefined), 'auth');
  });
});
