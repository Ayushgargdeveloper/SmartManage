import { getDemoLogin, getDemoResponse, isDemoAccessToken } from './demo-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const DEMO_FALLBACK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === 'true';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type AuthUser = {
  id: string;
  companyId: string | null;
  email: string;
  name: string;
  title: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
  roles: {
    name: string;
    permissions: string[];
  }[];
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
};

export type WorkOverview = {
  metrics: {
    activeProjects: number;
    delayedProjects: number;
    openBlockers: number;
    overdueTasks: number;
  };
  recentProgress: {
    id: string;
    workDate: string;
    workCompleted: string;
    status: string;
    progressPercent: number;
    timeSpentHours: number;
    user: { id: string; name: string; email: string };
    project: { id: string; name: string };
    task: { id: string; title: string } | null;
  }[];
};

export type WorkAnalytics = {
  metrics: {
    activeEmployees: number;
    submittedToday: number;
    submissionRate: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
    openBlockers: number;
    criticalBlockers: number;
    highRiskProjects: number;
  };
  trend: {
    day: string;
    date: string;
    submitted: number;
    completed: number;
    blockers: number;
    averageProgress: number;
  }[];
  taskStatus: Record<string, number>;
  projectHealth: {
    id: string;
    name: string;
    status: string;
    priority: string;
    progress: number;
    healthScore: number;
    targetDate: string | null;
    counts: {
      tasks: number;
      completedTasks: number;
      openBlockers: number;
      overdueTasks: number;
    };
  }[];
  workload: {
    id: string;
    name: string;
    title: string | null;
    activeTasks: number;
    overdueTasks: number;
    openBlockers: number;
    submittedToday: boolean;
    pressureScore: number;
  }[];
  risks: {
    id: string;
    title: string;
    severity: string;
    status: string;
    ageHours: number;
    owner: string;
    project: string;
    task: string | null;
  }[];
  recommendations: {
    title: string;
    body: string;
    tone: string;
  }[];
};

export type WorkActivityItem = {
  id: string;
  type: string;
  action: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  metadata: JsonValue;
};

export type WorkBriefing = {
  date: string;
  company: {
    id: string;
    name: string;
    timezone: string;
    dailyCutoff: string;
  };
  headline: string;
  metrics: {
    activeEmployees: number;
    submittedToday: number;
    submissionRate: number;
    openBlockers: number;
    criticalBlockers: number;
    overdueTasks: number;
    delayedProjects: number;
    unreadNotifications: number;
  };
  priorities: {
    id: string;
    type: string;
    title: string;
    body: string;
    tone: string;
  }[];
  activity: {
    id: string;
    title: string;
    body: string;
    action: string;
    createdAt: string;
    actor: { id: string; name: string; email: string } | null;
  }[];
  generatedFrom: string;
};

export type WorkSettings = {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  dailyCutoff: string;
  workweekDays: string[];
  updatedAt: string;
};

export type PlatformOverview = {
  metrics: {
    totalCompanies: number;
    activeCompanies: number;
    trialCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    totalReports: number;
    totalAiMessages: number;
  };
  companies: {
    id: string;
    name: string;
    slug: string;
    status: string;
    timezone: string;
    dailyCutoff: string;
    createdAt: string;
    updatedAt: string;
    counts: {
      users: number;
      projects: number;
      tasks: number;
      blockers: number;
      reports: number;
      aiConversations: number;
    };
  }[];
  recentAuditLogs: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: JsonValue;
    createdAt: string;
    company: { id: string; name: string; slug: string } | null;
    actor: { id: string; name: string; email: string } | null;
  }[];
};

export type PlatformCompany = PlatformOverview['companies'][number];

export type UpdatePlatformCompanyStatusPayload = {
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED';
};

export type CreatePlatformCompanyPayload = {
  name: string;
  slug?: string;
  timezone?: string;
  dailyCutoff?: string;
};

export type CreateCompanyAdminPayload = {
  name: string;
  email: string;
  title?: string;
  temporaryPassword: string;
};

export type UpdateWorkSettingsPayload = {
  name?: string;
  timezone?: string;
  dailyCutoff?: string;
  workweekDays?: string[];
};

export type WorkProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  targetDate: string | null;
  owner: { id: string; name: string; email: string } | null;
  team: { id: string; name: string } | null;
  counts: {
    tasks: number;
    blockers: number;
    members: number;
  };
};

export type WorkTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  progress: number;
  estimatedHours: number | null;
  actualHours: number | null;
  project: { id: string; name: string; status: string };
  assignee: { id: string; name: string; email: string } | null;
  reporter: { id: string; name: string; email: string } | null;
};

