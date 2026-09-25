import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from './generated/client';

const datasourceUrl =
  process.env.DATABASE_URL ??
  'postgresql://workpulse:workpulse@localhost:5432/workpulse?schema=public';

const adapter = new PrismaPg({ connectionString: datasourceUrl });
const prisma = new PrismaClient({ adapter });

const devPassword = process.env.SEED_USER_PASSWORD ?? 'workpulse-dev-pass';

function date(value: string) {
  return new Date(value);
}

async function createRoles(companyId: string | null) {
  const permissionsByRole = {
    SUPER_ADMIN: ['platform:*'],
    COMPANY_ADMIN: [
      'company:*',
      'department:*',
      'team:*',
      'project:*',
      'task:*',
      'progress:read',
      'report:*',
    ],
    TEAM_LEADER: [
      'team:read',
      'team:update',
      'project:read',
      'task:*',
      'progress:review',
      'blocker:*',
      'report:read',
    ],
    EMPLOYEE: [
      'task:read',
      'progress:create',
      'progress:read:own',
      'blocker:create',
      'comment:create',
    ],
  } as const;

  const roles = await Promise.all(
    Object.entries(permissionsByRole).map(([name, permissions]) =>
      prisma.role.create({
        data: {
          companyId,
          name: name as keyof typeof permissionsByRole,
          description: `${name.replaceAll('_', ' ').toLowerCase()} permissions`,
          permissions: [...permissions],
        },
      }),
    ),
  );

  return Object.fromEntries(roles.map((role) => [role.name, role]));
}

