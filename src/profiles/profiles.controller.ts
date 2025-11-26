import { Controller, Get, Post, Put, Patch, UseGuards, Param, Body, Query, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile', description: 'Retrieve user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('id') id: string) {
    return this.profilesService.getProfile(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all profiles', description: 'Retrieve all user profiles' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getAllProfiles() {
    return this.profilesService.getAllProfiles();
  }

  @Get('role/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get profiles by role', description: 'Retrieve profiles filtered by role' })
  @ApiParam({ name: 'role', description: 'User role (super_admin, contractor, attendant)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getProfilesByRole(@Param('role') role: string) {
    // Validate and convert string to UserRole enum
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(`Invalid role. Valid roles are: ${Object.values(UserRole).join(', ')}`);
    }
    return this.profilesService.getProfilesByRole(role as UserRole);
  }

  @Post('super-admin')
  // Public endpoint - allows creating first super admin without authentication
  // Service will check if super admin exists and prevent duplicates
  @ApiOperation({ 
    summary: 'Create Super Admin', 
    description: 'Create the first super admin profile. This endpoint is public for initial setup. Only one super admin is allowed.' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', example: 'Super Admin' },
        email: { type: 'string', example: 'admin@parkflow.com' },
        password: { type: 'string', example: 'Admin@123', description: 'Password for super admin account' },
        phone_number: { type: 'string', example: '+1234567890', nullable: true },
      },
      required: ['user_name', 'email', 'password'],
    },
  })
  @ApiStandardResponse({
    status: 201,
    description: 'Super Admin created successfully',
  })
  @ApiErrorResponse(409, 'Super Admin already exists or email already in use')
  async createSuperAdmin(@Body() data: { user_name: string; email: string; password: string; phone_number?: string }) {
    return this.profilesService.createSuperAdmin(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update profile', description: 'Update user profile information' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', nullable: true },
        email: { type: 'string', nullable: true },
        phone_number: { type: 'string', nullable: true },
        contractor_name: { type: 'string', nullable: true },
        attendant_name: { type: 'string', nullable: true },
      },
    },
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiErrorResponse(404, 'Profile not found')
  async updateProfile(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.profilesService.updateProfile(id, data, req.user?.id);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password', description: 'Change user password' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'OldPassword123!', description: 'Required only if not first login' },
        newPassword: { type: 'string', example: 'NewPassword123!' },
      },
      required: ['newPassword'],
    },
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiErrorResponse(400, 'Invalid old password or profile not found')
  async changePassword(@Param('id') id: string, @Body() data: { oldPassword?: string; newPassword: string }) {
    return this.profilesService.changePassword(id, data.oldPassword || '', data.newPassword);
  }

  @Patch(':id/email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update email', description: 'Update user email address' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newEmail: { type: 'string', example: 'newemail@example.com' },
      },
      required: ['newEmail'],
    },
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Email updated successfully',
  })
  @ApiErrorResponse(409, 'Email already exists')
  async updateEmail(@Param('id') id: string, @Body() data: { newEmail: string }) {
    return this.profilesService.updateEmail(id, data.newEmail);
  }
}

