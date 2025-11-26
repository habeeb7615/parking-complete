import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and get JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiStandardResponse({
    status: 200,
    description: 'Login successful',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'uuid-here',
        email: 'user@example.com',
        role: 'super_admin',
        user_name: 'User Name',
      },
    },
  })
  @ApiErrorResponse(401, 'Invalid credentials')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return this.authService.login(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile', description: 'Get authenticated user profile information' })
  @ApiStandardResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    example: {
      id: 'uuid-here',
      user_name: 'User Name',
      email: 'user@example.com',
      role: 'super_admin',
    },
  })
  @ApiErrorResponse(401, 'Unauthorized')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}

