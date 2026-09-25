import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('overview')
  @ApiOkResponse({ description: 'Returns platform-level tenant, usage, and activity metrics.' })
  overview(@Req() request: AuthenticatedRequest) {
    return this.platformService.getOverview(request.user);
  }

  @Post('companies')
  @ApiCreatedResponse({ description: 'Creates a tenant company and its default company roles.' })
  createCompany(@Req() request: AuthenticatedRequest, @Body() dto: CreateCompanyDto) {
    return this.platformService.createCompany(request.user, dto);
  }

  @Patch('companies/:id/status')
  @ApiOkResponse({ description: 'Updates a tenant company status.' })
  updateCompanyStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.platformService.updateCompanyStatus(request.user, companyId, dto);
  }

  @Post('companies/:id/admins')
  @ApiCreatedResponse({ description: 'Creates a company administrator for a tenant company.' })
  createCompanyAdmin(
    @Req() request: AuthenticatedRequest,
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyAdminDto,
  ) {
    return this.platformService.createCompanyAdmin(request.user, companyId, dto);
  }
}
