import type {
  AuthUser,
  CreateEmployeePayload,
  DailyProgressResponse,
  LoginResponse,
  PlatformCompany,
  PlatformOverview,
  ShareReportResponse,
  WorkActivityItem,
  WorkAiConversation,
  WorkAnalytics,
  WorkBlocker,
  WorkBriefing,
  WorkNotification,
  WorkOverview,
  WorkPeople,
  WorkProject,
  WorkReport,
  WorkReportEngagement,
  WorkReportExport,
  WorkReportShare,
  WorkSettings,
  WorkSharedReport,
  WorkTask,
  WorkTaskQuery,
} from './api';

const DEMO_TOKEN_PREFIX = 'workpulse-demo-session';
const DEMO_PASSWORD = 'workpulse-dev-pass';
const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();

const users: AuthUser[] = [
  {
    id: 'user-priya',
    companyId: 'company-acme',
    email: 'priya.m@acme.example',
    name: 'Priya Menon',
    title: 'Head of Operations',
    company: { id: 'company-acme', name: 'Acme Operations', slug: 'acme' },
    roles: [{ name: 'COMPANY_ADMIN', permissions: ['WORKSPACE_MANAGE', 'REPORT_SHARE'] }],
  },
  {
    id: 'user-dev',
    companyId: 'company-acme',
    email: 'dev.p@acme.example',
    name: 'Dev Patel',
    title: 'Backend Lead',
    company: { id: 'company-acme', name: 'Acme Operations', slug: 'acme' },
    roles: [{ name: 'TEAM_LEADER', permissions: ['TASK_UPDATE', 'BLOCKER_RESOLVE'] }],
  },
  {
    id: 'user-nora',
    companyId: 'company-acme',
    email: 'nora.s@acme.example',
    name: 'Nora Shah',
    title: 'QA Analyst',
    company: { id: 'company-acme', name: 'Acme Operations', slug: 'acme' },
    roles: [{ name: 'EMPLOYEE', permissions: ['DAILY_PROGRESS_CREATE'] }],
  },
  {
    id: 'user-super',
    companyId: null,
    email: 'ayushgarg.official07@gmail.com',
    name: 'Ayush Garg',
    title: 'Platform Administrator',
    company: null,
    roles: [{ name: 'SUPER_ADMIN', permissions: ['PLATFORM_MANAGE'] }],
  },
];

let settings: WorkSettings = {
  id: 'company-acme',
  name: 'Acme Operations',
  slug: 'acme',
  status: 'ACTIVE',
  timezone: 'Asia/Kolkata',
  dailyCutoff: '18:00',
  workweekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  updatedAt: now,
};

let projects: WorkProject[] = [
  {
    id: 'project-mobile',
    name: 'Mobile checkout',
    description: 'Payment and checkout modernization for mobile customers.',
    status: 'ACTIVE',
    priority: 'HIGH',
    progress: 78,
    targetDate: '2026-09-18T00:00:00.000Z',
    owner: users[0]!,
    team: { id: 'team-product', name: 'Product Delivery' },
    counts: { tasks: 4, blockers: 1, members: 5 },
  },
  {
    id: 'project-portal',
    name: 'Partner portal',
    description: 'Self-service portal for partner onboarding and support.',
    status: 'DELAYED',
    priority: 'URGENT',
    progress: 52,
    targetDate: '2026-09-12T00:00:00.000Z',
    owner: users[1]!,
    team: { id: 'team-product', name: 'Product Delivery' },
    counts: { tasks: 5, blockers: 2, members: 6 },
  },
  {
    id: 'project-analytics',
    name: 'Analytics refresh',
    description: 'Refresh operational reporting and saved queue views.',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    progress: 68,
    targetDate: '2026-09-25T00:00:00.000Z',
    owner: users[0]!,
    team: { id: 'team-data', name: 'Data Insights' },
    counts: { tasks: 3, blockers: 0, members: 4 },
  },
];

let tasks: WorkTask[] = [
  demoTask(
    'task-import',
    'Finalize CSV import validator',
    'project-analytics',
    'user-priya',
    'IN_PROGRESS',
    'HIGH',
    72,
    '2026-09-03T00:00:00.000Z',
  ),
  demoTask(
    'task-sso',
    'Resolve staging SSO redirect',
    'project-portal',
    'user-dev',
    'BLOCKED',
    'URGENT',
    44,
    '2026-09-02T00:00:00.000Z',
  ),
  demoTask(
    'task-retry',
    'QA payment retry states',
    'project-mobile',
    'user-nora',
    'REVIEW',
    'MEDIUM',
    91,
    '2026-09-04T00:00:00.000Z',
  ),
  demoTask(
    'task-empty',
    'Design report filters empty state',
    'project-analytics',
    'user-priya',
    'NOT_STARTED',
    'LOW',
    0,
    '2026-09-11T00:00:00.000Z',
  ),
];

