'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Copy,
  Clock,
  Command,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Loader2,
  LockKeyhole,
  Mail,
  Menu,
  MessagesSquare,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { productConfig } from '@workpulse/config';
import {
  addWorkReportFeedback,
  ApiError,
  askWorkAi,
  createDailyProgress,
  createPlatformCompany,
  createPlatformCompanyAdmin,
  createWorkEmployee,
  createWorkBriefingReport,
  createWorkReport,
  createWorkTask,
  exportWorkReport,
  getCurrentUser,
  getPlatformOverview,
  getWorkAnalytics,
  getWorkActivity,
  getWorkAiConversations,
  getWorkBriefing,
  getWorkBlockers,
  getWorkNotifications,
  getWorkOverview,
  getWorkPeople,
  getWorkProjects,
  getWorkReportEngagement,
  getWorkReportShares,
  getWorkReports,
  getWorkSharedReports,
  getWorkSettings,
  getWorkTasks,
  login,
  markAllWorkNotificationsRead,
  markWorkNotificationRead,
  markWorkReportViewed,
  resolveWorkBlocker,
  shareWorkReport,
  type AskAiPayload,
  type AuthUser,
  type CreateCompanyAdminPayload,
  type CreateEmployeePayload,
  type CreatePlatformCompanyPayload,
  type CreateReportPayload,
  type CreateTaskPayload,
  type PlatformOverview,
  type WorkActivityItem,
  type WorkAnalytics,
  type WorkBriefing,
  type WorkAiConversation,
  type WorkBlocker,
  type WorkNotification,
  type WorkOverview,
  type WorkPeople,
  type WorkProject,
  type WorkReport,
  type WorkReportEngagement,
  type WorkReportExport,
  type WorkReportShare,
  type WorkSharedReport,
  type WorkSettings,
  type WorkTask,
  type WorkTaskQuery,
  updatePlatformCompanyStatus,
  updateWorkTask,
  updateWorkSettings,
  type UpdateTaskPayload,
} from '@/lib/api';
import { roleKeyFromUser } from '@/lib/auth-rbac';
import {
  activity,
  blockers,
  employees,
  insightCards,
  kpis,
  projectHealth,
  roles,
  suggestedQuestions,
  tasks,
  trendData,
  type RoleKey,
} from '@/lib/mock-data';

const sessionStorageKey = 'workpulse-session';
const taskFilterViewsStorageKey = 'workpulse-task-filter-views';

type SessionState = {
  accessToken: string;
  user: AuthUser;
};

type SavedTaskFilterView = {
  id: string;
  name: string;
  filters: {
    status: WorkTaskQuery['status'] | '';
    priority: WorkTaskQuery['priority'] | '';
    projectId: string;
    assigneeId: string;
    limit: number;
  };
  savedAt: string;
};

const taskStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'REVIEW'];
const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function firstPageForUser(user: AuthUser) {
  const nextRole = roles.find((item) => item.key === roleKeyFromUser(user));
  return nextRole?.nav[0]?.key ?? 'dashboard';
}