async function main() {
  const passwordHash = await hash(devPassword, 12);

  await prisma.auditLog.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.dailyProgress.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectModule.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.departmentMember.deleteMany();
  await prisma.department.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const platformRoles = await createRoles(null);
  const platformAdmin = await prisma.user.create({
    data: {
      email: 'ayushgarg.official07@gmail.com',
      name: 'Ayush Garg',
      title: 'Platform Administrator',
      passwordHash,
      roles: { create: { roleId: platformRoles.SUPER_ADMIN.id } },
    },
  });

  const acme = await prisma.company.create({
    data: {
      name: 'Acme Operations',
      slug: 'acme-operations',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      dailyCutoff: '18:30',
      workweek: { days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    },
  });

  const brightlane = await prisma.company.create({
    data: {
      name: 'Brightlane Studio',
      slug: 'brightlane-studio',
      status: 'TRIAL',
      timezone: 'America/New_York',
      dailyCutoff: '17:30',
      workweek: { days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    },
  });

  const acmeRoles = await createRoles(acme.id);
  const brightlaneRoles = await createRoles(brightlane.id);

  const engineering = await prisma.department.create({
    data: {
      companyId: acme.id,
      name: 'Engineering',
      description: 'Product engineering and platform delivery',
    },
  });
  const operations = await prisma.department.create({
    data: {
      companyId: acme.id,
      name: 'Operations',
      description: 'Customer operations and process ownership',
    },
  });
  const design = await prisma.department.create({
    data: {
      companyId: brightlane.id,
      name: 'Design',
      description: 'Product design and implementation support',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        companyId: acme.id,
        email: 'priya.m@acme.example',
        name: 'Priya Mehta',
        title: 'Company Administrator',
        passwordHash,
        roles: { create: { roleId: acmeRoles.COMPANY_ADMIN.id } },
        departmentMemberships: { create: { departmentId: operations.id } },
      },
    }),
    prisma.user.create({
      data: {
        companyId: acme.id,
        email: 'maya.rao@acme.example',
        name: 'Maya Rao',
        title: 'Frontend Engineer',
        passwordHash,
        roles: { create: { roleId: acmeRoles.EMPLOYEE.id } },
        departmentMemberships: { create: { departmentId: engineering.id } },
      },
    }),
    prisma.user.create({
      data: {
        companyId: acme.id,
        email: 'dev.patel@acme.example',
        name: 'Dev Patel',
        title: 'Backend Team Leader',
        passwordHash,
        roles: { create: { roleId: acmeRoles.TEAM_LEADER.id } },
        departmentMemberships: { create: { departmentId: engineering.id } },
      },
    }),
    prisma.user.create({
      data: {
        companyId: acme.id,
        email: 'nora.shah@acme.example',
        name: 'Nora Shah',
        title: 'QA Engineer',
        passwordHash,
        roles: { create: { roleId: acmeRoles.EMPLOYEE.id } },
        departmentMemberships: { create: { departmentId: engineering.id } },
      },
    }),
    prisma.user.create({
      data: {
        companyId: acme.id,
        email: 'ishan.k@acme.example',
        name: 'Ishan Kapoor',
        title: 'Product Designer',
        passwordHash,
        roles: { create: { roleId: acmeRoles.EMPLOYEE.id } },
        departmentMemberships: { create: { departmentId: operations.id } },
      },
    }),
    prisma.user.create({
      data: {
        companyId: brightlane.id,
        email: 'lena@brightlane.example',
        name: 'Lena Ortiz',
        title: 'Company Administrator',
        passwordHash,
        roles: { create: { roleId: brightlaneRoles.COMPANY_ADMIN.id } },
        departmentMemberships: { create: { departmentId: design.id } },
      },
    }),
  ]);

  const [priya, maya, dev, nora, ishan, lena] = users;

  const deliveryTeam = await prisma.team.create({
    data: {
      companyId: acme.id,
      departmentId: engineering.id,
      leaderId: dev.id,
      name: 'Product Delivery',
      description: 'Core application delivery team',
      members: {
        create: [{ userId: dev.id }, { userId: maya.id }, { userId: nora.id }],
      },
    },
  });

  const workflowTeam = await prisma.team.create({
    data: {
      companyId: acme.id,
      departmentId: operations.id,
      leaderId: priya.id,
      name: 'Workflow Ops',
      description: 'Process owners and product operations',
      members: { create: [{ userId: priya.id }, { userId: ishan.id }] },
    },
  });

  const studioTeam = await prisma.team.create({
    data: {
      companyId: brightlane.id,
      departmentId: design.id,
      leaderId: lena.id,
      name: 'Client Studio',
      description: 'Client-facing delivery team',
      members: { create: [{ userId: lena.id }] },
    },
  });

  const analyticsProject = await prisma.project.create({
    data: {
      companyId: acme.id,
      departmentId: engineering.id,
      teamId: deliveryTeam.id,
      ownerId: dev.id,
      name: 'Analytics Refresh',
      description: 'Modernize operational analytics and report filters.',
      startDate: date('2026-07-01'),
      targetDate: date('2026-08-15'),
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 68,
      members: { create: [{ userId: dev.id }, { userId: maya.id }, { userId: nora.id }] },
    },
  });

  const portalProject = await prisma.project.create({
    data: {
      companyId: acme.id,
      departmentId: engineering.id,
      teamId: deliveryTeam.id,
      ownerId: dev.id,
      name: 'Partner Portal',
      description: 'Self-service workspace for partner operations.',
      startDate: date('2026-06-10'),
      targetDate: date('2026-08-05'),
      status: 'DELAYED',
      priority: 'URGENT',
      progress: 52,
      members: { create: [{ userId: dev.id }, { userId: maya.id }, { userId: nora.id }] },
    },
  });

  const reportProject = await prisma.project.create({
    data: {
      companyId: acme.id,
      departmentId: operations.id,
      teamId: workflowTeam.id,
      ownerId: priya.id,
      name: 'Reports V2',
      description: 'Management report templates and export UX.',
      startDate: date('2026-07-08'),
      targetDate: date('2026-09-01'),
      status: 'PLANNING',
      priority: 'MEDIUM',
      progress: 24,
      members: { create: [{ userId: priya.id }, { userId: ishan.id }] },
    },
  });

  const brandProject = await prisma.project.create({
    data: {
      companyId: brightlane.id,
      departmentId: design.id,
      teamId: studioTeam.id,
      ownerId: lena.id,
      name: 'Client Launch Kit',
      description: 'Template system for client launch reporting.',
      startDate: date('2026-07-15'),
      targetDate: date('2026-08-20'),
      status: 'ACTIVE',
      priority: 'MEDIUM',
      progress: 35,
      members: { create: { userId: lena.id } },
    },
  });

  const importModule = await prisma.projectModule.create({
    data: {
      companyId: acme.id,
      projectId: analyticsProject.id,
      name: 'Import and validation',
      description: 'CSV/Excel parsing and validation workflow',
      dueDate: date('2026-07-31'),
    },
  });

  const ssoModule = await prisma.projectModule.create({
    data: {
      companyId: acme.id,
      projectId: portalProject.id,
      name: 'Authentication',
      description: 'Partner SSO and account access',
      dueDate: date('2026-07-28'),
    },
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        companyId: acme.id,
        projectId: analyticsProject.id,
        moduleId: importModule.id,
        assigneeId: maya.id,
        reporterId: dev.id,
        title: 'Finalize CSV import validator',
        description:
          'Validate required fields, duplicate rows, unsupported status values, and row-level errors.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: date('2026-07-20'),
        dueDate: date('2026-07-25'),
        estimatedHours: '18.00',
        actualHours: '12.50',
        progress: 72,
      },
    }),
    prisma.task.create({
      data: {
        companyId: acme.id,
        projectId: portalProject.id,
        moduleId: ssoModule.id,
        assigneeId: dev.id,
        reporterId: priya.id,
        title: 'Resolve staging SSO redirect',
        description: 'Fix SAML callback mismatch and confirm staging provider metadata.',
        status: 'BLOCKED',
        priority: 'URGENT',
        startDate: date('2026-07-18'),
        dueDate: date('2026-07-23'),
        estimatedHours: '10.00',
        actualHours: '8.25',
        progress: 44,
      },
    }),
    prisma.task.create({
      data: {
        companyId: acme.id,
        projectId: analyticsProject.id,
        moduleId: importModule.id,
        assigneeId: nora.id,
        reporterId: dev.id,
        title: 'QA import preview edge cases',
        description: 'Test empty sheets, invalid mappings, and large workbook preview behavior.',
        status: 'REVIEW',
        priority: 'MEDIUM',
        startDate: date('2026-07-21'),
        dueDate: date('2026-07-26'),
        estimatedHours: '12.00',
        actualHours: '9.00',
        progress: 91,
      },
    }),
    prisma.task.create({
      data: {
        companyId: acme.id,
        projectId: reportProject.id,
        assigneeId: ishan.id,
        reporterId: priya.id,
        title: 'Design report filters empty state',
        description: 'Create clear empty and no-results states for future report filtering.',
        status: 'NOT_STARTED',
        priority: 'LOW',
        startDate: date('2026-07-28'),
        dueDate: date('2026-08-02'),
        estimatedHours: '6.00',
        progress: 0,
      },
    }),
    prisma.task.create({
      data: {
        companyId: brightlane.id,
        projectId: brandProject.id,
        assigneeId: lena.id,
        reporterId: lena.id,
        title: 'Prepare launch report template',
        description: 'Create launch status template for client reporting.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        startDate: date('2026-07-20'),
        dueDate: date('2026-07-29'),
        estimatedHours: '8.00',
        actualHours: '3.50',
        progress: 40,
      },
    }),
  ]);

  const [validatorTask, ssoTask, qaTask] = tasks;

  const mayaProgress = await prisma.dailyProgress.create({
    data: {
      companyId: acme.id,
      userId: maya.id,
      projectId: analyticsProject.id,
      taskId: validatorTask.id,
      workDate: date('2026-07-24'),
      workCompleted: 'Completed duplicate-row validation and added unsupported status checks.',
      status: 'IN_PROGRESS',
      progressPercent: 72,
      timeSpentHours: '5.50',
      hasBlocker: true,
      tomorrowPlan: 'Connect preview summary to downloadable error report.',
      externalLinks: ['https://docs.example/import-spec'],
    },
  });

  const devProgress = await prisma.dailyProgress.create({
    data: {
      companyId: acme.id,
      userId: dev.id,
      projectId: portalProject.id,
      taskId: ssoTask.id,
      workDate: date('2026-07-24'),
      workCompleted: 'Confirmed callback mismatch and prepared provider metadata diff.',
      status: 'BLOCKED',
      progressPercent: 44,
      timeSpentHours: '4.25',
      hasBlocker: true,
      tomorrowPlan: 'Escalate provider callback configuration to client IT owner.',
      externalLinks: [],
    },
  });

  await prisma.dailyProgress.create({
    data: {
      companyId: acme.id,
      userId: nora.id,
      projectId: analyticsProject.id,
      taskId: qaTask.id,
      workDate: date('2026-07-24'),
      workCompleted: 'Validated empty sheet handling and reviewed preview states.',
      status: 'COMPLETED',
      progressPercent: 91,
      timeSpentHours: '6.00',
      hasBlocker: false,
      tomorrowPlan: 'Run large workbook cases and verify row-level error exports.',
      externalLinks: [],
    },
  });

  const ssoBlocker = await prisma.blocker.create({
    data: {
      companyId: acme.id,
      employeeId: dev.id,
      projectId: portalProject.id,
      taskId: ssoTask.id,
      dailyProgressId: devProgress.id,
      resolverId: priya.id,
      description: 'Client SSO provider callback URL does not match staging metadata.',
      category: 'CLIENT',
      status: 'ESCALATED',
      severity: 'HIGH',
    },
  });

  const workbookBlocker = await prisma.blocker.create({
    data: {
      companyId: acme.id,
      employeeId: maya.id,
      projectId: analyticsProject.id,
      taskId: validatorTask.id,
      dailyProgressId: mayaProgress.id,
      resolverId: dev.id,
      description: 'Need final operations workbook to validate optional import columns.',
      category: 'DEPENDENCY',
      status: 'OPEN',
      severity: 'MEDIUM',
    },
  });

  await prisma.attachment.create({
    data: {
      companyId: acme.id,
      uploaderId: maya.id,
      projectId: analyticsProject.id,
      taskId: validatorTask.id,
      dailyProgressId: mayaProgress.id,
      fileName: 'import-validation-notes.pdf',
      storageKey: 'local/acme/import-validation-notes.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 184320,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        companyId: acme.id,
        authorId: priya.id,
        blockerId: ssoBlocker.id,
        body: 'Escalated this to the client IT contact. Please update after the callback URL is confirmed.',
      },
      {
        companyId: acme.id,
        authorId: dev.id,
        blockerId: workbookBlocker.id,
        body: 'I will request the workbook in today’s operations stand-up.',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        companyId: acme.id,
        userId: dev.id,
        type: 'BLOCKER_ESCALATION',
        title: 'SSO blocker escalated',
        body: 'Priya is now assigned as escalation owner.',
      },
      {
        companyId: acme.id,
        userId: priya.id,
        type: 'MISSING_UPDATE',
        title: '1 team member missing today’s update',
        body: 'Ishan has not submitted a daily progress update for Jul 24.',
      },
      {
        companyId: acme.id,
        userId: maya.id,
        type: 'COMMENT',
        title: 'New blocker comment',
        body: 'Dev commented on the workbook dependency blocker.',
      },
    ],
  });

  const aiConversation = await prisma.aIConversation.create({
    data: {
      companyId: acme.id,
      userId: priya.id,
      title: 'Daily blocker review',
      messages: {
        create: [
          {
            userId: priya.id,
            role: 'USER',
            content: 'Which blockers need attention today?',
          },
          {
            role: 'ASSISTANT',
            content:
              'The SSO callback mismatch is the highest-risk blocker because it affects Partner Portal delivery and is already overdue.',
            evidence: {
              projectIds: [portalProject.id],
              blockerIds: [ssoBlocker.id],
              taskIds: [ssoTask.id],
            },
            tokenCount: 94,
          },
        ],
      },
    },
  });

  await prisma.generatedReport.create({
    data: {
      companyId: acme.id,
      creatorId: priya.id,
      projectId: analyticsProject.id,
      type: 'WEEKLY',
      title: 'Engineering weekly progress summary',
      periodStart: date('2026-07-20'),
      periodEnd: date('2026-07-24'),
      filters: { department: 'Engineering', team: 'Product Delivery' },
      content: {
        metrics: { submitted: 3, blockers: 2, completedTasks: 1 },
        aiSummary:
          'Analytics import validation progressed well; Partner Portal SSO remains the key delivery risk.',
      },
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: platformAdmin.id,
        action: 'seed.platform_admin_created',
        entityType: 'User',
        entityId: platformAdmin.id,
      },
      {
        companyId: acme.id,
        actorId: priya.id,
        action: 'seed.company_sample_data_created',
        entityType: 'Company',
        entityId: acme.id,
        metadata: { aiConversationId: aiConversation.id },
      },
      {
        companyId: brightlane.id,
        actorId: lena.id,
        action: 'seed.company_sample_data_created',
        entityType: 'Company',
        entityId: brightlane.id,
      },
    ],
  });

  console.info('Seed completed:', {
    companies: 2,
    users: users.length + 1,
    projects: 4,
    tasks: tasks.length,
    dailyProgress: 3,
    blockers: 2,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
