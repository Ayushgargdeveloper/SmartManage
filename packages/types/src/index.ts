export const roles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_LEADER', 'EMPLOYEE'] as const;

export type Role = (typeof roles)[number];

export type TenantScopedEntity = {
  id: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};
