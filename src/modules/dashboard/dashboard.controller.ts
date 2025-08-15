import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverviewStats() {
    return this.dashboardService.getOverviewStats();
  }

  @Get('user-activity-trend')
  getUserActivityTrend(@Query('days') days: string = '30') {
    return this.dashboardService.getUserActivityTrend(parseInt(days));
  }

  @Get('token-consumption')
  getTokenConsumptionStats() {
    return this.dashboardService.getTokenConsumptionStats();
  }

  @Get('revenue-analysis')
  getRevenueAnalysis(@Query('months') months: string = '12') {
    return this.dashboardService.getRevenueAnalysis(parseInt(months));
  }
}
