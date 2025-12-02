import { Controller, Get, UseGuards, Param, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContractorDashboardService } from './contractor-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('contractor-dashboard')
@Controller('contractor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContractorDashboardController {
  constructor(private contractorDashboardService: ContractorDashboardService) {}

  @Get('recent-activity')
  @ApiOperation({ 
    summary: 'Get contractor recent activity', 
    description: 'Get latest 10 vehicle entries/exits with attendant names, amounts, and timestamps for logged-in contractor' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Number of records to return (default: 10)' })
  @ApiStandardResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async getRecentActivity(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user?.id;
    const requestLimit = limit ? parseInt(limit.toString()) : 10;
    
    console.log('========================================');
    console.log('[Recent Activity API] Request received');
    console.log('Endpoint: /contractor-dashboard/recent-activity');
    console.log('User ID:', userId);
    console.log('Limit:', requestLimit);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');
    
    if (!userId) {
      console.error('[Recent Activity API] Error: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const result = await this.contractorDashboardService.getContractorRecentActivity(userId, requestLimit);
      console.log('[Recent Activity API] Success - Records found:', result?.length || 0);
      console.log('[Recent Activity API] Response:', JSON.stringify(result, null, 2));
      console.log('========================================');
      return result;
    } catch (error) {
      console.error('[Recent Activity API] Error:', error.message);
      console.error('[Recent Activity API] Stack:', error.stack);
      console.log('========================================');
      throw error;
    }
  }

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