export type CreateTaskPayload = {
  projectId: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD' | 'REVIEW';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
};

export type UpdateTaskPayload = {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD' | 'REVIEW';
  progress?: number;
  actualHours?: number;
  note?: string;
};

export type WorkTaskQuery = {
  status?: CreateTaskPayload['status'];
  priority?: CreateTaskPayload['priority'];
  projectId?: string;
  assigneeId?: string;
  limit?: number;
};

export type WorkPeople = {
  summary: {
    employees: number;
    activeEmployees: number;
    submittedToday: number;
    openBlockers: number;
  };
  employees: {
    id: string;
    email: string;
    name: string;
    title: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    roles: string[];
    departments: { id: string; name: string }[];
    teams: {
      id: string;
      name: string;
      leaderId: string | null;
      department: { id: string; name: string } | null;
    }[];
    dailyUpdate: {
      status: string;
      progressPercent: number;
      submittedAt: string;
    } | null;
    workload: {
      activeTasks: number;
      overdueTasks: number;
      openBlockers: number;
    };
  }[];
  departments: {
    id: string;
    name: string;
    description: string | null;
    counts: {
      members: number;
      teams: number;
      projects: number;
    };
  }[];
  teams: {
    id: string;
    name: string;
    description: string | null;
    leader: { id: string; name: string; email: string } | null;
    department: { id: string; name: string } | null;
    counts: {
      members: number;
      projects: number;
    };
  }[];
};

export type CreateEmployeePayload = {
  name: string;
  email: string;
  title?: string;
  role?: 'COMPANY_ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';
  temporaryPassword: string;
  departmentId?: string;
  teamId?: string;
};

export type WorkBlocker = {
  id: string;
  description: string;
  category: string;
  status: string;
  severity: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ageHours: number;
  employee: { id: string; name: string; email: string };
  resolver: { id: string; name: string; email: string } | null;
  project: { id: string; name: string; status: string };
  task: { id: string; title: string; status: string } | null;
  counts: {
    comments: number;
    attachments: number;
  };
};

export type WorkNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type MarkNotificationsReadResponse = {
  updatedCount: number;
  readAt: string;
};

export type WorkReport = {
  id: string;
  type: string;
  title: string;
  periodStart: string | null;
  periodEnd: string | null;
  filters: JsonValue;
  content: JsonValue;
  fileKey: string | null;
  createdAt: string;
  creator: { id: string; name: string; email: string } | null;
  project: { id: string; name: string; status: string } | null;
};

export type CreateReportPayload = {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'EMPLOYEE' | 'TEAM' | 'PROJECT' | 'DEPARTMENT' | 'CUSTOM';
  title: string;
  projectId?: string;
  periodStart?: string;
  periodEnd?: string;
};

export type WorkReportExport = {
  reportId: string;
  title: string;
  type: string;
  filename: string;
  mimeType: string;
  markdown: string;
  text: string;
  generatedAt: string;
};

export type ShareReportPayload = {
  recipientIds: string[];
  message?: string;
};

export type ShareReportResponse = {
  reportId: string;
  sharedAt: string;
  sharedCount: number;
  recipients: { id: string; name: string; email: string }[];
  notificationIds: string[];
};

export type WorkReportShare = {
  id: string;
  reportId: string;
  sharedAt: string;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  message: string | null;
  recipientCount: number;
  recipients: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    viewedAt: string | null;
    feedback: string | null;
    feedbackAt: string | null;
  }[];
  followUp: {
    status: string;
    pendingReviewCount: number;
    pendingFeedbackCount: number;
    pendingReviewNames: string[];
    pendingFeedbackNames: string[];
    draft: string;
  };
};

export type WorkSharedReport = {
  id: string;
  reportId: string;
  sharedAt: string;
  message: string | null;
  actor: { id: string; name: string; email: string } | null;
  viewedAt: string | null;
  feedback: string | null;
  feedbackAt: string | null;
  report: WorkReport;
};

export type WorkReportViewedResponse = {
  reportId: string;
  viewedAt: string;
  alreadyViewed: boolean;
};

export type WorkReportFeedbackResponse = {
  reportId: string;
  feedback: string;
  feedbackAt: string;
};

export type WorkReportEngagement = {
  metrics: {
    reports: number;
    sharedReports: number;
    shareEvents: number;
    recipients: number;
    viewed: number;
    feedback: number;
    viewRate: number;
    feedbackRate: number;
  };
  recommendations: {
    title: string;
    body: string;
    tone: string;
    reportId: string | null;
  }[];
  reports: {
    report: WorkReport;
    shareEvents: number;
    recipientCount: number;
    viewedCount: number;
    feedbackCount: number;
    viewRate: number;
    feedbackRate: number;
    latestSharedAt: string | null;
    latestViewedAt: string | null;
    latestFeedbackAt: string | null;
  }[];
};

