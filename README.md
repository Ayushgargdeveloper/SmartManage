# WorkPulse AI

WorkPulse AI is a modular monolith SaaS foundation for daily work progress, team visibility, and AI-assisted management insight.

## Current Scope

This repository currently includes Phase 0 foundation and Phase 1 visual prototype work, the Phase 2 database foundation, Phase 3 live workflow integration, Phase 4 analytics intelligence, Phase 5 AI operations, Phase 6 follow-through, Phase 7 activity review, Phase 8 daily briefing, the Phase 9 briefing report slice, Phase 10 report previews, Phase 11 report exports, Phase 12 report sharing, Phase 13 report delivery visibility, Phase 14 shared report inbox, Phase 15 report review acknowledgements, Phase 16 shared report feedback, Phase 17 report engagement analytics, Phase 18 report engagement recommendations, Phase 19 report share follow-up prompts, Phase 20 follow-up draft copy actions, Phase 21 live task filters, Phase 22 filtered task queue insights, Phase 23 task queue briefing drafts, Phase 24 filtered task queue exports, Phase 25 saved task filter views, Phase 26 task filter view portability, Phase 27 saved view summaries, Phase 28 current saved view detection, Phase 29 unsaved filter indicators, Phase 30 saved view recency cues, Phase 31 saved view refresh actions, Phase 32 saved view maintenance checkpoints, Phase 33 saved view overlap detection, Phase 34 saved view overlap badges, Phase 35 saved view cleanup cues, Phase 36 saved view overlap cleanup, Phase 37 saved view cleanup undo, Phase 38 saved view export readiness, and Phase 39 local demo completion mode:

- `apps/web`: Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui-ready structure
- `apps/api`: NestJS REST API with health-check, JWT authentication, and tenant-scoped work endpoints
- Platform-scoped API for super-admin tenant, usage, and audit visibility
- `packages/config`: centralized product and environment configuration
- `packages/shared`: shared API response helpers
- `packages/types`: shared TypeScript domain types
- `apps/api/prisma`: Prisma schema, migration, and seed data
- Docker Compose for local PostgreSQL and Redis
- Live daily-progress submission from the web app to the authenticated API
- Live blocker dashboard data from the authenticated API
- Live notification feed data from the authenticated API
- Live generated report list data from the authenticated API
- Live report generation from current workspace metrics
- Live AI conversation history from the authenticated API
- Live AI question submission with saved grounded responses
- Live organization, department, and team visibility from the authenticated API
- Live task creation from the web app to the authenticated API
- Live workspace settings read/update workflow with audit logging
- Live platform overview for super-admin users
- Live tenant status management for super-admin users
- Live blocker resolution workflow with resolver tracking, notification, comment, and audit log
- Live notification read-state workflow with single and bulk mark-as-read actions
- Live tenant-scoped workspace analytics with submission coverage, task completion, project health, workload pressure, risk queue, and rule-based recommendations
- Live Analytics navigation for company admin and team leader roles
- AI action-plan intent for generating saved, evidence-backed next steps from blockers, overdue work, workload, and project risk
- AI Assistant action-plan control with preserved numbered-plan formatting in conversation history
- Live task follow-through updates for status, progress, actual hours, update notes, assignee notifications, and audit history
- Quick task actions in the web workspace for starting work, sending tasks to review, and marking tasks complete
- Live tenant-scoped activity review feed combining audit history and update comments
- Dashboard recent activity panel backed by live operational activity with prototype fallback
- Live daily operational briefing with headline, coverage metrics, priorities, unread notifications, and latest activity
- Dashboard briefing panel that turns analytics and activity into a manager-ready daily snapshot
- Briefing report generation that saves the current daily briefing into generated reports
- Dashboard save-as-report action with report-ready notification and audit history
- Report preview panel for saved generated reports and daily briefing snapshots
- Structured report rendering for metrics, status distributions, priorities, activity, recent progress, and blockers
- Export-ready report markdown and plain-text payloads from the authenticated API
- Report preview copy/download controls with live API export and prototype fallback
- Tenant-scoped report sharing that notifies selected active workspace users
- Report preview recipient picker and share note workflow backed by audit logging
- Report share history API enriched with actor and recipient details
- Report preview delivery history panel that refreshes after sharing
- Recipient-scoped shared report inbox built from report share audit history
- Shared-with-me report panel with preview and export reuse
- Recipient report review acknowledgements backed by tenant-scoped audit history
- Manager delivery history badges that show recipient reviewed timestamps
- Recipient report feedback workflow backed by tenant-scoped audit history
- Manager delivery history feedback visibility for shared report recipients
- Tenant-scoped report engagement analytics for shares, views, and feedback
- Reports page engagement panel with recipient, view, feedback, and top-report activity
- Rule-based report engagement recommendations for unread reports, feedback gaps, stale shares, and strong report formats
- Reports page recommendation prompts surfaced alongside live engagement metrics
- Per-share follow-up status for pending reviews and pending feedback
- Manager-ready follow-up drafts in report share history
- One-click follow-up draft copy controls with inline success and error feedback
- Typed task query parameters for status, priority, project, assignee, and row-limit filters
- Live task workspace filter controls that fetch filtered task queues from the authenticated API
- Filtered task queue health metrics for completion, blocked work, overdue work, and near-term due dates
- Manager-ready task queue focus prompts generated from the currently returned live task records
- Copy-ready task queue briefing drafts generated from filtered task risk, ownership, and due-date context
- CSV exports for the currently filtered live task queue with ownership, status, due-date, progress, and hour fields
- Browser-persisted saved task filter views for restoring recurring task queue review contexts
- JSON export/import controls for saved task filter views with validation and name-based merge behavior
- Saved task filter view summary cards with saved dates and filter badges for faster review
- Current saved view highlighting when the active live filters match a saved task filter view
- Unsaved/default/saved filter state indicators for the current live task queue context
- Saved task filter view recency badges that flag fresh, older, and review-worthy queue contexts
- One-click saved task filter view refresh actions that update named views with the current live filters and recency timestamp
- Saved task filter view maintenance checkpoints for fresh, review-needed, current-match, and next-refresh guidance
- Saved task filter view overlap detection that flags duplicate filter signatures before export or review
- Per-view saved filter overlap badges that name duplicate saved contexts directly on saved view cards
- Saved filter overlap cleanup cues that identify the newest duplicate to keep and older duplicates to review
- One-click saved filter overlap cleanup that removes older duplicate saved views while preserving the newest saved context
- Undo support for saved filter overlap cleanup so recently removed duplicate views can be restored in one click
- Saved filter export readiness signals that flag clean, stale, and overlap-blocked saved view sets before download
- Seeded local demo auth that falls back when the live API database is unavailable
- Demo-backed workspace, task, report, sharing, notification, settings, platform, and AI responses for full product walkthroughs without Docker

