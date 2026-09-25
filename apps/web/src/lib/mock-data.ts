import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListTodo,
  Network,
  Settings,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RoleKey = 'super-admin' | 'company-admin' | 'team-leader' | 'employee' | 'auth';

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export type RolePrototype = {
  key: RoleKey;
  label: string;
  workspace: string;
  nav: NavItem[];
};

export const roles: RolePrototype[] = [
  {
    key: 'company-admin',
    label: 'Company Admin',
    workspace: 'Acme Operations',
    nav: [
      { key: 'dashboard', label: 'Company Dashboard', icon: LayoutDashboard },
      { key: 'people', label: 'People', icon: Users },
      { key: 'departments', label: 'Departments', icon: Building2 },
      { key: 'teams', label: 'Teams', icon: Network },
      { key: 'projects', label: 'Projects', icon: ClipboardList },
      { key: 'tasks', label: 'Tasks', icon: ListTodo },
      { key: 'daily-progress', label: 'Daily Progress', icon: CalendarDays },
      { key: 'blockers', label: 'Blockers', icon: AlertTriangle },
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'ai-assistant', label: 'AI Assistant', icon: Bot },
      { key: 'ai-insights', label: 'AI Insights', icon: Sparkles },
      { key: 'reports', label: 'Reports', icon: FileText },
      { key: 'notifications', label: 'Notifications', icon: Bell },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    key: 'team-leader',
    label: 'Team Leader',
    workspace: 'Product Delivery',
    nav: [
      { key: 'dashboard', label: 'Team Dashboard', icon: LayoutDashboard },
      { key: 'my-team', label: 'Team Members', icon: Users },
      { key: 'tasks', label: 'Tasks', icon: ListTodo },
      { key: 'daily-updates', label: 'Progress', icon: CalendarDays },
      { key: 'blockers', label: 'Blockers', icon: AlertTriangle },
      { key: 'reports', label: 'Reports', icon: FileText },
      { key: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    key: 'employee',
    label: 'Employee',
    workspace: 'My Work',
    nav: [
      { key: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { key: 'my-tasks', label: 'My Tasks', icon: ListTodo },
      { key: 'submit-progress', label: 'My Progress', icon: CheckCircle2 },
      { key: 'my-blockers', label: 'My Blockers', icon: AlertTriangle },
      { key: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    key: 'super-admin',
    label: 'Super Admin',
    workspace: 'Platform',
    nav: [
      { key: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
      { key: 'companies', label: 'Companies', icon: Building2 },
      { key: 'company-management', label: 'Company Management', icon: Shield },
      { key: 'analytics', label: 'Audit & Platform Info', icon: BarChart3 },
      { key: 'notifications', label: 'Notifications', icon: Bell },
      { key: 'settings', label: 'Platform Settings', icon: Settings },
    ],
  },
  {
    key: 'auth',
    label: 'Sign In',
    workspace: 'Access',
    nav: [{ key: 'login', label: 'Login', icon: Shield }],
  },
];

export const kpis = [
  { label: 'Total employees', value: '142', delta: '+8 this month', tone: 'good' },
  { label: 'Active projects', value: '18', delta: '4 at risk', tone: 'warning' },
  { label: 'Completed tasks', value: '284', delta: '+21% vs last week', tone: 'good' },
  { label: 'In progress', value: '96', delta: '34 due this week', tone: 'neutral' },
  { label: 'Blocked tasks', value: '11', delta: '3 over 48h', tone: 'danger' },
  { label: 'Overdue tasks', value: '17', delta: '-6 since Monday', tone: 'warning' },
  { label: 'Submission rate', value: '87%', delta: '16 missing today', tone: 'good' },
  { label: 'Team workload', value: '74%', delta: 'Balanced capacity', tone: 'neutral' },
];

export const trendData = [
  { day: 'Mon', completed: 32, submitted: 84, blockers: 8 },
  { day: 'Tue', completed: 38, submitted: 88, blockers: 9 },
  { day: 'Wed', completed: 41, submitted: 91, blockers: 7 },
  { day: 'Thu', completed: 36, submitted: 86, blockers: 11 },
  { day: 'Fri', completed: 47, submitted: 92, blockers: 6 },
];

export const projectHealth = [
  { name: 'Mobile checkout', value: 78, status: 'Healthy' },
  { name: 'Partner portal', value: 52, status: 'At risk' },
  { name: 'Analytics refresh', value: 68, status: 'Watch' },
  { name: 'Billing migration', value: 41, status: 'Delayed' },
];

export const tasks = [
  {
    task: 'Finalize CSV import validator',
    project: 'Analytics refresh',
    owner: 'Maya R.',
    status: 'In Progress',
    priority: 'High',
    due: 'Today',
    progress: 72,
  },
  {
    task: 'Resolve staging SSO redirect',
    project: 'Partner portal',
    owner: 'Dev P.',
    status: 'Blocked',
    priority: 'Urgent',
    due: 'Yesterday',
    progress: 44,
  },
  {
    task: 'QA payment retry states',
    project: 'Mobile checkout',
    owner: 'Nora S.',
    status: 'Review',
    priority: 'Medium',
    due: 'Tomorrow',
    progress: 91,
  },
  {
    task: 'Design report filters empty state',
    project: 'Reports v2',
    owner: 'Ishan K.',
    status: 'Not Started',
    priority: 'Low',
    due: 'Aug 2',
    progress: 0,
  },
];

export const employees = [
  {
    name: 'Maya Rao',
    team: 'Frontend',
    submitted: '10:12 AM',
    workload: 'Balanced',
    status: 'Online',
  },
  { name: 'Dev Patel', team: 'Backend', submitted: 'Missing', workload: 'High', status: 'Blocked' },
  {
    name: 'Nora Shah',
    team: 'QA',
    submitted: '09:48 AM',
    workload: 'Balanced',
    status: 'Reviewing',
  },
  {
    name: 'Ishan Kapoor',
    team: 'Design',
    submitted: 'Draft saved',
    workload: 'Light',
    status: 'Planning',
  },
];

export const blockers = [
  {
    title: 'SSO provider callback mismatch',
    project: 'Partner portal',
    severity: 'High',
    age: '3d 4h',
    owner: 'Dev Patel',
  },
  {
    title: 'Client approval pending for tax invoice format',
    project: 'Billing migration',
    severity: 'Medium',
    age: '2d 1h',
    owner: 'Anika Lee',
  },
  {
    title: 'Sandbox account access expired',
    project: 'Mobile checkout',
    severity: 'Low',
    age: '8h',
    owner: 'Nora Shah',
  },
];

export const activity = [
  {
    icon: CheckCircle2,
    title: 'QA retry states completed',
    meta: 'Nora Shah - Mobile checkout - 18m ago',
  },
  {
    icon: AlertTriangle,
    title: 'New blocker raised',
    meta: 'Dev Patel - Partner portal - 41m ago',
  },
  {
    icon: CircleDot,
    title: 'Progress update submitted',
    meta: 'Maya Rao - Analytics refresh - 1h ago',
  },
  { icon: FileText, title: 'Weekly report draft generated', meta: 'AI summary - 2h ago' },
];

export const suggestedQuestions = [
  'What did the development team complete today?',
  'Which projects are at risk?',
  'What are the biggest blockers?',
  "Summarize this week's progress.",
  "What should we discuss in today's meeting?",
];

export const insightCards = [
  {
    label: 'Verified metric',
    title: 'Submission rate is 87%',
    body: '124 of 142 employees have submitted or saved a daily update today.',
  },
  {
    label: 'AI interpretation',
    title: 'Partner portal risk is dependency-driven',
    body: 'Most delays reference the same SSO callback issue and external access wait time.',
  },
  {
    label: 'Recommended action',
    title: 'Assign a resolver before stand-up',
    body: 'Move the SSO blocker to a named owner and set a same-day escalation checkpoint.',
  },
];