let blockers: WorkBlocker[] = [
  demoBlocker(
    'blocker-sso',
    'SSO provider callback mismatch',
    'project-portal',
    'task-sso',
    'user-dev',
    'HIGH',
    'ACCESS',
  ),
  demoBlocker(
    'blocker-tax',
    'Client approval pending for tax invoice format',
    'project-mobile',
    null,
    'user-priya',
    'MEDIUM',
    'APPROVAL',
  ),
  demoBlocker(
    'blocker-sandbox',
    'Sandbox account access expired',
    'project-mobile',
    'task-retry',
    'user-nora',
    'LOW',
    'ACCESS',
  ),
];

let notifications: WorkNotification[] = [
  {
    id: 'notification-report',
    type: 'REPORT_READY',
    title: 'Daily briefing ready',
    body: 'The current operations briefing is ready for review.',
    readAt: null,
    createdAt: now,
  },
  {
    id: 'notification-blocker',
    type: 'BLOCKER_ESCALATED',
    title: 'Partner portal blocker needs review',
    body: 'SSO redirect work has been blocked for more than 24 hours.',
    readAt: null,
    createdAt: now,
  },
];

let reports: WorkReport[] = [
  demoReport('report-daily', 'Daily briefing - ' + today, 'DAILY', 'project-portal'),
  demoReport('report-weekly', 'Weekly delivery risk review', 'WEEKLY', 'project-mobile'),
];

let conversations: WorkAiConversation[] = [
  {
    id: 'conversation-risk',
    title: 'Which projects are at risk?',
    createdAt: now,
    updatedAt: now,
    user: userSummary('user-priya')!,
    messages: [
      {
        id: 'message-user-risk',
        role: 'USER',
        content: 'Which projects are at risk?',
        evidence: {},
        tokenCount: 6,
        createdAt: now,
        user: userSummary('user-priya'),
      },
      {
        id: 'message-ai-risk',
        role: 'ASSISTANT',
        content:
          'Partner portal is the highest risk because it is delayed, urgent, and has an active SSO blocker. Mobile checkout should stay on the watch list until sandbox access is restored.',
        evidence: {
          projectIds: ['project-portal', 'project-mobile'],
          generatedFrom: 'demo_snapshot',
        },
        tokenCount: 36,
        createdAt: now,
        user: null,
      },
    ],
  },
];

export function isDemoAccessToken(accessToken: string) {
  return accessToken.startsWith(`${DEMO_TOKEN_PREFIX}:`);
}

export function getDemoLogin(email: string, password: string): LoginResponse | null {
  if (password !== DEMO_PASSWORD) return null;

  const user = users.find((item) => item.email === email.toLowerCase());
  if (!user) return null;

  return {
    accessToken: `${DEMO_TOKEN_PREFIX}:${user.id}`,
    tokenType: 'Bearer',
    user,
  };
}

