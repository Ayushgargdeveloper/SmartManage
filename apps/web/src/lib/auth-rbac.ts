import type { AuthUser } from './api';
import type { RoleKey } from './mock-data';

export const primaryRolePriority = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'TEAM_LEADER',
  'EMPLOYEE',
] as const;

export function roleKeyFromUser(user: AuthUser | undefined): RoleKey {
  if (!user) return 'auth';

  const roleNames = user.roles.map((role) => role.name);
  const primaryRole = primaryRolePriority.find((role) => roleNames.includes(role));

  switch (primaryRole) {
    case 'SUPER_ADMIN':
      return 'super-admin';
    case 'COMPANY_ADMIN':
      return 'company-admin';
    case 'TEAM_LEADER':
      return 'team-leader';
    case 'EMPLOYEE':
      return 'employee';
    default:
      return 'auth';
  }
}
