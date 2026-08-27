import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Get('seller')
  seller(@CurrentUser() user: AuthUser, @Query('sellerId') sellerId?: string) {
    return this.reports.sellerSummary(user, sellerId);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get('platform')
  platform(@CurrentUser() user: AuthUser) {
    return this.reports.platformOverview(user);
  }
}