export async function getDemoResponse<T>(
  path: string,
  options: RequestInit & { accessToken?: string },
): Promise<T> {
  const url = new URL(path, 'http://workpulse.local');
  const method = (options.method ?? 'GET').toUpperCase();
  const body = parseBody(options.body);

  if (url.pathname === '/auth/me') return currentDemoUser(options.accessToken) as T;
  if (url.pathname === '/work/overview') return workOverview() as T;
  if (url.pathname === '/work/analytics') return workAnalytics() as T;
  if (url.pathname === '/work/activity') return activity() as T;
  if (url.pathname === '/work/briefing' && method === 'GET') return briefing() as T;
  if (url.pathname === '/work/briefing/report' && method === 'POST')
    return addReport('Daily briefing - ' + today, 'DAILY') as T;
  if (url.pathname === '/work/settings' && method === 'GET') return settings as T;
  if (url.pathname === '/work/settings' && method === 'PATCH') return updateSettings(body) as T;
  if (url.pathname === '/work/projects') return projects as T;
  if (url.pathname === '/work/tasks' && method === 'GET') return filterTasks(url.searchParams) as T;
  if (url.pathname === '/work/tasks' && method === 'POST') return createTask(body) as T;
  if (url.pathname.startsWith('/work/tasks/') && method === 'PATCH')
    return updateTask(url.pathname.split('/').at(-1), body) as T;
  if (url.pathname === '/work/people' && method === 'GET') return people() as T;
  if (url.pathname === '/work/people' && method === 'POST') return createEmployee(body) as T;
  if (url.pathname === '/work/blockers') return blockers as T;
  if (url.pathname.startsWith('/work/blockers/') && method === 'PATCH')
    return resolveBlocker(url.pathname.split('/').at(-2)) as T;
  if (url.pathname === '/work/notifications') return notifications as T;
  if (url.pathname === '/work/notifications/read-all' && method === 'PATCH')
    return markAllRead() as T;
  if (url.pathname.startsWith('/work/notifications/') && method === 'PATCH')
    return markRead(url.pathname.split('/').at(-2)) as T;
  if (url.pathname === '/work/reports' && method === 'GET') return reports as T;
  if (url.pathname === '/work/reports' && method === 'POST')
    return addReport(
      stringValue(body.title, 'Custom report'),
      stringValue(body.type, 'CUSTOM'),
    ) as T;
  if (url.pathname === '/work/reports/shared-with-me') return sharedReports() as T;
  if (url.pathname === '/work/reports/engagement') return reportEngagement() as T;
  if (url.pathname.endsWith('/export')) return reportExport(url.pathname.split('/').at(-2)) as T;
  if (url.pathname.endsWith('/shares') && method === 'GET')
    return reportShares(url.pathname.split('/').at(-2)) as T;
  if (url.pathname.endsWith('/share') && method === 'POST')
    return shareReport(url.pathname.split('/').at(-2), body) as T;
  if (url.pathname.endsWith('/viewed') && method === 'POST')
    return viewed(url.pathname.split('/').at(-2)) as T;
  if (url.pathname.endsWith('/feedback') && method === 'POST')
    return feedback(url.pathname.split('/').at(-2), body) as T;
  if (url.pathname === '/work/ai-conversations' && method === 'GET') return conversations as T;
  if (url.pathname === '/work/ai-conversations/ask' && method === 'POST') return askAi(body) as T;
  if (url.pathname === '/work/daily-progress' && method === 'POST') return dailyProgress(body) as T;
  if (url.pathname === '/platform/overview') return platformOverview() as T;
  if (url.pathname === '/platform/companies' && method === 'POST')
    return createPlatformCompany(body) as T;
  if (
    url.pathname.startsWith('/platform/companies/') &&
    url.pathname.endsWith('/admins') &&
    method === 'POST'
  )
    return createPlatformCompanyAdmin(url.pathname.split('/').at(-2), body) as T;
  if (url.pathname.startsWith('/platform/companies/') && method === 'PATCH')
    return platformCompany(body) as T;

  throw new Error(`Demo route is not implemented for ${method} ${url.pathname}.`);
}

function currentDemoUser(accessToken: string | undefined) {
  const userId = accessToken?.startsWith(`${DEMO_TOKEN_PREFIX}:`)
    ? accessToken.slice(`${DEMO_TOKEN_PREFIX}:`.length)
    : undefined;

  return users.find((user) => user.id === userId) ?? users[0]!;
}

function demoTask(
  id: string,
  title: string,
  projectId: string,
  assigneeId: string,
  status: string,
  priority: string,
  progress: number,
  dueDate: string,
): WorkTask {
  return {
    id,
    title,
    description: `${title} for the current delivery cycle.`,
    status,
    priority,
    dueDate,
    progress,
    estimatedHours: 8,
    actualHours: progress > 0 ? 4 : null,
    project: projectSummary(projectId)!,
    assignee: userSummary(assigneeId),
    reporter: userSummary('user-priya'),
  };
}

function demoBlocker(
  id: string,
  description: string,
  projectId: string,
  taskId: string | null,
  employeeId: string,
  severity: string,
  category: string,
): WorkBlocker {
  return {
    id,
    description,
    category,
    status: 'OPEN',
    severity,
    resolution: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
    ageHours: severity === 'HIGH' ? 76 : 8,
    employee: userSummary(employeeId)!,
    resolver: null,
    project: projectSummary(projectId)!,
    task: taskId ? taskSummary(taskId) : null,
    counts: { comments: 2, attachments: severity === 'LOW' ? 0 : 1 },
  };
}

