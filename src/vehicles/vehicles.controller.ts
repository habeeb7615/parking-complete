import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { VehiclesService, CreateVehicleData, CheckoutVehicleData } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams } from '../contractors/contractors.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationSchema } from '../common/schemas/pagination.schema';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles', description: 'Retrieve list of all vehicles (without pagination)' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async getAllVehicles() {
    return this.vehiclesService.getAllVehicles();
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Get vehicles with pagination', description: 'Retrieve vehicles with pagination, search, and sorting' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async getVehiclesPaginated(@Body() pagination: IPagination) {
    return this.vehiclesService.pagination(pagination);
  }

  @Post('pagination')
  @ApiOperation({ summary: 'Get vehicles with pagination', description: 'Retrieve vehicles with advanced pagination and filtering' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async pagination(@Body() pagination: IPagination) {
    return this.vehiclesService.pagination(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID', description: 'Retrieve vehicle information by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }

  @Get('contractor/:contractorId')
  @ApiOperation({ summary: 'Get contractor vehicles', description: 'Retrieve all vehicles for a specific contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async getContractorVehicles(@Param('contractorId') contractorId: string) {
    return this.vehiclesService.getContractorVehicles(contractorId);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get vehicles by location', description: 'Retrieve all vehicles for a specific location' })
  @ApiParam({ name: 'locationId', description: 'Location ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async getVehiclesByLocation(@Param('locationId') locationId: string) {
    return this.vehiclesService.getVehiclesByLocation(locationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR, UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Create vehicle (Check-in)', description: 'Create a new vehicle check-in record' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        plate_number: { type: 'string', example: 'KA01AB1234' },
        vehicle_type: { type: 'string', example: '2-wheeler' },
        location_id: { type: 'string' },
        contractor_id: { type: 'string' },
        mobile_number: { type: 'string', nullable: true },
        gate_in_id: { type: 'string', nullable: true },
        session_id: { type: 'string', nullable: true },
      },
      required: ['plate_number', 'vehicle_type', 'location_id', 'contractor_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Vehicle checked in successfully' })
  async createVehicle(@Body() data: CreateVehicleData, @Request() req) {
    return this.vehiclesService.createVehicle(data, req.user?.id);
  }

  @Post('update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR, UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Update vehicle', description: 'Update vehicle information' })
  @ApiParam({ name: 'id', description: 'Vehicle ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        plate_number: { type: 'string', nullable: true },
        vehicle_type: { type: 'string', nullable: true },
        location_id: { type: 'string', nullable: true },
        contractor_id: { type: 'string', nullable: true },
        mobile_number: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async updateVehicle(@Param('id') id: string, @Body() data: Partial<CreateVehicleData>, @Request() req) {
    return this.vehiclesService.updateVehicle(id, data, req.user?.id);
  }

  @Post('checkout/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR, UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Checkout vehicle', description: 'Checkout a vehicle and process payment' })
  @ApiParam({ name: 'id', description: 'Vehicle ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        check_out_time: { type: 'string', format: 'date-time' },
        payment_amount: { type: 'number', example: 25.00 },
        payment_method: { type: 'string', enum: ['cash', 'card', 'digital', 'free'], example: 'cash' },
      },
      required: ['check_out_time', 'payment_amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'Vehicle checked out successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async checkoutVehicle(
    @Param('id') id: string,
    @Body() checkoutData: CheckoutVehicleData,
    @Request() req,
  ) {
    return this.vehiclesService.checkoutVehicle(id, checkoutData, req.user?.id);
  }

  @Get('delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Delete vehicle', description: 'Soft delete a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Vehicle deleted successfully',
  })
  @ApiErrorResponse(404, 'Vehicle not found')
  async deleteVehicle(@Param('id') id: string, @Request() req) {
    await this.vehiclesService.deleteVehicle(id, req.user?.id);
    return { message: 'Vehicle deleted successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get vehicle statistics', description: 'Get vehicle statistics with optional location filter' })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiStandardResponse({
    status: 200,
    description: 'Vehicle statistics retrieved successfully',
  })
  async getVehicleStats(@Query('locationId') locationId?: string) {
    return this.vehiclesService.getVehicleStats(locationId);
  }

  @Get('attendant/:attendantUserId')
  @ApiOperation({ summary: 'Get attendant vehicles', description: 'Get all vehicles for an attendant' })
  @ApiParam({ name: 'attendantUserId', description: 'Attendant User ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
  })
  async getAttendantVehicles(@Param('attendantUserId') attendantUserId: string) {
    return this.vehiclesService.getAttendantVehicles(attendantUserId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get vehicles by date range', description: 'Get vehicles within a date range for a location' })
  @ApiQuery({ name: 'locationId', required: true, type: String })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiStandardResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
  })
  async getVehiclesByDateRange(
    @Query('locationId') locationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehiclesService.getVehiclesByDateRange(locationId, startDate, endDate);
  }
}
