import { Controller, Get, Post, UseGuards, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationSchema } from '../common/schemas/pagination.schema';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics', description: 'Get comprehensive dashboard statistics and metrics' })
  @ApiStandardResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    example: {
      totalContractors: 10,
      totalLocations: 25,
      activeAttendants: 50,
      totalVehicles: 1000,
      totalRevenue: 50000,
      pendingApprovals: 5,
      activeSessions: 20,
      monthlyRevenue: 10000,
      weeklyRevenue: 2500,
      dailyRevenue: 500,
    },
  })
  async getDashboardMetrics() {
    return this.dashboardService.getDashboardMetrics();
  }

  @Get('contractor-stats')
  @ApiOperation({ summary: 'Get contractor statistics', description: 'Get statistics for all contractors' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor stats retrieved successfully',
  })
  async getContractorStats() {
    return this.dashboardService.getContractorStats();
  }

  @Get('location-stats')
  @ApiOperation({ summary: 'Get location statistics', description: 'Get statistics for all parking locations' })
  @ApiStandardResponse({
    status: 200,
    description: 'Location stats retrieved successfully',
  })
  async getLocationStats() {
    return this.dashboardService.getLocationStats();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity (legacy)', description: 'Get recent system activities and events with limit parameter' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiStandardResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit ? parseInt(limit.toString()) : 10);
  }

  @Post('recent-activity/paginated')
  @ApiOperation({ summary: 'Get recent activity with pagination', description: 'Get recent system activities and events with pagination, search, and sorting' })
  @ApiBody({ schema: PaginationSchema })
  @ApiStandardResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  async getRecentActivityPaginated(@Body() pagination: IPagination) {
    return this.dashboardService.getRecentActivityPaginated(pagination);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health', description: 'Get system health status and metrics' })
  @ApiStandardResponse({
    status: 200,
    description: 'System health retrieved successfully',
    example: {
      uptime: '99.9%',
      activeUsers: 100,
      activeContractors: 10,
      activeLocations: 25,
      status: 'All Systems Operational',
    },
  })
  async getSystemHealth() {
    return this.dashboardService.getSystemHealth();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get system analytics', description: 'Get system analytics (today, yesterday, this month, last month)' })
  @ApiStandardResponse({
    status: 200,
    description: 'System analytics retrieved successfully',
    example: {
      today: { vehicles: 10, revenue: 500 },
      yesterday: { vehicles: 8, revenue: 400 },
      thisMonth: { vehicles: 200, revenue: 10000 },
      lastMonth: { vehicles: 180, revenue: 9000 },
    },
  })
  async getSystemAnalytics() {
    return this.dashboardService.getSystemAnalytics();
  }

  @Get('revenue/day-wise')
  @ApiOperation({ summary: 'Get day-wise revenue', description: 'Get revenue breakdown by day for the last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiStandardResponse({
    status: 200,
    description: 'Day-wise revenue retrieved successfully',
  })
  async getDayWiseRevenue(@Query('days') days?: number) {
    return this.dashboardService.getDayWiseRevenue(days ? parseInt(days.toString()) : 30);
  }
}