function demoReport(id: string, title: string, type: string, projectId: string | null): WorkReport {
  const project = projectId ? projectSummary(projectId) : null;

  return {
    id,
    type,
    title,
    periodStart: today,
    periodEnd: today,
    filters: projectId ? { projectId } : {},
    content: {
      aiSummary: `${title} highlights ${blockers.filter((item) => item.status !== 'RESOLVED').length} open blockers and ${tasks.filter((item) => item.status === 'COMPLETED').length} completed tasks.`,
      metrics: workOverview().metrics,
      topBlockers: blockers.slice(0, 2),
      recentProgress: workOverview().recentProgress,
    },
    fileKey: null,
    createdAt: now,
    creator: userSummary('user-priya'),
    project,
  };
}

function workOverview(): WorkOverview {
  return {
    metrics: {
      activeProjects: projects.filter((item) => item.status === 'ACTIVE').length,
      delayedProjects: projects.filter((item) => item.status === 'DELAYED').length,
      openBlockers: blockers.filter((item) => item.status !== 'RESOLVED').length,
      overdueTasks: tasks.filter((item) => isOverdue(item)).length,
    },
    recentProgress: tasks.slice(0, 3).map((task) => ({
      id: `progress-${task.id}`,
      workDate: today,
      workCompleted: `${task.title} moved to ${task.progress}% completion.`,
      status: task.status,
      progressPercent: task.progress,
      timeSpentHours: task.actualHours ?? 2,
      user: task.assignee ?? userSummary('user-priya')!,
      project: { id: task.project.id, name: task.project.name },
      task: { id: task.id, title: task.title },
    })),
  };
}

function workAnalytics(): WorkAnalytics {
  const complete = tasks.filter((item) => item.status === 'COMPLETED').length;
  const openBlockers = blockers.filter((item) => item.status !== 'RESOLVED');

  return {
    metrics: {
      activeEmployees: 3,
      submittedToday: 3,
      submissionRate: 100,
      totalTasks: tasks.length,
      completedTasks: complete,
      completionRate: Math.round((complete / Math.max(tasks.length, 1)) * 100),
      overdueTasks: tasks.filter((item) => isOverdue(item)).length,
      openBlockers: openBlockers.length,
      criticalBlockers: openBlockers.filter((item) => item.severity === 'CRITICAL').length,
      highRiskProjects: projects.filter((item) => item.status === 'DELAYED').length,
    },
    trend: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => ({
      day,
      date: today,
      submitted: index < 2 ? 1 : 3,
      completed: index % 3,
      blockers: index > 3 ? openBlockers.length : 1,
      averageProgress: 58 + index * 4,
    })),
    taskStatus: tasks.reduce<Record<string, number>>((counts, task) => {
      counts[task.status] = (counts[task.status] ?? 0) + 1;
      return counts;
    }, {}),
    projectHealth: projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      healthScore: Math.max(20, project.progress - project.counts.blockers * 12),
      targetDate: project.targetDate,
      counts: {
        tasks: project.counts.tasks,
        completedTasks: tasks.filter(
          (task) => task.project.id === project.id && task.status === 'COMPLETED',
        ).length,
        openBlockers: blockers.filter(
          (blocker) => blocker.project.id === project.id && blocker.status !== 'RESOLVED',
        ).length,
        overdueTasks: tasks.filter((task) => task.project.id === project.id && isOverdue(task))
          .length,
      },
    })),
    workload: users
      .filter((user) => user.companyId)
      .map((user) => ({
        id: user.id,
        name: user.name,
        title: user.title,
        activeTasks: tasks.filter(
          (task) => task.assignee?.id === user.id && task.status !== 'COMPLETED',
        ).length,
        overdueTasks: tasks.filter((task) => task.assignee?.id === user.id && isOverdue(task))
          .length,
        openBlockers: blockers.filter(
          (blocker) => blocker.employee.id === user.id && blocker.status !== 'RESOLVED',
        ).length,
        submittedToday: true,
        pressureScore: 40,
      })),
    risks: openBlockers.map((blocker) => ({
      id: blocker.id,
      title: blocker.description,
      severity: blocker.severity,
      status: blocker.status,
      ageHours: blocker.ageHours,
      owner: blocker.employee.name,
      project: blocker.project.name,
      task: blocker.task?.title ?? null,
    })),
    recommendations: [
      {
        title: 'Escalate the SSO blocker',
        body: 'Partner portal remains delayed until callback access is fixed.',
        tone: 'danger',
      },
      {
        title: 'Keep daily coverage high',
        body: 'All active employees have a current update in the demo workspace.',
        tone: 'good',
      },
      {
        title: 'Review overdue work',
        body: 'One urgent task is overdue and should be reassigned or unblocked today.',
        tone: 'warning',
      },
    ],
  };
}

