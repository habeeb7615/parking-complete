import { Controller, Get, Post, UseGuards, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans', description: 'Retrieve list of all available subscription plans' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription plans retrieved successfully',
  })
  async getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID', description: 'Retrieve a specific subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription plan retrieved successfully',
  })
  @ApiErrorResponse(404, 'Subscription plan not found')
  async getSubscriptionPlanById(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionPlanById(id);
  }

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create subscription plan', description: 'Create a new subscription plan' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiStandardResponse({
    status: 201,
    description: 'Subscription plan created successfully',
  })
  async createSubscriptionPlan(@Body() data: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createSubscriptionPlan(data);
  }

  @Post('plans/update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription plan', description: 'Update an existing subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: 'string' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
  })
  @ApiErrorResponse(404, 'Subscription plan not found')
  async updateSubscriptionPlan(@Param('id') id: string, @Body() data: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.updateSubscriptionPlan(id, data);
  }

  @Get('plans/delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete subscription plan', description: 'Soft delete a subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription plan deleted successfully',
  })
  @ApiErrorResponse(404, 'Subscription plan not found')
  async deleteSubscriptionPlan(@Param('id') id: string) {
    await this.subscriptionsService.deleteSubscriptionPlan(id);
    return { message: 'Subscription plan deleted successfully' };
  }

  @Get('contractor/:contractorId')
  @ApiOperation({ summary: 'Get contractor subscription', description: 'Retrieve subscription details for a specific contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  @ApiErrorResponse(404, 'Subscription not found')
  async getContractorSubscription(@Param('contractorId') contractorId: string) {
    return this.subscriptionsService.getContractorSubscription(contractorId);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign subscription', description: 'Assign or update subscription for a contractor' })
  @ApiBody({ type: AssignSubscriptionDto })
  @ApiStandardResponse({
    status: 201,
    description: 'Subscription assigned successfully',
  })
  async assignSubscription(@Body() data: AssignSubscriptionDto) {
    return this.subscriptionsService.assignSubscription(data);
  }

  @Post('extend/:contractorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Extend subscription', description: 'Extend existing subscription for a contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiBody({ type: ExtendSubscriptionDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription extended successfully',
  })
  async extendSubscription(@Param('contractorId') contractorId: string, @Body() data: ExtendSubscriptionDto) {
    return this.subscriptionsService.extendSubscription(contractorId, data.additionalDays);
  }

  @Get('unassign/:contractorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unassign subscription', description: 'Remove subscription from a contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Subscription unassigned successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found or no subscription assigned')
  async unassignSubscription(@Param('contractorId') contractorId: string) {
    return this.subscriptionsService.unassignSubscription(contractorId);
  }

  @Get('expiring')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get expiring subscriptions', description: 'Get subscriptions expiring within threshold days' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  @ApiStandardResponse({
    status: 200,
    description: 'Expiring subscriptions retrieved successfully',
  })
  async getExpiringSubscriptions(@Query('days') days?: number) {
    return this.subscriptionsService.getExpiringSubscriptions(days ? parseInt(days.toString()) : 7);
  }

  @Get('expired')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get expired subscriptions', description: 'Get all expired subscriptions' })
  @ApiStandardResponse({
    status: 200,
    description: 'Expired subscriptions retrieved successfully',
  })
  async getExpiredSubscriptions() {
    return this.subscriptionsService.getExpiredSubscriptions();
  }

  @Get('financial-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get financial summary', description: 'Get subscription financial summary and breakdown' })
  @ApiStandardResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
  })
  async getFinancialSummary() {
    return this.subscriptionsService.getFinancialSummary();
  }
}