export default function WorkPulsePrototype() {
  const [activePage, setActivePage] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'checking'>('idle');

  const roleKey = useMemo(() => roleKeyFromUser(session?.user), [session?.user]);
  const role = useMemo(() => roles.find((item) => item.key === roleKey) ?? roles[0]!, [roleKey]);
  const currentNavItem = role.nav.find((item) => item.key === activePage) ?? role.nav[0]!;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('workpulse-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    }

    const storedSession = window.localStorage.getItem(sessionStorageKey);
    if (!storedSession) return;

    const parsedSession = JSON.parse(storedSession) as SessionState;
    setSession(parsedSession);
    setSessionStatus('checking');
    getCurrentUser(parsedSession.accessToken)
      .then((user) => {
        const nextSession = { ...parsedSession, user };
        setSession(nextSession);
        setActivePage(firstPageForUser(user));
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
      })
      .catch(() => {
        setSession(null);
        window.localStorage.removeItem(sessionStorageKey);
      })
      .finally(() => setSessionStatus('idle'));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('workpulse-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (role.nav.some((item) => item.key === activePage)) return;

    setActivePage(role.nav[0]?.key ?? 'login');
  }, [activePage, role.nav]);

  function handleLogin(nextSession: SessionState) {
    setSession(nextSession);
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
    setActivePage(firstPageForUser(nextSession.user));
    setMobileNavOpen(false);
  }

  function handleLogout() {
    setSession(null);
    window.localStorage.removeItem(sessionStorageKey);
    setActivePage('login');
    setMobileNavOpen(false);
  }

  if (roleKey === 'auth') {
    return (
      <main className="min-h-screen bg-[#07111f] text-white">
        <AuthPrototype onLogin={handleLogin} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-sidebar transition-transform lg:static ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarOpen ? 'lg:w-72' : 'lg:w-20'}`}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <Command className="h-5 w-5" aria-hidden="true" />
              </div>
              {sidebarOpen ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{productConfig.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{role.workspace}</p>
                </div>
              ) : null}
            </div>
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="border-b p-3">
            <div className="rounded-md border bg-card p-3">
              {sidebarOpen ? (
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {session ? 'Authenticated role' : 'Authentication'}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">{role.label}</p>
                  {session?.user.company ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {session.user.company.name}
                    </p>
                  ) : null}
                </div>
              ) : (
                <ShieldBadge label={role.label} />
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {role.nav.map((item) => {
              const Icon = item.icon;
              const active = item.key === activePage;
              return (
                <button
                  key={item.key}
                  className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition ${
                    active
                      ? 'bg-secondary text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                  onClick={() => {
                    setActivePage(item.key);
                    setMobileNavOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {sidebarOpen ? <span className="truncate">{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <button
              className="hidden h-10 w-full items-center justify-center rounded-md border text-muted-foreground hover:bg-secondary lg:flex"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setSidebarOpen((value) => !value)}
            >
              {sidebarOpen ? (
                <ArrowLeftToLine className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowRightToLine className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </aside>

        {mobileNavOpen ? (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
            <button
              className="rounded-md border p-2 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">
                {role.label} / {currentNavItem.label}
              </p>
              <h1 className="truncate text-lg font-semibold">{currentNavItem.label}</h1>
            </div>
            <div className="hidden h-10 min-w-72 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" aria-hidden="true" />
              Search people, projects, tasks
            </div>
            <button
              className={`relative rounded-md border p-2 transition hover:bg-secondary ${
                activePage === 'notifications' ? 'bg-secondary' : ''
              }`}
              aria-label="Open notifications"
              aria-current={activePage === 'notifications' ? 'page' : undefined}
              onClick={() => setActivePage('notifications')}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
            </button>
            <button
              className="rounded-md border p-2"
              aria-label="Toggle theme"
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              className="hidden items-center gap-2 rounded-md border px-3 py-2 text-sm md:flex"
              onClick={session ? handleLogout : () => setActivePage('login')}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              {sessionStatus === 'checking'
                ? 'Checking...'
                : session
                  ? session.user.name
                  : 'Sign in'}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
              <ProductPage
                page={activePage}
                role={roleKey}
                session={session}
                onNavigate={setActivePage}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductPage({
  page,
  role,
  session,
  onNavigate,
}: {
  page: string;
  role: RoleKey;
  session: SessionState | null;
  onNavigate: (page: string) => void;
}) {
  if (page.includes('analytics') && role !== 'super-admin')
    return <WorkAnalyticsExperience session={session} />;
  if (page.includes('report')) return <ReportsExperience session={session} />;
  if (page.includes('blocker')) return <BlockersExperience session={session} />;
  if (page.includes('daily') || page.includes('submit') || page === 'history')
    return <DailyProgressExperience role={role} session={session} />;
  if (page.includes('ai')) return <AiExperience session={session} />;
  if (page.includes('people') || page.includes('employee') || page.includes('team'))
    return <PeopleExperience role={role} session={session} />;
  if (page.includes('project') || page.includes('task'))
    return <WorkManagementExperience session={session} />;
  if (page.includes('notification')) return <NotificationsExperience session={session} />;
  if (page.includes('setting') || page.includes('plans') || page.includes('support'))
    return <SettingsExperience page={page} session={session} />;
  if (page.includes('compan') || page.includes('analytics') || page.includes('usage'))
    return <PlatformExperience page={page} session={session} />;
  return <DashboardExperience role={role} session={session} onNavigate={onNavigate} />;
}

function ShieldBadge({ label }: { label: string }) {
  return (
    <span className="block truncate text-center text-xs font-semibold">{label.slice(0, 2)}</span>
  );
}

function DashboardExperience({
  role,
  session,
  onNavigate,
}: {
  role: RoleKey;
  session: SessionState | null;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="space-y-6">
      <HeroBand role={role} onNavigate={onNavigate} />
      <LiveOverviewStrip session={session} />
      <DailyBriefingPanel session={session} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(0, role === 'employee' ? 4 : 8).map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="Weekly progress trend" action="This week">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Area type="monotone" dataKey="submitted" stroke="#0ea5e9" fill="#0ea5e933" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b98130" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Project health" action="View all">
          <div className="space-y-4">
            {projectHealth.map((project) => (
              <ProgressRow
                key={project.name}
                label={project.name}
                value={project.value}
                meta={project.status}
              />
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Attention required" action="Filter">
          <BlockerList compact />
        </Panel>
        <Panel title="Recent activity" action="Live">
          <LiveActivityList session={session} />
        </Panel>
      </div>
      <LiveAnalyticsStrip session={session} />
    </div>
  );
}

function HeroBand({ role, onNavigate }: { role: RoleKey; onNavigate: (page: string) => void }) {
  const copy =
    role === 'employee'
      ? 'Submit today in minutes, keep blockers visible, and see what needs your attention next.'
      : 'Monitor daily submissions, project risk, blockers, and team momentum from one operational view.';
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Today at a glance</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            Daily work intelligence is up to date.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Plus} onClick={() => onNavigate('tasks')}>
            New task
          </ActionButton>
          <ActionButton icon={FileText} variant="secondary" onClick={() => onNavigate('reports')}>
            Generate report
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function LiveOverviewStrip({ session }: { session: SessionState | null }) {
  const [overview, setOverview] = useState<WorkOverview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live company data.');

  useEffect(() => {
    if (!session) {
      setOverview(null);
      setStatus('idle');
      setMessage('Sign in to load live company data.');
      return;
    }

    setStatus('loading');
    setMessage('Loading live company data...');
    getWorkOverview(session.accessToken)
      .then((data) => {
        setOverview(data);
        setStatus('idle');
        setMessage('Live company data connected.');
      })
      .catch((error: unknown) => {
        setOverview(null);
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load live company data.');
      });
  }, [session]);

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-md ${
              status === 'error'
                ? 'bg-danger/10 text-danger'
                : status === 'loading'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-success/10 text-success'
            }`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">API connection</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        {overview ? (
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <LiveMetric label="Active" value={overview.metrics.activeProjects} />
            <LiveMetric label="Delayed" value={overview.metrics.delayedProjects} />
            <LiveMetric label="Blockers" value={overview.metrics.openBlockers} />
            <LiveMetric label="Overdue" value={overview.metrics.overdueTasks} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LiveMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DailyBriefingPanel({ session }: { session: SessionState | null }) {
  const [briefing, setBriefing] = useState<WorkBriefing | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("Sign in to load today's briefing.");
  const [saveMessage, setSaveMessage] = useState('Save this briefing into Reports.');

  useEffect(() => {
    if (!session) {
      setBriefing(null);
      setStatus('idle');
      setSaveStatus('idle');
      setMessage("Sign in to load today's briefing.");
      setSaveMessage('Save this briefing into Reports.');
      return;
    }

    setStatus('loading');
    setMessage('Preparing daily briefing...');
    getWorkBriefing(session.accessToken)
      .then((response) => {
        setBriefing(response);
        setStatus('idle');
        setSaveStatus('idle');
        setMessage('Daily briefing ready.');
        setSaveMessage('Save this briefing into Reports.');
      })
      .catch((error: unknown) => {
        setBriefing(null);
        setStatus('error');
        setSaveStatus('idle');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load daily briefing.');
        setSaveMessage('Briefing must load before it can be saved.');
      });
  }, [session]);

  async function handleSaveBriefingReport() {
    if (!session) {
      setSaveStatus('error');
      setSaveMessage('Sign in before saving a briefing report.');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving briefing report...');

    try {
      const report = await createWorkBriefingReport(session.accessToken);
      setSaveStatus('success');
      setSaveMessage(`Saved "${report.title}" to Reports.`);
    } catch (error: unknown) {
      setSaveStatus('error');
      setSaveMessage(error instanceof ApiError ? error.message : 'Unable to save briefing report.');
    }
  }

  if (!briefing) {
    return (
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-md ${
              status === 'error'
                ? 'bg-danger/10 text-danger'
                : status === 'loading'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">Daily briefing</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Daily briefing
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal">{briefing.headline}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {briefing.company.name} - {formatDate(briefing.date)} - cutoff{' '}
              {briefing.company.dailyCutoff}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <LiveMetric label="Submit %" value={briefing.metrics.submissionRate} />
            <LiveMetric label="Blockers" value={briefing.metrics.openBlockers} />
            <LiveMetric label="Overdue" value={briefing.metrics.overdueTasks} />
            <LiveMetric label="Unread" value={briefing.metrics.unreadNotifications} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={saveStatus === 'saving'}
              onClick={handleSaveBriefingReport}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              Save as report
            </button>
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                saveStatus === 'error'
                  ? 'bg-danger/10 text-danger'
                  : saveStatus === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {saveMessage}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Priorities</p>
            {briefing.priorities.length > 0 ? (
              briefing.priorities.slice(0, 3).map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`rounded-md p-3 text-sm ${toneClass(item.tone)}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 opacity-80">{item.body}</p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No urgent priorities were returned.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Latest activity</p>
            {briefing.activity.length > 0 ? (
              briefing.activity.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground">
                    {item.actor?.name ?? 'System'} - {formatTime(item.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No recent activity was returned.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveAnalyticsStrip({ session }: { session: SessionState | null }) {
  const [analytics, setAnalytics] = useState<WorkAnalytics | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live analytics.');

  useEffect(() => {
    if (!session) {
      setAnalytics(null);
      setStatus('idle');
      setMessage('Sign in to load live analytics.');
      return;
    }

    setStatus('loading');
    setMessage('Building analytics snapshot...');
    getWorkAnalytics(session.accessToken)
      .then((response) => {
        setAnalytics(response);
        setStatus('idle');
        setMessage('Live analytics snapshot is ready.');
      })
      .catch((error: unknown) => {
        setAnalytics(null);
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load analytics.');
      });
  }, [session]);

  if (!analytics) {
    return <AiSummaryStrip />;
  }

  return (
    <section className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm lg:grid-cols-3">
      {analytics.recommendations.slice(0, 3).map((card) => (
        <div key={card.title}>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${toneTextClass(card.tone)}`}
          >
            {status === 'loading'
              ? 'Refreshing'
              : status === 'error'
                ? 'Needs attention'
                : 'Live recommendation'}
          </p>
          <h3 className="mt-2 text-sm font-semibold">{card.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.body}</p>
        </div>
      ))}
      <p className="sr-only">{message}</p>
    </section>
  );
}

function WorkAnalyticsExperience({ session }: { session: SessionState | null }) {
  const [analytics, setAnalytics] = useState<WorkAnalytics | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load workspace analytics.');

  useEffect(() => {
    if (!session) {
      setAnalytics(null);
      setStatus('idle');
      setMessage('Sign in to load workspace analytics.');
      return;
    }

    setStatus('loading');
    setMessage('Loading live workspace analytics...');
    getWorkAnalytics(session.accessToken)
      .then((response) => {
        setAnalytics(response);
        setStatus('idle');
        setMessage('Live workspace analytics connected.');
      })
      .catch((error: unknown) => {
        setAnalytics(null);
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load workspace analytics.',
        );
      });
  }, [session]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">Analytics engine</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {analytics ? (
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <LiveMetric label="Submit %" value={analytics.metrics.submissionRate} />
              <LiveMetric label="Done %" value={analytics.metrics.completionRate} />
              <LiveMetric label="Risks" value={analytics.metrics.highRiskProjects} />
              <LiveMetric label="Critical" value={analytics.metrics.criticalBlockers} />
            </div>
          ) : null}
        </div>
      </section>

      {analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Submitted today"
              value={`${analytics.metrics.submittedToday}/${analytics.metrics.activeEmployees}`}
              delta={`${analytics.metrics.submissionRate}% coverage`}
              tone={analytics.metrics.submissionRate >= 90 ? 'good' : 'warning'}
            />
            <MetricCard
              label="Task completion"
              value={`${analytics.metrics.completionRate}%`}
              delta={`${analytics.metrics.completedTasks}/${analytics.metrics.totalTasks} done`}
              tone="good"
            />
            <MetricCard
              label="Open blockers"
              value={String(analytics.metrics.openBlockers)}
              delta={`${analytics.metrics.criticalBlockers} critical`}
              tone={
                analytics.metrics.criticalBlockers > 0
                  ? 'danger'
                  : analytics.metrics.openBlockers > 0
                    ? 'warning'
                    : 'good'
              }
            />
            <MetricCard
              label="Overdue tasks"
              value={String(analytics.metrics.overdueTasks)}
              delta={`${analytics.metrics.highRiskProjects} risky projects`}
              tone={analytics.metrics.overdueTasks > 0 ? 'warning' : 'good'}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Panel title="Seven day operating trend" action="Live">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Area type="monotone" dataKey="submitted" stroke="#0ea5e9" fill="#0ea5e933" />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b98130" />
                    <Area type="monotone" dataKey="blockers" stroke="#f59e0b" fill="#f59e0b30" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Task status mix" action="Current">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(analytics.taskStatus).map(([status, count]) => ({
                      status: titleCase(status),
                      count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Panel
              title="Project health ranking"
              action={`${analytics.projectHealth.length} tracked`}
            >
              <div className="space-y-4">
                {analytics.projectHealth.map((project) => (
                  <div key={project.id} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{project.name}</span>
                      <BadgeText>{project.healthScore}% health</BadgeText>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{ width: `${project.healthScore}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {titleCase(project.status)} - {project.counts.openBlockers} blockers -{' '}
                      {project.counts.overdueTasks} overdue
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Workload hotspots" action="People">
              <div className="space-y-3">
                {analytics.workload.map((person) => (
                  <div key={person.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{person.name}</p>
                      <BadgeText>{person.pressureScore} pressure</BadgeText>
                    </div>
                    <p className="mt-1 text-muted-foreground">{person.title ?? 'Team member'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {person.activeTasks} active tasks - {person.overdueTasks} overdue -{' '}
                      {person.openBlockers} blockers -{' '}
                      {person.submittedToday ? 'submitted' : 'missing update'}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Recommendations" action="Rule engine">
              <div className="space-y-3">
                {analytics.recommendations.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-md p-3 text-sm ${toneClass(item.tone)}`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 opacity-80">{item.body}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Risk queue" action={`${analytics.risks.length} blockers`}>
              <div className="space-y-3">
                {analytics.risks.length > 0 ? (
                  analytics.risks.map((risk) => (
                    <div key={risk.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{risk.title}</p>
                        <BadgeText>{titleCase(risk.severity)}</BadgeText>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {risk.project} - {risk.owner} - {formatAge(risk.ageHours)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    No active blocker risks were returned.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Submission coverage"
              value="87%"
              delta="Prototype fallback"
              tone="good"
            />
            <MetricCard label="Completion rate" value="68%" delta="Mock trend" tone="neutral" />
            <MetricCard label="Risk projects" value="4" delta="Needs review" tone="warning" />
          </div>
          <AiSummaryStrip />
        </>
      )}
    </div>
  );
}

function DailyProgressExperience({
  role,
  session,
}: {
  role: RoleKey;
  session: SessionState | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [liveProjects, setLiveProjects] = useState<WorkProject[]>([]);
  const [liveTasks, setLiveTasks] = useState<WorkTask[]>([]);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [workDate, setWorkDate] = useState(today);
  const [statusValue, setStatusValue] = useState('IN_PROGRESS');
  const [progressPercent, setProgressPercent] = useState(72);
  const [timeSpentHours, setTimeSpentHours] = useState(5.5);
  const [workCompleted, setWorkCompleted] = useState(
    'Completed validation rules for required fields, duplicate rows, and unsupported status values.',
  );
  const [tomorrowPlan, setTomorrowPlan] = useState(
    'Connect preview step with validation summary and downloadable error report.',
  );
  const [hasBlocker, setHasBlocker] = useState(true);
  const [blockerDescription, setBlockerDescription] = useState(
    'Need final sample workbook from operations team to validate optional columns.',
  );
  const [blockerCategory, setBlockerCategory] = useState('DEPENDENCY');
  const [links, setLinks] = useState('https://docs.example/import-spec');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('Sign in to submit live daily progress.');

  useEffect(() => {
    if (!session) {
      setLiveProjects([]);
      setLiveTasks([]);
      setProjectId('');
      setTaskId('');
      setLoadStatus('idle');
      setMessage('Sign in to submit live daily progress.');
      return;
    }

    setLoadStatus('loading');
    setMessage('Loading live project and task options...');
    Promise.all([getWorkProjects(session.accessToken), getWorkTasks(session.accessToken)])
      .then(([projectsResponse, tasksResponse]) => {
        setLiveProjects(projectsResponse);
        setLiveTasks(tasksResponse);
        setProjectId((current) => current || projectsResponse[0]?.id || '');
        setTaskId((current) => current || tasksResponse[0]?.id || '');
        setLoadStatus('idle');
        setMessage('Live daily progress form is ready.');
      })
      .catch((error: unknown) => {
        setLiveProjects([]);
        setLiveTasks([]);
        setProjectId('');
        setTaskId('');
        setLoadStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load live progress options.',
        );
      });
  }, [session]);

  const projectTasks = liveTasks.filter((task) => task.project.id === projectId);

  useEffect(() => {
    if (projectTasks.length > 0 && !projectTasks.some((task) => task.id === taskId)) {
      setTaskId(projectTasks[0]!.id);
    }
  }, [projectTasks, taskId]);

  async function handleProgressSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setSubmitStatus('error');
      setMessage('Sign in before submitting daily progress.');
      return;
    }

    if (!projectId) {
      setSubmitStatus('error');
      setMessage('Choose a project before submitting.');
      return;
    }

    setSubmitStatus('submitting');
    setMessage('Submitting daily progress...');

    try {
      const response = await createDailyProgress(session.accessToken, {
        projectId,
        taskId: taskId || undefined,
        workDate,
        workCompleted,
        status: statusValue as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD',
        progressPercent,
        timeSpentHours,
        tomorrowPlan,
        externalLinks: links
          .split(',')
          .map((link) => link.trim())
          .filter(Boolean),
        hasBlocker,
        blockerDescription: hasBlocker ? blockerDescription : undefined,
        blockerCategory: hasBlocker
          ? (blockerCategory as
              'TECHNICAL' | 'DEPENDENCY' | 'CLIENT' | 'APPROVAL' | 'RESOURCE' | 'ACCESS' | 'OTHER')
          : undefined,
      });

      setSubmitStatus('success');
      setMessage(`Saved ${response.project.name} progress for ${formatDate(response.workDate)}.`);
    } catch (error: unknown) {
      setSubmitStatus('error');
      setMessage(
        error instanceof ApiError ? error.message : 'Unable to submit progress right now.',
      );
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel
        title={role === 'employee' ? "Today's progress" : 'Team submissions'}
        action={session ? 'Live API' : 'Prototype'}
      >
        <form className="space-y-4" onSubmit={handleProgressSubmit}>
          <div
            className={`flex items-start gap-3 rounded-md p-3 text-sm ${
              submitStatus === 'error' || loadStatus === 'error'
                ? 'bg-danger/10 text-danger'
                : submitStatus === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {loadStatus === 'loading' || submitStatus === 'submitting' ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : submitStatus === 'error' || loadStatus === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{message}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date</span>
              <span className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  type="date"
                  value={workDate}
                  onChange={(event) => setWorkDate(event.target.value)}
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Project</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={!session || loadStatus === 'loading'}
              >
                {liveProjects.length === 0 ? <option value="">Analytics refresh</option> : null}
                {liveProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Task</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                disabled={!session || loadStatus === 'loading'}
              >
                {projectTasks.length === 0 ? (
                  <option value="">Finalize CSV import validator</option>
                ) : null}
                {projectTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Status</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
              >
                {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'].map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Progress percentage</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                min={0}
                max={100}
                type="number"
                value={progressPercent}
                onChange={(event) => setProgressPercent(Number(event.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Time spent</span>
              <span className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  min={0}
                  max={24}
                  step={0.25}
                  type="number"
                  value={timeSpentHours}
                  onChange={(event) => setTimeSpentHours(Number(event.target.value))}
                />
              </span>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Work completed today</span>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={workCompleted}
              onChange={(event) => setWorkCompleted(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Tomorrow's plan</span>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={tomorrowPlan}
              onChange={(event) => setTomorrowPlan(event.target.value)}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border bg-secondary/40 p-3 text-sm">
            <span className="font-medium">I am blocked</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-sky-500"
              checked={hasBlocker}
              onChange={(event) => setHasBlocker(event.target.checked)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Blocker description</span>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              value={blockerDescription}
              onChange={(event) => setBlockerDescription(event.target.value)}
              disabled={!hasBlocker}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Blocker category</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                value={blockerCategory}
                onChange={(event) => setBlockerCategory(event.target.value)}
                disabled={!hasBlocker}
              >
                {[
                  'TECHNICAL',
                  'DEPENDENCY',
                  'CLIENT',
                  'APPROVAL',
                  'RESOURCE',
                  'ACCESS',
                  'OTHER',
                ].map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Links</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={links}
                onChange={(event) => setLinks(event.target.value)}
              />
            </label>
          </div>
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-5 w-5" aria-hidden="true" />
            Drag attachments here or choose files
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={submitStatus === 'submitting' || !session}
          >
            {submitStatus === 'submitting' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Submit progress
          </button>
        </form>
      </Panel>
      <div className="space-y-4">
        <Panel title="Progress history" action="Custom range">
          <DataTable rows={tasks} />
        </Panel>
        <StateGallery />
      </div>
    </div>
  );
}

function AiExperience({ session }: { session: SessionState | null }) {
  const [liveConversations, setLiveConversations] = useState<WorkAiConversation[]>([]);
  const [question, setQuestion] = useState('Which blockers need attention today?');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [askStatus, setAskStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load AI conversation history.');
  const [askMessage, setAskMessage] = useState('Sign in to ask workspace questions.');

  useEffect(() => {
    if (!session) {
      setLiveConversations([]);
      setStatus('idle');
      setAskStatus('idle');
      setMessage('Sign in to load AI conversation history.');
      setAskMessage('Sign in to ask workspace questions.');
      return;
    }

    setStatus('loading');
    setMessage('Loading AI conversation history...');
    getWorkAiConversations(session.accessToken)
      .then((response) => {
        setLiveConversations(response);
        setStatus('idle');
        setMessage('Live AI history connected.');
        setAskMessage('Ask a workspace question grounded in live data.');
      })
      .catch((error: unknown) => {
        setLiveConversations([]);
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load AI conversation history.',
        );
        setAskMessage('AI questions need live workspace data.');
      });
  }, [session]);

  const hasLiveData = liveConversations.length > 0;
  const latestConversation = liveConversations[0];
  const messageCount = liveConversations.reduce(
    (count, conversation) => count + conversation.messages.length,
    0,
  );

  async function handleAskAi(
    event?: React.FormEvent<HTMLFormElement>,
    selectedQuestion?: string,
    intent: AskAiPayload['intent'] = 'QUESTION',
  ) {
    event?.preventDefault();

    if (!session) {
      setAskStatus('error');
      setAskMessage('Sign in before asking WorkPulse AI.');
      return;
    }

    const nextQuestion = (selectedQuestion ?? question).trim();
    if (!nextQuestion) {
      setAskStatus('error');
      setAskMessage('Enter a question first.');
      return;
    }

    setQuestion(nextQuestion);
    setAskStatus('submitting');
    setAskMessage('Asking WorkPulse AI...');

    try {
      const payload: AskAiPayload = {
        question: nextQuestion,
        conversationId: latestConversation?.id,
        intent,
      };
      const conversation = await askWorkAi(session.accessToken, payload);
      setLiveConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setAskStatus('success');
      setAskMessage(
        intent === 'ACTION_PLAN'
          ? 'Action plan saved to conversation history.'
          : 'Answer saved to conversation history.',
      );
      setQuestion('');
    } catch (error: unknown) {
      setAskStatus('error');
      setAskMessage(
        error instanceof ApiError ? error.message : 'Unable to ask WorkPulse AI right now.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">AI data</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {hasLiveData ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <LiveMetric label="Threads" value={liveConversations.length} />
              <LiveMetric label="Messages" value={messageCount} />
            </div>
          ) : null}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Suggested questions" action="Permission aware">
          <div className="space-y-2">
            <button
              className="w-full rounded-md border border-primary/50 bg-primary/10 p-3 text-left text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-60"
              disabled={askStatus === 'submitting'}
              onClick={() =>
                void handleAskAi(
                  undefined,
                  'Generate an action plan for today from blockers, overdue work, workload, and project risk.',
                  'ACTION_PLAN',
                )
              }
            >
              Generate today&apos;s action plan
            </button>
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                className="w-full rounded-md border p-3 text-left text-sm hover:bg-secondary disabled:opacity-60"
                disabled={askStatus === 'submitting'}
                onClick={() => void handleAskAi(undefined, question)}
              >
                {question}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Ask AI" action={hasLiveData ? 'Live history' : 'Mock response'}>
          {latestConversation ? (
            <LiveAiConversation
              conversation={latestConversation}
              question={question}
              askStatus={askStatus}
              askMessage={askMessage}
              onQuestionChange={setQuestion}
              onSubmit={handleAskAi}
            />
          ) : session ? (
            <NewAiQuestionPanel
              question={question}
              askStatus={askStatus}
              askMessage={askMessage}
              onQuestionChange={setQuestion}
              onSubmit={handleAskAi}
            />
          ) : (
            <PrototypeAiResponse />
          )}
        </Panel>
      </div>
    </div>
  );
}

function NewAiQuestionPanel({
  question,
  askStatus,
  askMessage,
  onQuestionChange,
  onSubmit,
}: {
  question: string;
  askStatus: 'idle' | 'submitting' | 'success' | 'error';
  askMessage: string;
  onQuestionChange: (question: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No saved AI conversations were returned for this workspace.
      </div>
      <AiQuestionForm
        question={question}
        askStatus={askStatus}
        askMessage={askMessage}
        onQuestionChange={onQuestionChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function LiveAiConversation({
  conversation,
  question,
  askStatus,
  askMessage,
  onQuestionChange,
  onSubmit,
}: {
  conversation: WorkAiConversation;
  question: string;
  askStatus: 'idle' | 'submitting' | 'success' | 'error';
  askMessage: string;
  onQuestionChange: (question: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-secondary/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{conversation.title}</p>
          <BadgeText>{conversation.user.name}</BadgeText>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Updated {formatDate(conversation.updatedAt)}
        </p>
      </div>
      <div className="space-y-3">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-md border p-4 ${message.role === 'ASSISTANT' ? 'bg-card' : 'bg-secondary'}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {message.role === 'ASSISTANT' ? (
                <Bot className="h-4 w-4 text-accent" aria-hidden="true" />
              ) : (
                <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {message.role === 'ASSISTANT' ? 'WorkPulse AI' : (message.user?.name ?? 'User')}
              <BadgeText>{titleCase(message.role)}</BadgeText>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {message.content}
            </p>
            {message.evidence ? (
              <div className="mt-3 rounded-md bg-evidence p-3 text-sm">
                Evidence saved for this response.
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <AiQuestionForm
        question={question}
        askStatus={askStatus}
        askMessage={askMessage}
        onQuestionChange={onQuestionChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function AiQuestionForm({
  question,
  askStatus,
  askMessage,
  onQuestionChange,
  onSubmit,
}: {
  question: string;
  askStatus: 'idle' | 'submitting' | 'success' | 'error';
  askMessage: string;
  onQuestionChange: (question: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <form className="flex gap-2 rounded-md border bg-card p-2" onSubmit={onSubmit}>
        <input
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          placeholder="Ask about team progress, blockers, or risks"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
        />
        <button
          className="rounded-md bg-primary p-2 text-primary-foreground disabled:opacity-60"
          aria-label="Send question"
          disabled={askStatus === 'submitting'}
        >
          {askStatus === 'submitting' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </form>
      <p
        className={`rounded-md p-3 text-sm ${
          askStatus === 'error'
            ? 'bg-danger/10 text-danger'
            : askStatus === 'success'
              ? 'bg-success/10 text-success'
              : 'bg-secondary text-muted-foreground'
        }`}
      >
        {askMessage}
      </p>
    </div>
  );
}

function PrototypeAiResponse() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-secondary p-4">
        <p className="text-sm font-medium">Which blockers need attention?</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4 text-accent" aria-hidden="true" />
          WorkPulse AI
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {insightCards.map((card) => (
            <div key={card.title} className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <h3 className="mt-2 text-sm font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md bg-evidence p-3 text-sm">
          Sources: Partner portal / SSO redirect task / Updates from Jul 22-Jul 24
        </div>
      </div>
      <div className="flex gap-2 rounded-md border bg-card p-2">
        <input
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          placeholder="Ask about team progress, blockers, or risks"
        />
        <button
          className="rounded-md bg-primary p-2 text-primary-foreground"
          aria-label="Send question"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function WorkManagementExperience({ session }: { session: SessionState | null }) {
  const createTaskSectionRef = useRef<HTMLDivElement>(null);
  const createTaskTitleRef = useRef<HTMLInputElement>(null);
  const taskFiltersSectionRef = useRef<HTMLDivElement>(null);
  const taskFilterStatusRef = useRef<HTMLSelectElement>(null);
  const [liveProjects, setLiveProjects] = useState<WorkProject[]>([]);
  const [liveTasks, setLiveTasks] = useState<WorkTask[]>([]);
  const [people, setPeople] = useState<WorkPeople | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<WorkTaskQuery['status'] | ''>('');
  const [taskFilterPriority, setTaskFilterPriority] = useState<WorkTaskQuery['priority'] | ''>('');
  const [taskFilterProjectId, setTaskFilterProjectId] = useState('');
  const [taskFilterAssigneeId, setTaskFilterAssigneeId] = useState('');
  const [taskFilterLimit, setTaskFilterLimit] = useState(25);
  const [savedTaskViews, setSavedTaskViews] = useState<SavedTaskFilterView[]>([]);
  const [lastCleanedTaskViews, setLastCleanedTaskViews] = useState<SavedTaskFilterView[]>([]);
  const [taskViewsLoaded, setTaskViewsLoaded] = useState(false);
  const [taskViewName, setTaskViewName] = useState('Weekly risk review');
  const [taskViewMessage, setTaskViewMessage] = useState(
    'Save the current live filters as a reusable view.',
  );
  const [taskTitle, setTaskTitle] = useState('Prepare customer import QA checklist');
  const [taskDescription, setTaskDescription] = useState(
    'Document edge cases, owner sign-off, and sample file validation steps.',
  );
  const [taskPriority, setTaskPriority] = useState<CreateTaskPayload['priority']>('HIGH');
  const [taskStatus, setTaskStatus] = useState<CreateTaskPayload['status']>('NOT_STARTED');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  });
  const [estimatedHours, setEstimatedHours] = useState(6);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [createStatus, setCreateStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState('Sign in to load live project and task records.');
  const [createMessage, setCreateMessage] = useState('Sign in to create live tasks.');
  const [taskSearchOpen, setTaskSearchOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  useEffect(() => {
    const storedViews = window.localStorage.getItem(taskFilterViewsStorageKey);
    if (!storedViews) {
      setTaskViewsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedViews) as SavedTaskFilterView[];
      if (Array.isArray(parsed)) setSavedTaskViews(parsed);
    } catch {
      window.localStorage.removeItem(taskFilterViewsStorageKey);
    } finally {
      setTaskViewsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!taskViewsLoaded) return;
    window.localStorage.setItem(taskFilterViewsStorageKey, JSON.stringify(savedTaskViews));
  }, [savedTaskViews, taskViewsLoaded]);

  useEffect(() => {
    if (!session) {
      setLiveProjects([]);
      setLiveTasks([]);
      setPeople(null);
      setSelectedProjectId('');
      setAssigneeId('');
      setTaskFilterStatus('');
      setTaskFilterPriority('');
      setTaskFilterProjectId('');
      setTaskFilterAssigneeId('');
      setTaskFilterLimit(25);
      setTaskViewMessage('Sign in to use saved task filter views.');
      setStatus('idle');
      setCreateStatus('idle');
      setActiveTaskId(null);
      setMessage('Sign in to load live project and task records.');
      setCreateMessage('Sign in to create live tasks.');
      return;
    }

    setStatus('loading');
    setMessage('Loading live task workspace...');
    const taskQuery: WorkTaskQuery = {
      status: taskFilterStatus || undefined,
      priority: taskFilterPriority || undefined,
      projectId: taskFilterProjectId || undefined,
      assigneeId: taskFilterAssigneeId || undefined,
      limit: taskFilterLimit,
    };
    Promise.all([
      getWorkProjects(session.accessToken),
      getWorkTasks(session.accessToken, taskQuery),
      getWorkPeople(session.accessToken),
    ])
      .then(([projectsResponse, tasksResponse, peopleResponse]) => {
        setLiveProjects(projectsResponse);
        setLiveTasks(tasksResponse);
        setPeople(peopleResponse);
        setSelectedProjectId((current) => current || projectsResponse[0]?.id || '');
        setAssigneeId(
          (current) =>
            current || peopleResponse.employees.find((employee) => employee.isActive)?.id || '',
        );
        setStatus('idle');
        setMessage(
          taskFiltersActive(taskQuery)
            ? `Live task workspace connected with ${tasksResponse.length} filtered task records.`
            : 'Live task workspace connected.',
        );
        setCreateMessage('Create a task in the live workspace.');
        setTaskViewMessage('Save the current live filters as a reusable view.');
      })
      .catch((error: unknown) => {
        setLiveProjects([]);
        setLiveTasks([]);
        setPeople(null);
        setSelectedProjectId('');
        setAssigneeId('');
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load live task workspace.',
        );
        setCreateMessage('Task creation needs live workspace data.');
      });
  }, [
    session,
    taskFilterStatus,
    taskFilterPriority,
    taskFilterProjectId,
    taskFilterAssigneeId,
    taskFilterLimit,
  ]);

  const hasLiveData = liveProjects.length > 0 || liveTasks.length > 0;
  const activeEmployees = people?.employees.filter((employee) => employee.isActive) ?? [];
  const normalizedTaskSearch = taskSearchQuery.trim().toLowerCase();
  const filteredLiveProjects = normalizedTaskSearch
    ? liveProjects.filter((project) =>
        [
          project.name,
          project.description,
          project.status,
          project.priority,
          project.owner?.name,
          project.team?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedTaskSearch),
      )
    : liveProjects;
  const filteredLiveTasks = normalizedTaskSearch
    ? liveTasks.filter((task) =>
        [
          task.title,
          task.description,
          task.status,
          task.priority,
          task.project.name,
          task.assignee?.name,
          task.reporter?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedTaskSearch),
      )
    : liveTasks;
  const filteredPrototypeProjects = normalizedTaskSearch
    ? projectHealth.filter((project) =>
        [project.name, project.status].join(' ').toLowerCase().includes(normalizedTaskSearch),
      )
    : projectHealth;
  const filteredPrototypeTasks = normalizedTaskSearch
    ? tasks.filter((task) =>
        [task.task, task.project, task.owner, task.status, task.priority]
          .join(' ')
          .toLowerCase()
          .includes(normalizedTaskSearch),
      )
    : tasks;
  const taskQueueInsights = useMemo(
    () => getTaskQueueInsights(filteredLiveTasks),
    [filteredLiveTasks],
  );
  const currentTaskFilters = useMemo(
    () => ({
      status: taskFilterStatus,
      priority: taskFilterPriority,
      projectId: taskFilterProjectId,
      assigneeId: taskFilterAssigneeId,
      limit: taskFilterLimit,
    }),
    [
      taskFilterStatus,
      taskFilterPriority,
      taskFilterProjectId,
      taskFilterAssigneeId,
      taskFilterLimit,
    ],
  );

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setCreateStatus('error');
      setCreateMessage('Sign in before creating a live task.');
      return;
    }

    if (!selectedProjectId || !taskTitle.trim()) {
      setCreateStatus('error');
      setCreateMessage('Choose a project and enter a task title.');
      return;
    }

    setCreateStatus('submitting');
    setCreateMessage('Creating task...');

    try {
      const task = await createWorkTask(session.accessToken, {
        projectId: selectedProjectId,
        assigneeId: assigneeId || undefined,
        title: taskTitle,
        description: taskDescription || undefined,
        priority: taskPriority,
        status: taskStatus,
        dueDate: dueDate || undefined,
        estimatedHours,
      });

      setLiveTasks((current) => [task, ...current.filter((item) => item.id !== task.id)]);
      setCreateStatus('success');
      setCreateMessage(`Created "${task.title}".`);
      setTaskTitle('');
      setTaskDescription('');
    } catch (error: unknown) {
      setCreateStatus('error');
      setCreateMessage(
        error instanceof ApiError ? error.message : 'Unable to create task right now.',
      );
    }
  }

  async function handleUpdateTask(task: WorkTask, payload: UpdateTaskPayload) {
    if (!session) {
      setCreateStatus('error');
      setCreateMessage('Sign in before updating task follow-through.');
      return;
    }

    setActiveTaskId(task.id);
    setCreateStatus('submitting');
    setCreateMessage(`Updating "${task.title}"...`);

    try {
      const updated = await updateWorkTask(session.accessToken, task.id, payload);
      setLiveTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setCreateStatus('success');
      setCreateMessage(`Updated "${updated.title}" to ${titleCase(updated.status)}.`);
    } catch (error: unknown) {
      setCreateStatus('error');
      setCreateMessage(
        error instanceof ApiError ? error.message : 'Unable to update task right now.',
      );
    } finally {
      setActiveTaskId(null);
    }
  }

  function handleSaveTaskView() {
    const name = taskViewName.trim();

    if (!name) {
      setTaskViewMessage('Name the filter view before saving it.');
      return;
    }

    const view: SavedTaskFilterView = {
      id: `task-view-${Date.now()}`,
      name,
      filters: currentTaskFilters,
      savedAt: new Date().toISOString(),
    };

    setLastCleanedTaskViews([]);
    setSavedTaskViews((current) => [view, ...current.filter((item) => item.name !== name)]);
    setTaskViewMessage(`Saved "${name}" with the current filters.`);
  }

  function handleApplyTaskView(view: SavedTaskFilterView) {
    setTaskFilterStatus(view.filters.status);
    setTaskFilterPriority(view.filters.priority);
    setTaskFilterProjectId(view.filters.projectId);
    setTaskFilterAssigneeId(view.filters.assigneeId);
    setTaskFilterLimit(view.filters.limit);
    setTaskViewName(view.name);
    setTaskViewMessage(`Applied "${view.name}".`);
  }

  function handleDeleteTaskView(viewId: string) {
    setLastCleanedTaskViews([]);
    setSavedTaskViews((current) => current.filter((view) => view.id !== viewId));
    setTaskViewMessage('Saved filter view removed.');
  }

  function handleCleanupTaskViewOverlaps(viewIds: string[]) {
    const cleanupIds = new Set(viewIds);

    if (cleanupIds.size === 0) {
      setTaskViewMessage('No overlapping saved filter views need cleanup.');
      return;
    }

    const removedViews = savedTaskViews.filter((view) => cleanupIds.has(view.id));
    setLastCleanedTaskViews(removedViews);
    setSavedTaskViews((current) => current.filter((view) => !cleanupIds.has(view.id)));
    setTaskViewMessage(
      `Removed ${cleanupIds.size} older overlapping saved filter view${cleanupIds.size === 1 ? '' : 's'}.`,
    );
  }

  function handleUndoTaskViewCleanup() {
    if (lastCleanedTaskViews.length === 0) {
      setTaskViewMessage('No saved filter cleanup is available to undo.');
      return;
    }

    setSavedTaskViews((current) =>
      mergeSavedTaskFilterViews(current, lastCleanedTaskViews).sort(
        (first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime(),
      ),
    );
    setTaskViewMessage(
      `Restored ${lastCleanedTaskViews.length} cleaned saved filter view${lastCleanedTaskViews.length === 1 ? '' : 's'}.`,
    );
    setLastCleanedTaskViews([]);
  }

  function handleRefreshTaskView(view: SavedTaskFilterView) {
    const refreshedView: SavedTaskFilterView = {
      ...view,
      filters: currentTaskFilters,
      savedAt: new Date().toISOString(),
    };

    setLastCleanedTaskViews([]);
    setSavedTaskViews((current) =>
      [refreshedView, ...current.filter((item) => item.id !== view.id)].sort(
        (first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime(),
      ),
    );
    setTaskViewName(view.name);
    setTaskViewMessage(`Refreshed "${view.name}" with the current filters.`);
  }

  function handleExportTaskViews() {
    if (savedTaskViews.length === 0) {
      setTaskViewMessage('Save at least one filter view before exporting.');
      return;
    }

    const filename = `workpulse-task-filter-views-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(savedTaskViews, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const href = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(href);
    setTaskViewMessage(
      `Exported ${savedTaskViews.length} saved filter view${savedTaskViews.length === 1 ? '' : 's'}.`,
    );
  }

  async function handleImportTaskViews(file: File | null) {
    if (!file) return;

    try {
      const importedViews = parseSavedTaskFilterViews(await file.text());
      setLastCleanedTaskViews([]);
      setSavedTaskViews((current) => mergeSavedTaskFilterViews(current, importedViews));
      setTaskViewMessage(
        `Imported ${importedViews.length} saved filter view${importedViews.length === 1 ? '' : 's'}.`,
      );
    } catch {
      setTaskViewMessage('Unable to import saved views from that file.');
    }
  }

  return (
    <div className="space-y-6">
      <Toolbar
        title="Task and project workspace"
        searchOpen={taskSearchOpen}
        searchValue={taskSearchQuery}
        searchPlaceholder="Search tasks and projects"
        searchClearLabel="Clear task search"
        onSearchToggle={() => setTaskSearchOpen((current) => !current)}
        onSearchChange={setTaskSearchQuery}
        onSearchClear={() => {
          setTaskSearchQuery('');
          setTaskSearchOpen(false);
        }}
        onFiltersClick={() => {
          taskFiltersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          taskFilterStatusRef.current?.focus({ preventScroll: true });
        }}
        onCreateClick={() => {
          createTaskSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          createTaskTitleRef.current?.focus({ preventScroll: true });
        }}
      />
      {normalizedTaskSearch ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasLiveData ? filteredLiveTasks.length : filteredPrototypeTasks.length}{' '}
          {(hasLiveData ? filteredLiveTasks.length : filteredPrototypeTasks.length) === 1
            ? 'task'
            : 'tasks'}{' '}
          and {hasLiveData ? filteredLiveProjects.length : filteredPrototypeProjects.length}{' '}
          {(hasLiveData ? filteredLiveProjects.length : filteredPrototypeProjects.length) === 1
            ? 'project'
            : 'projects'}{' '}
          found for &quot;{taskSearchQuery.trim()}&quot;.
        </p>
      ) : null}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-md ${
              status === 'error'
                ? 'bg-danger/10 text-danger'
                : status === 'loading'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-success/10 text-success'
            }`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">Workspace data</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {hasLiveData
          ? filteredLiveProjects.slice(0, 3).map((project) => (
              <Panel key={project.id} title={project.name} action={titleCase(project.status)}>
                <ProgressRow
                  label="Progress"
                  value={project.progress}
                  meta={`${project.progress}% complete`}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <BadgeText>{titleCase(project.priority)}</BadgeText>
                  <BadgeText>{project.counts.tasks} tasks</BadgeText>
                  <BadgeText>{project.counts.members} members</BadgeText>
                </div>
              </Panel>
            ))
          : filteredPrototypeProjects.map((project) => (
              <Panel key={project.name} title={project.name} action={project.status}>
                <ProgressRow
                  label="Progress"
                  value={project.value}
                  meta={`${project.value}% complete`}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <BadgeText>Active</BadgeText>
                  <BadgeText>High priority</BadgeText>
                  <BadgeText>5 members</BadgeText>
                </div>
              </Panel>
            ))}
        {normalizedTaskSearch &&
        (hasLiveData ? filteredLiveProjects.length : filteredPrototypeProjects.length) === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground lg:col-span-3">
            No projects match &quot;{taskSearchQuery.trim()}&quot;.
          </div>
        ) : null}
      </div>
      <div ref={createTaskSectionRef} className="scroll-mt-20">
        <Panel title="Create task" action={session ? 'Live API' : 'Sign in required'}>
          <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={handleCreateTask}>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Task title</span>
                <input
                  ref={createTaskTitleRef}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Description</span>
                <textarea
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Project</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  disabled={liveProjects.length === 0}
                >
                  {liveProjects.length === 0 ? <option value="">No live projects</option> : null}
                  {liveProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Assignee</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Priority</span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={taskPriority}
                    onChange={(event) =>
                      setTaskPriority(event.target.value as CreateTaskPayload['priority'])
                    }
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                      <option key={priority} value={priority}>
                        {titleCase(priority)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Status</span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={taskStatus}
                    onChange={(event) =>
                      setTaskStatus(event.target.value as CreateTaskPayload['status'])
                    }
                  >
                    {taskStatuses
                      .filter((item) => item !== 'COMPLETED')
                      .map((item) => (
                        <option key={item} value={item}>
                          {titleCase(item)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Due date</span>
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Hours</span>
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    type="number"
                    min="0"
                    max="500"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(event) => setEstimatedHours(Number(event.target.value))}
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={createStatus === 'submitting' || !session || liveProjects.length === 0}
              >
                {createStatus === 'submitting' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Create task
              </button>
              <p
                className={`rounded-md p-3 text-sm ${
                  createStatus === 'error'
                    ? 'bg-danger/10 text-danger'
                    : createStatus === 'success'
                      ? 'bg-success/10 text-success'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {createMessage}
              </p>
            </div>
          </form>
        </Panel>
      </div>
      <Panel title="Tasks" action={hasLiveData ? 'Live API' : 'Prototype fallback'}>
        {hasLiveData ? (
          <>
            <div ref={taskFiltersSectionRef} className="scroll-mt-20">
              <TaskFilterBar
                statusInputRef={taskFilterStatusRef}
                projects={liveProjects}
                employees={activeEmployees}
                status={taskFilterStatus}
                priority={taskFilterPriority}
                projectId={taskFilterProjectId}
                assigneeId={taskFilterAssigneeId}
                limit={taskFilterLimit}
                onStatusChange={setTaskFilterStatus}
                onPriorityChange={setTaskFilterPriority}
                onProjectChange={setTaskFilterProjectId}
                onAssigneeChange={setTaskFilterAssigneeId}
                onLimitChange={setTaskFilterLimit}
                onClear={() => {
                  setTaskFilterStatus('');
                  setTaskFilterPriority('');
                  setTaskFilterProjectId('');
                  setTaskFilterAssigneeId('');
                  setTaskFilterLimit(25);
                }}
              />
            </div>
            <SavedTaskFilterViews
              views={savedTaskViews}
              currentFilters={currentTaskFilters}
              viewName={taskViewName}
              message={taskViewMessage}
              onViewNameChange={setTaskViewName}
              onSave={handleSaveTaskView}
              onApply={handleApplyTaskView}
              onRefresh={handleRefreshTaskView}
              onDelete={handleDeleteTaskView}
              onCleanupOverlaps={handleCleanupTaskViewOverlaps}
              cleanedViewCount={lastCleanedTaskViews.length}
              onUndoCleanup={handleUndoTaskViewCleanup}
              onExport={handleExportTaskViews}
              onImport={handleImportTaskViews}
            />
          </>
        ) : null}
        {hasLiveData ? (
          <TaskQueueInsights insights={taskQueueInsights} rows={filteredLiveTasks} />
        ) : null}
        {hasLiveData ? (
          <LiveTaskTable
            rows={filteredLiveTasks}
            activeTaskId={activeTaskId}
            onUpdateTask={handleUpdateTask}
            emptyMessage={
              normalizedTaskSearch ? `No tasks match "${taskSearchQuery.trim()}".` : undefined
            }
          />
        ) : (
          <DataTable rows={filteredPrototypeTasks} />
        )}
      </Panel>
    </div>
  );
}

type TaskQueueInsight = {
  total: number;
  blocked: number;
  overdue: number;
  dueSoon: number;
  urgent: number;
  completionRate: number;
  briefingDraft: string;
  focusItems: {
    title: string;
    body: string;
    tone: 'danger' | 'warning' | 'good';
  }[];
};

function TaskFilterBar({
  statusInputRef,
  projects,
  employees,
  status,
  priority,
  projectId,
  assigneeId,
  limit,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
  onAssigneeChange,
  onLimitChange,
  onClear,
}: {
  statusInputRef?: React.RefObject<HTMLSelectElement | null>;
  projects: WorkProject[];
  employees: WorkPeople['employees'];
  status: WorkTaskQuery['status'] | '';
  priority: WorkTaskQuery['priority'] | '';
  projectId: string;
  assigneeId: string;
  limit: number;
  onStatusChange: (value: WorkTaskQuery['status'] | '') => void;
  onPriorityChange: (value: WorkTaskQuery['priority'] | '') => void;
  onProjectChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onLimitChange: (value: number) => void;
  onClear: () => void;
}) {
  const activeFilterCount = [
    status,
    priority,
    projectId,
    assigneeId,
    limit !== 25 ? String(limit) : '',
  ].filter(Boolean).length;

  return (
    <div className="mb-4 rounded-md border bg-background p-3">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
          <select
            ref={statusInputRef}
            className="h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as WorkTaskQuery['status'] | '')}
          >
            <option value="">All statuses</option>
            {taskStatuses.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Priority</span>
          <select
            className="h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={priority}
            onChange={(event) =>
              onPriorityChange(event.target.value as WorkTaskQuery['priority'] | '')
            }
          >
            <option value="">All priorities</option>
            {taskPriorities.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Project</span>
          <select
            className="h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={projectId}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Assignee</span>
          <select
            className="h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={assigneeId}
            onChange={(event) => onAssigneeChange(event.target.value)}
          >
            <option value="">All assignees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Limit</span>
          <select
            className="h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value} rows
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
            disabled={activeFilterCount === 0}
            onClick={onClear}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {activeFilterCount > 0
          ? `${activeFilterCount} live filter${activeFilterCount === 1 ? '' : 's'} applied.`
          : 'Showing the default live task queue.'}
      </p>
    </div>
  );
}

function SavedTaskFilterViews({
  views,
  currentFilters,
  viewName,
  message,
  onViewNameChange,
  onSave,
  onApply,
  onRefresh,
  onDelete,
  onCleanupOverlaps,
  cleanedViewCount,
  onUndoCleanup,
  onExport,
  onImport,
}: {
  views: SavedTaskFilterView[];
  currentFilters: SavedTaskFilterView['filters'];
  viewName: string;
  message: string;
  onViewNameChange: (value: string) => void;
  onSave: () => void;
  onApply: (view: SavedTaskFilterView) => void;
  onRefresh: (view: SavedTaskFilterView) => void;
  onDelete: (viewId: string) => void;
  onCleanupOverlaps: (viewIds: string[]) => void;
  cleanedViewCount: number;
  onUndoCleanup: () => void;
  onExport: () => void;
  onImport: (file: File | null) => void;
}) {
  const currentFilterSignature = taskFilterSignature(currentFilters);
  const currentFiltersSaved = views.some(
    (view) => taskFilterSignature(view.filters) === currentFilterSignature,
  );
  const maintenance = getSavedTaskViewMaintenance(views, currentFilterSignature);
  const currentFilterActive = savedTaskViewBadges({
    id: 'current-filter-preview',
    name: 'Current filters',
    filters: currentFilters,
    savedAt: new Date().toISOString(),
  }).some((badge) => badge !== '25 rows');

  return (
    <div className="mb-4 rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Saved view</span>
          <input
            className="h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={viewName}
            onChange={(event) => onViewNameChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          onClick={onSave}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Save view
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
          disabled={maintenance.cleanupCandidateIds.length === 0}
          onClick={() => onCleanupOverlaps(maintenance.cleanupCandidateIds)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clean overlaps
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
          disabled={cleanedViewCount === 0}
          onClick={onUndoCleanup}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Undo cleanup
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
          disabled={views.length === 0}
          onClick={onExport}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {maintenance.exportLabel}
        </button>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              onImport(event.target.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">{message}</p>
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            currentFiltersSaved
              ? 'bg-success/15 text-success'
              : currentFilterActive
                ? 'bg-warning/15 text-warning'
                : 'bg-secondary text-muted-foreground'
          }`}
        >
          {currentFiltersSaved
            ? 'Saved view active'
            : currentFilterActive
              ? 'Unsaved filters'
              : 'Default queue'}
        </span>
      </div>
      {views.length > 0 ? (
        <>
          <div className="mt-3 grid gap-2 md:grid-cols-6">
            {maintenance.metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-xl font-semibold tracking-normal">{metric.value}</span>
                  <span className={`rounded-md px-2 py-1 text-xs ${toneClass(metric.tone)}`}>
                    {metric.meta}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-md bg-secondary p-3 text-xs leading-5 text-muted-foreground">
            {maintenance.message}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {views.map((view) => {
              const isCurrentView = taskFilterSignature(view.filters) === currentFilterSignature;
              const overlapNames = maintenance.overlapsByViewId.get(view.id) ?? [];
              const overlapCue = maintenance.overlapCueByViewId.get(view.id);

              return (
                <div
                  key={view.id}
                  className={`rounded-md border bg-card p-3 ${
                    isCurrentView ? 'border-accent/60 bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => onApply(view)}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                        <span className="truncate">{view.name}</span>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Saved {formatDate(view.savedAt)}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      {isCurrentView ? (
                        <span className="rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                          Current
                        </span>
                      ) : null}
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${savedTaskViewAgeTone(
                          view.savedAt,
                        )}`}
                      >
                        {savedTaskViewAgeLabel(view.savedAt)}
                      </span>
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-50"
                        aria-label={`Refresh ${view.name} with current filters`}
                        disabled={isCurrentView}
                        onClick={() => onRefresh(view)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                        aria-label={`Delete ${view.name}`}
                        onClick={() => onDelete(view.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {overlapCue ? (
                      <span
                        className={`rounded-md px-2 py-1 text-xs ${toneClass(overlapCue.tone)}`}
                      >
                        {overlapCue.label}
                      </span>
                    ) : null}
                    {overlapNames.length > 0 ? (
                      <span className="rounded-md bg-warning/15 px-2 py-1 text-xs text-warning">
                        Overlaps {overlapNames.join(', ')}
                      </span>
                    ) : null}
                    {savedTaskViewBadges(view).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No saved task filter views yet.
        </div>
      )}
    </div>
  );
}

function TaskQueueInsights({ insights, rows }: { insights: TaskQueueInsight; rows: WorkTask[] }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const queueActionMessage =
    exportStatus === 'success'
      ? 'Filtered queue CSV downloaded.'
      : exportStatus === 'error'
        ? 'Unable to download the filtered queue.'
        : copyStatus === 'success'
          ? 'Briefing draft copied.'
          : copyStatus === 'error'
            ? 'Unable to copy the briefing draft.'
            : 'Ready for standup, Slack, or report notes.';
  const metrics = [
    {
      label: 'Completion',
      value: `${insights.completionRate}%`,
      meta: `${insights.total} returned`,
      tone:
        insights.completionRate >= 70
          ? 'good'
          : insights.completionRate >= 40
            ? 'warning'
            : 'danger',
    },
    {
      label: 'Blocked',
      value: String(insights.blocked),
      meta: insights.blocked === 1 ? 'task waiting' : 'tasks waiting',
      tone: insights.blocked > 0 ? 'danger' : 'good',
    },
    {
      label: 'Overdue',
      value: String(insights.overdue),
      meta: insights.overdue === 1 ? 'task late' : 'tasks late',
      tone: insights.overdue > 0 ? 'warning' : 'good',
    },
    {
      label: 'Due soon',
      value: String(insights.dueSoon),
      meta: 'next 7 days',
      tone: insights.dueSoon > 0 ? 'warning' : 'good',
    },
  ];

  async function handleCopyBriefing() {
    try {
      await window.navigator.clipboard.writeText(insights.briefingDraft);
      setCopyStatus('success');
      setExportStatus('idle');
    } catch {
      setCopyStatus('error');
      setExportStatus('idle');
    }
  }

  function handleDownloadQueue() {
    try {
      const filename = `workpulse-task-queue-${new Date().toISOString().slice(0, 10)}.csv`;
      const blob = new Blob([buildTaskQueueCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const href = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(href);
      setExportStatus('success');
      setCopyStatus('idle');
    } catch {
      setExportStatus('error');
      setCopyStatus('idle');
    }
  }

  return (
    <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_1.1fr]">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold tracking-normal">{metric.value}</span>
              <span className={`rounded-md px-2 py-1 text-xs ${toneClass(metric.tone)}`}>
                {metric.meta}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-md border bg-background p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-accent" aria-hidden="true" />
          Filtered queue focus
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {insights.focusItems.map((item) => (
            <div key={item.title} className={`rounded-md p-3 text-sm ${toneClass(item.tone)}`}>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 leading-5">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border bg-background p-3 xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessagesSquare className="h-4 w-4 text-accent" aria-hidden="true" />
              Queue briefing draft
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{queueActionMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium"
              onClick={handleDownloadQueue}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {exportStatus === 'success' ? 'Downloaded' : 'CSV'}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium"
              onClick={handleCopyBriefing}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copyStatus === 'success' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line rounded-md bg-secondary p-3 text-sm leading-6 text-muted-foreground">
          {insights.briefingDraft}
        </p>
      </div>
    </div>
  );
}

function LiveTaskTable({
  rows,
  activeTaskId,
  onUpdateTask,
  emptyMessage = 'No active tasks were returned for this workspace.',
}: {
  rows: WorkTask[];
  activeTaskId: string | null;
  onUpdateTask: (task: WorkTask, payload: UpdateTaskPayload) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Task</th>
            <th>Project</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Progress</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="py-4 font-medium">{row.title}</td>
              <td>{row.project.name}</td>
              <td>{row.assignee?.name ?? 'Unassigned'}</td>
              <td>
                <BadgeText>{titleCase(row.status)}</BadgeText>
              </td>
              <td>{titleCase(row.priority)}</td>
              <td>{formatDate(row.dueDate)}</td>
              <td>{row.progress}%</td>
              <td>
                <TaskQuickActions
                  task={row}
                  active={activeTaskId === row.id}
                  onUpdateTask={onUpdateTask}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {rows.length} live records</span>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-1">Previous</button>
          <button className="rounded-md border px-3 py-1">Next</button>
        </div>
      </div>
    </div>
  );
}

function TaskQuickActions({
  task,
  active,
  onUpdateTask,
}: {
  task: WorkTask;
  active: boolean;
  onUpdateTask: (task: WorkTask, payload: UpdateTaskPayload) => void;
}) {
  const completed = task.status === 'COMPLETED';

  return (
    <div className="flex min-w-48 flex-wrap gap-2">
      <button
        className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-60"
        disabled={active || completed || task.status === 'IN_PROGRESS'}
        onClick={() =>
          onUpdateTask(task, {
            status: 'IN_PROGRESS',
            progress: Math.max(task.progress, 25),
            note: 'Started from task follow-through quick action.',
          })
        }
      >
        {active ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <Clock className="h-3 w-3" aria-hidden="true" />
        )}
        Start
      </button>
      <button
        className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-60"
        disabled={active || completed || task.status === 'REVIEW'}
        onClick={() =>
          onUpdateTask(task, {
            status: 'REVIEW',
            progress: Math.max(task.progress, 80),
            note: 'Moved to review from task follow-through quick action.',
          })
        }
      >
        {active ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <Search className="h-3 w-3" aria-hidden="true" />
        )}
        Review
      </button>
      <button
        className="inline-flex h-8 items-center gap-1 rounded-md bg-success/15 px-2 text-xs font-medium text-success disabled:opacity-60"
        disabled={active || completed}
        onClick={() =>
          onUpdateTask(task, {
            status: 'COMPLETED',
            progress: 100,
            actualHours: task.actualHours ?? task.estimatedHours ?? undefined,
            note: 'Completed from task follow-through quick action.',
          })
        }
      >
        {active ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        )}
        Done
      </button>
    </div>
  );
}

function taskFiltersActive(query: WorkTaskQuery) {
  return Boolean(
    query.status || query.priority || query.projectId || query.assigneeId || query.limit !== 25,
  );
}

function savedTaskViewBadges(view: SavedTaskFilterView) {
  const badges = [
    view.filters.status ? `Status: ${titleCase(view.filters.status)}` : '',
    view.filters.priority ? `Priority: ${titleCase(view.filters.priority)}` : '',
    view.filters.projectId ? 'Project scoped' : '',
    view.filters.assigneeId ? 'Owner scoped' : '',
    `${view.filters.limit} rows`,
  ].filter(Boolean);

  return badges.length > 0 ? badges : ['Default queue'];
}

function savedTaskViewAgeLabel(savedAt: string) {
  const ageDays = savedTaskViewAgeDays(savedAt);

  if (ageDays <= 1) return 'Fresh';
  if (ageDays <= 7) return `${ageDays}d old`;
  return 'Review';
}

function savedTaskViewAgeTone(savedAt: string) {
  const ageDays = savedTaskViewAgeDays(savedAt);

  if (ageDays <= 1) return 'bg-success/15 text-success';
  if (ageDays <= 7) return 'bg-secondary text-muted-foreground';
  return 'bg-warning/15 text-warning';
}

function savedTaskViewAgeDays(savedAt: string) {
  const savedTime = new Date(savedAt).getTime();
  if (Number.isNaN(savedTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - savedTime) / 86400000));
}

function getSavedTaskViewMaintenance(views: SavedTaskFilterView[], currentFilterSignature: string) {
  const fresh = views.filter((view) => savedTaskViewAgeDays(view.savedAt) <= 1).length;
  const review = views.filter((view) => savedTaskViewAgeDays(view.savedAt) > 7).length;
  const currentMatches = views.filter(
    (view) => taskFilterSignature(view.filters) === currentFilterSignature,
  ).length;
  const duplicateGroups = Array.from(
    views.reduce((groups, view) => {
      const signature = taskFilterSignature(view.filters);
      groups.set(signature, [...(groups.get(signature) ?? []), view]);
      return groups;
    }, new Map<string, SavedTaskFilterView[]>()),
  )
    .map(([, group]) => group)
    .filter((group) => group.length > 1);
  const duplicateViews = duplicateGroups.reduce((total, group) => total + group.length, 0);
  const firstDuplicateGroup = duplicateGroups[0] ?? [];
  const overlapsByViewId = new Map(
    duplicateGroups.flatMap((group) =>
      group.map((view) => [
        view.id,
        group.filter((item) => item.id !== view.id).map((item) => item.name),
      ]),
    ),
  );
  const overlapCueByViewId = new Map(
    duplicateGroups.flatMap((group) => {
      const [newestView] = sortSavedTaskViewsByNewest(group);

      return group.map((view) => [
        view.id,
        view.id === newestView?.id
          ? { label: 'Keep newest', tone: 'good' }
          : { label: 'Cleanup candidate', tone: 'warning' },
      ]);
    }),
  );
  const cleanupCandidateIds = duplicateGroups.flatMap((group) => {
    const [, ...olderViews] = sortSavedTaskViewsByNewest(group);
    return olderViews.map((view) => view.id);
  });
  const exportStatus =
    duplicateViews > 0 ? 'blocked' : review > 0 ? 'review' : views.length > 0 ? 'ready' : 'empty';
  const exportLabel =
    exportStatus === 'blocked'
      ? 'Export needs cleanup'
      : exportStatus === 'review'
        ? 'Export with review'
        : 'Export ready';

  const nextRefreshView =
    [...views].sort((first, second) => {
      const ageDifference =
        savedTaskViewAgeDays(second.savedAt) - savedTaskViewAgeDays(first.savedAt);
      return ageDifference !== 0 ? ageDifference : first.name.localeCompare(second.name);
    })[0] ?? null;

  const metrics = [
    {
      label: 'Saved',
      value: String(views.length),
      meta: views.length === 1 ? 'view' : 'views',
      tone: 'good',
    },
    {
      label: 'Fresh',
      value: String(fresh),
      meta: '0-1d old',
      tone: fresh > 0 ? 'good' : 'warning',
    },
    {
      label: 'Review',
      value: String(review),
      meta: '>7d old',
      tone: review > 0 ? 'warning' : 'good',
    },
    {
      label: 'Current',
      value: String(currentMatches),
      meta: currentMatches === 1 ? 'match' : 'matches',
      tone: currentMatches > 0 ? 'good' : 'warning',
    },
    {
      label: 'Overlap',
      value: String(duplicateViews),
      meta: duplicateViews === 1 ? 'view' : 'views',
      tone: duplicateViews > 0 ? 'warning' : 'good',
    },
    {
      label: 'Export',
      value: exportStatus === 'blocked' ? 'Hold' : exportStatus === 'review' ? 'Review' : 'Ready',
      meta:
        exportStatus === 'blocked'
          ? 'cleanup first'
          : exportStatus === 'review'
            ? 'stale views'
            : 'clean set',
      tone: exportStatus === 'blocked' || exportStatus === 'review' ? 'warning' : 'good',
    },
  ];

  const message =
    duplicateViews > 0
      ? `Overlap detected across ${duplicateGroups.length} saved filter set${duplicateGroups.length === 1 ? '' : 's'}. Clean ${cleanupCandidateIds.length} older duplicate${cleanupCandidateIds.length === 1 ? '' : 's'} or compare ${firstDuplicateGroup.map((view) => `"${view.name}"`).join(' and ')} before exporting.`
      : review > 0 && nextRefreshView
        ? `${review} saved view${review === 1 ? '' : 's'} need review. Refresh "${nextRefreshView.name}" first, then export the updated set.`
        : currentMatches > 0
          ? 'The current live filters already match a saved view. Refresh only when the queue context changes.'
          : 'No saved view matches the current live filters yet. Save or refresh a view before recurring reviews.';

  return {
    metrics,
    message,
    overlapsByViewId,
    overlapCueByViewId,
    cleanupCandidateIds,
    exportLabel,
  };
}

function sortSavedTaskViewsByNewest(views: SavedTaskFilterView[]) {
  return [...views].sort(
    (first, second) =>
      new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime() ||
      first.name.localeCompare(second.name),
  );
}

function taskFilterSignature(filters: SavedTaskFilterView['filters']) {
  return [
    filters.status || '',
    filters.priority || '',
    filters.projectId || '',
    filters.assigneeId || '',
    String(filters.limit),
  ].join('|');
}

function parseSavedTaskFilterViews(value: string): SavedTaskFilterView[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Saved task filter view export must be an array.');

  const views = parsed.map(normalizeSavedTaskFilterView);
  if (views.length === 0) throw new Error('Saved task filter view export is empty.');
  return views;
}

function normalizeSavedTaskFilterView(value: unknown): SavedTaskFilterView {
  if (!isRecord(value)) throw new Error('Saved task filter view must be an object.');
  if (!isRecord(value.filters)) throw new Error('Saved task filter view filters are missing.');

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name) throw new Error('Saved task filter view name is missing.');

  const status = normalizeTaskStatus(value.filters.status);
  const priority = normalizeTaskPriority(value.filters.priority);
  const projectId = typeof value.filters.projectId === 'string' ? value.filters.projectId : '';
  const assigneeId = typeof value.filters.assigneeId === 'string' ? value.filters.assigneeId : '';
  const limit = normalizeTaskLimit(value.filters.limit);
  const savedAt =
    typeof value.savedAt === 'string' && !Number.isNaN(new Date(value.savedAt).getTime())
      ? value.savedAt
      : new Date().toISOString();

  return {
    id: typeof value.id === 'string' && value.id ? value.id : `task-view-${Date.now()}`,
    name,
    filters: {
      status,
      priority,
      projectId,
      assigneeId,
      limit,
    },
    savedAt,
  };
}

function mergeSavedTaskFilterViews(
  current: SavedTaskFilterView[],
  importedViews: SavedTaskFilterView[],
) {
  const viewsByName = new Map(current.map((view) => [view.name, view]));
  importedViews.forEach((view) => viewsByName.set(view.name, view));
  return Array.from(viewsByName.values()).sort(
    (first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime(),
  );
}

function normalizeTaskStatus(value: unknown): WorkTaskQuery['status'] | '' {
  return typeof value === 'string' && taskStatuses.includes(value)
    ? (value as WorkTaskQuery['status'])
    : '';
}

function normalizeTaskPriority(value: unknown): WorkTaskQuery['priority'] | '' {
  return typeof value === 'string' && taskPriorities.includes(value)
    ? (value as WorkTaskQuery['priority'])
    : '';
}

function normalizeTaskLimit(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return [10, 25, 50, 100].includes(parsed) ? parsed : 25;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getTaskQueueInsights(rows: WorkTask[]): TaskQueueInsight {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 7);
  const activeRows = rows.filter((task) => task.status !== 'COMPLETED');
  const blocked = rows.filter((task) => task.status === 'BLOCKED').length;
  const overdue = activeRows.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < today;
  }).length;
  const dueSoon = activeRows.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= soon;
  }).length;
  const urgent = activeRows.filter((task) => task.priority === 'URGENT').length;
  const completed = rows.filter((task) => task.status === 'COMPLETED').length;
  const completionRate = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;
  const focusItems = buildTaskFocusItems({
    total: rows.length,
    blocked,
    overdue,
    dueSoon,
    urgent,
    completionRate,
  });
  const briefingDraft = buildTaskQueueBriefing(rows, {
    total: rows.length,
    blocked,
    overdue,
    dueSoon,
    urgent,
    completionRate,
  });

  return {
    total: rows.length,
    blocked,
    overdue,
    dueSoon,
    urgent,
    completionRate,
    briefingDraft,
    focusItems,
  };
}

function buildTaskFocusItems({
  total,
  blocked,
  overdue,
  dueSoon,
  urgent,
  completionRate,
}: Omit<TaskQueueInsight, 'briefingDraft' | 'focusItems'>): TaskQueueInsight['focusItems'] {
  const items: TaskQueueInsight['focusItems'] = [];

  if (total === 0) {
    return [
      {
        title: 'No matching work',
        body: 'Clear a filter or broaden the row limit to review more task records.',
        tone: 'warning',
      },
      {
        title: 'Queue is quiet',
        body: 'No task risks were returned by the current live filter set.',
        tone: 'good',
      },
      {
        title: 'Next move',
        body: 'Create a task or switch projects when new work needs tracking.',
        tone: 'good',
      },
    ];
  }

  if (blocked > 0) {
    items.push({
      title: 'Unblock first',
      body: `${blocked} filtered task${blocked === 1 ? ' is' : 's are'} blocked and should get owner follow-up.`,
      tone: 'danger',
    });
  }

  if (overdue > 0) {
    items.push({
      title: 'Recover dates',
      body: `${overdue} active task${overdue === 1 ? ' is' : 's are'} overdue in this queue.`,
      tone: 'warning',
    });
  }

  if (urgent > 0) {
    items.push({
      title: 'Protect urgent work',
      body: `${urgent} urgent task${urgent === 1 ? ' needs' : 's need'} capacity checked today.`,
      tone: 'warning',
    });
  }

  if (dueSoon > 0) {
    items.push({
      title: 'Plan the week',
      body: `${dueSoon} active task${dueSoon === 1 ? ' is' : 's are'} due in the next 7 days.`,
      tone: 'warning',
    });
  }

  if (completionRate >= 70) {
    items.push({
      title: 'Momentum is healthy',
      body: `${completionRate}% of returned tasks are complete. Keep the filtered queue moving.`,
      tone: 'good',
    });
  }

  if (items.length === 0) {
    items.push({
      title: 'No visible risk',
      body: 'The returned queue has no blocked, overdue, urgent, or due-soon tasks.',
      tone: 'good',
    });
  }

  while (items.length < 3) {
    items.push({
      title: 'Next review',
      body: 'Use status, priority, owner, or project filters to narrow the queue further.',
      tone: 'good',
    });
  }

  return items.slice(0, 3);
}

function buildTaskQueueBriefing(
  rows: WorkTask[],
  insight: Omit<TaskQueueInsight, 'briefingDraft' | 'focusItems'>,
) {
  if (insight.total === 0) {
    return [
      'Task queue update:',
      'No tasks match the current filter set.',
      'Recommended next step: broaden filters or create new tracked work if this queue should not be empty.',
    ].join('\n');
  }

  const topTasks = rows
    .filter((task) => task.status !== 'COMPLETED')
    .slice()
    .sort(compareTaskRisk)
    .slice(0, 3)
    .map((task) => {
      const owner = task.assignee?.name ?? 'Unassigned';
      return `- ${task.title} (${titleCase(task.priority)}, ${titleCase(task.status)}, ${owner}, due ${formatDate(task.dueDate)})`;
    });

  return [
    'Task queue update:',
    `${insight.total} task${insight.total === 1 ? '' : 's'} returned; ${insight.completionRate}% complete.`,
    `${insight.blocked} blocked, ${insight.overdue} overdue, ${insight.dueSoon} due in the next 7 days, ${insight.urgent} urgent.`,
    topTasks.length > 0
      ? ['Focus list:', ...topTasks].join('\n')
      : 'Focus list: no active tasks returned.',
    'Recommended next step: confirm owners and dates for the highest-risk items before the next check-in.',
  ].join('\n');
}

function buildTaskQueueCsv(rows: WorkTask[]) {
  const headers = [
    'Task',
    'Project',
    'Owner',
    'Status',
    'Priority',
    'Due date',
    'Progress',
    'Estimated hours',
    'Actual hours',
    'Description',
  ];
  const body = rows.map((task) => [
    task.title,
    task.project.name,
    task.assignee?.name ?? 'Unassigned',
    titleCase(task.status),
    titleCase(task.priority),
    task.dueDate ? formatDate(task.dueDate) : '',
    `${task.progress}%`,
    task.estimatedHours ?? '',
    task.actualHours ?? '',
    task.description ?? '',
  ]);

  return [headers, ...body].map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string | number) {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function compareTaskRisk(first: WorkTask, second: WorkTask) {
  return taskRiskScore(second) - taskRiskScore(first);
}

function taskRiskScore(task: WorkTask) {
  const statusWeight: Record<string, number> = {
    BLOCKED: 60,
    ON_HOLD: 40,
    IN_PROGRESS: 20,
    REVIEW: 10,
    NOT_STARTED: 5,
  };
  const priorityWeight: Record<string, number> = {
    URGENT: 30,
    HIGH: 20,
    MEDIUM: 10,
    LOW: 0,
  };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueWeight = dueDate
    ? Math.max(-10, Math.min(30, Math.ceil((today.getTime() - dueDate.getTime()) / 86400000) * 5))
    : 0;

  return (
    (statusWeight[task.status] ?? 0) +
    (priorityWeight[task.priority] ?? 0) +
    dueWeight +
    Math.max(0, 100 - task.progress) / 10
  );
}

function formatDate(value: string | null) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(value),
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function PeopleExperience({ role, session }: { role: RoleKey; session: SessionState | null }) {
  const [people, setPeople] = useState<WorkPeople | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live organization data.');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeTitle, setEmployeeTitle] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeRole, setEmployeeRole] =
    useState<NonNullable<CreateEmployeePayload['role']>>('EMPLOYEE');
  const [employeeTeamId, setEmployeeTeamId] = useState('');
  const [employeeDepartmentId, setEmployeeDepartmentId] = useState('');
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error' | 'success'>(
    'idle',
  );
  const [createMessage, setCreateMessage] = useState('');
  const employeeNameRef = useRef<HTMLInputElement>(null);
  const roleFilterRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!session) {
      setPeople(null);
      setStatus('idle');
      setMessage('Sign in to load live organization data.');
      return;
    }

    setStatus('loading');
    setMessage('Loading live organization data...');
    getWorkPeople(session.accessToken)
      .then((response) => {
        setPeople(response);
        setStatus('idle');
        setMessage('Live organization data connected.');
      })
      .catch((error: unknown) => {
        setPeople(null);
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load live organization data.',
        );
      });
  }, [session]);

  const hasLiveData = Boolean(people);
  const hasFilters = Boolean(roleFilter || statusFilter || teamFilter || departmentFilter);
  const visiblePeople = useMemo(() => {
    if (!people) return null;

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = (values: Array<string | null | undefined>) =>
      !query || values.some((value) => value?.toLowerCase().includes(query));

    return {
      ...people,
      employees: people.employees.filter(
        (employee) =>
          matchesQuery([
            employee.name,
            employee.email,
            employee.title,
            ...employee.roles,
            ...employee.teams.map((team) => team.name),
            ...employee.departments.map((department) => department.name),
          ]) &&
          (!roleFilter || employee.roles.includes(roleFilter)) &&
          (!statusFilter || String(employee.isActive) === statusFilter) &&
          (!teamFilter || employee.teams.some((team) => team.id === teamFilter)) &&
          (!departmentFilter ||
            employee.departments.some((department) => department.id === departmentFilter)),
      ),
      teams: people.teams.filter((team) =>
        matchesQuery([team.name, team.description, team.leader?.name, team.department?.name]),
      ),
      departments: people.departments.filter((department) =>
        matchesQuery([department.name, department.description]),
      ),
    };
  }, [departmentFilter, people, roleFilter, searchQuery, statusFilter, teamFilter]);

  function clearPeopleFilters() {
    setRoleFilter('');
    setStatusFilter('');
    setTeamFilter('');
    setDepartmentFilter('');
  }

  function openPeopleFilters() {
    setShowFilters((current) => !current);
    window.setTimeout(() => roleFilterRef.current?.focus(), 0);
  }

  function openCreateEmployee() {
    setShowCreate(true);
    setCreateStatus('idle');
    setCreateMessage('');
    window.setTimeout(() => employeeNameRef.current?.focus(), 0);
  }

  async function handleCreateEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setCreateStatus('error');
      setCreateMessage('Sign in as a company administrator to create an employee.');
      return;
    }

    setCreateStatus('loading');
    setCreateMessage('Creating employee account...');
    try {
      const response = await createWorkEmployee(session.accessToken, {
        name: employeeName.trim(),
        email: employeeEmail.trim(),
        title: employeeTitle.trim() || undefined,
        role: employeeRole,
        temporaryPassword: employeePassword,
        teamId: employeeTeamId || undefined,
        departmentId: employeeDepartmentId || undefined,
      });
      setPeople(response);
      setEmployeeName('');
      setEmployeeEmail('');
      setEmployeeTitle('');
      setEmployeePassword('');
      setEmployeeRole('EMPLOYEE');
      setEmployeeTeamId('');
      setEmployeeDepartmentId('');
      setCreateStatus('success');
      setCreateMessage('Employee account created and added to the organization.');
    } catch (error) {
      setCreateStatus('error');
      setCreateMessage(error instanceof ApiError ? error.message : 'Unable to create employee.');
    }
  }

  return (
    <div className="space-y-6">
      <Toolbar
        title={role === 'team-leader' ? 'My team' : 'Organization management'}
        searchOpen={searchOpen}
        searchValue={searchQuery}
        searchPlaceholder="Search people, teams, or departments"
        searchClearLabel="Clear organization search"
        onSearchToggle={() => setSearchOpen(true)}
        onSearchChange={setSearchQuery}
        onSearchClear={() => {
          setSearchQuery('');
          setSearchOpen(false);
        }}
        onFiltersClick={openPeopleFilters}
        onCreateClick={openCreateEmployee}
        showCreate={role === 'company-admin'}
      />
      {showFilters ? (
        <section className="rounded-lg border bg-card p-4 shadow-sm" aria-label="People filters">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-medium">
              Role
              <select
                ref={roleFilterRef}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="">All roles</option>
                <option value="COMPANY_ADMIN">Company admin</option>
                <option value="TEAM_LEADER">Team leader</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Status
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Team
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
              >
                <option value="">All teams</option>
                {people?.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Department
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="">All departments</option>
                {people?.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {visiblePeople?.employees.length ?? 0} employees match
            </p>
            <button
              type="button"
              className="h-10 rounded-md border bg-background px-3 text-sm font-medium disabled:opacity-50"
              disabled={!hasFilters}
              onClick={clearPeopleFilters}
            >
              Clear filters
            </button>
          </div>
        </section>
      ) : null}
      {showCreate && role === 'company-admin' ? (
        <Panel title="Create employee" action="Company admin">
          <form className="space-y-4" onSubmit={handleCreateEmployee}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm font-medium">
                Name
                <input
                  ref={employeeNameRef}
                  required
                  minLength={2}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeName}
                  onChange={(event) => setEmployeeName(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Work email
                <input
                  required
                  type="email"
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeEmail}
                  onChange={(event) => setEmployeeEmail(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Job title
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeTitle}
                  onChange={(event) => setEmployeeTitle(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Temporary password
                <input
                  required
                  type="password"
                  minLength={8}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeePassword}
                  onChange={(event) => setEmployeePassword(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Role
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeRole}
                  onChange={(event) =>
                    setEmployeeRole(
                      event.target.value as NonNullable<CreateEmployeePayload['role']>,
                    )
                  }
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TEAM_LEADER">Team leader</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Team
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeTeamId}
                  onChange={(event) => setEmployeeTeamId(event.target.value)}
                >
                  <option value="">No team</option>
                  {people?.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Department
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                  value={employeeDepartmentId}
                  onChange={(event) => setEmployeeDepartmentId(event.target.value)}
                >
                  <option value="">No department</option>
                  {people?.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={`text-sm ${createStatus === 'error' ? 'text-danger' : 'text-muted-foreground'}`}
                aria-live="polite"
              >
                {createMessage}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-10 rounded-md border bg-background px-3 text-sm font-medium"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  disabled={createStatus === 'loading'}
                >
                  {createStatus === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  Create employee
                </button>
              </div>
            </div>
          </form>
        </Panel>
      ) : null}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">Organization data</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {people ? (
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <LiveMetric label="Employees" value={people.summary.employees} />
              <LiveMetric label="Active" value={people.summary.activeEmployees} />
              <LiveMetric label="Submitted" value={people.summary.submittedToday} />
              <LiveMetric label="Blockers" value={people.summary.openBlockers} />
            </div>
          ) : null}
        </div>
      </section>
      <Panel title="Employees and teams" action={hasLiveData ? 'Live API' : 'Prototype fallback'}>
        {visiblePeople ? <LivePeopleTable people={visiblePeople} /> : <PrototypePeopleTable />}
      </Panel>
      {visiblePeople ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Teams" action={`${visiblePeople.teams.length} matching teams`}>
            <LiveTeamList teams={visiblePeople.teams} />
          </Panel>
          <Panel
            title="Departments"
            action={`${visiblePeople.departments.length} matching departments`}
          >
            <LiveDepartmentList departments={visiblePeople.departments} />
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function LivePeopleTable({ people }: { people: WorkPeople }) {
  if (people.employees.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No employees were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Employee</th>
            <th>Team</th>
            <th>Daily update</th>
            <th>Workload</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {people.employees.map((employee) => (
            <tr key={employee.id}>
              <td className="py-4">
                <p className="font-medium">{employee.name}</p>
                <p className="text-xs text-muted-foreground">{employee.title ?? employee.email}</p>
              </td>
              <td>{employee.teams.map((team) => team.name).join(', ') || 'Unassigned'}</td>
              <td>
                {employee.dailyUpdate
                  ? `${titleCase(employee.dailyUpdate.status)} at ${formatTime(employee.dailyUpdate.submittedAt)}`
                  : 'Missing'}
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <BadgeText>{employee.workload.activeTasks} active</BadgeText>
                  {employee.workload.overdueTasks > 0 ? (
                    <BadgeText>{employee.workload.overdueTasks} overdue</BadgeText>
                  ) : null}
                  {employee.workload.openBlockers > 0 ? (
                    <BadgeText>{employee.workload.openBlockers} blockers</BadgeText>
                  ) : null}
                </div>
              </td>
              <td>{employee.roles.map(titleCase).join(', ')}</td>
              <td>
                <BadgeText>{employee.isActive ? 'Active' : 'Inactive'}</BadgeText>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrototypePeopleTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Employee</th>
            <th>Team</th>
            <th>Daily update</th>
            <th>Workload</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {employees.map((employee) => (
            <tr key={employee.name}>
              <td className="py-4 font-medium">{employee.name}</td>
              <td>{employee.team}</td>
              <td>{employee.submitted}</td>
              <td>{employee.workload}</td>
              <td>
                <BadgeText>{employee.status}</BadgeText>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveTeamList({ teams }: { teams: WorkPeople['teams'] }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No teams were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div key={team.id} className="rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{team.name}</p>
            <BadgeText>{team.department?.name ?? 'No department'}</BadgeText>
          </div>
          <p className="mt-2 text-muted-foreground">Lead: {team.leader?.name ?? 'Unassigned'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BadgeText>{team.counts.members} members</BadgeText>
            <BadgeText>{team.counts.projects} projects</BadgeText>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveDepartmentList({ departments }: { departments: WorkPeople['departments'] }) {
  if (departments.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No departments were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {departments.map((department) => (
        <div key={department.id} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{department.name}</p>
          {department.description ? (
            <p className="mt-1 text-muted-foreground">{department.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <BadgeText>{department.counts.members} members</BadgeText>
            <BadgeText>{department.counts.teams} teams</BadgeText>
            <BadgeText>{department.counts.projects} projects</BadgeText>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockersExperience({ session }: { session: SessionState | null }) {
  const [liveBlockers, setLiveBlockers] = useState<WorkBlocker[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live blocker records.');
  const [actionStatus, setActionStatus] = useState<'idle' | 'resolving' | 'success' | 'error'>(
    'idle',
  );
  const [actionMessage, setActionMessage] = useState(
    'Resolve a blocker once the live dashboard is connected.',
  );
  const [activeBlockerId, setActiveBlockerId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLiveBlockers([]);
      setStatus('idle');
      setMessage('Sign in to load live blocker records.');
      setActionStatus('idle');
      setActionMessage('Resolve a blocker once the live dashboard is connected.');
      setActiveBlockerId(null);
      return;
    }

    setStatus('loading');
    setMessage('Loading live blockers...');
    getWorkBlockers(session.accessToken)
      .then((response) => {
        setLiveBlockers(response);
        setStatus('idle');
        setMessage('Live blocker dashboard connected.');
      })
      .catch((error: unknown) => {
        setLiveBlockers([]);
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load live blockers.');
      });
  }, [session]);

  async function handleResolveBlocker(blocker: WorkBlocker) {
    if (!session) return;

    setActionStatus('resolving');
    setActionMessage(`Resolving blocker for ${blocker.project.name}...`);
    setActiveBlockerId(blocker.id);

    try {
      const resolved = await resolveWorkBlocker(
        session.accessToken,
        blocker.id,
        `Resolved from WorkPulse dashboard on ${new Date().toLocaleDateString()}.`,
      );
      setLiveBlockers((current) =>
        current.map((item) => (item.id === resolved.id ? resolved : item)),
      );
      setActionStatus('success');
      setActionMessage('Blocker resolved and the owner was notified.');
    } catch (error: unknown) {
      setActionStatus('error');
      setActionMessage(error instanceof ApiError ? error.message : 'Unable to resolve blocker.');
    } finally {
      setActiveBlockerId(null);
    }
  }

  const hasLiveData = liveBlockers.length > 0;
  const openCount = liveBlockers.filter((blocker) => blocker.status === 'OPEN').length;
  const escalatedCount = liveBlockers.filter((blocker) => blocker.status === 'ESCALATED').length;
  const highRiskCount = liveBlockers.filter(
    (blocker) => blocker.severity === 'HIGH' || blocker.severity === 'CRITICAL',
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">Blocker data</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {hasLiveData ? (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <LiveMetric label="Open" value={openCount} />
              <LiveMetric label="Escalated" value={escalatedCount} />
              <LiveMetric label="High risk" value={highRiskCount} />
            </div>
          ) : null}
        </div>
        {hasLiveData ? (
          <p
            className={`mt-4 rounded-md p-3 text-sm ${
              actionStatus === 'error'
                ? 'bg-danger/10 text-danger'
                : actionStatus === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {actionMessage}
          </p>
        ) : null}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Blocker dashboard" action={hasLiveData ? 'Live API' : 'Prototype fallback'}>
          {hasLiveData ? (
            <LiveBlockerList
              rows={liveBlockers}
              activeBlockerId={activeBlockerId}
              onResolve={handleResolveBlocker}
            />
          ) : (
            <BlockerList />
          )}
        </Panel>
        <Panel
          title="Escalation readiness"
          action={hasLiveData ? `${escalatedCount} escalated` : 'Configurable later'}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="blockers" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReportsExperience({ session }: { session: SessionState | null }) {
  const prototypeReports: WorkReport[] = [
    {
      id: 'prototype-daily',
      type: 'DAILY',
      title: 'Daily management report',
      periodStart: null,
      periodEnd: null,
      filters: {},
      content: {
        generatedFrom: 'daily_operational_snapshot',
        headline:
          'Submission coverage is improving, but blockers and overdue work still need manager attention.',
        aiSummary: 'A manager-ready daily view with coverage, priorities, and latest activity.',
        metrics: {
          submittedToday: 42,
          submissionRate: 82,
          openBlockers: 6,
          overdueTasks: 9,
        },
        priorities: [
          {
            id: 'prototype-priority-1',
            title: 'Escalate critical blockers',
            body: 'Two critical blockers have crossed the same-day response window.',
            tone: 'danger',
          },
          {
            id: 'prototype-priority-2',
            title: 'Follow up missing updates',
            body: 'Several active contributors have not submitted today.',
            tone: 'warning',
          },
        ],
        activity: [
          {
            id: 'prototype-activity-1',
            title: 'Payment milestone moved to review',
            body: 'Latest progress was saved with implementation notes.',
            createdAt: '2026-07-31T09:30:00.000Z',
          },
        ],
      },
      fileKey: null,
      createdAt: '2026-07-31T09:30:00.000Z',
      creator: { id: 'prototype-user', name: 'Prototype manager', email: 'manager@example.com' },
      project: null,
    },
    {
      id: 'prototype-weekly',
      type: 'WEEKLY',
      title: 'Weekly team report',
      periodStart: '2026-07-25',
      periodEnd: '2026-07-31',
      filters: {},
      content: {
        aiSummary:
          'Team delivery is steady with a few blocked items concentrated in platform dependencies.',
        metrics: {
          activeProjects: 8,
          completedTasks: 34,
          openBlockers: 5,
          overdueTasks: 7,
        },
        tasksByStatus: {
          IN_PROGRESS: 18,
          REVIEW: 6,
          COMPLETED: 34,
          BLOCKED: 5,
        },
        blockersByStatus: {
          OPEN: 3,
          IN_REVIEW: 2,
        },
        recentProgress: [
          {
            id: 'prototype-progress-1',
            workCompleted:
              'Completed API integration checks and sent the dashboard update to review.',
            progressPercent: 85,
            user: { name: 'Aarav Singh' },
            project: { name: 'Operations Console' },
          },
        ],
        topBlockers: [
          {
            id: 'prototype-blocker-1',
            description: 'Waiting on vendor credentials for payment reconciliation.',
            severity: 'HIGH',
            project: { name: 'Billing Automation' },
          },
        ],
      },
      fileKey: null,
      createdAt: '2026-07-31T09:30:00.000Z',
      creator: { id: 'prototype-user', name: 'Prototype manager', email: 'manager@example.com' },
      project: null,
    },
    {
      id: 'prototype-monthly',
      type: 'MONTHLY',
      title: 'Monthly department report',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      filters: {},
      content: {
        aiSummary:
          'Department throughput improved while risk remained concentrated in cross-team dependencies.',
        metrics: {
          activeEmployees: 51,
          completionRate: 74,
          delayedProjects: 2,
          criticalBlockers: 1,
        },
        tasksByStatus: {
          COMPLETED: 122,
          IN_PROGRESS: 39,
          BLOCKED: 8,
        },
      },
      fileKey: null,
      createdAt: '2026-07-31T09:30:00.000Z',
      creator: { id: 'prototype-user', name: 'Prototype manager', email: 'manager@example.com' },
      project: null,
    },
    {
      id: 'prototype-project',
      type: 'PROJECT',
      title: 'Project health report',
      periodStart: '2026-07-25',
      periodEnd: '2026-07-31',
      filters: {},
      content: {
        aiSummary:
          'The project remains on track, with one high-severity dependency needing ownership clarity.',
        metrics: {
          progress: 68,
          completedTasks: 19,
          openBlockers: 2,
          overdueTasks: 3,
        },
        blockersByStatus: {
          OPEN: 1,
          IN_REVIEW: 1,
        },
        topBlockers: [
          {
            id: 'prototype-project-blocker',
            description: 'Design approval needed before final QA can start.',
            severity: 'HIGH',
          },
        ],
      },
      fileKey: null,
      createdAt: '2026-07-31T09:30:00.000Z',
      creator: { id: 'prototype-user', name: 'Prototype manager', email: 'manager@example.com' },
      project: { id: 'prototype-project', name: 'Customer Portal', status: 'ACTIVE' },
    },
  ];
  const [liveReports, setLiveReports] = useState<WorkReport[]>([]);
  const [liveProjects, setLiveProjects] = useState<WorkProject[]>([]);
  const [livePeople, setLivePeople] = useState<WorkPeople | null>(null);
  const [sharedReports, setSharedReports] = useState<WorkSharedReport[]>([]);
  const [reportEngagement, setReportEngagement] = useState<WorkReportEngagement | null>(null);
  const [reportType, setReportType] = useState<CreateReportPayload['type']>('WEEKLY');
  const [reportTitle, setReportTitle] = useState('Weekly delivery health snapshot');
  const [projectId, setProjectId] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('Sign in to load generated reports.');
  const [generateMessage, setGenerateMessage] = useState('Sign in to generate live reports.');
  const [reportSearchOpen, setReportSearchOpen] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  useEffect(() => {
    if (!session) {
      setLiveReports([]);
      setLiveProjects([]);
      setLivePeople(null);
      setSharedReports([]);
      setReportEngagement(null);
      setProjectId('');
      setStatus('idle');
      setGenerateStatus('idle');
      setMessage('Sign in to load generated reports.');
      setGenerateMessage('Sign in to generate live reports.');
      return;
    }

    setStatus('loading');
    setMessage('Loading generated reports...');
    Promise.all([
      getWorkReports(session.accessToken),
      getWorkProjects(session.accessToken),
      getWorkPeople(session.accessToken),
      getWorkSharedReports(session.accessToken),
      getWorkReportEngagement(session.accessToken),
    ])
      .then(
        ([
          reportsResponse,
          projectsResponse,
          peopleResponse,
          sharedReportsResponse,
          engagementResponse,
        ]) => {
          setLiveReports(reportsResponse);
          setLiveProjects(projectsResponse);
          setLivePeople(peopleResponse);
          setSharedReports(sharedReportsResponse);
          setReportEngagement(engagementResponse);
          setStatus('idle');
          setMessage('Live reports connected.');
          setGenerateMessage('Generate a saved report from current workspace data.');
        },
      )
      .catch((error: unknown) => {
        setLiveReports([]);
        setLiveProjects([]);
        setLivePeople(null);
        setSharedReports([]);
        setReportEngagement(null);
        setProjectId('');
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load generated reports.');
        setGenerateMessage('Report generation needs live workspace data.');
      });
  }, [session]);

  const hasLiveData = liveReports.length > 0;
  const projectReportCount = liveReports.filter((report) => report.project).length;
  const availableReports = hasLiveData ? liveReports : prototypeReports;
  const normalizedReportSearch = reportSearchQuery.trim().toLowerCase();
  const filteredReports = normalizedReportSearch
    ? availableReports.filter((report) =>
        [
          report.title,
          report.type,
          report.project?.name,
          report.creator?.name,
          reportSummary(report),
          reportPeriod(report),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedReportSearch),
      )
    : availableReports;

  async function handleGenerateReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setGenerateStatus('error');
      setGenerateMessage('Sign in before generating a report.');
      return;
    }

    if (!reportTitle.trim()) {
      setGenerateStatus('error');
      setGenerateMessage('Enter a report title.');
      return;
    }

    setGenerateStatus('submitting');
    setGenerateMessage('Generating report...');

    try {
      const report = await createWorkReport(session.accessToken, {
        type: reportType,
        title: reportTitle,
        projectId: projectId || undefined,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
      });

      setLiveReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      setGenerateStatus('success');
      setGenerateMessage(`Generated "${report.title}".`);
    } catch (error: unknown) {
      setGenerateStatus('error');
      setGenerateMessage(
        error instanceof ApiError ? error.message : 'Unable to generate report right now.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <Toolbar
        title="Reports"
        searchOpen={reportSearchOpen}
        searchValue={reportSearchQuery}
        searchPlaceholder="Search reports"
        searchClearLabel="Clear report search"
        onSearchToggle={() => setReportSearchOpen((current) => !current)}
        onSearchChange={setReportSearchQuery}
        onSearchClear={() => {
          setReportSearchQuery('');
          setReportSearchOpen(false);
        }}
      />
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">Report data</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {hasLiveData ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <LiveMetric label="Reports" value={liveReports.length} />
              <LiveMetric label="Project-linked" value={projectReportCount} />
            </div>
          ) : null}
        </div>
      </section>
      <Panel title="Generate report" action={session ? 'Live API' : 'Sign in required'}>
        <form className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" onSubmit={handleGenerateReport}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Report title</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Type</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={reportType}
                onChange={(event) =>
                  setReportType(event.target.value as CreateReportPayload['type'])
                }
              >
                {['DAILY', 'WEEKLY', 'MONTHLY', 'PROJECT', 'TEAM', 'DEPARTMENT', 'CUSTOM'].map(
                  (type) => (
                    <option key={type} value={type}>
                      {titleCase(type)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Project</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">All projects</option>
                {liveProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Start</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">End</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={generateStatus === 'submitting' || !session}
            >
              {generateStatus === 'submitting' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              Generate report
            </button>
            <p
              className={`min-h-10 flex-1 rounded-md p-3 text-sm ${
                generateStatus === 'error'
                  ? 'bg-danger/10 text-danger'
                  : generateStatus === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {generateMessage}
            </p>
          </div>
        </form>
      </Panel>
      {session ? <ReportEngagementPanel engagement={reportEngagement} /> : null}
      {session ? (
        <SharedReportInbox
          rows={sharedReports}
          session={session}
          people={livePeople}
          onViewed={(reportId, viewedAt) =>
            setSharedReports((current) =>
              current.map((share) =>
                share.reportId === reportId ? { ...share, viewedAt } : share,
              ),
            )
          }
          onFeedback={(reportId, feedback, feedbackAt) =>
            setSharedReports((current) =>
              current.map((share) =>
                share.reportId === reportId ? { ...share, feedback, feedbackAt } : share,
              ),
            )
          }
        />
      ) : null}
      {filteredReports.length > 0 ? (
        <>
          {normalizedReportSearch ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
              for &quot;{reportSearchQuery.trim()}&quot;.
            </p>
          ) : null}
          <LiveReportGrid rows={filteredReports} session={session} people={livePeople} />
        </>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No reports match &quot;{reportSearchQuery.trim()}&quot;. Clear the search to see all
          reports.
        </div>
      )}
    </div>
  );
}

function LiveReportGrid({
  rows,
  session,
  people,
}: {
  rows: WorkReport[];
  session: SessionState | null;
  people: WorkPeople | null;
}) {
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No generated reports were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((report) => (
          <Panel key={report.id} title={report.title} action={titleCase(report.type)}>
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{reportSummary(report)}</p>
              <div className="flex flex-wrap gap-2">
                {report.project ? <BadgeText>{report.project.name}</BadgeText> : null}
                {report.creator ? <BadgeText>{report.creator.name}</BadgeText> : null}
                <BadgeText>{reportPeriod(report)}</BadgeText>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                onClick={() => setSelectedReport(report)}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Preview report
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {selectedReport ? (
        <ReportPreviewPanel
          report={selectedReport}
          session={session}
          people={people}
          onClose={() => setSelectedReport(null)}
        />
      ) : null}
    </div>
  );
}

function ReportEngagementPanel({ engagement }: { engagement: WorkReportEngagement | null }) {
  if (!engagement) {
    return (
      <Panel title="Report engagement" action="Live API">
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Sign in with a working database connection to load report engagement.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Report engagement" action={`${engagement.metrics.sharedReports} shared`}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LiveMetric label="Recipients" value={engagement.metrics.recipients} />
          <LiveMetric label="Viewed" value={engagement.metrics.viewed} />
          <LiveMetric label="Feedback" value={engagement.metrics.feedback} />
          <LiveMetric label="View rate" value={engagement.metrics.viewRate} />
        </div>
        {engagement.recommendations.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {engagement.recommendations.map((recommendation) => (
              <div
                key={`${recommendation.title}-${recommendation.reportId ?? 'workspace'}`}
                className="rounded-md border bg-background p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{recommendation.title}</p>
                  <span
                    className={`rounded-md px-2 py-1 text-xs ${toneClass(recommendation.tone)}`}
                  >
                    {titleCase(recommendation.tone)}
                  </span>
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">{recommendation.body}</p>
              </div>
            ))}
          </div>
        ) : null}
        {engagement.reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3">Report</th>
                  <th>Recipients</th>
                  <th>Viewed</th>
                  <th>Feedback</th>
                  <th>Latest activity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {engagement.reports.slice(0, 6).map((item) => (
                  <tr key={item.report.id}>
                    <td className="py-4">
                      <p className="font-medium">{item.report.title}</p>
                      <p className="text-xs text-muted-foreground">{titleCase(item.report.type)}</p>
                    </td>
                    <td>{item.recipientCount}</td>
                    <td>
                      {item.viewedCount} ({item.viewRate}%)
                    </td>
                    <td>
                      {item.feedbackCount} ({item.feedbackRate}%)
                    </td>
                    <td>
                      {item.latestFeedbackAt
                        ? `Feedback ${formatTime(item.latestFeedbackAt)}`
                        : item.latestViewedAt
                          ? `Viewed ${formatTime(item.latestViewedAt)}`
                          : item.latestSharedAt
                            ? `Shared ${formatTime(item.latestSharedAt)}`
                            : 'No activity'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No shared report engagement has been recorded yet.
          </div>
        )}
      </div>
    </Panel>
  );
}

function SharedReportInbox({
  rows,
  session,
  people,
  onViewed,
  onFeedback,
}: {
  rows: WorkSharedReport[];
  session: SessionState;
  people: WorkPeople | null;
  onViewed: (reportId: string, viewedAt: string) => void;
  onFeedback: (reportId: string, feedback: string, feedbackAt: string) => void;
}) {
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeFeedbackReportId, setActiveFeedbackReportId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState('Open a shared report or mark it reviewed.');
  const [actionStatus, setActionStatus] = useState<'idle' | 'updating' | 'success' | 'error'>(
    'idle',
  );

  async function handleMarkViewed(reportId: string) {
    setActiveReportId(reportId);
    setActionStatus('updating');
    setActionMessage('Marking report reviewed...');

    try {
      const response = await markWorkReportViewed(session.accessToken, reportId);
      onViewed(response.reportId, response.viewedAt);
      setActionStatus('success');
      setActionMessage(
        response.alreadyViewed ? 'Report was already marked reviewed.' : 'Report marked reviewed.',
      );
    } catch (error: unknown) {
      setActionStatus('error');
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to mark report reviewed.',
      );
    } finally {
      setActiveReportId(null);
    }
  }

  async function handleSubmitFeedback(event: React.FormEvent<HTMLFormElement>, reportId: string) {
    event.preventDefault();

    const feedback = (feedbackDrafts[reportId] ?? '').trim();
    if (!feedback) {
      setActionStatus('error');
      setActionMessage('Enter feedback before sending.');
      return;
    }

    setActiveFeedbackReportId(reportId);
    setActionStatus('updating');
    setActionMessage('Sending report feedback...');

    try {
      const response = await addWorkReportFeedback(session.accessToken, reportId, feedback);
      onFeedback(response.reportId, response.feedback, response.feedbackAt);
      setFeedbackDrafts((current) => ({ ...current, [reportId]: '' }));
      setActionStatus('success');
      setActionMessage('Report feedback sent.');
    } catch (error: unknown) {
      setActionStatus('error');
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to send report feedback.',
      );
    } finally {
      setActiveFeedbackReportId(null);
    }
  }

  return (
    <Panel title="Shared with me" action={`${rows.length} received`}>
      {rows.length > 0 ? (
        <div className="space-y-4">
          <p
            className={`rounded-md p-3 text-sm ${
              actionStatus === 'error'
                ? 'bg-danger/10 text-danger'
                : actionStatus === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {actionMessage}
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.slice(0, 6).map((share) => (
              <div key={share.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{share.report.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <BadgeText>{titleCase(share.report.type)}</BadgeText>
                    {share.viewedAt ? <BadgeText>Reviewed</BadgeText> : null}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {share.message ?? reportSummary(share.report)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <BadgeText>{share.actor?.name ?? 'System'}</BadgeText>
                  <BadgeText>{formatTime(share.sharedAt)}</BadgeText>
                  <BadgeText>{reportPeriod(share.report)}</BadgeText>
                  {share.viewedAt ? (
                    <BadgeText>Reviewed {formatTime(share.viewedAt)}</BadgeText>
                  ) : null}
                  {share.feedbackAt ? (
                    <BadgeText>Feedback {formatTime(share.feedbackAt)}</BadgeText>
                  ) : null}
                </div>
                {share.feedback ? (
                  <p className="mt-3 rounded-md bg-success/10 p-3 text-sm leading-6 text-success">
                    {share.feedback}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                    onClick={() => setSelectedReport(share.report)}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Open shared report
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
                    disabled={Boolean(share.viewedAt) || activeReportId === share.reportId}
                    onClick={() => handleMarkViewed(share.reportId)}
                  >
                    {activeReportId === share.reportId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    Mark reviewed
                  </button>
                </div>
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => handleSubmitFeedback(event, share.reportId)}
                >
                  <textarea
                    className="min-h-20 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={feedbackDrafts[share.reportId] ?? ''}
                    maxLength={800}
                    placeholder="Send feedback on this report"
                    onChange={(event) =>
                      setFeedbackDrafts((current) => ({
                        ...current,
                        [share.reportId]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
                    disabled={activeFeedbackReportId === share.reportId}
                  >
                    {activeFeedbackReportId === share.reportId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                    Send feedback
                  </button>
                </form>
              </div>
            ))}
          </div>
          {selectedReport ? (
            <ReportPreviewPanel
              report={selectedReport}
              session={session}
              people={people}
              onClose={() => setSelectedReport(null)}
            />
          ) : null}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No reports have been shared with this account yet.
        </div>
      )}
    </Panel>
  );
}

function ReportPreviewPanel({
  report,
  session,
  people,
  onClose,
}: {
  report: WorkReport;
  session: SessionState | null;
  people: WorkPeople | null;
  onClose: () => void;
}) {
  const content = asRecord(report.content);
  const metrics = recordField(content, 'metrics');
  const tasksByStatus = recordField(content, 'tasksByStatus');
  const blockersByStatus = recordField(content, 'blockersByStatus');
  const priorities = arrayField(content, 'priorities');
  const activityItems = arrayField(content, 'activity');
  const recentProgress = arrayField(content, 'recentProgress');
  const topBlockers = arrayField(content, 'topBlockers');
  const summary =
    stringField(content, 'aiSummary') ?? stringField(content, 'headline') ?? reportSummary(report);
  const isBriefing =
    stringField(content, 'generatedFrom') === 'daily_operational_snapshot' || priorities.length > 0;
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [exportMessage, setExportMessage] = useState('Export this preview as markdown.');
  const shareRecipients = useMemo(
    () =>
      (people?.employees ?? []).filter(
        (employee) => employee.isActive && employee.id !== session?.user.id,
      ),
    [people, session],
  );
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState(
    'Please review this report before the next planning check-in.',
  );
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'success' | 'error'>('idle');
  const [shareStatusMessage, setShareStatusMessage] = useState(
    'Select recipients to notify them about this report.',
  );
  const [shareHistory, setShareHistory] = useState<WorkReportShare[]>([]);
  const [historyStatus, setHistoryStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [historyMessage, setHistoryMessage] = useState(
    'Share history appears after live report sharing is connected.',
  );

  useEffect(() => {
    if (!session) {
      setShareHistory([]);
      setHistoryStatus('idle');
      setHistoryMessage('Share history appears after live report sharing is connected.');
      return;
    }

    setHistoryStatus('loading');
    setHistoryMessage('Loading share history...');
    getWorkReportShares(session.accessToken, report.id)
      .then((response) => {
        setShareHistory(response);
        setHistoryStatus('idle');
        setHistoryMessage(
          response.length > 0 ? 'Share history loaded.' : 'This report has not been shared yet.',
        );
      })
      .catch((error: unknown) => {
        setShareHistory([]);
        setHistoryStatus('error');
        setHistoryMessage(
          error instanceof ApiError ? error.message : 'Unable to load share history.',
        );
      });
  }, [report.id, session]);

  async function loadReportExport(): Promise<WorkReportExport> {
    if (session) return exportWorkReport(session.accessToken, report.id);
    return buildLocalReportExport(report);
  }

  async function handleCopyExport() {
    setExportStatus('loading');
    setExportMessage('Preparing export...');

    try {
      const exportedReport = await loadReportExport();
      await window.navigator.clipboard.writeText(exportedReport.markdown);
      setExportStatus('success');
      setExportMessage('Markdown copied to clipboard.');
    } catch (error: unknown) {
      setExportStatus('error');
      setExportMessage(error instanceof ApiError ? error.message : 'Unable to copy report export.');
    }
  }

  async function handleDownloadExport() {
    setExportStatus('loading');
    setExportMessage('Preparing download...');

    try {
      const exportedReport = await loadReportExport();
      const blob = new Blob([exportedReport.markdown], { type: exportedReport.mimeType });
      const href = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = exportedReport.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(href);
      setExportStatus('success');
      setExportMessage(`Downloaded ${exportedReport.filename}.`);
    } catch (error: unknown) {
      setExportStatus('error');
      setExportMessage(
        error instanceof ApiError ? error.message : 'Unable to download report export.',
      );
    }
  }

  function toggleShareRecipient(recipientId: string) {
    setSelectedRecipientIds((current) =>
      current.includes(recipientId)
        ? current.filter((id) => id !== recipientId)
        : [...current, recipientId],
    );
  }

  async function handleShareReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setShareStatus('error');
      setShareStatusMessage('Sign in before sharing a report.');
      return;
    }

    if (selectedRecipientIds.length === 0) {
      setShareStatus('error');
      setShareStatusMessage('Choose at least one recipient.');
      return;
    }

    setShareStatus('sharing');
    setShareStatusMessage('Sharing report...');

    try {
      const response = await shareWorkReport(session.accessToken, report.id, {
        recipientIds: selectedRecipientIds,
        message: shareMessage.trim() || undefined,
      });
      const refreshedHistory = await getWorkReportShares(session.accessToken, report.id);
      setShareStatus('success');
      setShareStatusMessage(
        `Shared with ${response.sharedCount} recipient${response.sharedCount === 1 ? '' : 's'}.`,
      );
      setShareHistory(refreshedHistory);
      setHistoryStatus('idle');
      setHistoryMessage('Share history updated.');
      setSelectedRecipientIds([]);
    } catch (error: unknown) {
      setShareStatus('error');
      setShareStatusMessage(error instanceof ApiError ? error.message : 'Unable to share report.');
    }
  }

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeText>{titleCase(report.type)}</BadgeText>
            <BadgeText>{reportPeriod(report)}</BadgeText>
            {isBriefing ? <BadgeText>Daily briefing snapshot</BadgeText> : null}
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-normal">{report.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
            disabled={exportStatus === 'loading'}
            onClick={handleCopyExport}
          >
            {exportStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            Copy
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
            disabled={exportStatus === 'loading'}
            onClick={handleDownloadExport}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </button>
          <button
            className="h-10 rounded-md border p-2 text-muted-foreground hover:bg-secondary"
            aria-label="Close report preview"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="space-y-5 p-4">
        <p
          className={`rounded-md p-3 text-sm ${
            exportStatus === 'error'
              ? 'bg-danger/10 text-danger'
              : exportStatus === 'success'
                ? 'bg-success/10 text-success'
                : 'bg-secondary text-muted-foreground'
          }`}
        >
          {exportMessage}
        </p>
        <form className="rounded-md border bg-background p-4" onSubmit={handleShareReport}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Share report</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{shareStatusMessage}</p>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={!session || shareStatus === 'sharing' || selectedRecipientIds.length === 0}
            >
              {shareStatus === 'sharing' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              Share
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Recipients</p>
              {shareRecipients.length > 0 ? (
                <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {shareRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex min-h-12 items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
                    >
                      <input
                        className="h-4 w-4 accent-primary"
                        type="checkbox"
                        checked={selectedRecipientIds.includes(recipient.id)}
                        onChange={() => toggleShareRecipient(recipient.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{recipient.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {recipient.title ?? recipient.email}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {session
                    ? 'No active recipients were loaded for this workspace.'
                    : 'Sign in to choose workspace recipients.'}
                </div>
              )}
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
                Note
              </span>
              <textarea
                className="min-h-32 w-full resize-none rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={shareMessage}
                maxLength={500}
                disabled={!session}
                onChange={(event) => setShareMessage(event.target.value)}
              />
            </label>
          </div>
          <p
            className={`mt-3 rounded-md p-3 text-sm ${
              shareStatus === 'error'
                ? 'bg-danger/10 text-danger'
                : shareStatus === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {shareStatus === 'error' || shareStatus === 'success'
              ? shareStatusMessage
              : selectedRecipientIds.length > 0
                ? `${selectedRecipientIds.length} recipient${selectedRecipientIds.length === 1 ? '' : 's'} selected.`
                : shareStatusMessage}
          </p>
        </form>
        <ReportShareHistory
          rows={shareHistory}
          status={historyStatus}
          message={historyMessage}
          hasSession={Boolean(session)}
        />
        {metrics ? <ReportMetricGrid metrics={metrics} /> : null}
        {tasksByStatus || blockersByStatus ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {tasksByStatus ? (
              <ReportStatusGroup title="Tasks by status" values={tasksByStatus} />
            ) : null}
            {blockersByStatus ? (
              <ReportStatusGroup title="Blockers by status" values={blockersByStatus} />
            ) : null}
          </div>
        ) : null}
        {priorities.length > 0 ? (
          <ReportList
            title="Priorities"
            rows={priorities}
            renderRow={(item) => {
              const record = asRecord(item);
              return (
                <div
                  key={
                    stringField(record, 'id') ?? stringField(record, 'title') ?? stableString(item)
                  }
                  className="rounded-md border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      {stringField(record, 'title') ?? 'Priority'}
                    </h3>
                    {stringField(record, 'tone') ? (
                      <BadgeText>{titleCase(stringField(record, 'tone')!)}</BadgeText>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {stringField(record, 'body') ?? stableString(item)}
                  </p>
                </div>
              );
            }}
          />
        ) : null}
        {activityItems.length > 0 ? (
          <ReportList
            title="Latest activity"
            rows={activityItems}
            renderRow={(item) => {
              const record = asRecord(item);
              return (
                <div
                  key={
                    stringField(record, 'id') ?? stringField(record, 'title') ?? stableString(item)
                  }
                  className="rounded-md border p-3"
                >
                  <p className="text-sm font-semibold">
                    {stringField(record, 'title') ?? 'Activity'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {stringField(record, 'body') ?? stableString(item)}
                  </p>
                  {stringField(record, 'createdAt') ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatTime(stringField(record, 'createdAt')!)}
                    </p>
                  ) : null}
                </div>
              );
            }}
          />
        ) : null}
        {recentProgress.length > 0 ? <ReportProgressList rows={recentProgress} /> : null}
        {topBlockers.length > 0 ? <ReportBlockerList rows={topBlockers} /> : null}
      </div>
    </section>
  );
}

function ReportMetricGrid({ metrics }: { metrics: Record<string, unknown> }) {
  const entries = Object.entries(metrics).filter(
    ([, value]) => typeof value === 'number' || typeof value === 'string',
  );

  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {entries.slice(0, 8).map(([key, value]) => (
        <div key={key} className="rounded-md border bg-background p-3">
          <p className="text-xs text-muted-foreground">{labelFromKey(key)}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{String(value)}</p>
        </div>
      ))}
    </div>
  );
}

function ReportStatusGroup({ title, values }: { title: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(
    ([, value]) => typeof value === 'number' || typeof value === 'string',
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <BadgeText key={key}>
            {titleCase(key)}: {String(value)}
          </BadgeText>
        ))}
      </div>
    </div>
  );
}

function ReportList({
  title,
  rows,
  renderRow,
}: {
  title: string;
  rows: unknown[];
  renderRow: (item: unknown) => React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-3">{rows.slice(0, 5).map(renderRow)}</div>
    </div>
  );
}

function ReportProgressList({ rows }: { rows: unknown[] }) {
  return (
    <ReportList
      title="Recent progress"
      rows={rows}
      renderRow={(item) => {
        const record = asRecord(item);
        const user = recordField(record, 'user');
        const project = recordField(record, 'project');
        const progress = record['progressPercent'];
        return (
          <div
            key={stringField(record, 'id') ?? stableString(item)}
            className="rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{stringField(user, 'name') ?? 'Team update'}</p>
              {typeof progress === 'number' ? <BadgeText>{progress}%</BadgeText> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {stringField(record, 'workCompleted') ?? stableString(item)}
            </p>
            {project ? (
              <p className="mt-2 text-xs text-muted-foreground">{stringField(project, 'name')}</p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

function ReportBlockerList({ rows }: { rows: unknown[] }) {
  return (
    <ReportList
      title="Top blockers"
      rows={rows}
      renderRow={(item) => {
        const record = asRecord(item);
        const project = recordField(record, 'project');
        return (
          <div
            key={stringField(record, 'id') ?? stableString(item)}
            className="rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {stringField(record, 'description') ?? 'Blocker'}
              </p>
              {stringField(record, 'severity') ? (
                <BadgeText>{titleCase(stringField(record, 'severity')!)}</BadgeText>
              ) : null}
            </div>
            {project ? (
              <p className="mt-2 text-xs text-muted-foreground">{stringField(project, 'name')}</p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

function ReportShareHistory({
  rows,
  status,
  message,
  hasSession,
}: {
  rows: WorkReportShare[];
  status: 'idle' | 'loading' | 'error';
  message: string;
  hasSession: boolean;
}) {
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyMessage, setCopyMessage] = useState(
    'Copy a follow-up draft when a share needs action.',
  );

  async function handleCopyFollowUp(share: WorkReportShare) {
    try {
      await window.navigator.clipboard.writeText(share.followUp.draft);
      setCopiedShareId(share.id);
      setCopyStatus('success');
      setCopyMessage('Follow-up draft copied.');
    } catch {
      setCopiedShareId(null);
      setCopyStatus('error');
      setCopyMessage('Unable to copy the follow-up draft.');
    }
  }

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Share history</h3>
          <p
            className={`mt-1 text-sm leading-6 ${
              status === 'error' ? 'text-danger' : 'text-muted-foreground'
            }`}
          >
            {message}
          </p>
        </div>
        <BadgeText>
          {status === 'loading' ? 'Loading' : hasSession ? `${rows.length} events` : 'Live only'}
        </BadgeText>
      </div>
      {rows.length > 0 ? (
        <p
          className={`mt-3 rounded-md p-3 text-sm ${
            copyStatus === 'error'
              ? 'bg-danger/10 text-danger'
              : copyStatus === 'success'
                ? 'bg-success/10 text-success'
                : 'bg-secondary text-muted-foreground'
          }`}
        >
          {copyMessage}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.slice(0, 5).map((share) => (
            <div key={share.id} className="rounded-md border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{share.actor?.name ?? 'System'} shared this report</p>
                <span className="text-xs text-muted-foreground">{formatTime(share.sharedAt)}</span>
              </div>
              {share.message ? (
                <p className="mt-2 leading-6 text-muted-foreground">{share.message}</p>
              ) : null}
              <div className="mt-3 rounded-md border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Follow-up</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeText>{titleCase(share.followUp.status)}</BadgeText>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs font-medium disabled:opacity-60"
                      onClick={() => handleCopyFollowUp(share)}
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      {copiedShareId === share.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">{share.followUp.draft}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {share.followUp.pendingReviewCount > 0 ? (
                    <BadgeText>
                      {share.followUp.pendingReviewCount} need review:{' '}
                      {share.followUp.pendingReviewNames.slice(0, 3).join(', ')}
                    </BadgeText>
                  ) : null}
                  {share.followUp.pendingFeedbackCount > 0 ? (
                    <BadgeText>
                      {share.followUp.pendingFeedbackCount} need feedback:{' '}
                      {share.followUp.pendingFeedbackNames.slice(0, 3).join(', ')}
                    </BadgeText>
                  ) : null}
                  {share.followUp.status === 'complete' ? (
                    <BadgeText>No follow-up</BadgeText>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {share.recipients.slice(0, 6).map((recipient) => (
                  <span key={recipient.id} className="rounded-md bg-secondary px-2 py-1 text-xs">
                    <span className="font-medium">
                      {recipient.name}
                      {recipient.isActive ? '' : ' (inactive)'}
                    </span>
                    {recipient.viewedAt ? (
                      <span className="ml-1 text-muted-foreground">
                        viewed {formatTime(recipient.viewedAt)}
                      </span>
                    ) : null}
                    {recipient.feedback ? (
                      <span className="mt-1 block text-muted-foreground">{recipient.feedback}</span>
                    ) : null}
                  </span>
                ))}
                {share.recipientCount > 6 ? (
                  <BadgeText>+{share.recipientCount - 6} more</BadgeText>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function reportSummary(report: WorkReport) {
  if (
    report.content &&
    typeof report.content === 'object' &&
    !Array.isArray(report.content) &&
    'aiSummary' in report.content
  ) {
    const summary = report.content.aiSummary;
    if (typeof summary === 'string') return summary;
  }

  return 'Generated report with scoped metrics, filters, and saved content for this workspace.';
}

function reportPeriod(report: WorkReport) {
  if (report.periodStart && report.periodEnd)
    return `${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`;
  if (report.periodStart) return formatDate(report.periodStart);
  return formatDate(report.createdAt);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function recordField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function stringField(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function labelFromKey(value: string) {
  return titleCase(value.replace(/([a-z])([A-Z])/g, '$1_$2'));
}

function stableString(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return 'Saved report item';
  }
}

function buildLocalReportExport(report: WorkReport): WorkReportExport {
  const markdown = reportMarkdown(report);

  return {
    reportId: report.id,
    title: report.title,
    type: report.type,
    filename: `${slugify(report.title)}-${report.createdAt.slice(0, 10)}.md`,
    mimeType: 'text/markdown',
    markdown,
    text: markdownToText(markdown),
    generatedAt: new Date().toISOString(),
  };
}

function reportMarkdown(report: WorkReport) {
  const content = asRecord(report.content);
  const summary =
    stringField(content, 'aiSummary') ?? stringField(content, 'headline') ?? reportSummary(report);
  const lines = [
    `# ${report.title}`,
    '',
    `Type: ${titleCase(report.type)}`,
    `Period: ${reportPeriod(report)}`,
    report.project ? `Project: ${report.project.name}` : null,
    report.creator ? `Creator: ${report.creator.name}` : null,
    `Generated: ${formatDate(report.createdAt)}`,
    '',
    summary ? `## Summary\n\n${summary}` : null,
    recordMarkdownSection('Metrics', recordField(content, 'metrics')),
    recordMarkdownSection('Tasks by status', recordField(content, 'tasksByStatus')),
    recordMarkdownSection('Blockers by status', recordField(content, 'blockersByStatus')),
    listMarkdownSection('Priorities', arrayField(content, 'priorities'), (item) => {
      const record = asRecord(item);
      const title = stringField(record, 'title') ?? 'Priority';
      const body = stringField(record, 'body') ?? stableString(item);
      const tone = stringField(record, 'tone');
      return tone ? `- ${title} (${titleCase(tone)}): ${body}` : `- ${title}: ${body}`;
    }),
    listMarkdownSection('Latest activity', arrayField(content, 'activity'), (item) => {
      const record = asRecord(item);
      const title = stringField(record, 'title') ?? 'Activity';
      const body = stringField(record, 'body') ?? stableString(item);
      const createdAt = stringField(record, 'createdAt');
      return createdAt ? `- ${title}: ${body} (${formatDate(createdAt)})` : `- ${title}: ${body}`;
    }),
    listMarkdownSection('Recent progress', arrayField(content, 'recentProgress'), (item) => {
      const record = asRecord(item);
      const user = recordField(record, 'user');
      const project = recordField(record, 'project');
      const employee =
        stringField(record, 'employee') ?? stringField(user, 'name') ?? 'Team update';
      const progress =
        typeof record.progressPercent === 'number' ? ` (${record.progressPercent}%)` : '';
      const work = stringField(record, 'workCompleted') ?? stableString(item);
      const projectName = stringField(record, 'project') ?? stringField(project, 'name');
      return projectName
        ? `- ${employee}${progress} on ${projectName}: ${work}`
        : `- ${employee}${progress}: ${work}`;
    }),
    listMarkdownSection('Top blockers', arrayField(content, 'topBlockers'), (item) => {
      const record = asRecord(item);
      const project = recordField(record, 'project');
      const description = stringField(record, 'description') ?? 'Blocker';
      const severity = stringField(record, 'severity');
      const projectName = stringField(record, 'project') ?? stringField(project, 'name');
      const prefix = severity ? `${description} (${titleCase(severity)})` : description;
      return projectName ? `- ${prefix} - ${projectName}` : `- ${prefix}`;
    }),
  ].filter((line): line is string => typeof line === 'string' && line.length > 0);

  return `${lines.join('\n')}\n`;
}

function recordMarkdownSection(title: string, values: Record<string, unknown> | null) {
  if (!values) return null;

  const rows = Object.entries(values)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([key, value]) => `- ${labelFromKey(key)}: ${String(value)}`);

  return rows.length > 0 ? `## ${title}\n\n${rows.join('\n')}` : null;
}

function listMarkdownSection(
  title: string,
  values: unknown[],
  renderItem: (item: unknown) => string,
) {
  const rows = values.slice(0, 10).map(renderItem);
  return rows.length > 0 ? `## ${title}\n\n${rows.join('\n')}` : null;
}

function markdownToText(value: string) {
  return value
    .replace(/^#\s+/gm, '')
    .replace(/^##\s+/gm, '')
    .replace(/^\-\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'report'
  );
}

function NotificationsExperience({ session }: { session: SessionState | null }) {
  const [liveNotifications, setLiveNotifications] = useState<WorkNotification[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live notifications.');
  const [actionStatus, setActionStatus] = useState<'idle' | 'updating' | 'success' | 'error'>(
    'idle',
  );
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState(
    'Unread notifications can be cleared once live data is connected.',
  );

  useEffect(() => {
    if (!session) {
      setLiveNotifications([]);
      setStatus('idle');
      setMessage('Sign in to load live notifications.');
      setActionStatus('idle');
      setActiveNotificationId(null);
      setActionMessage('Unread notifications can be cleared once live data is connected.');
      return;
    }

    setStatus('loading');
    setMessage('Loading live notifications...');
    getWorkNotifications(session.accessToken)
      .then((response) => {
        setLiveNotifications(response);
        setStatus('idle');
        setMessage('Live notifications connected.');
      })
      .catch((error: unknown) => {
        setLiveNotifications([]);
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load live notifications.',
        );
      });
  }, [session]);

  async function handleMarkRead(notification: WorkNotification) {
    if (!session || notification.readAt) return;

    setActionStatus('updating');
    setActiveNotificationId(notification.id);
    setActionMessage(`Marking "${notification.title}" as read...`);

    try {
      const updated = await markWorkNotificationRead(session.accessToken, notification.id);
      setLiveNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setActionStatus('success');
      setActionMessage('Notification marked as read.');
    } catch (error: unknown) {
      setActionStatus('error');
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to mark notification as read.',
      );
    } finally {
      setActiveNotificationId(null);
    }
  }

  async function handleMarkAllRead() {
    if (!session || unreadCount === 0) return;

    setActionStatus('updating');
    setActiveNotificationId('all');
    setActionMessage('Marking all notifications as read...');

    try {
      const response = await markAllWorkNotificationsRead(session.accessToken);
      setLiveNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? response.readAt,
        })),
      );
      setActionStatus('success');
      setActionMessage(`${response.updatedCount} notifications marked as read.`);
    } catch (error: unknown) {
      setActionStatus('error');
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to mark notifications as read.',
      );
    } finally {
      setActiveNotificationId(null);
    }
  }

  const hasLiveData = liveNotifications.length > 0;
  const unreadCount = liveNotifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${
                status === 'error'
                  ? 'bg-danger/10 text-danger'
                  : status === 'loading'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
              }`}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold">Notification data</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          {hasLiveData ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <LiveMetric label="Unread" value={unreadCount} />
              <LiveMetric label="Total" value={liveNotifications.length} />
            </div>
          ) : null}
        </div>
        {hasLiveData ? (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p
              className={`rounded-md p-3 text-sm ${
                actionStatus === 'error'
                  ? 'bg-danger/10 text-danger'
                  : actionStatus === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {actionMessage}
            </p>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
              disabled={unreadCount === 0 || activeNotificationId === 'all'}
              onClick={handleMarkAllRead}
            >
              {activeNotificationId === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              Mark all read
            </button>
          </div>
        ) : null}
      </section>
      <Panel title="Notifications" action={hasLiveData ? 'Live API' : 'Prototype fallback'}>
        {hasLiveData ? (
          <LiveNotificationList
            rows={liveNotifications}
            activeNotificationId={activeNotificationId}
            onMarkRead={handleMarkRead}
          />
        ) : (
          <PrototypeNotificationList />
        )}
      </Panel>
    </div>
  );
}

function LiveNotificationList({
  rows,
  activeNotificationId,
  onMarkRead,
}: {
  rows: WorkNotification[];
  activeNotificationId: string | null;
  onMarkRead: (notification: WorkNotification) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No notifications were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((notification) => (
        <div key={notification.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <Bell
            className={`mt-0.5 h-4 w-4 ${notification.readAt ? 'text-muted-foreground' : 'text-accent'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{notification.title}</p>
              {!notification.readAt ? <BadgeText>Unread</BadgeText> : null}
              <BadgeText>{titleCase(notification.type)}</BadgeText>
            </div>
            <p className="mt-1 text-muted-foreground">{notification.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(notification.createdAt)}
            </p>
          </div>
          {!notification.readAt ? (
            <button
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 font-medium disabled:opacity-60"
              disabled={activeNotificationId === notification.id || activeNotificationId === 'all'}
              onClick={() => onMarkRead(notification)}
            >
              {activeNotificationId === notification.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              Mark read
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PrototypeNotificationList() {
  return (
    <div className="space-y-3">
      {[
        '16 employees have not submitted today',
        '3 blockers require owner assignment',
        'Weekly report draft is ready',
      ].map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <Bell className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium">{item}</p>
            <p className="text-muted-foreground">
              Shown as an in-app alert with email architecture planned later.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const workweekOptions = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function SettingsExperience({ page, session }: { page: string; session: SessionState | null }) {
  const [settings, setSettings] = useState<WorkSettings | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [dailyCutoff, setDailyCutoff] = useState('18:00');
  const [workweekDays, setWorkweekDays] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load workspace settings.');
  const [saveMessage, setSaveMessage] = useState(
    'Settings can be saved after live data is connected.',
  );

  useEffect(() => {
    if (!session) {
      setSettings(null);
      setCompanyName('');
      setTimezone('UTC');
      setDailyCutoff('18:00');
      setWorkweekDays([]);
      setStatus('idle');
      setSaveStatus('idle');
      setMessage('Sign in to load workspace settings.');
      setSaveMessage('Settings can be saved after live data is connected.');
      return;
    }

    setStatus('loading');
    setMessage('Loading workspace settings...');
    getWorkSettings(session.accessToken)
      .then((response) => {
        setSettings(response);
        setCompanyName(response.name);
        setTimezone(response.timezone);
        setDailyCutoff(response.dailyCutoff);
        setWorkweekDays(response.workweekDays);
        setStatus('idle');
        setMessage('Live workspace settings connected.');
        setSaveMessage('Update operational defaults for this workspace.');
      })
      .catch((error: unknown) => {
        setSettings(null);
        setStatus('error');
        setMessage(
          error instanceof ApiError ? error.message : 'Unable to load workspace settings.',
        );
        setSaveMessage('Settings update needs live workspace data.');
      });
  }, [session]);

  async function handleSaveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setSaveStatus('error');
      setSaveMessage('Sign in before updating workspace settings.');
      return;
    }

    if (!companyName.trim() || !timezone.trim() || !dailyCutoff.trim()) {
      setSaveStatus('error');
      setSaveMessage('Company name, timezone, and cutoff are required.');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving settings...');

    try {
      const response = await updateWorkSettings(session.accessToken, {
        name: companyName,
        timezone,
        dailyCutoff,
        workweekDays,
      });
      setSettings(response);
      setCompanyName(response.name);
      setTimezone(response.timezone);
      setDailyCutoff(response.dailyCutoff);
      setWorkweekDays(response.workweekDays);
      setSaveStatus('success');
      setSaveMessage('Workspace settings saved.');
    } catch (error: unknown) {
      setSaveStatus('error');
      setSaveMessage(
        error instanceof ApiError ? error.message : 'Unable to save workspace settings right now.',
      );
    }
  }

  function toggleWorkweekDay(day: string) {
    setWorkweekDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title={page === 'plans' ? 'Subscription plans placeholder' : 'Workspace settings'}
        action={settings ? 'Live API' : 'Prototype fallback'}
      >
        <form className="space-y-4" onSubmit={handleSaveSettings}>
          <section className="rounded-md border bg-background p-3">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-md ${
                  status === 'error'
                    ? 'bg-danger/10 text-danger'
                    : status === 'loading'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                }`}
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </span>
              <div>
                <h2 className="text-sm font-semibold">Settings data</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          </section>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Company name</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Company name"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Timezone</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Singapore'].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Daily cutoff</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                type="time"
                value={dailyCutoff}
                onChange={(event) => setDailyCutoff(event.target.value)}
              />
            </label>
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium">Workweek</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {workweekOptions.map((day) => (
                <label
                  key={day}
                  className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={workweekDays.includes(day)}
                    onChange={() => toggleWorkweekDay(day)}
                  />
                  {titleCase(day)}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={saveStatus === 'saving' || !session}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            Save settings
          </button>
          <p
            className={`rounded-md p-3 text-sm ${
              saveStatus === 'error'
                ? 'bg-danger/10 text-danger'
                : saveStatus === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {saveMessage}
          </p>
          {settings ? (
            <p className="text-xs text-muted-foreground">
              Last updated {formatDate(settings.updatedAt)} - Workspace slug: {settings.slug}
            </p>
          ) : null}
        </form>
      </Panel>
      <StateGallery />
    </div>
  );
}

function PlatformExperience({ page, session }: { page: string; session: SessionState | null }) {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState(
    'Tenant status changes require live platform data.',
  );
  const [message, setMessage] = useState(
    'Sign in as a platform administrator to load platform data.',
  );
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [companyTimezone, setCompanyTimezone] = useState('UTC');
  const [companyDailyCutoff, setCompanyDailyCutoff] = useState('18:00');
  const [createCompanyStatus, setCreateCompanyStatus] = useState<
    'idle' | 'creating' | 'success' | 'error'
  >('idle');
  const [adminCompanyId, setAdminCompanyId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTitle, setAdminTitle] = useState('Company Administrator');
  const [adminPassword, setAdminPassword] = useState('');
  const [createAdminStatus, setCreateAdminStatus] = useState<
    'idle' | 'creating' | 'success' | 'error'
  >('idle');

  useEffect(() => {
    if (!session) {
      setOverview(null);
      setStatus('idle');
      setActiveCompanyId(null);
      setActionMessage('Tenant status changes require live platform data.');
      setMessage('Sign in as a platform administrator to load platform data.');
      return;
    }

    setStatus('loading');
    setMessage('Loading platform overview...');
    getPlatformOverview(session.accessToken)
      .then((response) => {
        setOverview(response);
        setAdminCompanyId((current) => current || response.companies[0]?.id || '');
        setStatus('idle');
        setMessage('Live platform data connected.');
        setActionMessage('Tenant status changes are audited.');
      })
      .catch((error: unknown) => {
        setOverview(null);
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load platform overview.');
        setActionMessage('Unable to update tenant status until platform data loads.');
      });
  }, [session]);

  async function handleCompanyStatusChange(
    companyId: string,
    nextStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED',
  ) {
    if (!session) {
      setActionMessage('Sign in as a platform administrator before changing tenant status.');
      return;
    }

    setActiveCompanyId(companyId);
    setActionMessage('Updating tenant status...');

    try {
      const updated = await updatePlatformCompanyStatus(session.accessToken, companyId, {
        status: nextStatus,
      });
      setOverview((current) => {
        if (!current) return current;
        const companies =
          updated.status === 'ARCHIVED'
            ? current.companies.filter((company) => company.id !== updated.id)
            : current.companies.map((company) => (company.id === updated.id ? updated : company));

        return {
          ...current,
          metrics: {
            ...current.metrics,
            totalCompanies: companies.length,
            activeCompanies: companies.filter((company) => company.status === 'ACTIVE').length,
            trialCompanies: companies.filter((company) => company.status === 'TRIAL').length,
            suspendedCompanies: companies.filter((company) => company.status === 'SUSPENDED')
              .length,
          },
          companies,
        };
      });
      setActionMessage(`${updated.name} status updated to ${titleCase(updated.status)}.`);
    } catch (error: unknown) {
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to update tenant status.',
      );
    } finally {
      setActiveCompanyId(null);
    }
  }

  async function handleCreateCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setCreateCompanyStatus('error');
      setActionMessage('Sign in as a platform administrator before creating a company.');
      return;
    }

    const payload: CreatePlatformCompanyPayload = {
      name: companyName.trim(),
      slug: companySlug.trim() || undefined,
      timezone: companyTimezone.trim() || undefined,
      dailyCutoff: companyDailyCutoff,
    };

    setCreateCompanyStatus('creating');
    setActionMessage('Creating company...');

    try {
      const created = await createPlatformCompany(session.accessToken, payload);
      setOverview((current) => {
        if (!current) return current;
        const companies = [created, ...current.companies];

        return {
          ...current,
          metrics: {
            ...current.metrics,
            totalCompanies: companies.length,
            activeCompanies: companies.filter((company) => company.status === 'ACTIVE').length,
            trialCompanies: companies.filter((company) => company.status === 'TRIAL').length,
            suspendedCompanies: companies.filter((company) => company.status === 'SUSPENDED')
              .length,
          },
          companies,
        };
      });
      setAdminCompanyId(created.id);
      setCompanyName('');
      setCompanySlug('');
      setCompanyTimezone('UTC');
      setCompanyDailyCutoff('18:00');
      setCreateCompanyStatus('success');
      setActionMessage(`${created.name} created. You can now create its company admin.`);
    } catch (error: unknown) {
      setCreateCompanyStatus('error');
      setActionMessage(error instanceof ApiError ? error.message : 'Unable to create company.');
    }
  }

  async function handleCreateCompanyAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !adminCompanyId) {
      setCreateAdminStatus('error');
      setActionMessage('Choose a company before creating a company admin.');
      return;
    }

    const payload: CreateCompanyAdminPayload = {
      name: adminName.trim(),
      email: adminEmail.trim(),
      title: adminTitle.trim() || undefined,
      temporaryPassword: adminPassword,
    };

    setCreateAdminStatus('creating');
    setActionMessage('Creating company admin...');

    try {
      const created = await createPlatformCompanyAdmin(
        session.accessToken,
        adminCompanyId,
        payload,
      );
      setOverview((current) => {
        if (!current) return current;

        return {
          ...current,
          metrics: {
            ...current.metrics,
            totalUsers: current.metrics.totalUsers + 1,
          },
          companies: current.companies.map((company) =>
            company.id === created.companyId
              ? { ...company, counts: { ...company.counts, users: company.counts.users + 1 } }
              : company,
          ),
        };
      });
      setAdminName('');
      setAdminEmail('');
      setAdminTitle('Company Administrator');
      setAdminPassword('');
      setCreateAdminStatus('success');
      setActionMessage(`${created.name} was created as a company admin.`);
    } catch (error: unknown) {
      setCreateAdminStatus('error');
      setActionMessage(
        error instanceof ApiError ? error.message : 'Unable to create company admin.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <Toolbar
        title={
          page === 'companies'
            ? 'Companies'
            : page === 'ai-usage'
              ? 'AI usage'
              : 'Platform overview'
        }
      />
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-md ${
              status === 'error'
                ? 'bg-danger/10 text-danger'
                : status === 'loading'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-success/10 text-success'
            }`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">Platform data</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </section>
      {overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Tenants"
              value={String(overview.metrics.totalCompanies)}
              delta={`${overview.metrics.activeCompanies} active`}
              tone="good"
            />
            <MetricCard
              label="Trial"
              value={String(overview.metrics.trialCompanies)}
              delta="Evaluation"
              tone="neutral"
            />
            <MetricCard
              label="Suspended"
              value={String(overview.metrics.suspendedCompanies)}
              delta="Needs review"
              tone={overview.metrics.suspendedCompanies > 0 ? 'warning' : 'good'}
            />
            <MetricCard
              label="Users"
              value={String(overview.metrics.totalUsers)}
              delta="All tenants"
              tone="neutral"
            />
            <MetricCard
              label="Reports"
              value={String(overview.metrics.totalReports)}
              delta="Generated"
              tone="good"
            />
            <MetricCard
              label="AI messages"
              value={String(overview.metrics.totalAiMessages)}
              delta="Saved history"
              tone="neutral"
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Create company" action="Super admin">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCompany}>
                <label className="text-sm font-medium">
                  Company name
                  <input
                    required
                    minLength={2}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Slug
                  <input
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={companySlug}
                    placeholder="auto-generated"
                    onChange={(event) => setCompanySlug(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Timezone
                  <input
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={companyTimezone}
                    onChange={(event) => setCompanyTimezone(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Daily cutoff
                  <input
                    required
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={companyDailyCutoff}
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    onChange={(event) => setCompanyDailyCutoff(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60 md:col-span-2"
                  disabled={createCompanyStatus === 'creating'}
                >
                  {createCompanyStatus === 'creating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  Create company
                </button>
              </form>
            </Panel>
            <Panel title="Create company admin" action="Super admin">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCompanyAdmin}>
                <label className="text-sm font-medium md:col-span-2">
                  Company
                  <select
                    required
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={adminCompanyId}
                    onChange={(event) => setAdminCompanyId(event.target.value)}
                  >
                    {overview.companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Name
                  <input
                    required
                    minLength={2}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Email
                  <input
                    required
                    type="email"
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Title
                  <input
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={adminTitle}
                    onChange={(event) => setAdminTitle(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Temporary password
                  <input
                    required
                    type="password"
                    minLength={8}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60 md:col-span-2"
                  disabled={createAdminStatus === 'creating' || overview.companies.length === 0}
                >
                  {createAdminStatus === 'creating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  )}
                  Create company admin
                </button>
              </form>
            </Panel>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <Panel title="Tenant list" action={`${overview.companies.length} live tenants`}>
              <div className="space-y-3">
                <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
                  {actionMessage}
                </p>
                <PlatformCompanyTable
                  rows={overview.companies}
                  activeCompanyId={activeCompanyId}
                  onStatusChange={handleCompanyStatusChange}
                />
              </div>
            </Panel>
            <Panel title="Recent platform activity" action="Audit log">
              <PlatformAuditList rows={overview.recentAuditLogs} />
            </Panel>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Active tenants" value="24" delta="+3 this quarter" tone="good" />
            <MetricCard
              label="AI requests"
              value="18.4k"
              delta="Usage placeholder"
              tone="neutral"
            />
            <MetricCard label="Support tickets" value="7" delta="2 urgent" tone="warning" />
          </div>
          <Panel title="Tenant list" action="Prototype fallback">
            <DataTable
              rows={tasks.map((task) => ({
                ...task,
                task: task.project,
                project: 'Acme Operations',
              }))}
            />
          </Panel>
        </>
      )}
    </div>
  );
}

function PlatformCompanyTable({
  rows,
  activeCompanyId,
  onStatusChange,
}: {
  rows: PlatformOverview['companies'];
  activeCompanyId: string | null;
  onStatusChange: (
    companyId: string,
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED',
  ) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No tenant companies were returned.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Company</th>
            <th>Status</th>
            <th>Users</th>
            <th>Work</th>
            <th>AI</th>
            <th>Timezone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((company) => (
            <tr key={company.id}>
              <td className="py-4">
                <p className="font-medium">{company.name}</p>
                <p className="text-xs text-muted-foreground">{company.slug}</p>
              </td>
              <td>
                <BadgeText>{titleCase(company.status)}</BadgeText>
              </td>
              <td>{company.counts.users}</td>
              <td>
                {company.counts.projects} projects / {company.counts.tasks} tasks
              </td>
              <td>
                {company.counts.aiConversations} conversations / {company.counts.reports} reports
              </td>
              <td>{company.timezone}</td>
              <td>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  value={company.status}
                  disabled={activeCompanyId === company.id}
                  onChange={(event) =>
                    onStatusChange(
                      company.id,
                      event.target.value as 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED',
                    )
                  }
                >
                  {['ACTIVE', 'TRIAL', 'SUSPENDED', 'ARCHIVED'].map((status) => (
                    <option key={status} value={status}>
                      {titleCase(status)}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlatformAuditList({ rows }: { rows: PlatformOverview['recentAuditLogs'] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No audit activity was returned.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((log) => (
        <div key={log.id} className="rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{log.action}</p>
            <BadgeText>{log.entityType}</BadgeText>
          </div>
          <p className="mt-1 text-muted-foreground">
            {log.company?.name ?? 'Platform'} - {log.actor?.name ?? 'System'} -{' '}
            {formatDate(log.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

function AuthPrototype({ onLogin }: { onLogin: (session: SessionState) => void }) {
  const [email, setEmail] = useState('ayushgarg.official07@gmail.com');
  const [password, setPassword] = useState('workpulse-dev-pass');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState(
    'Use the seeded development credentials after the database is available.',
  );
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus('loading');
    setMessage('Signing in...');

    try {
      const response = await login(email, password);
      onLogin({ accessToken: response.accessToken, user: response.user });
      setStatus('success');
      setMessage(`Signed in as ${response.user.name}.`);
    } catch (error: unknown) {
      setStatus('error');
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setMessage('Incorrect email or password. Please try again.');
      } else {
        setMessage(error instanceof ApiError ? error.message : 'Unable to sign in right now.');
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f]">
      <div className="auth-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="absolute -left-32 top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-cyan-400/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-52 right-[-7rem] h-[38rem] w-[38rem] rounded-full bg-violet-500/20 blur-[140px]"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-cyan-500/10 backdrop-blur-xl">
            <Command className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">{productConfig.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Work intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-300 backdrop-blur-xl">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
          Secure access
        </div>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6.5rem)] w-full max-w-7xl items-center gap-12 px-5 pb-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pb-20">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Your workday, intelligently organized
          </div>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.06] tracking-[-0.045em] text-white xl:text-6xl">
            Turn daily work into{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              clear momentum.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            One intelligent workspace to align your team, surface blockers, and keep every project
            moving forward.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: UsersRound, value: 'One team', label: 'Fully aligned' },
              { icon: Sparkles, value: 'AI briefs', label: 'Instant clarity' },
              { icon: ShieldCheck, value: 'Role-based', label: 'Secure access' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.value}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl"
                >
                  <Icon className="mb-3 h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {['AG', 'MS', 'RK'].map((initials, index) => (
                <span
                  key={initials}
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#07111f] text-[10px] font-bold text-white ${
                    index === 0 ? 'bg-cyan-600' : index === 1 ? 'bg-violet-600' : 'bg-emerald-600'
                  }`}
                >
                  {initials}
                </span>
              ))}
            </div>
            Built for teams that move fast
          </div>
        </section>

        <section className="mx-auto w-full max-w-[30rem]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.075] p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <div className="rounded-[1.6rem] border border-white/[0.08] bg-[#0b1627]/90 px-6 py-7 sm:px-9 sm:py-9">
              <div className="mb-8">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 text-[#07111f] shadow-lg shadow-cyan-500/20">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-cyan-300">Welcome back</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">
                  Sign in to your workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Enter your details to continue to {productConfig.name}.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Work email</span>
                  <span className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-400/10">
                    <Mail className="h-4 w-4 shrink-0 text-slate-500 transition group-focus-within:text-cyan-300" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      value={email}
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
                  <span className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-400/10">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500 transition group-focus-within:text-cyan-300" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      value={password}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 text-sm font-bold text-[#07111f] shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:shadow-cyan-400/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  )}
                  {status === 'loading' ? 'Signing in...' : 'Sign in securely'}
                </button>

                <div
                  className={`flex gap-3 rounded-xl border p-3 text-xs leading-5 ${
                    status === 'error'
                      ? 'border-red-400/20 bg-red-400/10 text-red-200'
                      : status === 'success'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/[0.07] bg-white/[0.035] text-slate-400'
                  }`}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{message}</span>
                </div>
              </form>

              <p className="mt-7 text-center text-xs text-slate-500">
                Protected by enterprise-grade access controls
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-normal">{value}</p>
        <span className={`rounded-md px-2 py-1 text-xs ${toneClass(tone)}`}>{delta}</span>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        {action ? (
          <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
            {action}
          </span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ProgressRow({ label, value, meta }: { label: string; value: number; meta: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{meta}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DataTable({ rows }: { rows: typeof tasks }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Task</th>
            <th>Project</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={`${row.task}-${row.owner}`}>
              <td className="py-4 font-medium">{row.task}</td>
              <td>{row.project}</td>
              <td>{row.owner}</td>
              <td>
                <BadgeText>{row.status}</BadgeText>
              </td>
              <td>{row.priority}</td>
              <td>{row.due}</td>
              <td>{row.progress}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-4 of 96 records</span>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-1">Previous</button>
          <button className="rounded-md border px-3 py-1">Next</button>
        </div>
      </div>
    </div>
  );
}

function LiveBlockerList({
  rows,
  compact = false,
  activeBlockerId,
  onResolve,
}: {
  rows: WorkBlocker[];
  compact?: boolean;
  activeBlockerId?: string | null;
  onResolve?: (blocker: WorkBlocker) => void;
}) {
  const visibleRows = compact ? rows.slice(0, 2) : rows;

  if (visibleRows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No blockers were returned for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleRows.map((blocker) => (
        <div key={blocker.id} className="rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{blocker.description}</h3>
            <div className="flex flex-wrap gap-2">
              <BadgeText>{titleCase(blocker.severity)}</BadgeText>
              <BadgeText>{titleCase(blocker.status)}</BadgeText>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {blocker.project.name} - Owner: {blocker.employee.name} - Age:{' '}
            {formatAge(blocker.ageHours)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {blocker.task ? <BadgeText>{blocker.task.title}</BadgeText> : null}
            {blocker.resolver ? <BadgeText>Resolver: {blocker.resolver.name}</BadgeText> : null}
            <BadgeText>{blocker.counts.comments} comments</BadgeText>
            <BadgeText>{blocker.counts.attachments} files</BadgeText>
          </div>
          {blocker.resolution ? (
            <p className="mt-3 rounded-md bg-success/10 p-3 text-sm text-success">
              {blocker.resolution}
            </p>
          ) : null}
          {!compact && onResolve && blocker.status !== 'RESOLVED' ? (
            <button
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
              disabled={activeBlockerId === blocker.id}
              onClick={() => onResolve(blocker)}
            >
              {activeBlockerId === blocker.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              Resolve blocker
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function BlockerList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      {blockers.slice(0, compact ? 2 : blockers.length).map((blocker) => (
        <div key={blocker.title} className="rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{blocker.title}</h3>
            <BadgeText>{blocker.severity}</BadgeText>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {blocker.project} - Owner: {blocker.owner} - Age: {blocker.age}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatAge(ageHours: number) {
  if (ageHours < 1) return '<1h';
  if (ageHours < 24) return `${Math.round(ageHours)}h`;
  const days = Math.floor(ageHours / 24);
  const hours = Math.round(ageHours % 24);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

function ActivityList() {
  return (
    <div className="space-y-3">
      {activity.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex gap-3 rounded-md border p-3">
            <Icon className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.meta}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LiveActivityList({ session }: { session: SessionState | null }) {
  const [items, setItems] = useState<WorkActivityItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Sign in to load live activity.');

  useEffect(() => {
    if (!session) {
      setItems([]);
      setStatus('idle');
      setMessage('Sign in to load live activity.');
      return;
    }

    setStatus('loading');
    setMessage('Loading operational activity...');
    getWorkActivity(session.accessToken)
      .then((response) => {
        setItems(response);
        setStatus('idle');
        setMessage(
          response.length > 0
            ? 'Live activity connected.'
            : 'No recent live activity was returned.',
        );
      })
      .catch((error: unknown) => {
        setItems([]);
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load live activity.');
      });
  }, [session]);

  if (!session || items.length === 0) {
    return (
      <div className="space-y-3">
        <p
          className={`rounded-md p-3 text-sm ${
            status === 'error' ? 'bg-danger/10 text-danger' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {message}
        </p>
        <ActivityList />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex gap-3 rounded-md border p-3">
          {item.type === 'COMMENT' ? (
            <MessagesSquare className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          ) : (
            <CircleDot className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <BadgeText>{titleCase(item.entityType)}</BadgeText>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.actor?.name ?? 'System'} - {formatTime(item.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AiSummaryStrip() {
  return (
    <section className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm lg:grid-cols-3">
      {insightCards.map((card) => (
        <div key={card.title}>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{card.label}</p>
          <h3 className="mt-2 text-sm font-semibold">{card.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.body}</p>
        </div>
      ))}
    </section>
  );
}

function Toolbar({
  title,
  searchOpen = false,
  searchValue = '',
  searchPlaceholder = 'Search',
  searchClearLabel = 'Clear search',
  onSearchToggle,
  onSearchChange,
  onSearchClear,
  onFiltersClick,
  onCreateClick,
  showCreate = true,
}: {
  title: string;
  searchOpen?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  searchClearLabel?: string;
  onSearchToggle?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  onFiltersClick?: () => void;
  onCreateClick?: () => void;
  showCreate?: boolean;
}) {
  const searchEnabled = Boolean(onSearchToggle && onSearchChange && onSearchClear);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Mock data workspace</p>
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {searchEnabled && searchOpen ? (
          <div className="flex h-10 min-w-64 items-center gap-2 rounded-md border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={searchClearLabel}
              onClick={onSearchClear}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <ActionButton icon={Search} variant="secondary" onClick={onSearchToggle}>
            Search
          </ActionButton>
        )}
        <ActionButton icon={Filter} variant="secondary" onClick={onFiltersClick}>
          Filters
        </ActionButton>
        {showCreate ? (
          <ActionButton icon={Plus} onClick={onCreateClick}>
            Create
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

function StateGallery() {
  return (
    <Panel title="Reusable states" action="Design system">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-3 text-sm">
          <Loader2 className="mb-3 h-5 w-5 animate-spin text-accent" />
          <p className="font-medium">Loading</p>
          <p className="text-muted-foreground">Skeletons and disabled controls.</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <AlertCircle className="mb-3 h-5 w-5 text-danger" />
          <p className="font-medium">Error</p>
          <p className="text-muted-foreground">Clear recovery and retry action.</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <CheckCircle2 className="mb-3 h-5 w-5 text-success" />
          <p className="font-medium">Empty</p>
          <p className="text-muted-foreground">Helpful next best action.</p>
        </div>
      </div>
    </Panel>
  );
}

function ActionButton({
  icon: Icon,
  children,
  variant = 'primary',
  onClick,
}: {
  icon: typeof Plus;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium ${
        variant === 'primary' ? 'bg-primary text-primary-foreground' : 'border bg-card'
      }`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function BadgeText({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-secondary px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function toneClass(tone: string) {
  if (tone === 'good') return 'bg-success/15 text-success';
  if (tone === 'warning') return 'bg-warning/15 text-warning';
  if (tone === 'danger') return 'bg-danger/15 text-danger';
  return 'bg-secondary text-muted-foreground';
}

function toneTextClass(tone: string) {
  if (tone === 'good') return 'text-success';
  if (tone === 'warning') return 'text-warning';
  if (tone === 'danger') return 'text-danger';
  return 'text-accent';
}
