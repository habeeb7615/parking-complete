import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ContractorDashboardService } from './contractor-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('contractor-dashboard')
@Controller('contractor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContractorDashboardController {
  constructor(private contractorDashboardService: ContractorDashboardService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get contractor dashboard', description: 'Get comprehensive dashboard data for a contractor' })
  @ApiParam({ name: 'userId', description: 'Contractor User ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async getContractorDashboard(@Param('userId') userId: string) {
    return this.contractorDashboardService.getContractorDashboard(userId);
  }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get contractor stats', description: 'Get statistics for a contractor' })
  @ApiParam({ name: 'userId', description: 'Contractor User ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor stats retrieved successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async getContractorStats(@Param('userId') userId: string) {
    return this.contractorDashboardService.getContractorStats(userId);
  }
}