function people(): WorkPeople {
  const companyUsers = users.filter((user) => user.companyId);

  return {
    summary: {
      employees: companyUsers.length,
      activeEmployees: companyUsers.length,
      submittedToday: companyUsers.length,
      openBlockers: blockers.length,
    },
    employees: companyUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      title: user.title,
      isActive: true,
      lastLoginAt: now,
      roles: user.roles.map((role) => role.name),
      departments: [{ id: 'dept-product', name: 'Product' }],
      teams: [
        {
          id: 'team-product',
          name: 'Product Delivery',
          leaderId: 'user-dev',
          department: { id: 'dept-product', name: 'Product' },
        },
      ],
      dailyUpdate: { status: 'IN_PROGRESS', progressPercent: 74, submittedAt: now },
      workload: {
        activeTasks: tasks.filter(
          (task) => task.assignee?.id === user.id && task.status !== 'COMPLETED',
        ).length,
        overdueTasks: tasks.filter((task) => task.assignee?.id === user.id && isOverdue(task))
          .length,
        openBlockers: blockers.filter(
          (blocker) => blocker.employee.id === user.id && blocker.status !== 'RESOLVED',
        ).length,
      },
    })),
    departments: [
      {
        id: 'dept-product',
        name: 'Product',
        description: 'Delivery and operations',
        counts: { members: companyUsers.length, teams: 1, projects: 3 },
      },
    ],
    teams: [
      {
        id: 'team-product',
        name: 'Product Delivery',
        description: 'Cross-functional delivery squad',
        leader: userSummary('user-dev'),
        department: { id: 'dept-product', name: 'Product' },
        counts: { members: companyUsers.length, projects: 3 },
      },
    ],
  };
}

function createEmployee(body: Record<string, unknown>): WorkPeople {
  const payload = body as CreateEmployeePayload;
  const email = stringValue(payload.email, `employee-${Date.now()}@acme.example`).toLowerCase();
  const allowedRoles = ['COMPANY_ADMIN', 'TEAM_LEADER', 'EMPLOYEE'];
  const role = allowedRoles.includes(String(payload.role)) ? String(payload.role) : 'EMPLOYEE';

  if (!users.some((user) => user.email.toLowerCase() === email)) {
    users.push({
      id: `user-${Date.now()}`,
      companyId: 'company-acme',
      email,
      name: stringValue(payload.name, 'New employee'),
      title: stringValue(payload.title, '') || null,
      company: { id: 'company-acme', name: 'Acme Operations', slug: 'acme' },
      roles: [{ name: role, permissions: [] }],
    });
  }

  return people();
}

function briefing(): WorkBriefing {
  const overview = workOverview();

  return {
    date: today,
    company: {
      id: settings.id,
      name: settings.name,
      timezone: settings.timezone,
      dailyCutoff: settings.dailyCutoff,
    },
    headline: `${overview.metrics.openBlockers} blockers need attention across ${overview.metrics.activeProjects} active projects.`,
    metrics: {
      activeEmployees: 3,
      submittedToday: 3,
      submissionRate: 100,
      openBlockers: overview.metrics.openBlockers,
      criticalBlockers: 0,
      overdueTasks: overview.metrics.overdueTasks,
      delayedProjects: overview.metrics.delayedProjects,
      unreadNotifications: notifications.filter((item) => !item.readAt).length,
    },
    priorities: workAnalytics().recommendations.map((item, index) => ({
      id: `priority-${index}`,
      type: 'RECOMMENDATION',
      title: item.title,
      body: item.body,
      tone: item.tone,
    })),
    activity: activity()
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        action: item.action,
        createdAt: item.createdAt,
        actor: item.actor,
      })),
    generatedFrom: 'demo_workspace',
  };
}

