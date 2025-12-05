import { Controller, Get, Post, UseGuards, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PaginationParams } from '../contractors/contractors.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { PaginationSchema } from '../common/schemas/pagination.schema';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments', description: 'Retrieve list of all payments (without pagination)' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Get payments with pagination', description: 'Retrieve payments with pagination, search, and sorting' })
  @ApiBody({ schema: PaginationSchema })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getPaymentsPaginated(@Body() pagination: IPagination) {
    return this.paymentsService.pagination(pagination);
  }

  @Post('pagination')
  @ApiOperation({ summary: 'Get payments with pagination', description: 'Retrieve payments with advanced pagination and filtering' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async pagination(@Body() pagination: IPagination) {
    return this.paymentsService.pagination(pagination);
  }

  @Get('contractor/:contractorId')
  @ApiOperation({ summary: 'Get contractor payments', description: 'Retrieve all payments for a specific contractor with pagination' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getContractorPayments(@Param('contractorId') contractorId: string, @Query() params: PaginationParams) {
    return this.paymentsService.getContractorPayments(contractorId, params);
  }

  @Get('attendant/:attendantId')
  @ApiOperation({ summary: 'Get attendant payments', description: 'Retrieve all payments for a specific attendant with pagination' })
  @ApiParam({ name: 'attendantId', description: 'Attendant ID', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getAttendantPayments(@Param('attendantId') attendantId: string, @Query() params: PaginationParams) {
    return this.paymentsService.getAttendantPayments(attendantId, params);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get location payments', description: 'Retrieve all payments for a specific location' })
  @ApiParam({ name: 'locationId', description: 'Location ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getLocationPayments(@Param('locationId') locationId: string) {
    return this.paymentsService.getLocationPayments(locationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics', description: 'Get payment statistics with optional contractor or location filter' })
  @ApiQuery({ name: 'contractorId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiStandardResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
    example: {
      totalRevenue: 50000,
      todayRevenue: 500,
      thisWeekRevenue: 2500,
      thisMonthRevenue: 10000,
      averagePayment: 25.5,
      paymentMethodBreakdown: {
        cash: 30000,
        card: 15000,
        digital: 5000,
        free: 0,
      },
    },
  })
  async getPaymentStats(@Query('contractorId') contractorId?: string, @Query('locationId') locationId?: string) {
    return this.paymentsService.getPaymentStats(contractorId, locationId);
  }

  @Get('location-wise')
  @ApiOperation({ summary: 'Get location-wise payments', description: 'Get payment breakdown by location' })
  @ApiQuery({ name: 'contractorId', required: false, type: String })
  @ApiStandardResponse({
    status: 200,
    description: 'Location-wise payments retrieved successfully',
  })
  async getLocationWisePayments(@Query('contractorId') contractorId?: string) {
    return this.paymentsService.getLocationWisePayments(contractorId);
  }

  @Get('contractor-wise')
  @ApiOperation({ summary: 'Get contractor-wise payments', description: 'Get payment breakdown by contractor' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor-wise payments retrieved successfully',
  })
  async getContractorWisePayments() {
    return this.paymentsService.getContractorWisePayments();
  }
}
