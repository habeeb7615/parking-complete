import { Controller, Get, Post, UseGuards, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams } from '../contractors/contractors.service';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationSchema } from '../common/schemas/pagination.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AssignAttendantDto } from './dto/assign-attendant.dto';

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

  @Post('paginated')
  @ApiOperation({ summary: 'Get locations with pagination', description: 'Retrieve locations with pagination, search, and sorting' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async getLocationsPaginated(@Body() pagination: IPagination) {
    return this.locationsService.pagination(pagination);
  }

  @Post('pagination')
  @ApiOperation({ summary: 'Get locations with pagination', description: 'Retrieve locations with advanced pagination and filtering' })
  @ApiBody({ schema: PaginationSchema })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async pagination(@Body() pagination: IPagination) {
    return this.locationsService.pagination(pagination);
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
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot create for other contractors' })
  @ApiResponse({ status: 400, description: 'Bad Request - Limit exceeded' })
  @ApiResponse({ status: 409, description: 'Conflict - A location with the same name and address already exists for this contractor' })
  async createLocation(@Body() data: CreateLocationDto, @Request() req) {
    return this.locationsService.createLocation(data, req.user?.id, req.user?.role);
  }

  @Post('update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Update location', description: 'Update parking location information' })
  @ApiParam({ name: 'id', description: 'Location ID', type: 'string' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 409, description: 'Conflict - A location with the same name and address already exists for this contractor' })
  async updateLocation(@Param('id') id: string, @Body() data: UpdateLocationDto, @Request() req) {
    return this.locationsService.updateLocation(id, data, req.user?.id);
  }

  @Get('delete/:id')
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
  @ApiBody({ type: AssignAttendantDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendant assigned successfully',
  })
  async assignLocationToAttendant(@Param('id') id: string, @Body() data: AssignAttendantDto) {
    return this.locationsService.assignLocationToAttendant(data.attendantId, id);
  }

  @Get('delete/:id/attendant/:attendantId')
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