export type WorkAiConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  messages: {
    id: string;
    role: string;
    content: string;
    evidence: JsonValue;
    tokenCount: number | null;
    createdAt: string;
    user: { id: string; name: string; email: string } | null;
  }[];
};

export type AskAiPayload = {
  question: string;
  conversationId?: string;
  intent?: 'QUESTION' | 'ACTION_PLAN';
};

export type CreateDailyProgressPayload = {
  projectId: string;
  taskId?: string;
  workDate: string;
  workCompleted: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD';
  progressPercent: number;
  timeSpentHours: number;
  tomorrowPlan?: string;
  externalLinks?: string[];
  hasBlocker?: boolean;
  blockerDescription?: string;
  blockerCategory?:
    'TECHNICAL' | 'DEPENDENCY' | 'CLIENT' | 'APPROVAL' | 'RESOURCE' | 'ACCESS' | 'OTHER';
  blockerSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

export type DailyProgressResponse = {
  id: string;
  workDate: string;
  workCompleted: string;
  status: string;
  progressPercent: number;
  timeSpentHours: number;
  hasBlocker: boolean;
  project: { id: string; name: string };
  task: { id: string; title: string } | null;
  blockers: {
    id: string;
    description: string;
    status: string;
    severity: string;
    category: string;
  }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    return await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (!DEMO_FALLBACK_ENABLED) {
      throw error;
    }

    const demoLogin = getDemoLogin(email, password);
    if (demoLogin) return demoLogin;

    if (!(error instanceof ApiError) || error.status === 401 || error.status === 403) {
      throw new ApiError('Incorrect email or password. Please try again.', 401);
    }

    throw error;
  }
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { accessToken });
}

export async function getPlatformOverview(accessToken: string): Promise<PlatformOverview> {
  return apiRequest<PlatformOverview>('/platform/overview', { accessToken });
}

