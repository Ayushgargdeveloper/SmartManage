import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import {
  BlockerCategory,
  BlockerSeverity,
  Prisma,
  type Notification,
} from '../../../prisma/generated/client';
import { PrismaService } from '../database/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import type { AskAiDto } from './dto/ask-ai.dto';
import type { CreateDailyProgressDto } from './dto/create-daily-progress.dto';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { CreateReportDto } from './dto/create-report.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { ReportFeedbackDto } from './dto/report-feedback.dto';
import type { ResolveBlockerDto } from './dto/resolve-blocker.dto';
import type { ShareReportDto } from './dto/share-report.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const [activeProjects, delayedProjects, openBlockers, overdueTasks, recentProgress] =
        await Promise.all([
          this.prisma.project.count({ where: { companyId, archivedAt: null, status: 'ACTIVE' } }),
          this.prisma.project.count({ where: { companyId, archivedAt: null, status: 'DELAYED' } }),
          this.prisma.blocker.count({
            where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
          }),
          this.prisma.task.count({
            where: {
              companyId,
              archivedAt: null,
              dueDate: { lt: new Date() },
              status: { notIn: ['COMPLETED'] },
            },
          }),
          this.prisma.dailyProgress.findMany({
            where: { companyId },
            orderBy: { workDate: 'desc' },
            take: 5,
            include: {
              user: { select: { id: true, name: true, email: true } },
              project: { select: { id: true, name: true } },
              task: { select: { id: true, title: true } },
            },
          }),
        ]);

      return {
        metrics: {
          activeProjects,
          delayedProjects,
          openBlockers,
          overdueTasks,
        },
        recentProgress: recentProgress.map((item) => ({
          id: item.id,
          workDate: item.workDate.toISOString().slice(0, 10),
          workCompleted: item.workCompleted,
          status: item.status,
          progressPercent: item.progressPercent,
          timeSpentHours: Number(item.timeSpentHours),
          user: item.user,
          project: item.project,
          task: item.task,
        })),
      };
    });
  }

  async getAnalytics(user: JwtPayload) {
    const companyId = this.requireTenant(user);
    const today = this.parseWorkDate(new Date().toISOString().slice(0, 10));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const trendStart = new Date(today);
    trendStart.setUTCDate(trendStart.getUTCDate() - 6);

    return this.withDatabaseAvailability(async () => {
      const [
        activeEmployees,
        submittedToday,
        totalTasks,
        completedTasks,
        overdueTasks,
        taskStatusCounts,
        progressEntries,
        blockers,
        projects,
        workloadPeople,
      ] = await Promise.all([
        this.prisma.user.count({ where: { companyId, archivedAt: null, isActive: true } }),
        this.prisma.dailyProgress.count({ where: { companyId, workDate: today } }),
        this.prisma.task.count({ where: { companyId, archivedAt: null } }),
        this.prisma.task.count({ where: { companyId, archivedAt: null, status: 'COMPLETED' } }),
        this.prisma.task.count({
          where: {
            companyId,
            archivedAt: null,
            dueDate: { lt: today },
            status: { notIn: ['COMPLETED'] },
          },
        }),
        this.prisma.task.groupBy({
          by: ['status'],
          where: { companyId, archivedAt: null },
          _count: { _all: true },
        }),
        this.prisma.dailyProgress.findMany({
          where: { companyId, workDate: { gte: trendStart, lt: tomorrow } },
          orderBy: { workDate: 'asc' },
          select: {
            id: true,
            workDate: true,
            status: true,
            progressPercent: true,
            hasBlocker: true,
          },
        }),
        this.prisma.blocker.findMany({
          where: { companyId },
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            description: true,
            status: true,
            severity: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
            employee: { select: { id: true, name: true } },
          },
        }),
        this.prisma.project.findMany({
          where: { companyId, archivedAt: null },
          orderBy: [{ status: 'asc' }, { priority: 'desc' }, { targetDate: 'asc' }],
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            progress: true,
            targetDate: true,
            tasks: {
              where: { archivedAt: null },
              select: { id: true, status: true, dueDate: true },
            },
            blockers: {
              select: { id: true, status: true, severity: true },
            },
          },
        }),
        this.prisma.user.findMany({
          where: { companyId, archivedAt: null, isActive: true },
          orderBy: { name: 'asc' },
          take: 50,
          select: {
            id: true,
            name: true,
            title: true,
            assignedTasks: {
              where: {
                companyId,
                archivedAt: null,
                status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD', 'REVIEW'] },
              },
              select: { id: true, status: true, dueDate: true },
            },
            blockers: {
              where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
              select: { id: true, severity: true },
            },
            dailyProgress: {
              where: { companyId, workDate: today },
              select: { id: true, progressPercent: true },
              take: 1,
            },
          },
        }),
      ]);

      const taskStatus = Object.fromEntries(
        taskStatusCounts.map((item) => [item.status, item._count._all]),
      );
      const openBlockers = blockers.filter((blocker) =>
        ['OPEN', 'ESCALATED', 'IN_REVIEW'].includes(blocker.status),
      );
      const criticalBlockers = openBlockers.filter(
        (blocker) => blocker.severity === 'CRITICAL',
      ).length;
      const highRiskProjects = projects.filter((project) => {
        const openProjectBlockers = project.blockers.filter((blocker) =>
          ['OPEN', 'ESCALATED', 'IN_REVIEW'].includes(blocker.status),
        ).length;
        const overdueProjectTasks = project.tasks.filter(
          (task) => task.dueDate && task.dueDate < today && task.status !== 'COMPLETED',
        ).length;
        return project.status === 'DELAYED' || openProjectBlockers > 0 || overdueProjectTasks > 0;
      });

      const trend = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(trendStart);
        day.setUTCDate(trendStart.getUTCDate() + index);
        const key = this.dateKey(day);
        const entries = progressEntries.filter((entry) => this.dateKey(entry.workDate) === key);
        const averageProgress =
          entries.length > 0
            ? Math.round(
                entries.reduce((total, entry) => total + entry.progressPercent, 0) / entries.length,
              )
            : 0;

        return {
          day: this.analyticsDayLabel(day),
          date: key,
          submitted: entries.length,
          completed: entries.filter((entry) => entry.status === 'COMPLETED').length,
          blockers: entries.filter((entry) => entry.hasBlocker).length,
          averageProgress,
        };
      });

      const projectHealth = projects
        .map((project) => {
          const openProjectBlockers = project.blockers.filter((blocker) =>
            ['OPEN', 'ESCALATED', 'IN_REVIEW'].includes(blocker.status),
          ).length;
          const overdueProjectTasks = project.tasks.filter(
            (task) => task.dueDate && task.dueDate < today && task.status !== 'COMPLETED',
          ).length;
          const completedProjectTasks = project.tasks.filter(
            (task) => task.status === 'COMPLETED',
          ).length;
          const score = Math.max(
            0,
            Math.min(
              100,
              project.progress -
                openProjectBlockers * 12 -
                overdueProjectTasks * 8 -
                (project.status === 'DELAYED' ? 18 : 0) -
                (project.status === 'ON_HOLD' ? 10 : 0),
            ),
          );

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            priority: project.priority,
            progress: project.progress,
            healthScore: score,
            targetDate: project.targetDate?.toISOString() ?? null,
            counts: {
              tasks: project.tasks.length,
              completedTasks: completedProjectTasks,
              openBlockers: openProjectBlockers,
              overdueTasks: overdueProjectTasks,
            },
          };
        })
        .sort((a, b) => a.healthScore - b.healthScore)
        .slice(0, 6);

      const workload = workloadPeople
        .map((person) => {
          const overdue = person.assignedTasks.filter(
            (task) => task.dueDate && task.dueDate < today && task.status !== 'COMPLETED',
          ).length;
          const pressureScore =
            person.assignedTasks.length * 8 + overdue * 14 + person.blockers.length * 16;

          return {
            id: person.id,
            name: person.name,
            title: person.title,
            activeTasks: person.assignedTasks.length,
            overdueTasks: overdue,
            openBlockers: person.blockers.length,
            submittedToday: person.dailyProgress.length > 0,
            pressureScore,
          };
        })
        .sort((a, b) => b.pressureScore - a.pressureScore)
        .slice(0, 6);

      const risks = openBlockers.slice(0, 6).map((blocker) => ({
        id: blocker.id,
        title: blocker.description,
        severity: blocker.severity,
        status: blocker.status,
        ageHours: Math.max(
          0,
          Math.round(((Date.now() - blocker.createdAt.getTime()) / 3_600_000) * 10) / 10,
        ),
        owner: blocker.employee.name,
        project: blocker.project.name,
        task: blocker.task?.title ?? null,
      }));

      return {
        metrics: {
          activeEmployees,
          submittedToday,
          submissionRate:
            activeEmployees > 0 ? Math.round((submittedToday / activeEmployees) * 100) : 0,
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          overdueTasks,
          openBlockers: openBlockers.length,
          criticalBlockers,
          highRiskProjects: highRiskProjects.length,
        },
        trend,
        taskStatus,
        projectHealth,
        workload,
        risks,
        recommendations: this.buildAnalyticsRecommendations({
          overdueTasks,
          openBlockers: openBlockers.length,
          criticalBlockers,
          highRiskProjects: highRiskProjects.length,
          submissionRate:
            activeEmployees > 0 ? Math.round((submittedToday / activeEmployees) * 100) : 0,
        }),
      };
    });
  }

  async listActivity(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const [auditLogs, comments] = await Promise.all([
        this.prisma.auditLog.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
        }),
        this.prisma.comment.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            author: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true } },
            task: { select: { id: true, title: true, status: true } },
            blocker: { select: { id: true, description: true, status: true } },
          },
        }),
      ]);

      const auditItems = auditLogs.map((log) => ({
        id: log.id,
        type: 'AUDIT',
        action: log.action,
        title: this.activityTitle(log.action, log.entityType),
        body: this.activityBody(log.action, log.metadata),
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
        metadata: log.metadata,
      }));

      const commentItems = comments.map((comment) => ({
        id: comment.id,
        type: 'COMMENT',
        action: 'COMMENT_ADDED',
        title: comment.task
          ? `Task note: ${comment.task.title}`
          : comment.blocker
            ? `Blocker note: ${comment.blocker.description}`
            : comment.project
              ? `Project note: ${comment.project.name}`
              : 'Workspace note',
        body: comment.body,
        entityType: comment.task
          ? 'Task'
          : comment.blocker
            ? 'Blocker'
            : comment.project
              ? 'Project'
              : 'Comment',
        entityId: comment.task?.id ?? comment.blocker?.id ?? comment.project?.id ?? comment.id,
        createdAt: comment.createdAt.toISOString(),
        actor: comment.author,
        metadata: {
          project: comment.project,
          task: comment.task,
          blocker: comment.blocker,
        },
      }));

      return [...auditItems, ...commentItems]
        .sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 30);
    });
  }

  async getBriefing(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      return this.buildBriefingSnapshot(companyId, user.sub);
    });
  }

  async createBriefingReport(user: JwtPayload) {
    const companyId = this.requireTenant(user);
    const today = this.parseWorkDate(new Date().toISOString().slice(0, 10));

    return this.withDatabaseAvailability(async () => {
      const briefing = await this.buildBriefingSnapshot(companyId, user.sub);
      const title = `Daily briefing - ${briefing.date}`;

      const report = await this.prisma.$transaction(async (tx) => {
        const created = await tx.generatedReport.create({
          data: {
            companyId,
            creatorId: user.sub,
            type: 'DAILY',
            title,
            periodStart: today,
            periodEnd: today,
            filters: {
              source: 'daily_briefing',
              date: briefing.date,
            },
            content: {
              ...briefing,
              aiSummary: briefing.headline,
            },
          },
          include: {
            creator: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true, status: true } },
          },
        });

        await tx.notification.create({
          data: {
            companyId,
            userId: user.sub,
            type: 'REPORT_READY',
            title: 'Daily briefing saved',
            body: `${created.title} is available in Reports.`,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'BRIEFING_REPORT_GENERATED',
            entityType: 'GeneratedReport',
            entityId: created.id,
            metadata: {
              date: briefing.date,
              source: briefing.generatedFrom,
              priorityCount: briefing.priorities.length,
              activityCount: briefing.activity.length,
            },
          },
        });

        return created;
      });

      return this.serializeReport(report);
    });
  }

  async getSettings(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const company = await this.prisma.company.findFirst({
        where: { id: companyId, archivedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          timezone: true,
          dailyCutoff: true,
          workweek: true,
          updatedAt: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Company settings were not found for the current tenant.');
      }

      return this.serializeSettings(company);
    });
  }

  async updateSettings(user: JwtPayload, dto: UpdateCompanySettingsDto) {
    const companyId = this.requireTenant(user);
    const workweekDays = dto.workweekDays?.map((day) => day.trim().toUpperCase()).filter(Boolean);

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Company name is required.');
    }

    if (dto.timezone !== undefined && !dto.timezone.trim()) {
      throw new BadRequestException('Timezone is required.');
    }

    if (workweekDays && new Set(workweekDays).size !== workweekDays.length) {
      throw new BadRequestException('Workweek days must be unique.');
    }

    return this.withDatabaseAvailability(async () => {
      const company = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.company.update({
          where: { id: companyId },
          data: {
            name: dto.name?.trim(),
            timezone: dto.timezone?.trim(),
            dailyCutoff: dto.dailyCutoff,
            workweek: workweekDays ? { days: workweekDays } : undefined,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            timezone: true,
            dailyCutoff: true,
            workweek: true,
            updatedAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'COMPANY_SETTINGS_UPDATED',
            entityType: 'Company',
            entityId: companyId,
            metadata: {
              changedFields: Object.entries({
                name: dto.name,
                timezone: dto.timezone,
                dailyCutoff: dto.dailyCutoff,
                workweekDays,
              })
                .filter(([, value]) => value !== undefined)
                .map(([key]) => key),
            },
          },
        });

        return updated;
      });

      return this.serializeSettings(company);
    });
  }

  async listTasks(user: JwtPayload, query: ListTasksQueryDto) {
    const companyId = this.requireTenant(user);
    const take = query.limit ?? 25;

    return this.withDatabaseAvailability(async () => {
      const tasks = await this.prisma.task.findMany({
        where: {
          companyId,
          archivedAt: null,
          status: query.status,
          priority: query.priority,
          projectId: query.projectId,
          assigneeId: query.assigneeId,
        },
        orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        take,
        include: {
          project: { select: { id: true, name: true, status: true } },
          assignee: { select: { id: true, name: true, email: true } },
          reporter: { select: { id: true, name: true, email: true } },
        },
      });

      return tasks.map((task) => ({
        ...this.serializeTask(task),
      }));
    });
  }

  async createTask(user: JwtPayload, dto: CreateTaskDto) {
    const companyId = this.requireTenant(user);
    const title = dto.title.trim();
    const description = dto.description?.trim();

    if (!title) {
      throw new BadRequestException('Task title is required.');
    }

    return this.withDatabaseAvailability(async () => {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, archivedAt: null },
        select: { id: true, name: true },
      });

      if (!project) {
        throw new NotFoundException('Project was not found for the current tenant.');
      }

      if (dto.assigneeId) {
        const assignee = await this.prisma.user.findFirst({
          where: { id: dto.assigneeId, companyId, archivedAt: null, isActive: true },
          select: { id: true },
        });

        if (!assignee) {
          throw new NotFoundException('Assignee was not found for the current tenant.');
        }
      }

      const task = await this.prisma.$transaction(async (tx) => {
        const created = await tx.task.create({
          data: {
            companyId,
            projectId: dto.projectId,
            assigneeId: dto.assigneeId,
            reporterId: user.sub,
            title,
            description: description || undefined,
            status: dto.status ?? 'NOT_STARTED',
            priority: dto.priority ?? 'MEDIUM',
            dueDate: dto.dueDate ? this.parseWorkDate(dto.dueDate) : undefined,
            estimatedHours:
              typeof dto.estimatedHours === 'number'
                ? new Prisma.Decimal(dto.estimatedHours)
                : undefined,
          },
          include: {
            project: { select: { id: true, name: true, status: true } },
            assignee: { select: { id: true, name: true, email: true } },
            reporter: { select: { id: true, name: true, email: true } },
          },
        });

        if (created.assigneeId && created.assigneeId !== user.sub) {
          await tx.notification.create({
            data: {
              companyId,
              userId: created.assigneeId,
              type: 'SYSTEM',
              title: 'New task assigned',
              body: `${project.name}: ${created.title}`,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'TASK_CREATED',
            entityType: 'Task',
            entityId: created.id,
            metadata: {
              projectId: dto.projectId,
              assigneeId: created.assigneeId,
              priority: created.priority,
              status: created.status,
            },
          },
        });

        return created;
      });

      return this.serializeTask(task);
    });
  }

  async updateTask(user: JwtPayload, taskId: string, dto: UpdateTaskDto) {
    const companyId = this.requireTenant(user);
    const note = dto.note?.trim();

    if (
      dto.status === undefined &&
      dto.progress === undefined &&
      dto.actualHours === undefined &&
      !note
    ) {
      throw new BadRequestException('At least one task update field is required.');
    }

    return this.withDatabaseAvailability(async () => {
      const existingTask = await this.prisma.task.findFirst({
        where: { id: taskId, companyId, archivedAt: null },
        select: {
          id: true,
          projectId: true,
          assigneeId: true,
          status: true,
          progress: true,
          actualHours: true,
          title: true,
          project: { select: { name: true } },
        },
      });

      if (!existingTask) {
        throw new NotFoundException('Task was not found for the current tenant.');
      }

      const nextProgress =
        dto.status === 'COMPLETED' && dto.progress === undefined ? 100 : dto.progress;

      const updatedTask = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
          where: { id: existingTask.id },
          data: {
            status: dto.status,
            progress: nextProgress,
            actualHours:
              typeof dto.actualHours === 'number' ? new Prisma.Decimal(dto.actualHours) : undefined,
          },
          include: {
            project: { select: { id: true, name: true, status: true } },
            assignee: { select: { id: true, name: true, email: true } },
            reporter: { select: { id: true, name: true, email: true } },
          },
        });

        if (note) {
          await tx.comment.create({
            data: {
              companyId,
              authorId: user.sub,
              projectId: existingTask.projectId,
              taskId: existingTask.id,
              body: note,
            },
          });
        }

        if (existingTask.assigneeId && existingTask.assigneeId !== user.sub && dto.status) {
          await tx.notification.create({
            data: {
              companyId,
              userId: existingTask.assigneeId,
              type: 'SYSTEM',
              title: 'Task status updated',
              body: `${existingTask.project.name}: ${existingTask.title} is now ${dto.status.toLowerCase().replace(/_/g, ' ')}.`,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'TASK_UPDATED',
            entityType: 'Task',
            entityId: existingTask.id,
            metadata: {
              previousStatus: existingTask.status,
              nextStatus: updated.status,
              previousProgress: existingTask.progress,
              nextProgress: updated.progress,
              previousActualHours: existingTask.actualHours
                ? Number(existingTask.actualHours)
                : null,
              nextActualHours: updated.actualHours ? Number(updated.actualHours) : null,
              noteAdded: Boolean(note),
            },
          },
        });

        return updated;
      });

      return this.serializeTask(updatedTask);
    });
  }

  async listProjects(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const projects = await this.prisma.project.findMany({
        where: { companyId, archivedAt: null },
        orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { name: 'asc' }],
        include: {
          owner: { select: { id: true, name: true, email: true } },
          team: { select: { id: true, name: true } },
          _count: { select: { tasks: true, blockers: true, members: true } },
        },
      });

      return projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        targetDate: project.targetDate?.toISOString() ?? null,
        owner: project.owner,
        team: project.team,
        counts: {
          tasks: project._count.tasks,
          blockers: project._count.blockers,
          members: project._count.members,
        },
      }));
    });
  }

  async listPeople(user: JwtPayload) {
    const companyId = this.requireTenant(user);
    const today = this.parseWorkDate(new Date().toISOString().slice(0, 10));
    const activeTaskStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD'] as const;

    return this.withDatabaseAvailability(async () => {
      const [people, departments, teams] = await Promise.all([
        this.prisma.user.findMany({
          where: { companyId, archivedAt: null },
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
          include: {
            roles: { include: { role: { select: { name: true } } } },
            teamMemberships: {
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    leaderId: true,
                    department: { select: { id: true, name: true } },
                  },
                },
              },
            },
            departmentMemberships: {
              include: { department: { select: { id: true, name: true } } },
            },
            assignedTasks: {
              where: { companyId, archivedAt: null, status: { in: [...activeTaskStatuses] } },
              select: { id: true, status: true, priority: true, dueDate: true },
            },
            dailyProgress: {
              where: { companyId, workDate: today },
              select: { id: true, status: true, progressPercent: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            blockers: {
              where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
              select: { id: true, severity: true, status: true },
            },
          },
        }),
        this.prisma.department.findMany({
          where: { companyId, archivedAt: null },
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { members: true, teams: true, projects: true } },
          },
        }),
        this.prisma.team.findMany({
          where: { companyId, archivedAt: null },
          orderBy: { name: 'asc' },
          include: {
            leader: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
            _count: { select: { members: true, projects: true } },
          },
        }),
      ]);

      const employees = people.map((person) => {
        const submittedProgress = person.dailyProgress[0] ?? null;
        const overdueTasks = person.assignedTasks.filter(
          (task) => task.dueDate && task.dueDate < new Date() && task.status !== 'COMPLETED',
        ).length;

        return {
          id: person.id,
          email: person.email,
          name: person.name,
          title: person.title,
          isActive: person.isActive,
          lastLoginAt: person.lastLoginAt?.toISOString() ?? null,
          roles: person.roles.map((role) => role.role.name),
          departments: person.departmentMemberships.map((membership) => membership.department),
          teams: person.teamMemberships.map((membership) => ({
            id: membership.team.id,
            name: membership.team.name,
            leaderId: membership.team.leaderId,
            department: membership.team.department,
          })),
          dailyUpdate: submittedProgress
            ? {
                status: submittedProgress.status,
                progressPercent: submittedProgress.progressPercent,
                submittedAt: submittedProgress.createdAt.toISOString(),
              }
            : null,
          workload: {
            activeTasks: person.assignedTasks.length,
            overdueTasks,
            openBlockers: person.blockers.length,
          },
        };
      });

      return {
        summary: {
          employees: employees.length,
          activeEmployees: employees.filter((person) => person.isActive).length,
          submittedToday: employees.filter((person) => person.dailyUpdate).length,
          openBlockers: employees.reduce(
            (total, person) => total + person.workload.openBlockers,
            0,
          ),
        },
        employees,
        departments: departments.map((department) => ({
          id: department.id,
          name: department.name,
          description: department.description,
          counts: {
            members: department._count.members,
            teams: department._count.teams,
            projects: department._count.projects,
          },
        })),
        teams: teams.map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          leader: team.leader,
          department: team.department,
          counts: {
            members: team._count.members,
            projects: team._count.projects,
          },
        })),
      };
    });
  }

  async createEmployee(user: JwtPayload, dto: CreateEmployeeDto) {
    const companyId = this.requireTenant(user);

    if (!user.roles.includes('COMPANY_ADMIN')) {
      throw new ForbiddenException('Only company administrators can create employee accounts.');
    }

    if (dto.role === 'SUPER_ADMIN' || dto.role === 'COMPANY_ADMIN') {
      throw new BadRequestException(
        'Company administrators can create only team leader or employee accounts.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    const title = dto.title?.trim() || null;
    const roleName = dto.role ?? 'EMPLOYEE';

    await this.withDatabaseAvailability(async () => {
      const [role, department, team] = await Promise.all([
        this.prisma.role.findUnique({
          where: { companyId_name: { companyId, name: roleName } },
          select: { id: true },
        }),
        dto.departmentId
          ? this.prisma.department.findFirst({
              where: { id: dto.departmentId, companyId, archivedAt: null },
              select: { id: true },
            })
          : null,
        dto.teamId
          ? this.prisma.team.findFirst({
              where: { id: dto.teamId, companyId, archivedAt: null },
              select: { id: true },
            })
          : null,
      ]);

      if (!role) throw new BadRequestException('The selected role is not configured.');
      if (dto.departmentId && !department) {
        throw new BadRequestException('The selected department is not available.');
      }
      if (dto.teamId && !team) {
        throw new BadRequestException('The selected team is not available.');
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          const employee = await tx.user.create({
            data: {
              companyId,
              email,
              name,
              title,
              passwordHash: await hash(dto.temporaryPassword, 12),
              roles: { create: { roleId: role.id } },
              departmentMemberships: department
                ? { create: { departmentId: department.id } }
                : undefined,
              teamMemberships: team ? { create: { teamId: team.id } } : undefined,
            },
          });

          await tx.auditLog.create({
            data: {
              companyId,
              actorId: user.sub,
              action: 'EMPLOYEE_CREATED',
              entityType: 'User',
              entityId: employee.id,
              metadata: {
                email,
                role: roleName,
                departmentId: dto.departmentId,
                teamId: dto.teamId,
              },
            },
          });
        });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException('An account with this email already exists.');
        }
        throw error;
      }
    });

    return this.listPeople(user);
  }

  async listBlockers(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const blockers = await this.prisma.blocker.findMany({
        where: { companyId },
        orderBy: [{ status: 'asc' }, { severity: 'desc' }, { createdAt: 'asc' }],
        take: 50,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          resolver: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
          task: { select: { id: true, title: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });

      return blockers.map((blocker) => ({
        id: blocker.id,
        description: blocker.description,
        category: blocker.category,
        status: blocker.status,
        severity: blocker.severity,
        resolution: blocker.resolution,
        resolvedAt: blocker.resolvedAt?.toISOString() ?? null,
        createdAt: blocker.createdAt.toISOString(),
        updatedAt: blocker.updatedAt.toISOString(),
        ageHours: Math.max(
          0,
          Math.round(((Date.now() - blocker.createdAt.getTime()) / 3_600_000) * 10) / 10,
        ),
        employee: blocker.employee,
        resolver: blocker.resolver,
        project: blocker.project,
        task: blocker.task,
        counts: {
          comments: blocker._count.comments,
          attachments: blocker._count.attachments,
        },
      }));
    });
  }

  async resolveBlocker(user: JwtPayload, blockerId: string, dto: ResolveBlockerDto) {
    const companyId = this.requireTenant(user);
    const resolution = dto.resolution.trim();

    if (!resolution) {
      throw new BadRequestException('Resolution is required.');
    }

    return this.withDatabaseAvailability(async () => {
      const blocker = await this.prisma.blocker.findFirst({
        where: { id: blockerId, companyId },
        select: { id: true, employeeId: true, status: true, description: true },
      });

      if (!blocker) {
        throw new NotFoundException('Blocker was not found for the current tenant.');
      }

      if (blocker.status === 'RESOLVED') {
        throw new ConflictException('Blocker is already resolved.');
      }

      const resolvedBlocker = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.blocker.update({
          where: { id: blocker.id },
          data: {
            status: 'RESOLVED',
            resolution,
            resolvedAt: new Date(),
            resolverId: user.sub,
          },
          include: {
            employee: { select: { id: true, name: true, email: true } },
            resolver: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true, status: true } },
            task: { select: { id: true, title: true, status: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        });

        await tx.comment.create({
          data: {
            companyId,
            authorId: user.sub,
            projectId: updated.project.id,
            taskId: updated.task?.id,
            blockerId: updated.id,
            body: `Resolution: ${resolution}`,
          },
        });

        if (updated.employee.id !== user.sub) {
          await tx.notification.create({
            data: {
              companyId,
              userId: updated.employee.id,
              type: 'SYSTEM',
              title: 'Blocker resolved',
              body: `${updated.project.name}: ${updated.description}`,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'BLOCKER_RESOLVED',
            entityType: 'Blocker',
            entityId: updated.id,
            metadata: {
              previousStatus: blocker.status,
              resolution,
            },
          },
        });

        return updated;
      });

      return this.serializeBlocker(resolvedBlocker);
    });
  }

  async listNotifications(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const notifications = await this.prisma.notification.findMany({
        where: {
          companyId,
          userId: user.sub,
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });

      return notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        readAt: notification.readAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      }));
    });
  }

  async markNotificationRead(user: JwtPayload, notificationId: string) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, companyId, userId: user.sub },
      });

      if (!notification) {
        throw new NotFoundException('Notification was not found for the current user.');
      }

      if (notification.readAt) {
        return this.serializeNotification(notification);
      }

      const updated = await this.prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
      });

      return this.serializeNotification(updated);
    });
  }

  async markAllNotificationsRead(user: JwtPayload) {
    const companyId = this.requireTenant(user);
    const readAt = new Date();

    return this.withDatabaseAvailability(async () => {
      const result = await this.prisma.notification.updateMany({
        where: {
          companyId,
          userId: user.sub,
          readAt: null,
        },
        data: { readAt },
      });

      return {
        updatedCount: result.count,
        readAt: readAt.toISOString(),
      };
    });
  }

  async listReports(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const reports = await this.prisma.generatedReport.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      });

      return reports.map((report) => ({
        ...this.serializeReport(report),
      }));
    });
  }

  async listSharedReports(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const shareLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          action: 'REPORT_SHARED',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      });
      const matchingLogs = shareLogs
        .filter((log) =>
          this.arrayValue(this.toJsonObject(log.metadata).recipientIds).includes(user.sub),
        )
        .slice(0, 25);
      const reportIds = [
        ...new Set(
          matchingLogs
            .map((log) => log.entityId)
            .filter((reportId): reportId is string => typeof reportId === 'string'),
        ),
      ];
      const reports = reportIds.length
        ? await this.prisma.generatedReport.findMany({
            where: { id: { in: reportIds }, companyId },
            include: {
              creator: { select: { id: true, name: true, email: true } },
              project: { select: { id: true, name: true, status: true } },
            },
          })
        : [];
      const reportsById = new Map(
        reports.map((report) => [report.id, this.serializeReport(report)]),
      );
      const viewLogs = reportIds.length
        ? await this.prisma.auditLog.findMany({
            where: {
              companyId,
              entityType: 'GeneratedReport',
              entityId: { in: reportIds },
              action: 'REPORT_VIEWED',
              actorId: user.sub,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];
      const viewedAtByReportId = new Map<string, string>();
      viewLogs.forEach((log) => {
        if (log.entityId && !viewedAtByReportId.has(log.entityId)) {
          viewedAtByReportId.set(log.entityId, log.createdAt.toISOString());
        }
      });
      const feedbackLogs = reportIds.length
        ? await this.prisma.auditLog.findMany({
            where: {
              companyId,
              entityType: 'GeneratedReport',
              entityId: { in: reportIds },
              action: 'REPORT_FEEDBACK',
              actorId: user.sub,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];
      const feedbackByReportId = new Map<string, { feedback: string; feedbackAt: string }>();
      feedbackLogs.forEach((log) => {
        if (log.entityId && !feedbackByReportId.has(log.entityId)) {
          feedbackByReportId.set(log.entityId, {
            feedback: this.stringValue(this.toJsonObject(log.metadata).feedback) ?? '',
            feedbackAt: log.createdAt.toISOString(),
          });
        }
      });

      return matchingLogs
        .map((log) => {
          const report = log.entityId ? reportsById.get(log.entityId) : undefined;
          if (!report) return null;

          const metadata = this.toJsonObject(log.metadata);

          return {
            id: log.id,
            reportId: report.id,
            sharedAt: this.stringValue(metadata.sharedAt) ?? log.createdAt.toISOString(),
            message: this.stringValue(metadata.message),
            actor: log.actor,
            viewedAt: viewedAtByReportId.get(report.id) ?? null,
            feedback: feedbackByReportId.get(report.id)?.feedback ?? null,
            feedbackAt: feedbackByReportId.get(report.id)?.feedbackAt ?? null,
            report,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    });
  }

  async getReportEngagement(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const reports = await this.prisma.generatedReport.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      });
      const reportIds = reports.map((report) => report.id);
      const [shareLogs, viewLogs, feedbackLogs] = reportIds.length
        ? await Promise.all([
            this.prisma.auditLog.findMany({
              where: {
                companyId,
                entityType: 'GeneratedReport',
                entityId: { in: reportIds },
                action: 'REPORT_SHARED',
              },
              orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.findMany({
              where: {
                companyId,
                entityType: 'GeneratedReport',
                entityId: { in: reportIds },
                action: 'REPORT_VIEWED',
              },
              orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.findMany({
              where: {
                companyId,
                entityType: 'GeneratedReport',
                entityId: { in: reportIds },
                action: 'REPORT_FEEDBACK',
              },
              orderBy: { createdAt: 'desc' },
            }),
          ])
        : [[], [], []];

      const engagement = reports.map((report) => {
        const reportShareLogs = shareLogs.filter((log) => log.entityId === report.id);
        const reportViewLogs = viewLogs.filter((log) => log.entityId === report.id);
        const reportFeedbackLogs = feedbackLogs.filter((log) => log.entityId === report.id);
        const recipientIds = [
          ...new Set(
            reportShareLogs.flatMap((log) =>
              this.arrayValue(this.toJsonObject(log.metadata).recipientIds).filter(
                (id): id is string => typeof id === 'string',
              ),
            ),
          ),
        ];
        const viewedRecipientIds = [
          ...new Set(
            reportViewLogs
              .map((log) => log.actorId)
              .filter((id): id is string => typeof id === 'string' && recipientIds.includes(id)),
          ),
        ];
        const feedbackRecipientIds = [
          ...new Set(
            reportFeedbackLogs
              .map((log) => log.actorId)
              .filter((id): id is string => typeof id === 'string' && recipientIds.includes(id)),
          ),
        ];

        return {
          report: this.serializeReport(report),
          shareEvents: reportShareLogs.length,
          recipientCount: recipientIds.length,
          viewedCount: viewedRecipientIds.length,
          feedbackCount: feedbackRecipientIds.length,
          viewRate:
            recipientIds.length > 0
              ? Math.round((viewedRecipientIds.length / recipientIds.length) * 100)
              : 0,
          feedbackRate:
            recipientIds.length > 0
              ? Math.round((feedbackRecipientIds.length / recipientIds.length) * 100)
              : 0,
          latestSharedAt: reportShareLogs[0]?.createdAt.toISOString() ?? null,
          latestViewedAt: reportViewLogs[0]?.createdAt.toISOString() ?? null,
          latestFeedbackAt: reportFeedbackLogs[0]?.createdAt.toISOString() ?? null,
        };
      });
      const totals = engagement.reduce(
        (total, item) => ({
          reports: total.reports + 1,
          sharedReports: total.sharedReports + (item.shareEvents > 0 ? 1 : 0),
          shareEvents: total.shareEvents + item.shareEvents,
          recipients: total.recipients + item.recipientCount,
          viewed: total.viewed + item.viewedCount,
          feedback: total.feedback + item.feedbackCount,
        }),
        { reports: 0, sharedReports: 0, shareEvents: 0, recipients: 0, viewed: 0, feedback: 0 },
      );
      const metrics = {
        ...totals,
        viewRate: totals.recipients > 0 ? Math.round((totals.viewed / totals.recipients) * 100) : 0,
        feedbackRate:
          totals.recipients > 0 ? Math.round((totals.feedback / totals.recipients) * 100) : 0,
      };
      const sharedReports = engagement
        .filter((item) => item.shareEvents > 0)
        .sort((left, right) => {
          if (right.viewRate !== left.viewRate) return right.viewRate - left.viewRate;
          return right.feedbackRate - left.feedbackRate;
        });

      return {
        metrics,
        recommendations: this.buildReportEngagementRecommendations(metrics, sharedReports),
        reports: sharedReports,
      };
    });
  }

  async exportReport(user: JwtPayload, reportId: string) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const report = await this.prisma.generatedReport.findFirst({
        where: { id: reportId, companyId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      });

      if (!report) {
        throw new NotFoundException('Report was not found for the current tenant.');
      }

      return this.buildReportExport(this.serializeReport(report));
    });
  }

  async listReportShares(user: JwtPayload, reportId: string) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const report = await this.prisma.generatedReport.findFirst({
        where: { id: reportId, companyId },
        select: { id: true, title: true },
      });

      if (!report) {
        throw new NotFoundException('Report was not found for the current tenant.');
      }

      const shareLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_SHARED',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      });

      const recipientIds = [
        ...new Set(
          shareLogs.flatMap((log) =>
            this.arrayValue(this.toJsonObject(log.metadata).recipientIds).filter(
              (id): id is string => typeof id === 'string',
            ),
          ),
        ),
      ];
      const recipients = recipientIds.length
        ? await this.prisma.user.findMany({
            where: { id: { in: recipientIds }, companyId },
            select: { id: true, name: true, email: true, isActive: true },
          })
        : [];
      const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]));
      const viewLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_VIEWED',
          actorId: { in: recipientIds },
        },
        orderBy: { createdAt: 'desc' },
      });
      const viewedAtByRecipientId = new Map<string, string>();
      viewLogs.forEach((log) => {
        if (log.actorId && !viewedAtByRecipientId.has(log.actorId)) {
          viewedAtByRecipientId.set(log.actorId, log.createdAt.toISOString());
        }
      });
      const feedbackLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_FEEDBACK',
          actorId: { in: recipientIds },
        },
        orderBy: { createdAt: 'desc' },
      });
      const feedbackByRecipientId = new Map<string, { feedback: string; feedbackAt: string }>();
      feedbackLogs.forEach((log) => {
        if (log.actorId && !feedbackByRecipientId.has(log.actorId)) {
          feedbackByRecipientId.set(log.actorId, {
            feedback: this.stringValue(this.toJsonObject(log.metadata).feedback) ?? '',
            feedbackAt: log.createdAt.toISOString(),
          });
        }
      });

      return shareLogs.map((log) => {
        const metadata = this.toJsonObject(log.metadata);
        const logRecipientIds = this.arrayValue(metadata.recipientIds).filter(
          (id): id is string => typeof id === 'string',
        );
        const recipientsWithState = logRecipientIds.map((id) => {
          const recipient = recipientsById.get(id);

          return {
            ...(recipient ?? { id, name: 'Former workspace user', email: '', isActive: false }),
            viewedAt: viewedAtByRecipientId.get(id) ?? null,
            feedback: feedbackByRecipientId.get(id)?.feedback ?? null,
            feedbackAt: feedbackByRecipientId.get(id)?.feedbackAt ?? null,
          };
        });
        const pendingReviewRecipients = recipientsWithState.filter(
          (recipient) => !recipient.viewedAt,
        );
        const pendingFeedbackRecipients = recipientsWithState.filter(
          (recipient) => recipient.viewedAt && !recipient.feedback,
        );

        return {
          id: log.id,
          reportId: report.id,
          sharedAt: this.stringValue(metadata.sharedAt) ?? log.createdAt.toISOString(),
          createdAt: log.createdAt.toISOString(),
          actor: log.actor,
          message: this.stringValue(metadata.message),
          recipientCount:
            typeof metadata.recipientCount === 'number'
              ? metadata.recipientCount
              : logRecipientIds.length,
          recipients: recipientsWithState,
          followUp: this.buildReportShareFollowUp({
            reportTitle: report.title,
            pendingReviewRecipients,
            pendingFeedbackRecipients,
          }),
        };
      });
    });
  }

  async markReportViewed(user: JwtPayload, reportId: string) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const report = await this.prisma.generatedReport.findFirst({
        where: { id: reportId, companyId },
        select: { id: true, title: true, type: true },
      });

      if (!report) {
        throw new NotFoundException('Report was not found for the current tenant.');
      }

      const shareLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_SHARED',
        },
        orderBy: { createdAt: 'desc' },
      });
      const shareLog = shareLogs.find((log) =>
        this.arrayValue(this.toJsonObject(log.metadata).recipientIds).includes(user.sub),
      );

      if (!shareLog) {
        throw new ForbiddenException('This report has not been shared with the current user.');
      }

      const existingView = await this.prisma.auditLog.findFirst({
        where: {
          companyId,
          actorId: user.sub,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_VIEWED',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingView) {
        return {
          reportId: report.id,
          viewedAt: existingView.createdAt.toISOString(),
          alreadyViewed: true,
        };
      }

      const viewed = await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: user.sub,
          action: 'REPORT_VIEWED',
          entityType: 'GeneratedReport',
          entityId: report.id,
          metadata: {
            type: report.type,
            title: report.title,
            shareLogId: shareLog.id,
          },
        },
      });

      return {
        reportId: report.id,
        viewedAt: viewed.createdAt.toISOString(),
        alreadyViewed: false,
      };
    });
  }

  async addReportFeedback(user: JwtPayload, reportId: string, dto: ReportFeedbackDto) {
    const companyId = this.requireTenant(user);
    const feedback = dto.feedback.trim();

    if (!feedback) {
      throw new BadRequestException('Feedback is required.');
    }

    return this.withDatabaseAvailability(async () => {
      const report = await this.prisma.generatedReport.findFirst({
        where: { id: reportId, companyId },
        select: { id: true, title: true, type: true },
      });

      if (!report) {
        throw new NotFoundException('Report was not found for the current tenant.');
      }

      const shareLogs = await this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: 'GeneratedReport',
          entityId: report.id,
          action: 'REPORT_SHARED',
        },
        orderBy: { createdAt: 'desc' },
      });
      const shareLog = shareLogs.find((log) =>
        this.arrayValue(this.toJsonObject(log.metadata).recipientIds).includes(user.sub),
      );

      if (!shareLog) {
        throw new ForbiddenException('This report has not been shared with the current user.');
      }

      const created = await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: user.sub,
          action: 'REPORT_FEEDBACK',
          entityType: 'GeneratedReport',
          entityId: report.id,
          metadata: {
            type: report.type,
            title: report.title,
            shareLogId: shareLog.id,
            feedback,
          },
        },
      });

      return {
        reportId: report.id,
        feedback,
        feedbackAt: created.createdAt.toISOString(),
      };
    });
  }

  async shareReport(user: JwtPayload, reportId: string, dto: ShareReportDto) {
    const companyId = this.requireTenant(user);
    const recipientIds = [...new Set(dto.recipientIds.map((id) => id.trim()).filter(Boolean))];
    const message = dto.message?.trim();

    if (recipientIds.length === 0) {
      throw new BadRequestException('At least one recipient is required.');
    }

    return this.withDatabaseAvailability(async () => {
      const [report, recipients] = await Promise.all([
        this.prisma.generatedReport.findFirst({
          where: { id: reportId, companyId },
          select: { id: true, title: true, type: true },
        }),
        this.prisma.user.findMany({
          where: { id: { in: recipientIds }, companyId, archivedAt: null, isActive: true },
          select: { id: true, name: true, email: true },
        }),
      ]);

      if (!report) {
        throw new NotFoundException('Report was not found for the current tenant.');
      }

      if (recipients.length !== recipientIds.length) {
        throw new BadRequestException('One or more recipients were not found in this workspace.');
      }

      const sharedAt = new Date();

      const notificationIds = await this.prisma.$transaction(async (tx) => {
        const notifications = await Promise.all(
          recipients.map((recipient) =>
            tx.notification.create({
              data: {
                companyId,
                userId: recipient.id,
                type: 'REPORT_READY',
                title: 'Report shared with you',
                body: message
                  ? `${report.title}: ${message}`
                  : `${report.title} is ready to review in Reports.`,
              },
              select: { id: true },
            }),
          ),
        );

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'REPORT_SHARED',
            entityType: 'GeneratedReport',
            entityId: report.id,
            metadata: {
              type: report.type,
              recipientIds,
              recipientCount: recipients.length,
              message: message ?? null,
              sharedAt: sharedAt.toISOString(),
            },
          },
        });

        return notifications.map((notification) => notification.id);
      });

      return {
        reportId: report.id,
        sharedAt: sharedAt.toISOString(),
        sharedCount: recipients.length,
        recipients,
        notificationIds,
      };
    });
  }

  async createReport(user: JwtPayload, dto: CreateReportDto) {
    const companyId = this.requireTenant(user);
    const title = dto.title.trim();
    const periodStart = dto.periodStart ? this.parseWorkDate(dto.periodStart) : undefined;
    const periodEnd = dto.periodEnd ? this.parseWorkDate(dto.periodEnd) : undefined;

    if (!title) {
      throw new BadRequestException('Report title is required.');
    }

    if (periodStart && periodEnd && periodStart > periodEnd) {
      throw new BadRequestException('Report start date must be before or equal to end date.');
    }

    return this.withDatabaseAvailability(async () => {
      const project = dto.projectId
        ? await this.prisma.project.findFirst({
            where: { id: dto.projectId, companyId, archivedAt: null },
            select: { id: true, name: true, status: true },
          })
        : null;

      if (dto.projectId && !project) {
        throw new NotFoundException('Project was not found for the current tenant.');
      }

      const content = await this.buildReportContent(companyId, {
        projectId: dto.projectId,
        periodStart,
        periodEnd,
      });

      const report = await this.prisma.$transaction(async (tx) => {
        const created = await tx.generatedReport.create({
          data: {
            companyId,
            creatorId: user.sub,
            projectId: dto.projectId,
            type: dto.type,
            title,
            periodStart,
            periodEnd,
            filters: {
              projectId: dto.projectId ?? null,
              periodStart: periodStart?.toISOString().slice(0, 10) ?? null,
              periodEnd: periodEnd?.toISOString().slice(0, 10) ?? null,
            },
            content,
          },
          include: {
            creator: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true, status: true } },
          },
        });

        await tx.notification.create({
          data: {
            companyId,
            userId: user.sub,
            type: 'REPORT_READY',
            title: 'Report ready',
            body: `${created.title} has been generated.`,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'REPORT_GENERATED',
            entityType: 'GeneratedReport',
            entityId: created.id,
            metadata: {
              type: created.type,
              projectId: created.projectId,
              periodStart: created.periodStart?.toISOString().slice(0, 10) ?? null,
              periodEnd: created.periodEnd?.toISOString().slice(0, 10) ?? null,
            },
          },
        });

        return created;
      });

      return this.serializeReport(report);
    });
  }

  async listAiConversations(user: JwtPayload) {
    const companyId = this.requireTenant(user);

    return this.withDatabaseAvailability(async () => {
      const conversations = await this.prisma.aIConversation.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 12,
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return conversations.map((conversation) => ({
        ...this.serializeAiConversation(conversation),
      }));
    });
  }

  async askAi(user: JwtPayload, dto: AskAiDto) {
    const companyId = this.requireTenant(user);
    const question = dto.question.trim();

    if (!question) {
      throw new BadRequestException('Question is required.');
    }

    return this.withDatabaseAvailability(async () => {
      if (dto.conversationId) {
        const conversation = await this.prisma.aIConversation.findFirst({
          where: { id: dto.conversationId, companyId, userId: user.sub },
          select: { id: true },
        });

        if (!conversation) {
          throw new NotFoundException('AI conversation was not found for the current user.');
        }
      }

      const answer = await this.buildAiAnswer(companyId, question, dto.intent ?? 'QUESTION');
      const conversationTitle = this.aiConversationTitle(question);

      const conversation = await this.prisma.$transaction(async (tx) => {
        const savedConversation = dto.conversationId
          ? await tx.aIConversation.update({
              where: { id: dto.conversationId },
              data: {
                updatedAt: new Date(),
                messages: {
                  create: [
                    {
                      userId: user.sub,
                      role: 'USER',
                      content: question,
                      tokenCount: this.estimatedTokenCount(question),
                    },
                    {
                      role: 'ASSISTANT',
                      content: answer.content,
                      evidence: answer.evidence,
                      tokenCount: this.estimatedTokenCount(answer.content),
                    },
                  ],
                },
              },
              include: this.aiConversationInclude(),
            })
          : await tx.aIConversation.create({
              data: {
                companyId,
                userId: user.sub,
                title: conversationTitle,
                messages: {
                  create: [
                    {
                      userId: user.sub,
                      role: 'USER',
                      content: question,
                      tokenCount: this.estimatedTokenCount(question),
                    },
                    {
                      role: 'ASSISTANT',
                      content: answer.content,
                      evidence: answer.evidence,
                      tokenCount: this.estimatedTokenCount(answer.content),
                    },
                  ],
                },
              },
              include: this.aiConversationInclude(),
            });

        await tx.auditLog.create({
          data: {
            companyId,
            actorId: user.sub,
            action: 'AI_QUESTION_ASKED',
            entityType: 'AIConversation',
            entityId: savedConversation.id,
            metadata: {
              question,
              intent: dto.intent ?? 'QUESTION',
              evidence: answer.evidence,
            },
          },
        });

        return savedConversation;
      });

      return this.serializeAiConversation(conversation);
    });
  }

  async createDailyProgress(user: JwtPayload, dto: CreateDailyProgressDto) {
    const companyId = this.requireTenant(user);

    if (dto.hasBlocker && !dto.blockerDescription?.trim()) {
      throw new BadRequestException('Blocker description is required when hasBlocker is true.');
    }

    return this.withDatabaseAvailability(async () => {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, archivedAt: null },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException('Project was not found for the current tenant.');
      }

      if (dto.taskId) {
        const task = await this.prisma.task.findFirst({
          where: { id: dto.taskId, companyId, projectId: dto.projectId, archivedAt: null },
          select: { id: true },
        });

        if (!task) {
          throw new NotFoundException('Task was not found for the current tenant and project.');
        }
      }

      try {
        const progress = await this.prisma.dailyProgress.create({
          data: {
            companyId,
            userId: user.sub,
            projectId: dto.projectId,
            taskId: dto.taskId,
            workDate: this.parseWorkDate(dto.workDate),
            workCompleted: dto.workCompleted,
            status: dto.status,
            progressPercent: dto.progressPercent,
            timeSpentHours: new Prisma.Decimal(dto.timeSpentHours),
            hasBlocker: dto.hasBlocker ?? false,
            tomorrowPlan: dto.tomorrowPlan,
            externalLinks: dto.externalLinks ?? [],
            blockers:
              dto.hasBlocker && dto.blockerDescription
                ? {
                    create: {
                      companyId,
                      employeeId: user.sub,
                      projectId: dto.projectId,
                      taskId: dto.taskId,
                      description: dto.blockerDescription,
                      category: dto.blockerCategory ?? BlockerCategory.OTHER,
                      severity: dto.blockerSeverity ?? BlockerSeverity.MEDIUM,
                    },
                  }
                : undefined,
          },
          include: {
            blockers: true,
            project: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
          },
        });

        return {
          id: progress.id,
          workDate: progress.workDate.toISOString().slice(0, 10),
          workCompleted: progress.workCompleted,
          status: progress.status,
          progressPercent: progress.progressPercent,
          timeSpentHours: Number(progress.timeSpentHours),
          hasBlocker: progress.hasBlocker,
          project: progress.project,
          task: progress.task,
          blockers: progress.blockers.map((blocker) => ({
            id: blocker.id,
            description: blocker.description,
            status: blocker.status,
            severity: blocker.severity,
            category: blocker.category,
          })),
        };
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'Daily progress already exists for this user, task, and work date.',
          );
        }

        throw error;
      }
    });
  }

  private requireTenant(user: JwtPayload): string {
    if (!user.companyId) {
      throw new ForbiddenException('This endpoint requires a company-scoped user.');
    }

    return user.companyId;
  }

  private parseWorkDate(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private dateKey(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private analyticsDayLabel(value: Date): string {
    return value.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  }

  private buildAnalyticsRecommendations(metrics: {
    overdueTasks: number;
    openBlockers: number;
    criticalBlockers: number;
    highRiskProjects: number;
    submissionRate: number;
  }) {
    const recommendations = [];

    if (metrics.criticalBlockers > 0) {
      recommendations.push({
        title: 'Escalate critical blockers',
        body: `${metrics.criticalBlockers} critical blocker${metrics.criticalBlockers === 1 ? '' : 's'} should get an owner and next action today.`,
        tone: 'danger',
      });
    }

    if (metrics.overdueTasks > 0) {
      recommendations.push({
        title: 'Rebalance overdue work',
        body: `${metrics.overdueTasks} incomplete task${metrics.overdueTasks === 1 ? ' is' : 's are'} past due across the workspace.`,
        tone: 'warning',
      });
    }

    if (metrics.submissionRate < 90) {
      recommendations.push({
        title: 'Improve daily update coverage',
        body: `Submission coverage is ${metrics.submissionRate}%; missing updates reduce forecast confidence.`,
        tone: 'warning',
      });
    }

    if (metrics.highRiskProjects > 0) {
      recommendations.push({
        title: 'Review project health',
        body: `${metrics.highRiskProjects} project${metrics.highRiskProjects === 1 ? ' has' : 's have'} delayed, blocked, or overdue signals.`,
        tone: 'neutral',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Keep the operating rhythm',
        body: 'No urgent analytics risks were found in the current workspace snapshot.',
        tone: 'good',
      });
    }

    return recommendations.slice(0, 4);
  }

  private buildReportEngagementRecommendations(
    metrics: {
      reports: number;
      sharedReports: number;
      shareEvents: number;
      recipients: number;
      viewed: number;
      feedback: number;
      viewRate: number;
      feedbackRate: number;
    },
    reports: {
      report: { id: string; title: string };
      recipientCount: number;
      viewedCount: number;
      feedbackCount: number;
      viewRate: number;
      feedbackRate: number;
      latestSharedAt: string | null;
      latestViewedAt: string | null;
      latestFeedbackAt: string | null;
    }[],
  ) {
    const recommendations: {
      title: string;
      body: string;
      tone: string;
      reportId: string | null;
    }[] = [];

    if (metrics.sharedReports === 0) {
      recommendations.push({
        title: 'Share a report to start the loop',
        body: 'No reports have been shared yet, so managers cannot see review or feedback coverage.',
        tone: 'warning',
        reportId: null,
      });

      return recommendations;
    }

    if (metrics.recipients > 0 && metrics.viewRate < 60) {
      recommendations.push({
        title: 'Follow up on unread reports',
        body: `Overall view coverage is ${metrics.viewRate}%; resend the key summary to recipients who have not reviewed it.`,
        tone: 'warning',
        reportId: null,
      });
    }

    if (metrics.recipients > 0 && metrics.feedbackRate < 25) {
      recommendations.push({
        title: 'Ask for explicit feedback',
        body: `Feedback coverage is ${metrics.feedbackRate}%; add a direct question when sharing the next report.`,
        tone: 'neutral',
        reportId: null,
      });
    }

    const staleUnreadReport = reports.find((item) => {
      if (!item.latestSharedAt || item.viewedCount > 0) return false;
      const ageHours = (Date.now() - new Date(item.latestSharedAt).getTime()) / 3_600_000;
      return ageHours >= 24;
    });

    if (staleUnreadReport) {
      recommendations.push({
        title: 'Nudge stale recipients',
        body: `"${staleUnreadReport.report.title}" has been shared for over 24 hours without a recorded review.`,
        tone: 'danger',
        reportId: staleUnreadReport.report.id,
      });
    }

    const highSignalReport = reports.find(
      (item) => item.recipientCount > 0 && item.feedbackRate >= 50,
    );

    if (highSignalReport) {
      recommendations.push({
        title: 'Reuse the strongest report format',
        body: `"${highSignalReport.report.title}" is getting feedback from ${highSignalReport.feedbackRate}% of recipients.`,
        tone: 'good',
        reportId: highSignalReport.report.id,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Keep the review rhythm',
        body: 'Shared reports are getting healthy review and feedback signals. Keep sending concise summaries with a clear ask.',
        tone: 'good',
        reportId: null,
      });
    }

    return recommendations.slice(0, 4);
  }

  private buildReportShareFollowUp({
    reportTitle,
    pendingReviewRecipients,
    pendingFeedbackRecipients,
  }: {
    reportTitle: string;
    pendingReviewRecipients: { name: string }[];
    pendingFeedbackRecipients: { name: string }[];
  }) {
    const pendingReviewNames = pendingReviewRecipients.map((recipient) => recipient.name);
    const pendingFeedbackNames = pendingFeedbackRecipients.map((recipient) => recipient.name);
    const status =
      pendingReviewNames.length > 0
        ? 'needs_review'
        : pendingFeedbackNames.length > 0
          ? 'needs_feedback'
          : 'complete';
    const draft =
      status === 'needs_review'
        ? `Please review "${reportTitle}" when you can and reply with any blockers or decisions needed.`
        : status === 'needs_feedback'
          ? `Thanks for reviewing "${reportTitle}". Please add a short note with concerns, decisions, or approval.`
          : `All tracked recipients have reviewed "${reportTitle}" and no follow-up is currently needed.`;

    return {
      status,
      pendingReviewCount: pendingReviewNames.length,
      pendingFeedbackCount: pendingFeedbackNames.length,
      pendingReviewNames,
      pendingFeedbackNames,
      draft,
    };
  }

  private activityTitle(action: string, entityType: string): string {
    const subject = entityType.replace(/([a-z])([A-Z])/g, '$1 $2');
    const label = action
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return `${subject} ${label}`;
  }

  private activityBody(action: string, metadata: Prisma.JsonValue): string {
    if (action === 'TASK_UPDATED' && this.isJsonRecord(metadata)) {
      const previousStatus =
        typeof metadata.previousStatus === 'string' ? metadata.previousStatus : null;
      const nextStatus = typeof metadata.nextStatus === 'string' ? metadata.nextStatus : null;
      const nextProgress = typeof metadata.nextProgress === 'number' ? metadata.nextProgress : null;

      return `Status ${previousStatus ?? 'unknown'} -> ${nextStatus ?? 'unknown'}${nextProgress !== null ? `, progress ${nextProgress}%` : ''}.`;
    }

    if (action === 'TASK_CREATED' && this.isJsonRecord(metadata)) {
      const priority = typeof metadata.priority === 'string' ? metadata.priority : 'MEDIUM';
      const status = typeof metadata.status === 'string' ? metadata.status : 'NOT_STARTED';
      return `Created with ${priority.toLowerCase()} priority and ${status.toLowerCase().replace(/_/g, ' ')} status.`;
    }

    if (action === 'BLOCKER_RESOLVED' && this.isJsonRecord(metadata)) {
      const resolution =
        typeof metadata.resolution === 'string' ? metadata.resolution : 'Resolution recorded.';
      return resolution;
    }

    if (action === 'AI_QUESTION_ASKED' && this.isJsonRecord(metadata)) {
      const intent = typeof metadata.intent === 'string' ? metadata.intent : 'QUESTION';
      return intent === 'ACTION_PLAN'
        ? 'AI generated an action plan from workspace evidence.'
        : 'AI answered a workspace question.';
    }

    return action.toLowerCase().replace(/_/g, ' ');
  }

  private priorityLabel(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ');
  }

  private async buildBriefingSnapshot(companyId: string, userId: string) {
    const today = this.parseWorkDate(new Date().toISOString().slice(0, 10));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      company,
      activeEmployees,
      submittedToday,
      overdueTasks,
      openBlockers,
      criticalBlockers,
      delayedProjects,
      unreadNotifications,
      latestActivity,
    ] = await Promise.all([
      this.prisma.company.findFirst({
        where: { id: companyId, archivedAt: null },
        select: { id: true, name: true, timezone: true, dailyCutoff: true },
      }),
      this.prisma.user.count({ where: { companyId, archivedAt: null, isActive: true } }),
      this.prisma.dailyProgress.count({
        where: { companyId, workDate: { gte: today, lt: tomorrow } },
      }),
      this.prisma.task.findMany({
        where: {
          companyId,
          archivedAt: null,
          dueDate: { lt: today },
          status: { notIn: ['COMPLETED'] },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 5,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      }),
      this.prisma.blocker.findMany({
        where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        take: 5,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, status: true } },
          task: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.blocker.count({
        where: {
          companyId,
          status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] },
          severity: 'CRITICAL',
        },
      }),
      this.prisma.project.count({ where: { companyId, archivedAt: null, status: 'DELAYED' } }),
      this.prisma.notification.count({ where: { companyId, userId, readAt: null } }),
      this.prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Company was not found for the current tenant.');
    }

    const submissionRate =
      activeEmployees > 0 ? Math.round((submittedToday / activeEmployees) * 100) : 0;
    const priorities = [
      ...openBlockers.slice(0, 3).map((blocker) => ({
        id: blocker.id,
        type: 'BLOCKER',
        title: blocker.description,
        body: `${blocker.project.name} - ${blocker.employee.name} - ${this.priorityLabel(blocker.severity)}`,
        tone:
          blocker.severity === 'CRITICAL'
            ? 'danger'
            : blocker.severity === 'HIGH'
              ? 'warning'
              : 'neutral',
      })),
      ...overdueTasks.slice(0, 3).map((task) => ({
        id: task.id,
        type: 'OVERDUE_TASK',
        title: task.title,
        body: `${task.project.name}${task.assignee ? ` - ${task.assignee.name}` : ''}`,
        tone: task.priority === 'URGENT' || task.priority === 'HIGH' ? 'warning' : 'neutral',
      })),
    ].slice(0, 5);

    const headline =
      criticalBlockers > 0
        ? `${criticalBlockers} critical blocker${criticalBlockers === 1 ? '' : 's'} need attention today.`
        : overdueTasks.length > 0
          ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'} need follow-through.`
          : submissionRate < 90
            ? `Daily update coverage is ${submissionRate}%; follow up before ${company.dailyCutoff}.`
            : 'Workspace operating rhythm looks stable today.';

    return {
      date: this.dateKey(today),
      company,
      headline,
      metrics: {
        activeEmployees,
        submittedToday,
        submissionRate,
        openBlockers: openBlockers.length,
        criticalBlockers,
        overdueTasks: overdueTasks.length,
        delayedProjects,
        unreadNotifications,
      },
      priorities,
      activity: latestActivity.map((log) => ({
        id: log.id,
        title: this.activityTitle(log.action, log.entityType),
        body: this.activityBody(log.action, log.metadata),
        action: log.action,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
      })),
      generatedFrom: 'daily_operational_snapshot',
    };
  }

  private isJsonRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private serializeBlocker(
    blocker: Prisma.BlockerGetPayload<{
      include: {
        employee: { select: { id: true; name: true; email: true } };
        resolver: { select: { id: true; name: true; email: true } };
        project: { select: { id: true; name: true; status: true } };
        task: { select: { id: true; title: true; status: true } };
        _count: { select: { comments: true; attachments: true } };
      };
    }>,
  ) {
    return {
      id: blocker.id,
      description: blocker.description,
      category: blocker.category,
      status: blocker.status,
      severity: blocker.severity,
      resolution: blocker.resolution,
      resolvedAt: blocker.resolvedAt?.toISOString() ?? null,
      createdAt: blocker.createdAt.toISOString(),
      updatedAt: blocker.updatedAt.toISOString(),
      ageHours: Math.max(
        0,
        Math.round(((Date.now() - blocker.createdAt.getTime()) / 3_600_000) * 10) / 10,
      ),
      employee: blocker.employee,
      resolver: blocker.resolver,
      project: blocker.project,
      task: blocker.task,
      counts: {
        comments: blocker._count.comments,
        attachments: blocker._count.attachments,
      },
    };
  }

  private serializeNotification(notification: Notification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  private serializeSettings(company: {
    id: string;
    name: string;
    slug: string;
    status: string;
    timezone: string;
    dailyCutoff: string;
    workweek: Prisma.JsonValue;
    updatedAt: Date;
  }) {
    const workweek = company.workweek;
    const workweekObject =
      typeof workweek === 'object' && workweek !== null && !Array.isArray(workweek)
        ? (workweek as { days?: unknown })
        : null;
    const days =
      workweekObject && Array.isArray(workweekObject.days)
        ? workweekObject.days.filter((day): day is string => typeof day === 'string')
        : [];

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
      timezone: company.timezone,
      dailyCutoff: company.dailyCutoff,
      workweekDays: days,
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  private serializeReport(
    report: Prisma.GeneratedReportGetPayload<{
      include: {
        creator: { select: { id: true; name: true; email: true } };
        project: { select: { id: true; name: true; status: true } };
      };
    }>,
  ) {
    return {
      id: report.id,
      type: report.type,
      title: report.title,
      periodStart: report.periodStart?.toISOString().slice(0, 10) ?? null,
      periodEnd: report.periodEnd?.toISOString().slice(0, 10) ?? null,
      filters: report.filters,
      content: report.content,
      fileKey: report.fileKey,
      createdAt: report.createdAt.toISOString(),
      creator: report.creator,
      project: report.project,
    };
  }

  private buildReportExport(report: ReturnType<WorkService['serializeReport']>) {
    const markdown = this.reportMarkdown(report);

    return {
      reportId: report.id,
      title: report.title,
      type: report.type,
      filename: `${this.slugify(report.title)}-${report.createdAt.slice(0, 10)}.md`,
      mimeType: 'text/markdown',
      markdown,
      text: this.markdownToText(markdown),
      generatedAt: new Date().toISOString(),
    };
  }

  private reportMarkdown(report: ReturnType<WorkService['serializeReport']>) {
    const content = this.toJsonObject(report.content);
    const summary = this.stringValue(content.aiSummary) ?? this.stringValue(content.headline);
    const lines = [
      `# ${report.title}`,
      '',
      `Type: ${this.labelFromKey(report.type)}`,
      `Period: ${this.reportPeriod(report)}`,
      report.project ? `Project: ${report.project.name}` : null,
      report.creator ? `Creator: ${report.creator.name}` : null,
      `Generated: ${report.createdAt.slice(0, 10)}`,
      '',
      summary ? `## Summary\n\n${summary}` : null,
      this.recordSection('Metrics', this.toJsonObject(content.metrics)),
      this.recordSection('Tasks by status', this.toJsonObject(content.tasksByStatus)),
      this.recordSection('Blockers by status', this.toJsonObject(content.blockersByStatus)),
      this.listSection('Priorities', this.arrayValue(content.priorities), (item) => {
        const record = this.toJsonObject(item);
        const title = this.stringValue(record.title) ?? 'Priority';
        const body = this.stringValue(record.body) ?? this.stableString(item);
        const tone = this.stringValue(record.tone);
        return tone ? `- ${title} (${this.labelFromKey(tone)}): ${body}` : `- ${title}: ${body}`;
      }),
      this.listSection('Latest activity', this.arrayValue(content.activity), (item) => {
        const record = this.toJsonObject(item);
        const title = this.stringValue(record.title) ?? 'Activity';
        const body = this.stringValue(record.body) ?? this.stableString(item);
        const createdAt = this.stringValue(record.createdAt);
        return createdAt
          ? `- ${title}: ${body} (${createdAt.slice(0, 10)})`
          : `- ${title}: ${body}`;
      }),
      this.listSection('Recent progress', this.arrayValue(content.recentProgress), (item) => {
        const record = this.toJsonObject(item);
        const project = this.toJsonObject(record.project);
        const employee =
          this.stringValue(record.employee) ??
          this.stringValue(this.toJsonObject(record.user).name) ??
          'Team update';
        const progress =
          typeof record.progressPercent === 'number' ? ` (${record.progressPercent}%)` : '';
        const work = this.stringValue(record.workCompleted) ?? this.stableString(item);
        const projectName = this.stringValue(project.name);
        return projectName
          ? `- ${employee}${progress} on ${projectName}: ${work}`
          : `- ${employee}${progress}: ${work}`;
      }),
      this.listSection('Top blockers', this.arrayValue(content.topBlockers), (item) => {
        const record = this.toJsonObject(item);
        const project = this.toJsonObject(record.project);
        const description = this.stringValue(record.description) ?? 'Blocker';
        const severity = this.stringValue(record.severity);
        const projectName = this.stringValue(project.name) ?? this.stringValue(record.project);
        const prefix = severity ? `${description} (${this.labelFromKey(severity)})` : description;
        return projectName ? `- ${prefix} - ${projectName}` : `- ${prefix}`;
      }),
    ].filter((line): line is string => typeof line === 'string' && line.length > 0);

    return `${lines.join('\n')}\n`;
  }

  private recordSection(title: string, values: Record<string, unknown>) {
    const rows = Object.entries(values)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .map(([key, value]) => `- ${this.labelFromKey(key)}: ${String(value)}`);

    return rows.length > 0 ? `## ${title}\n\n${rows.join('\n')}` : null;
  }

  private listSection(title: string, values: unknown[], renderItem: (item: unknown) => string) {
    const rows = values.slice(0, 10).map(renderItem);
    return rows.length > 0 ? `## ${title}\n\n${rows.join('\n')}` : null;
  }

  private reportPeriod(report: ReturnType<WorkService['serializeReport']>) {
    if (report.periodStart && report.periodEnd)
      return `${report.periodStart} to ${report.periodEnd}`;
    if (report.periodStart) return report.periodStart;
    return report.createdAt.slice(0, 10);
  }

  private markdownToText(value: string) {
    return value
      .replace(/^#\s+/gm, '')
      .replace(/^##\s+/gm, '')
      .replace(/^\-\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private toJsonObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private arrayValue(value: unknown) {
    return Array.isArray(value) ? value : [];
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private stableString(value: unknown) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return 'Saved report item';
    }
  }

  private slugify(value: string) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64) || 'report'
    );
  }

  private labelFromKey(value: string) {
    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(' ');
  }

  private serializeAiConversation(
    conversation: Prisma.AIConversationGetPayload<{
      include: {
        user: { select: { id: true; name: true; email: true } };
        messages: {
          include: {
            user: { select: { id: true; name: true; email: true } };
          };
        };
      };
    }>,
  ) {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      user: conversation.user,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        evidence: message.evidence,
        tokenCount: message.tokenCount,
        createdAt: message.createdAt.toISOString(),
        user: message.user,
      })),
    };
  }

  private serializeTask(
    task: Prisma.TaskGetPayload<{
      include: {
        project: { select: { id: true; name: true; status: true } };
        assignee: { select: { id: true; name: true; email: true } };
        reporter: { select: { id: true; name: true; email: true } };
      };
    }>,
  ) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      progress: task.progress,
      estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actualHours: task.actualHours ? Number(task.actualHours) : null,
      project: task.project,
      assignee: task.assignee,
      reporter: task.reporter,
    };
  }

  private async buildReportContent(
    companyId: string,
    filters: { projectId?: string; periodStart?: Date; periodEnd?: Date },
  ): Promise<Prisma.JsonObject> {
    const projectFilter = filters.projectId ? { projectId: filters.projectId } : {};
    const progressDateFilter =
      filters.periodStart || filters.periodEnd
        ? {
            workDate: {
              gte: filters.periodStart,
              lte: filters.periodEnd,
            },
          }
        : {};

    const [projectCount, taskCounts, blockerCounts, progressEntries, topBlockers] =
      await Promise.all([
        this.prisma.project.count({
          where: {
            companyId,
            archivedAt: null,
            id: filters.projectId,
          },
        }),
        this.prisma.task.groupBy({
          by: ['status'],
          where: {
            companyId,
            archivedAt: null,
            ...projectFilter,
          },
          _count: { _all: true },
        }),
        this.prisma.blocker.groupBy({
          by: ['status'],
          where: {
            companyId,
            ...projectFilter,
          },
          _count: { _all: true },
        }),
        this.prisma.dailyProgress.findMany({
          where: {
            companyId,
            ...projectFilter,
            ...progressDateFilter,
          },
          orderBy: { workDate: 'desc' },
          take: 20,
          include: {
            user: { select: { name: true } },
            project: { select: { name: true } },
            task: { select: { title: true } },
          },
        }),
        this.prisma.blocker.findMany({
          where: {
            companyId,
            status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] },
            ...projectFilter,
          },
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
          take: 5,
          include: {
            employee: { select: { name: true } },
            project: { select: { name: true } },
            task: { select: { title: true } },
          },
        }),
      ]);

    const tasksByStatus = Object.fromEntries(
      taskCounts.map((item) => [item.status, item._count._all]),
    );
    const blockersByStatus = Object.fromEntries(
      blockerCounts.map((item) => [item.status, item._count._all]),
    );
    const totalTasks = taskCounts.reduce((total, item) => total + item._count._all, 0);
    const completedTasks = tasksByStatus.COMPLETED ?? 0;
    const openBlockers =
      (blockersByStatus.OPEN ?? 0) +
      (blockersByStatus.ESCALATED ?? 0) +
      (blockersByStatus.IN_REVIEW ?? 0);
    const averageProgress =
      progressEntries.length > 0
        ? Math.round(
            progressEntries.reduce((total, item) => total + item.progressPercent, 0) /
              progressEntries.length,
          )
        : 0;

    return {
      metrics: {
        projects: projectCount,
        tasks: totalTasks,
        completedTasks,
        openBlockers,
        submittedUpdates: progressEntries.length,
        averageProgress,
      },
      tasksByStatus,
      blockersByStatus,
      recentProgress: progressEntries.slice(0, 6).map((item) => ({
        workDate: item.workDate.toISOString().slice(0, 10),
        employee: item.user.name,
        project: item.project.name,
        task: item.task?.title ?? null,
        status: item.status,
        progressPercent: item.progressPercent,
        workCompleted: item.workCompleted,
      })),
      topBlockers: topBlockers.map((blocker) => ({
        description: blocker.description,
        status: blocker.status,
        severity: blocker.severity,
        owner: blocker.employee.name,
        project: blocker.project.name,
        task: blocker.task?.title ?? null,
      })),
      aiSummary:
        openBlockers > 0
          ? `${openBlockers} active blockers need attention; ${completedTasks} of ${totalTasks} tracked tasks are complete.`
          : `No active blockers found; ${completedTasks} of ${totalTasks} tracked tasks are complete.`,
    };
  }

  private async buildAiAnswer(
    companyId: string,
    question: string,
    intent: 'QUESTION' | 'ACTION_PLAN',
  ): Promise<{ content: string; evidence: Prisma.JsonObject }> {
    const normalizedQuestion = question.toLowerCase();
    const [projects, openBlockers, overdueTasks, recentProgress, overloadedPeople] =
      await Promise.all([
        this.prisma.project.findMany({
          where: { companyId, archivedAt: null },
          orderBy: [{ status: 'asc' }, { priority: 'desc' }, { targetDate: 'asc' }],
          take: 5,
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            progress: true,
            targetDate: true,
          },
        }),
        this.prisma.blocker.findMany({
          where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
          take: 5,
          include: {
            employee: { select: { name: true } },
            project: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
          },
        }),
        this.prisma.task.findMany({
          where: {
            companyId,
            archivedAt: null,
            dueDate: { lt: new Date() },
            status: { notIn: ['COMPLETED'] },
          },
          orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
          take: 5,
          include: {
            assignee: { select: { name: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        this.prisma.dailyProgress.findMany({
          where: { companyId },
          orderBy: { workDate: 'desc' },
          take: 5,
          include: {
            user: { select: { name: true } },
            project: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
          },
        }),
        this.prisma.user.findMany({
          where: { companyId, archivedAt: null, isActive: true },
          orderBy: { name: 'asc' },
          take: 8,
          select: {
            id: true,
            name: true,
            assignedTasks: {
              where: {
                companyId,
                archivedAt: null,
                status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'ON_HOLD', 'REVIEW'] },
              },
              select: { id: true, status: true, dueDate: true },
            },
            blockers: {
              where: { companyId, status: { in: ['OPEN', 'ESCALATED', 'IN_REVIEW'] } },
              select: { id: true },
            },
          },
        }),
      ]);

    if (
      intent === 'ACTION_PLAN' ||
      normalizedQuestion.includes('action plan') ||
      normalizedQuestion.includes('next step')
    ) {
      const today = this.parseWorkDate(new Date().toISOString().slice(0, 10));
      const atRiskProjects = projects.filter(
        (project) => project.status === 'DELAYED' || project.status === 'ON_HOLD',
      );
      const workloadHotspots = overloadedPeople
        .map((person) => {
          const overdue = person.assignedTasks.filter(
            (task) => task.dueDate && task.dueDate < today && task.status !== 'COMPLETED',
          ).length;

          return {
            id: person.id,
            name: person.name,
            pressureScore:
              person.assignedTasks.length * 8 + overdue * 14 + person.blockers.length * 16,
            activeTasks: person.assignedTasks.length,
            overdueTasks: overdue,
            openBlockers: person.blockers.length,
          };
        })
        .filter((person) => person.pressureScore > 0)
        .sort((a, b) => b.pressureScore - a.pressureScore)
        .slice(0, 3);
      const planItems = this.buildAiActionPlanItems({
        openBlockers,
        overdueTasks,
        recentProgress,
        atRiskProjects,
        workloadHotspots,
      });

      return {
        content: [
          'Recommended action plan:',
          ...planItems.map((item, index) => `${index + 1}. ${item}`),
        ].join('\n'),
        evidence: {
          focus: 'action_plan',
          intent,
          projectIds: projects.map((project) => project.id),
          blockerIds: openBlockers.map((blocker) => blocker.id),
          taskIds: overdueTasks.map((task) => task.id),
          progressIds: recentProgress.map((progress) => progress.id),
          workloadUserIds: workloadHotspots.map((person) => person.id),
          generatedFrom: 'analytics_action_plan',
        },
      };
    }

    const focus =
      normalizedQuestion.includes('blocker') || normalizedQuestion.includes('risk')
        ? 'blockers'
        : normalizedQuestion.includes('overdue') || normalizedQuestion.includes('late')
          ? 'overdue'
          : 'progress';

    const blockerSummary =
      openBlockers.length > 0
        ? openBlockers
            .slice(0, 3)
            .map(
              (blocker) =>
                `${blocker.project.name}: ${blocker.description} (${blocker.severity.toLowerCase()})`,
            )
            .join(' ')
        : 'There are no active blockers in the current workspace.';
    const overdueSummary =
      overdueTasks.length > 0
        ? overdueTasks
            .slice(0, 3)
            .map((task) => `${task.title} on ${task.project.name}`)
            .join('; ')
        : 'There are no overdue incomplete tasks.';
    const progressSummary =
      recentProgress.length > 0
        ? recentProgress
            .slice(0, 3)
            .map(
              (entry) =>
                `${entry.user.name} reported ${entry.progressPercent}% on ${entry.project.name}`,
            )
            .join('; ')
        : 'No recent daily progress entries are available yet.';

    const content =
      focus === 'blockers'
        ? `${blockerSummary} Overdue watch: ${overdueSummary}`
        : focus === 'overdue'
          ? `${overdueSummary} Active blocker context: ${blockerSummary}`
          : `${progressSummary} Current risk context: ${blockerSummary}`;

    return {
      content,
      evidence: {
        focus,
        projectIds: projects.map((project) => project.id),
        blockerIds: openBlockers.map((blocker) => blocker.id),
        taskIds: overdueTasks.map((task) => task.id),
        progressIds: recentProgress.map((progress) => progress.id),
        intent,
        generatedFrom: 'workspace_snapshot',
      },
    };
  }

  private buildAiActionPlanItems({
    openBlockers,
    overdueTasks,
    recentProgress,
    atRiskProjects,
    workloadHotspots,
  }: {
    openBlockers: Prisma.BlockerGetPayload<{
      include: {
        employee: { select: { name: true } };
        project: { select: { id: true; name: true } };
        task: { select: { id: true; title: true } };
      };
    }>[];
    overdueTasks: Prisma.TaskGetPayload<{
      include: {
        assignee: { select: { name: true } };
        project: { select: { id: true; name: true } };
      };
    }>[];
    recentProgress: Prisma.DailyProgressGetPayload<{
      include: {
        user: { select: { name: true } };
        project: { select: { id: true; name: true } };
        task: { select: { id: true; title: true } };
      };
    }>[];
    atRiskProjects: { name: string; status: string; priority: string; progress: number }[];
    workloadHotspots: {
      name: string;
      activeTasks: number;
      overdueTasks: number;
      openBlockers: number;
    }[];
  }): string[] {
    const actions: string[] = [];
    const criticalBlocker =
      openBlockers.find((blocker) => blocker.severity === 'CRITICAL') ?? openBlockers[0];
    const overdueTask = overdueTasks[0];
    const riskProject = atRiskProjects[0];
    const workloadHotspot = workloadHotspots[0];

    if (criticalBlocker) {
      actions.push(
        `Assign a same-day owner for ${criticalBlocker.project.name}: ${criticalBlocker.description} (${criticalBlocker.employee.name}).`,
      );
    }

    if (overdueTask) {
      actions.push(
        `Review overdue work on ${overdueTask.project.name}: ${overdueTask.title}${overdueTask.assignee ? ` with ${overdueTask.assignee.name}` : ''}.`,
      );
    }

    if (riskProject) {
      actions.push(
        `Run a project health check for ${riskProject.name}; it is ${riskProject.status.toLowerCase()} at ${riskProject.progress}% progress.`,
      );
    }

    if (workloadHotspot) {
      actions.push(
        `Rebalance ${workloadHotspot.name}'s queue: ${workloadHotspot.activeTasks} active tasks, ${workloadHotspot.overdueTasks} overdue, ${workloadHotspot.openBlockers} blockers.`,
      );
    }

    const latestProgress = recentProgress[0];
    if (latestProgress) {
      actions.push(
        `Use the latest daily updates to confirm tomorrow's plan; ${latestProgress.user.name} last reported ${latestProgress.progressPercent}% on ${latestProgress.project.name}.`,
      );
    }

    if (actions.length === 0) {
      actions.push(
        'No urgent risks were found; keep daily updates flowing and review project health again tomorrow.',
      );
    }

    return actions.slice(0, 5);
  }

  private aiConversationInclude() {
    return {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        take: 24,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    };
  }

  private aiConversationTitle(question: string): string {
    const normalized = question.trim().replace(/\s+/g, ' ');
    return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
  }

  private estimatedTokenCount(value: string): number {
    return Math.max(1, Math.ceil(value.trim().split(/\s+/).filter(Boolean).length * 1.4));
  }

  private async withDatabaseAvailability<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isDatabaseAuthError(error)) {
        throw new ServiceUnavailableException(
          'Database credentials are not valid for the configured connection.',
        );
      }

      throw error;
    }
  }

  private isDatabaseAuthError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P1000';
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
