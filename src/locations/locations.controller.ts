import { Controller, Get, Post, Put, Delete, UseGuards, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LocationsService, CreateLocationData } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams } from '../contractors/contractors.service';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations', description: 'Retrieve list of all parking locations (without pagination)' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getAllLocations() {
    return this.locationsService.getAllLocations();
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get locations with pagination', description: 'Retrieve locations with pagination, search, and sorting' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String, enum: ['created_on', 'locations_name', 'address', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getLocationsPaginated(@Query() params: PaginationParams) {
    return this.locationsService.getLocationsPaginated(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID', description: 'Retrieve parking location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationById(@Param('id') id: string) {
    return this.locationsService.getLocationById(id);
  }

  @Get('contractor/:userId')
  @ApiOperation({ summary: 'Get contractor locations', description: 'Retrieve all locations for a specific contractor' })
  @ApiParam({ name: 'userId', description: 'Contractor User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getContractorLocations(@Param('userId') userId: string) {
    return this.locationsService.getContractorLocations(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Create location', description: 'Create a new parking location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        locations_name: { type: 'string', example: 'Downtown Parking' },
        address: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'New York', nullable: true },
        state: { type: 'string', example: 'NY', nullable: true },
        pincode: { type: 'string', example: '10001', nullable: true },
        total_slots: { type: 'number', example: 50 },
        contractor_id: { type: 'string' },
        status: { type: 'string', example: 'active', nullable: true },
      },
      required: ['locations_name', 'address', 'total_slots', 'contractor_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  async createLocation(@Body() data: CreateLocationData, @Request() req) {
    return this.locationsService.createLocation(data, req.user?.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Update location', description: 'Update parking location information' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        locations_name: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        city: { type: 'string', nullable: true },
        state: { type: 'string', nullable: true },
        pincode: { type: 'string', nullable: true },
        total_slots: { type: 'number', nullable: true },
        contractor_id: { type: 'string', nullable: true },
        status: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(@Param('id') id: string, @Body() data: Partial<CreateLocationData>, @Request() req) {
    return this.locationsService.updateLocation(id, data, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Delete location', description: 'Soft delete a parking location' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Location deleted successfully',
  })
  @ApiErrorResponse(404, 'Location not found')
  async deleteLocation(@Param('id') id: string, @Request() req) {
    await this.locationsService.deleteLocation(id, req.user?.id);
    return { message: 'Location deleted successfully' };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get location statistics', description: 'Get detailed statistics for a location' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Location statistics retrieved successfully',
  })
  async getLocationStats(@Param('id') id: string) {
    return this.locationsService.getLocationStats(id);
  }

  @Post(':id/assign-attendant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Assign attendant to location', description: 'Assign an attendant to a parking location' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attendantId: { type: 'string' },
      },
      required: ['attendantId'],
    },
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendant assigned successfully',
  })
  async assignLocationToAttendant(@Param('id') id: string, @Body() data: { attendantId: string }) {
    return this.locationsService.assignLocationToAttendant(data.attendantId, id);
  }

  @Delete(':id/attendant/:attendantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Remove attendant from location', description: 'Remove an attendant from a parking location' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiParam({ name: 'attendantId', description: 'Attendant ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendant removed successfully',
  })
  async removeLocationFromAttendant(@Param('id') id: string, @Param('attendantId') attendantId: string) {
    return this.locationsService.removeLocationFromAttendant(attendantId);
  }

  @Get('attendant/:attendantId')
  @ApiOperation({ summary: 'Get attendant locations', description: 'Get all locations assigned to an attendant' })
  @ApiParam({ name: 'attendantId', description: 'Attendant ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Locations retrieved successfully',
  })
  async getAttendantLocations(@Param('attendantId') attendantId: string) {
    return this.locationsService.getAttendantLocations(attendantId);
  }
}