export async function createPlatformCompany(
  accessToken: string,
  payload: CreatePlatformCompanyPayload,
): Promise<PlatformCompany> {
  return apiRequest<PlatformCompany>('/platform/companies', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function updatePlatformCompanyStatus(
  accessToken: string,
  companyId: string,
  payload: UpdatePlatformCompanyStatusPayload,
): Promise<PlatformCompany> {
  return apiRequest<PlatformCompany>(`/platform/companies/${companyId}/status`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function createPlatformCompanyAdmin(
  accessToken: string,
  companyId: string,
  payload: CreateCompanyAdminPayload,
): Promise<AuthUser> {
  return apiRequest<AuthUser>(`/platform/companies/${companyId}/admins`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getWorkOverview(accessToken: string): Promise<WorkOverview> {
  return apiRequest<WorkOverview>('/work/overview', { accessToken });
}

export async function getWorkAnalytics(accessToken: string): Promise<WorkAnalytics> {
  return apiRequest<WorkAnalytics>('/work/analytics', { accessToken });
}

export async function getWorkActivity(accessToken: string): Promise<WorkActivityItem[]> {
  return apiRequest<WorkActivityItem[]>('/work/activity', { accessToken });
}

export async function getWorkBriefing(accessToken: string): Promise<WorkBriefing> {
  return apiRequest<WorkBriefing>('/work/briefing', { accessToken });
}

export async function createWorkBriefingReport(accessToken: string): Promise<WorkReport> {
  return apiRequest<WorkReport>('/work/briefing/report', {
    method: 'POST',
    accessToken,
  });
}

export async function getWorkSettings(accessToken: string): Promise<WorkSettings> {
  return apiRequest<WorkSettings>('/work/settings', { accessToken });
}

export async function updateWorkSettings(
  accessToken: string,
  payload: UpdateWorkSettingsPayload,
): Promise<WorkSettings> {
  return apiRequest<WorkSettings>('/work/settings', {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getWorkProjects(accessToken: string): Promise<WorkProject[]> {
  return apiRequest<WorkProject[]>('/work/projects', { accessToken });
}

export async function getWorkTasks(
  accessToken: string,
  query: WorkTaskQuery = {},
): Promise<WorkTask[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const queryString = params.toString();

  return apiRequest<WorkTask[]>(`/work/tasks${queryString ? `?${queryString}` : ''}`, {
    accessToken,
  });
}

export async function createWorkTask(
  accessToken: string,
  payload: CreateTaskPayload,
): Promise<WorkTask> {
  return apiRequest<WorkTask>('/work/tasks', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function updateWorkTask(
  accessToken: string,
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<WorkTask> {
  return apiRequest<WorkTask>(`/work/tasks/${taskId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getWorkPeople(accessToken: string): Promise<WorkPeople> {
  return apiRequest<WorkPeople>('/work/people', { accessToken });
}

export async function createWorkEmployee(
  accessToken: string,
  payload: CreateEmployeePayload,
): Promise<WorkPeople> {
  return apiRequest<WorkPeople>('/work/people', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getWorkBlockers(accessToken: string): Promise<WorkBlocker[]> {
  return apiRequest<WorkBlocker[]>('/work/blockers', { accessToken });
}

export async function resolveWorkBlocker(
  accessToken: string,
  blockerId: string,
  resolution: string,
): Promise<WorkBlocker> {
  return apiRequest<WorkBlocker>(`/work/blockers/${blockerId}/resolve`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ resolution }),
  });
}

export async function getWorkNotifications(accessToken: string): Promise<WorkNotification[]> {
  return apiRequest<WorkNotification[]>('/work/notifications', { accessToken });
}

export async function markWorkNotificationRead(
  accessToken: string,
  notificationId: string,
): Promise<WorkNotification> {
  return apiRequest<WorkNotification>(`/work/notifications/${notificationId}/read`, {
    method: 'PATCH',
    accessToken,
  });
}

export async function markAllWorkNotificationsRead(
  accessToken: string,
): Promise<MarkNotificationsReadResponse> {
  return apiRequest<MarkNotificationsReadResponse>('/work/notifications/read-all', {
    method: 'PATCH',
    accessToken,
  });
}

export async function getWorkReports(accessToken: string): Promise<WorkReport[]> {
  return apiRequest<WorkReport[]>('/work/reports', { accessToken });
}

export async function getWorkSharedReports(accessToken: string): Promise<WorkSharedReport[]> {
  return apiRequest<WorkSharedReport[]>('/work/reports/shared-with-me', { accessToken });
}

export async function getWorkReportEngagement(accessToken: string): Promise<WorkReportEngagement> {
  return apiRequest<WorkReportEngagement>('/work/reports/engagement', { accessToken });
}

export async function createWorkReport(
  accessToken: string,
  payload: CreateReportPayload,
): Promise<WorkReport> {
  return apiRequest<WorkReport>('/work/reports', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function exportWorkReport(
  accessToken: string,
  reportId: string,
): Promise<WorkReportExport> {
  return apiRequest<WorkReportExport>(`/work/reports/${reportId}/export`, { accessToken });
}

export async function shareWorkReport(
  accessToken: string,
  reportId: string,
  payload: ShareReportPayload,
): Promise<ShareReportResponse> {
  return apiRequest<ShareReportResponse>(`/work/reports/${reportId}/share`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getWorkReportShares(
  accessToken: string,
  reportId: string,
): Promise<WorkReportShare[]> {
  return apiRequest<WorkReportShare[]>(`/work/reports/${reportId}/shares`, { accessToken });
}

export async function markWorkReportViewed(
  accessToken: string,
  reportId: string,
): Promise<WorkReportViewedResponse> {
  return apiRequest<WorkReportViewedResponse>(`/work/reports/${reportId}/viewed`, {
    method: 'POST',
    accessToken,
  });
}

export async function addWorkReportFeedback(
  accessToken: string,
  reportId: string,
  feedback: string,
): Promise<WorkReportFeedbackResponse> {
  return apiRequest<WorkReportFeedbackResponse>(`/work/reports/${reportId}/feedback`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ feedback }),
  });
}

export async function getWorkAiConversations(accessToken: string): Promise<WorkAiConversation[]> {
  return apiRequest<WorkAiConversation[]>('/work/ai-conversations', { accessToken });
}

export async function askWorkAi(
  accessToken: string,
  payload: AskAiPayload,
): Promise<WorkAiConversation> {
  return apiRequest<WorkAiConversation>('/work/ai-conversations/ask', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function createDailyProgress(
  accessToken: string,
  payload: CreateDailyProgressPayload,
): Promise<DailyProgressResponse> {
  return apiRequest<DailyProgressResponse>('/work/daily-progress', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  if (options.accessToken && isDemoAccessToken(options.accessToken)) {
    if (!DEMO_FALLBACK_ENABLED) {
      throw new ApiError('Demo session is not enabled for this environment.', 401);
    }

    return getDemoResponse<T>(path, options);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(payload.message)) return payload.message.join(' ');
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