function activity(): WorkActivityItem[] {
  return [
    {
      id: 'activity-task',
      type: 'AUDIT',
      action: 'TASK_UPDATED',
      title: 'Task moved forward',
      body: 'QA payment retry states moved into review.',
      entityType: 'Task',
      entityId: 'task-retry',
      createdAt: now,
      actor: userSummary('user-nora'),
      metadata: { status: 'REVIEW' },
    },
    {
      id: 'activity-blocker',
      type: 'COMMENT',
      action: 'COMMENT_ADDED',
      title: 'Blocker note added',
      body: 'SSO callback mismatch needs provider-side confirmation.',
      entityType: 'Blocker',
      entityId: 'blocker-sso',
      createdAt: now,
      actor: userSummary('user-dev'),
      metadata: { severity: 'HIGH' },
    },
  ];
}

function filterTasks(params: URLSearchParams): WorkTask[] {
  const query: WorkTaskQuery = Object.fromEntries(params.entries());
  const limit = Number(params.get('limit') ?? 25);

  return tasks
    .filter((task) => !query.status || task.status === query.status)
    .filter((task) => !query.priority || task.priority === query.priority)
    .filter((task) => !query.projectId || task.project.id === query.projectId)
    .filter((task) => !query.assigneeId || task.assignee?.id === query.assigneeId)
    .slice(0, Number.isFinite(limit) ? limit : 25);
}

function createTask(body: Record<string, unknown>): WorkTask {
  const task = demoTask(
    `task-${Date.now()}`,
    stringValue(body.title, 'New task'),
    stringValue(body.projectId, projects[0]!.id),
    stringValue(body.assigneeId, 'user-priya'),
    stringValue(body.status, 'NOT_STARTED'),
    stringValue(body.priority, 'MEDIUM'),
    0,
    stringValue(body.dueDate, today) + 'T00:00:00.000Z',
  );
  tasks = [task, ...tasks];
  return task;
}

function updateTask(taskId: string | undefined, body: Record<string, unknown>): WorkTask {
  const task = tasks.find((item) => item.id === taskId) ?? tasks[0]!;
  const updated = {
    ...task,
    status: stringValue(body.status, task.status),
    progress: typeof body.progress === 'number' ? body.progress : task.progress,
    actualHours: typeof body.actualHours === 'number' ? body.actualHours : task.actualHours,
  };
  tasks = tasks.map((item) => (item.id === updated.id ? updated : item));
  return updated;
}

function resolveBlocker(blockerId: string | undefined): WorkBlocker {
  const blocker = blockers.find((item) => item.id === blockerId) ?? blockers[0]!;
  const resolved = {
    ...blocker,
    status: 'RESOLVED',
    resolution: 'Resolved in demo mode.',
    resolvedAt: now,
    resolver: userSummary('user-priya'),
    updatedAt: now,
  };
  blockers = blockers.map((item) => (item.id === resolved.id ? resolved : item));
  return resolved;
}

function markRead(notificationId: string | undefined): WorkNotification {
  const notification =
    notifications.find((item) => item.id === notificationId) ?? notifications[0]!;
  const updated = { ...notification, readAt: notification.readAt ?? now };
  notifications = notifications.map((item) => (item.id === updated.id ? updated : item));
  return updated;
}

function markAllRead() {
  notifications = notifications.map((item) => ({ ...item, readAt: item.readAt ?? now }));
  return { updatedCount: notifications.length, readAt: now };
}

function updateSettings(body: Record<string, unknown>): WorkSettings {
  settings = {
    ...settings,
    name: stringValue(body.name, settings.name),
    timezone: stringValue(body.timezone, settings.timezone),
    dailyCutoff: stringValue(body.dailyCutoff, settings.dailyCutoff),
    workweekDays: Array.isArray(body.workweekDays)
      ? body.workweekDays.filter((day): day is string => typeof day === 'string')
      : settings.workweekDays,
    updatedAt: now,
  };
  return settings;
}

function addReport(title: string, type: string): WorkReport {
  const report = demoReport(`report-${Date.now()}`, title, type, null);
  reports = [report, ...reports];
  return report;
}

function sharedReports(): WorkSharedReport[] {
  return reports.slice(0, 1).map((report) => ({
    id: `share-${report.id}`,
    reportId: report.id,
    sharedAt: now,
    message: 'Please review before stand-up.',
    actor: userSummary('user-priya'),
    viewedAt: null,
    feedback: null,
    feedbackAt: null,
    report,
  }));
}

