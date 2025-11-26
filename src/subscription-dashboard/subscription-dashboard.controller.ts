import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SubscriptionDashboardService } from './subscription-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('subscription-dashboard')
@Controller('subscription-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionDashboardController {
  constructor(private subscriptionDashboardService: SubscriptionDashboardService) {}

  @Get('contractor-details')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get contractor subscription details', description: 'Get subscription details for all contractors' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor subscription details retrieved successfully',
  })
  async getContractorSubscriptionDetails() {
    return this.subscriptionDashboardService.getContractorSubscriptionDetails();
  }

  @Get('payment-statistics')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get payment statistics', description: 'Get payment statistics (today, week, month, total)' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
  })
  async getPaymentStatistics() {
    return this.subscriptionDashboardService.getPaymentStatistics();
  }

  @Get('plan-purchase-statistics')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get plan purchase statistics', description: 'Get statistics on subscription plan purchases' })
  @ApiStandardResponse({
    status: 200,
    description: 'Plan purchase statistics retrieved successfully',
  })
  async getPlanPurchaseStatistics() {
    return this.subscriptionDashboardService.getPlanPurchaseStatistics();
  }

  @Get('contractor/:contractorId/payments')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get contractor payment details', description: 'Get all payment details for a contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  async getContractorPaymentDetails(@Param('contractorId') contractorId: string) {
    return this.subscriptionDashboardService.getContractorPaymentDetails(contractorId);
  }

  @Get('contractor/:contractorId/history')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get contractor subscription history', description: 'Get subscription history for a contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription history retrieved successfully',
  })
  async getContractorSubscriptionHistory(@Param('contractorId') contractorId: string) {
    return this.subscriptionDashboardService.getContractorSubscriptionHistory(contractorId);
  }

  @Get('payments')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all payment details', description: 'Get all payment details across the system' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  async getAllPaymentDetails() {
    return this.subscriptionDashboardService.getAllPaymentDetails();
  }
}

