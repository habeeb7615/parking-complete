import { Controller, Get, Post, UseGuards, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ContractorsService, PaginationParams } from './contractors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationSchema } from '../common/schemas/pagination.schema';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@ApiTags('contractors')
@Controller('contractors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contractors', description: 'Retrieve list of all contractors (without pagination). For contractors, only their own record is returned.' })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  async getAllContractors(@Request() req) {
    return this.contractorsService.getAllContractors(req.user?.id, req.user?.role);
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Get contractors with pagination', description: 'Retrieve contractors with pagination, search, and sorting. For contractors, only their own record is returned.' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  async getContractorsPaginated(@Body() pagination: IPagination, @Request() req) {
    return this.contractorsService.pagination(pagination, req.user?.id, req.user?.role);
  }

  @Post('pagination')
  @ApiOperation({ summary: 'Get contractors with pagination', description: 'Retrieve contractors with advanced pagination and filtering. For contractors, only their own record is returned.' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  async pagination(@Body() pagination: IPagination, @Request() req) {
    return this.contractorsService.pagination(pagination, req.user?.id, req.user?.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID', description: 'Retrieve contractor information by ID' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Contractor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async getContractorById(@Param('id') id: string) {
    return this.contractorsService.getContractorById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get contractor by user ID', description: 'Retrieve contractor information by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Contractor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async getContractorByUserId(@Param('userId') userId: string) {
    return this.contractorsService.getContractorByUserId(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create contractor', description: 'Create a new contractor with profile' })
  @ApiBody({ type: CreateContractorDto })
  @ApiResponse({ status: 201, description: 'Contractor created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate entry: Email, User name, Phone number, or Contact number already exists' })
  async createContractor(@Body() data: CreateContractorDto, @Request() req) {
    return this.contractorsService.createContractor(data, req.user?.id);
  }

  @Post('update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update contractor', description: 'Update contractor information' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiBody({ type: UpdateContractorDto })
  @ApiResponse({ status: 200, description: 'Contractor updated successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @ApiResponse({ status: 409, description: 'Duplicate entry: Email, User name, Phone number, or Contact number already exists' })
  async updateContractor(@Param('id') id: string, @Body() data: UpdateContractorDto, @Request() req) {
    return this.contractorsService.updateContractor(id, data, req.user?.id);
  }

  @Get('delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete contractor', description: 'Soft delete a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor deleted successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async deleteContractor(@Param('id') id: string, @Request() req) {
    await this.contractorsService.deleteContractor(id, req.user?.id);
    return { message: 'Contractor deleted successfully' };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get contractor statistics', description: 'Get detailed statistics for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Contractor statistics retrieved successfully',
  })
  async getContractorStats(@Param('id') id: string) {
    return this.contractorsService.getContractorStats(id);
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Get contractor locations', description: 'Get all locations for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Locations retrieved successfully',
  })
  async getContractorLocations(@Param('id') id: string) {
    return this.contractorsService.getContractorLocations(id);
  }

  @Get(':id/attendants')
  @ApiOperation({ summary: 'Get contractor attendants', description: 'Get all attendants for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendants retrieved successfully',
  })
  async getContractorAttendants(@Param('id') id: string) {
    return this.contractorsService.getContractorAttendants(id);
  }

  @Get(':id/vehicles')
  @ApiOperation({ summary: 'Get contractor vehicles', description: 'Get all vehicles for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
  })
  async getContractorVehicles(@Param('id') id: string) {
    return this.contractorsService.getContractorVehicles(id);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get contractor payments', description: 'Get all payments for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async getContractorPayments(@Param('id') id: string) {
    return this.contractorsService.getContractorPayments(id);
  }

  @Get(':id/revenue/day-wise')
  @ApiOperation({ summary: 'Get contractor day-wise revenue', description: 'Get revenue breakdown by day for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiStandardResponse({
    status: 200,
    description: 'Day-wise revenue retrieved successfully',
  })
  async getContractorDayWiseRevenue(@Param('id') id: string, @Query('days') days?: number) {
    return this.contractorsService.getContractorDayWiseRevenue(id, days ? parseInt(days.toString()) : 30);
  }

  @Get(':id/revenue/month-wise')
  @ApiOperation({ summary: 'Get contractor month-wise revenue', description: 'Get revenue breakdown by month for a contractor' })
  @ApiParam({ name: 'id', description: 'Contractor ID', type: 'string' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12 })
  @ApiStandardResponse({
    status: 200,
    description: 'Month-wise revenue retrieved successfully',
  })
  async getContractorMonthWiseRevenue(@Param('id') id: string, @Query('months') months?: number) {
    return this.contractorsService.getContractorMonthWiseRevenue(id, months ? parseInt(months.toString()) : 12);
  }
}