function reportEngagement(): WorkReportEngagement {
  return {
    metrics: {
      reports: reports.length,
      sharedReports: 1,
      shareEvents: 1,
      recipients: 2,
      viewed: 1,
      feedback: 1,
      viewRate: 50,
      feedbackRate: 50,
    },
    recommendations: [
      {
        title: 'Follow up on unread reports',
        body: 'One recipient has not opened the latest briefing.',
        tone: 'warning',
        reportId: reports[0]?.id ?? null,
      },
    ],
    reports: reports.map((report) => ({
      report,
      shareEvents: 1,
      recipientCount: 2,
      viewedCount: 1,
      feedbackCount: 1,
      viewRate: 50,
      feedbackRate: 50,
      latestSharedAt: now,
      latestViewedAt: now,
      latestFeedbackAt: now,
    })),
  };
}

function reportExport(reportId: string | undefined): WorkReportExport {
  const report = reports.find((item) => item.id === reportId) ?? reports[0]!;
  const markdown = `# ${report.title}\n\n${String(report.content && typeof report.content === 'object' && !Array.isArray(report.content) ? (report.content.aiSummary ?? 'Demo report export.') : 'Demo report export.')}\n`;
  return {
    reportId: report.id,
    title: report.title,
    type: report.type,
    filename: `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
    mimeType: 'text/markdown',
    markdown,
    text: markdown.replace(/^#\s+/gm, '').trim(),
    generatedAt: now,
  };
}

function reportShares(reportId: string | undefined): WorkReportShare[] {
  return [
    {
      id: `share-${reportId ?? 'report'}`,
      reportId: reportId ?? reports[0]!.id,
      sharedAt: now,
      createdAt: now,
      actor: userSummary('user-priya'),
      message: 'Please review the latest risk notes.',
      recipientCount: 2,
      recipients: [
        {
          ...userSummary('user-dev')!,
          isActive: true,
          viewedAt: now,
          feedback: 'Looks accurate.',
          feedbackAt: now,
        },
        {
          ...userSummary('user-nora')!,
          isActive: true,
          viewedAt: null,
          feedback: null,
          feedbackAt: null,
        },
      ],
      followUp: {
        status: 'PENDING_REVIEW',
        pendingReviewCount: 1,
        pendingFeedbackCount: 1,
        pendingReviewNames: ['Nora Shah'],
        pendingFeedbackNames: ['Nora Shah'],
        draft: 'Hi Nora, can you review the latest report and add feedback before stand-up?',
      },
    },
  ];
}

function shareReport(
  reportId: string | undefined,
  body: Record<string, unknown>,
): ShareReportResponse {
  const recipientIds = Array.isArray(body.recipientIds)
    ? body.recipientIds.filter((id): id is string => typeof id === 'string')
    : [];
  const recipients = recipientIds
    .map(userSummary)
    .filter((user): user is NonNullable<ReturnType<typeof userSummary>> => Boolean(user));

  return {
    reportId: reportId ?? reports[0]!.id,
    sharedAt: now,
    sharedCount: recipients.length,
    recipients,
    notificationIds: recipients.map((recipient) => `notification-${recipient.id}`),
  };
}

function viewed(reportId: string | undefined) {
  return { reportId: reportId ?? reports[0]!.id, viewedAt: now, alreadyViewed: false };
}

function feedback(reportId: string | undefined, body: Record<string, unknown>) {
  return {
    reportId: reportId ?? reports[0]!.id,
    feedback: stringValue(body.feedback, 'Looks good.'),
    feedbackAt: now,
  };
}

function askAi(body: Record<string, unknown>): WorkAiConversation {
  const question = stringValue(body.question, 'What should we do next?');
  const conversation: WorkAiConversation = {
    id: `conversation-${Date.now()}`,
    title: question.slice(0, 48),
    createdAt: now,
    updatedAt: now,
    user: userSummary('user-priya')!,
    messages: [
      {
        id: `message-user-${Date.now()}`,
        role: 'USER',
        content: question,
        evidence: {},
        tokenCount: question.split(/\s+/).length,
        createdAt: now,
        user: userSummary('user-priya'),
      },
      {
        id: `message-ai-${Date.now()}`,
        role: 'ASSISTANT',
        content:
          'Recommended action plan:\n1. Assign Dev to close the SSO callback blocker today.\n2. Keep QA payment retry states in review until sandbox access is confirmed.\n3. Share the daily briefing with project owners before stand-up.',
        evidence: { generatedFrom: 'demo_workspace', blockerIds: blockers.map((item) => item.id) },
        tokenCount: 42,
        createdAt: now,
        user: null,
      },
    ],
  };
  conversations = [conversation, ...conversations];
  return conversation;
}

function dailyProgress(body: Record<string, unknown>): DailyProgressResponse {
  const project = projectSummary(stringValue(body.projectId, projects[0]!.id))!;
  const task = body.taskId ? taskSummary(String(body.taskId)) : null;

  return {
    id: `progress-${Date.now()}`,
    workDate: stringValue(body.workDate, today),
    workCompleted: stringValue(body.workCompleted, 'Demo progress submitted.'),
    status: stringValue(body.status, 'IN_PROGRESS'),
    progressPercent: typeof body.progressPercent === 'number' ? body.progressPercent : 65,
    timeSpentHours: typeof body.timeSpentHours === 'number' ? body.timeSpentHours : 2,
    hasBlocker: Boolean(body.hasBlocker),
    project: { id: project.id, name: project.name },
    task,
    blockers: Boolean(body.hasBlocker)
      ? [
          {
            id: `blocker-${Date.now()}`,
            description: stringValue(body.blockerDescription, 'Demo blocker'),
            status: 'OPEN',
            severity: stringValue(body.blockerSeverity, 'MEDIUM'),
            category: stringValue(body.blockerCategory, 'OTHER'),
          },
        ]
      : [],
  };
}

function platformOverview(): PlatformOverview {
  const companies = [
    platformCompany({ status: 'ACTIVE' }),
    {
      ...platformCompany({ status: 'TRIAL' }),
      id: 'company-northwind',
      name: 'Northwind Labs',
      slug: 'northwind',
    },
  ];

  return {
    metrics: {
      totalCompanies: companies.length,
      activeCompanies: 1,
      trialCompanies: 1,
      suspendedCompanies: 0,
      totalUsers: 24,
      totalReports: reports.length,
      totalAiMessages: conversations.flatMap((item) => item.messages).length,
    },
    companies,
    recentAuditLogs: activity().map((item) => ({
      ...item,
      company: { id: settings.id, name: settings.name, slug: settings.slug },
    })),
  };
}

function platformCompany(body: Record<string, unknown>): PlatformCompany {
  return {
    id: settings.id,
    name: settings.name,
    slug: settings.slug,
    status: stringValue(body.status, settings.status),
    timezone: settings.timezone,
    dailyCutoff: settings.dailyCutoff,
    createdAt: now,
    updatedAt: now,
    counts: {
      users: 3,
      projects: projects.length,
      tasks: tasks.length,
      blockers: blockers.length,
      reports: reports.length,
      aiConversations: conversations.length,
    },
  };
}

function createPlatformCompany(body: Record<string, unknown>): PlatformCompany {
  settings = {
    ...settings,
    id: `company-${Date.now()}`,
    name: stringValue(body.name, 'New company'),
    slug: stringValue(
      body.slug,
      stringValue(body.name, 'new-company')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
    ),
    status: 'TRIAL',
    timezone: stringValue(body.timezone, 'UTC'),
    dailyCutoff: stringValue(body.dailyCutoff, '18:00'),
    updatedAt: now,
  };

  return platformCompany({ status: settings.status });
}

function createPlatformCompanyAdmin(
  companyId: string | undefined,
  body: Record<string, unknown>,
): AuthUser {
  const user: AuthUser = {
    id: `user-admin-${Date.now()}`,
    companyId: companyId ?? settings.id,
    email: stringValue(body.email, `admin-${Date.now()}@example.com`).toLowerCase(),
    name: stringValue(body.name, 'Company Admin'),
    title: stringValue(body.title, 'Company Administrator'),
    company: { id: companyId ?? settings.id, name: settings.name, slug: settings.slug },
    roles: [{ name: 'COMPANY_ADMIN', permissions: ['company:*'] }],
  };
  users.push(user);
  return user;
}

function projectSummary(id: string) {
  const project = projects.find((item) => item.id === id);
  return project ? { id: project.id, name: project.name, status: project.status } : null;
}

function taskSummary(id: string) {
  const task = tasks.find((item) => item.id === id);
  return task ? { id: task.id, title: task.title, status: task.status } : null;
}

function userSummary(id: string) {
  const user = users.find((item) => item.id === id);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== 'string') return {};

  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function isOverdue(task: WorkTask) {
  return Boolean(task.dueDate && task.dueDate.slice(0, 10) < today && task.status !== 'COMPLETED');
}
