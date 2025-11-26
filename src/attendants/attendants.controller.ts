import { Controller, Get, Post, Put, Delete, UseGuards, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AttendantsService, CreateAttendantData } from './attendants.service';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams } from '../contractors/contractors.service';

@ApiTags('attendants')
@Controller('attendants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AttendantsController {
  constructor(private attendantsService: AttendantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all attendants', description: 'Retrieve list of all attendants (without pagination)' })
  @ApiResponse({ status: 200, description: 'Attendants retrieved successfully' })
  async getAllAttendants() {
    return this.attendantsService.getAllAttendants();
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get attendants with pagination', description: 'Retrieve attendants with pagination, search, and sorting' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String, enum: ['created_on', 'user_name', 'email', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Attendants retrieved successfully' })
  async getAttendantsPaginated(@Query() params: PaginationParams) {
    return this.attendantsService.getAttendantsPaginated(params);
  }

  @Get('contractor/:contractorUserId')
  @ApiOperation({ summary: 'Get attendants by contractor', description: 'Retrieve attendants for a specific contractor with pagination' })
  @ApiParam({ name: 'contractorUserId', description: 'Contractor User ID', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Attendants retrieved successfully' })
  async getAttendantsByContractor(@Param('contractorUserId') contractorUserId: string, @Query() params: PaginationParams) {
    return this.attendantsService.getAttendantsByContractor(contractorUserId, params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendant by ID', description: 'Retrieve attendant information by ID' })
  @ApiParam({ name: 'id', description: 'Attendant ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Attendant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attendant not found' })
  async getAttendantById(@Param('id') id: string) {
    return this.attendantsService.getAttendantById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get attendant by user ID', description: 'Retrieve attendant information by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Attendant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attendant not found' })
  async getAttendantByUserId(@Param('userId') userId: string) {
    return this.attendantsService.getAttendantByUserId(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Create attendant', description: 'Create a new attendant with profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'attendant@example.com' },
        password: { type: 'string', example: 'Password123!' },
        phone_number: { type: 'string', example: '+1234567890', nullable: true },
        location_id: { type: 'string', nullable: true },
        contractor_id: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
      },
      required: ['user_name', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'Attendant created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createAttendant(@Body() data: CreateAttendantData, @Request() req) {
    return this.attendantsService.createAttendant(data, req.user?.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Update attendant', description: 'Update attendant information' })
  @ApiParam({ name: 'id', description: 'Attendant ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', nullable: true },
        email: { type: 'string', nullable: true },
        password: { type: 'string', nullable: true },
        phone_number: { type: 'string', nullable: true },
        location_id: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['active', 'inactive'], nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Attendant updated successfully' })
  @ApiResponse({ status: 404, description: 'Attendant not found' })
  async updateAttendant(@Param('id') id: string, @Body() data: Partial<CreateAttendantData>, @Request() req) {
    return this.attendantsService.updateAttendant(id, data, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Delete attendant', description: 'Soft delete an attendant' })
  @ApiParam({ name: 'id', description: 'Attendant ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendant deleted successfully',
  })
  @ApiErrorResponse(404, 'Attendant not found')
  async deleteAttendant(@Param('id') id: string, @Request() req) {
    await this.attendantsService.deleteAttendant(id, req.user?.id);
    return { message: 'Attendant deleted successfully' };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get attendant statistics', description: 'Get detailed statistics for an attendant' })
  @ApiParam({ name: 'id', description: 'Attendant ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Attendant statistics retrieved successfully',
  })
  async getAttendantStats(@Param('id') id: string) {
    return this.attendantsService.getAttendantStats(id);
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Get attendant locations', description: 'Get all locations assigned to an attendant' })
  @ApiParam({ name: 'id', description: 'Attendant ID', type: 'string' })
  @ApiStandardResponse({
    status: 200,
    description: 'Locations retrieved successfully',
  })
  async getAttendantLocations(@Param('id') id: string) {
    return this.attendantsService.getAttendantLocations(id);
  }

  @Get('stats/overall')
  @ApiOperation({ summary: 'Get overall attendant statistics', description: 'Get overall statistics for all attendants' })
  @ApiStandardResponse({
    status: 200,
    description: 'Overall attendant statistics retrieved successfully',
  })
  async getOverallAttendantStats() {
    return this.attendantsService.getOverallAttendantStats();
  }
}
