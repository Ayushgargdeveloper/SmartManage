import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AskAiDto } from './dto/ask-ai.dto';
import { CreateDailyProgressDto } from './dto/create-daily-progress.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { ReportFeedbackDto } from './dto/report-feedback.dto';
import { ResolveBlockerDto } from './dto/resolve-blocker.dto';
import { ShareReportDto } from './dto/share-report.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { WorkService } from './work.service';

@ApiTags('work')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPANY_ADMIN', 'TEAM_LEADER', 'EMPLOYEE')
@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get('overview')
  @ApiOkResponse({ description: 'Returns company-scoped dashboard metrics and recent progress.' })
  overview(@Req() request: AuthenticatedRequest) {
    return this.workService.getOverview(request.user);
  }

  @Get('analytics')
  @ApiOkResponse({
    description: 'Returns company-scoped operational analytics and risk recommendations.',
  })
  analytics(@Req() request: AuthenticatedRequest) {
    return this.workService.getAnalytics(request.user);
  }

  @Get('activity')
  @ApiOkResponse({ description: 'Returns company-scoped recent operational activity.' })
  activity(@Req() request: AuthenticatedRequest) {
    return this.workService.listActivity(request.user);
  }

  @Get('briefing')
  @ApiOkResponse({ description: 'Returns a company-scoped daily operational briefing.' })
  briefing(@Req() request: AuthenticatedRequest) {
    return this.workService.getBriefing(request.user);
  }

  @Post('briefing/report')
  @ApiCreatedResponse({
    description: 'Generates and stores the current daily briefing as a report.',
  })
  createBriefingReport(@Req() request: AuthenticatedRequest) {
    return this.workService.createBriefingReport(request.user);
  }

  @Get('settings')
  @ApiOkResponse({ description: 'Returns company-scoped workspace settings.' })
  settings(@Req() request: AuthenticatedRequest) {
    return this.workService.getSettings(request.user);
  }

  @Patch('settings')
  @Roles('COMPANY_ADMIN')
  @ApiOkResponse({ description: 'Updates company-scoped workspace settings.' })
  updateSettings(@Req() request: AuthenticatedRequest, @Body() dto: UpdateCompanySettingsDto) {
    return this.workService.updateSettings(request.user, dto);
  }

  @Get('tasks')
  @ApiOkResponse({ description: 'Returns company-scoped tasks.' })
  tasks(@Req() request: AuthenticatedRequest, @Query() query: ListTasksQueryDto) {
    return this.workService.listTasks(request.user, query);
  }

  @Post('tasks')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiCreatedResponse({ description: 'Creates a company-scoped task.' })
  createTask(@Req() request: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    return this.workService.createTask(request.user, dto);
  }

  @Patch('tasks/:id')
  @ApiOkResponse({ description: 'Updates company-scoped task follow-through fields.' })
  updateTask(
    @Req() request: AuthenticatedRequest,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.workService.updateTask(request.user, taskId, dto);
  }

  @Get('projects')
  @ApiOkResponse({ description: 'Returns company-scoped projects.' })
  projects(@Req() request: AuthenticatedRequest) {
    return this.workService.listProjects(request.user);
  }

  @Get('people')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiOkResponse({ description: 'Returns company-scoped people, team, and daily update status.' })
  people(@Req() request: AuthenticatedRequest) {
    return this.workService.listPeople(request.user);
  }

  @Post('people')
  @Roles('COMPANY_ADMIN')
  @ApiCreatedResponse({ description: 'Creates a company-scoped employee account.' })
  createEmployee(@Req() request: AuthenticatedRequest, @Body() dto: CreateEmployeeDto) {
    return this.workService.createEmployee(request.user, dto);
  }

  @Get('blockers')
  @ApiOkResponse({
    description: 'Returns company-scoped blockers with project, task, and owner context.',
  })
  blockers(@Req() request: AuthenticatedRequest) {
    return this.workService.listBlockers(request.user);
  }

  @Patch('blockers/:id/resolve')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiOkResponse({ description: 'Resolves a company-scoped blocker and records the resolution.' })
  resolveBlocker(
    @Req() request: AuthenticatedRequest,
    @Param('id') blockerId: string,
    @Body() dto: ResolveBlockerDto,
  ) {
    return this.workService.resolveBlocker(request.user, blockerId, dto);
  }

  @Get('notifications')
  @ApiOkResponse({ description: 'Returns notifications for the authenticated company user.' })
  notifications(@Req() request: AuthenticatedRequest) {
    return this.workService.listNotifications(request.user);
  }

  @Patch('notifications/read-all')
  @ApiOkResponse({
    description: 'Marks all notifications as read for the authenticated company user.',
  })
  markAllNotificationsRead(@Req() request: AuthenticatedRequest) {
    return this.workService.markAllNotificationsRead(request.user);
  }

  @Patch('notifications/:id/read')
  @ApiOkResponse({
    description: 'Marks one notification as read for the authenticated company user.',
  })
  markNotificationRead(@Req() request: AuthenticatedRequest, @Param('id') notificationId: string) {
    return this.workService.markNotificationRead(request.user, notificationId);
  }

  @Get('reports')
  @ApiOkResponse({ description: 'Returns company-scoped generated reports.' })
  reports(@Req() request: AuthenticatedRequest) {
    return this.workService.listReports(request.user);
  }

  @Get('reports/shared-with-me')
  @ApiOkResponse({ description: 'Returns reports shared with the authenticated workspace user.' })
  sharedReports(@Req() request: AuthenticatedRequest) {
    return this.workService.listSharedReports(request.user);
  }

  @Get('reports/engagement')
  @ApiOkResponse({
    description: 'Returns report sharing, review, and feedback engagement metrics.',
  })
  reportEngagement(@Req() request: AuthenticatedRequest) {
    return this.workService.getReportEngagement(request.user);
  }

  @Get('reports/:id/export')
  @ApiOkResponse({
    description: 'Returns an export-ready markdown and plain-text version of a generated report.',
  })
  exportReport(@Req() request: AuthenticatedRequest, @Param('id') reportId: string) {
    return this.workService.exportReport(request.user, reportId);
  }

  @Get('reports/:id/shares')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiOkResponse({ description: 'Returns share history for a company-scoped generated report.' })
  reportShares(@Req() request: AuthenticatedRequest, @Param('id') reportId: string) {
    return this.workService.listReportShares(request.user, reportId);
  }

  @Post('reports/:id/viewed')
  @ApiCreatedResponse({ description: 'Marks a shared report as viewed by the authenticated user.' })
  markReportViewed(@Req() request: AuthenticatedRequest, @Param('id') reportId: string) {
    return this.workService.markReportViewed(request.user, reportId);
  }

  @Post('reports/:id/feedback')
  @ApiCreatedResponse({ description: 'Adds recipient feedback to a shared generated report.' })
  addReportFeedback(
    @Req() request: AuthenticatedRequest,
    @Param('id') reportId: string,
    @Body() dto: ReportFeedbackDto,
  ) {
    return this.workService.addReportFeedback(request.user, reportId, dto);
  }

  @Post('reports/:id/share')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiCreatedResponse({ description: 'Shares a generated report with selected workspace users.' })
  shareReport(
    @Req() request: AuthenticatedRequest,
    @Param('id') reportId: string,
    @Body() dto: ShareReportDto,
  ) {
    return this.workService.shareReport(request.user, reportId, dto);
  }

  @Post('reports')
  @Roles('COMPANY_ADMIN', 'TEAM_LEADER')
  @ApiCreatedResponse({ description: 'Generates and stores a company-scoped report snapshot.' })
  createReport(@Req() request: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.workService.createReport(request.user, dto);
  }

  @Get('ai-conversations')
  @ApiOkResponse({ description: 'Returns company-scoped AI conversation history with messages.' })
  aiConversations(@Req() request: AuthenticatedRequest) {
    return this.workService.listAiConversations(request.user);
  }

  @Post('ai-conversations/ask')
  @ApiCreatedResponse({
    description: 'Stores an AI question and returns a grounded workspace answer.',
  })
  askAi(@Req() request: AuthenticatedRequest, @Body() dto: AskAiDto) {
    return this.workService.askAi(request.user, dto);
  }

  @Post('daily-progress')
  @ApiCreatedResponse({ description: 'Creates a daily progress entry for the authenticated user.' })
  createDailyProgress(@Req() request: AuthenticatedRequest, @Body() dto: CreateDailyProgressDto) {
    return this.workService.createDailyProgress(request.user, dto);
  }
}
