import { Controller, Get, Post, UseGuards, Param, Body, Query, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('getOne/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get one profile', description: 'Retrieve user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getOne(@Param('id') id: string) {
    return this.profilesService.getProfile(id);
  }

  @Get('getAll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all profiles', description: 'Retrieve all user profiles' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getAll() {
    return this.profilesService.getAllProfiles();
  }

  @Get('getByRole/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get profiles by role', description: 'Retrieve profiles filtered by role' })
  @ApiParam({ name: 'role', description: 'User role (super_admin, contractor, attendant)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getByRole(@Param('role') role: string) {
    // Validate and convert string to UserRole enum
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(`Invalid role. Valid roles are: ${Object.values(UserRole).join(', ')}`);
    }
    return this.profilesService.getProfilesByRole(role as UserRole);
  }

  @Post('create')
  // Public endpoint - allows creating first super admin without authentication
  // Service will check if super admin exists and prevent duplicates
  @ApiOperation({ 
    summary: 'Create Super Admin', 
    description: 'Create the first super admin profile. This endpoint is public for initial setup. Only one super admin is allowed.' 
  })
  @ApiBody({ type: CreateSuperAdminDto })
  @ApiStandardResponse({
    status: 201,
    description: 'Super Admin created successfully',
  })
  @ApiErrorResponse(409, 'Super Admin already exists or email already in use')
  async create(@Body() data: CreateSuperAdminDto) {
    return this.profilesService.createSuperAdmin(data);
  }

  @Post('update/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update profile', description: 'Update user profile information' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiErrorResponse(404, 'Profile not found')
  async update(@Param('id') id: string, @Body() data: UpdateProfileDto, @Request() req) {
    return this.profilesService.updateProfile(id, data, req.user?.id);
  }

  @Post('updatePassword/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password', description: 'Change user password' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiErrorResponse(400, 'Invalid old password or profile not found')
  async updatePassword(@Param('id') id: string, @Body() data: ChangePasswordDto) {
    return this.profilesService.changePassword(id, data.oldPassword || '', data.newPassword);
  }

  @Post('updateEmail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update email', description: 'Update user email address' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({ type: UpdateEmailDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Email updated successfully',
  })
  @ApiErrorResponse(409, 'Email already exists')
  async updateEmail(@Param('id') id: string, @Body() data: UpdateEmailDto) {
    return this.profilesService.updateEmail(id, data.newEmail);
  }
}

