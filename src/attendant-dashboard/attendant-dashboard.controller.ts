import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttendantDashboardService } from './attendant-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';

@ApiTags('attendant-dashboard')
@Controller('attendant-dashboard')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiBearerAuth('JWT-auth')
export class AttendantDashboardController {
  constructor(private attendantDashboardService: AttendantDashboardService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get attendant dashboard', 
    description: 'Get dashboard statistics for the logged-in attendant including total vehicles, check-ins, check-outs, currently parked, and revenue data' 
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiErrorResponse(404, 'Attendant not found or location not assigned')
  async getAttendantDashboard(@Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.attendantDashboardService.getAttendantDashboard(userId);
  }
}