Later phases will broaden product workflows, analytics, and AI integrations.

## Requirements

- Node.js 20.11+
- npm 10+
- Docker Desktop for PostgreSQL and Redis

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment files:

   ```bash
   cp .env.example .env
   ```

3. Start infrastructure:

   ```bash
   docker compose up -d
   ```

4. Start the web app:

   ```bash
   npm run dev:web
   ```

5. Start the API in another terminal:

   ```bash
   npm run dev:api
   ```

If PostgreSQL is not available, the web app still supports a complete local demo. Open the Auth Flows login screen and use:

```text
priya.m@acme.example
workpulse-dev-pass
```

For Super Admin demo access, use:

```text
ayushgarg.official07@gmail.com
workpulse-dev-pass
```

The browser client tries the real API first. If login is blocked by unavailable database credentials, it starts a seeded demo session and serves the product workflows from in-browser demo data.

## Useful Commands

```bash
npm run build
npm run lint
npm run typecheck
npm run format:check
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Authentication

After running migrations and seed data, use any seeded user with the development password:

```text
workpulse-dev-pass
```

Example login:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"priya.m@acme.example\",\"password\":\"workpulse-dev-pass\"}"
```

Seeded Super Admin login:

```text
ayushgarg.official07@gmail.com
workpulse-dev-pass
```

Use the returned bearer token with:

```text
GET http://localhost:4000/auth/me
```

## Work APIs

Authenticated company users can call:

```text
GET http://localhost:4000/work/overview
GET http://localhost:4000/work/analytics
GET http://localhost:4000/work/activity
GET http://localhost:4000/work/briefing
POST http://localhost:4000/work/briefing/report
GET http://localhost:4000/work/settings
PATCH http://localhost:4000/work/settings
GET http://localhost:4000/work/projects
GET http://localhost:4000/work/tasks
GET http://localhost:4000/work/tasks?status=IN_PROGRESS&priority=HIGH&limit=25
GET http://localhost:4000/work/people
POST http://localhost:4000/work/tasks
PATCH http://localhost:4000/work/tasks/:id
GET http://localhost:4000/work/blockers
GET http://localhost:4000/work/notifications
GET http://localhost:4000/work/reports
GET http://localhost:4000/work/reports/shared-with-me
GET http://localhost:4000/work/reports/engagement
GET http://localhost:4000/work/reports/:id/export
GET http://localhost:4000/work/reports/:id/shares
POST http://localhost:4000/work/reports/:id/viewed
POST http://localhost:4000/work/reports/:id/feedback
POST http://localhost:4000/work/reports/:id/share
POST http://localhost:4000/work/reports
GET http://localhost:4000/work/ai-conversations
POST http://localhost:4000/work/ai-conversations/ask
PATCH http://localhost:4000/work/blockers/:id/resolve
PATCH http://localhost:4000/work/notifications/:id/read
PATCH http://localhost:4000/work/notifications/read-all
POST http://localhost:4000/work/daily-progress
```

Authenticated platform administrators can call:

```text
GET http://localhost:4000/platform/overview
PATCH http://localhost:4000/platform/companies/:id/status
```

These endpoints derive tenant scope from the bearer token and reject platform-only users for company work data.

See `DATABASE.md` for schema structure, tenant-isolation rules, and seed data notes.

## Health Check

With the API running, open:

```text
http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "WorkPulse AI API"
}
```
