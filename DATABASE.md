# Database Architecture

Phase 2 establishes the PostgreSQL and Prisma foundation for WorkPulse AI.

## Prisma Files

- Schema: `apps/api/prisma/schema.prisma`
- Prisma config: `apps/api/prisma.config.ts`
- Initial migration: `apps/api/prisma/migrations/20260724172000_phase_2_database_foundation/migration.sql`
- Seed script: `apps/api/prisma/seed.ts`
- Nest database service: `apps/api/src/modules/database/prisma.service.ts`

## Core Modeling Principles

- Tenant data is scoped through `companyId` on business entities.
- Platform users such as `SUPER_ADMIN` may have `companyId = null`.
- Company-owned roles allow each tenant to gain future custom permissions without hard-coding authorization in UI components.
- Soft archive fields use `archivedAt` on long-lived operational records where deletion should be reversible.
- Operational history uses separate `AuditLog`, `Comment`, `Notification`, `AIConversation`, `AIMessage`, and `GeneratedReport` tables.

## Tenant Isolation

Backend services must never trust `companyId` from request bodies or query parameters. Future service methods should derive the tenant from the authenticated user and include tenant filters in every query touching company data.

Examples:

```ts
await prisma.task.findMany({
  where: {
    companyId: currentUser.companyId,
    assigneeId: currentUser.id,
    archivedAt: null,
  },
});
```

Cross-company access must be rejected even when an attacker guesses a valid object ID from another tenant.

## Important Indexes

- `User(companyId, isActive)`
- `Department(companyId, archivedAt)`
- `Team(companyId, departmentId)`
- `Project(companyId, status, priority)`
- `Project(companyId, targetDate)`
- `Task(companyId, status, priority)`
- `Task(companyId, dueDate)`
- `DailyProgress(companyId, workDate)`
- `DailyProgress(companyId, userId, workDate)`
- `Blocker(companyId, status, severity)`
- `GeneratedReport(companyId, type, createdAt)`

## Local Commands

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
```

The default development database URL is:

```text
postgresql://workpulse:workpulse@localhost:5432/workpulse?schema=public
```

If another PostgreSQL server is already listening on port `5432`, set `DATABASE_URL` to valid local credentials before running migration or seed commands.

## Seed Data

The seed creates:

- 1 platform admin
- 2 sample companies
- Company admins, team leaders, and employees
- Departments and teams
- Projects and project modules
- Tasks, daily progress, blockers, comments, attachments, notifications
- AI conversation history and a generated report

Passwords are deliberately placeholder hashes until Phase 3 implements secure authentication.
