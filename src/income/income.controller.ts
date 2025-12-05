import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { ApiStandardResponse, ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('income')
@Controller('income')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiBearerAuth('JWT-auth')
export class IncomeController {
  constructor(private incomeService: IncomeService) {}

  @Get('contractor/location-wise')
  @ApiOperation({ 
    summary: 'Get contractor income by location and attendant', 
    description: 'Get hierarchical income data grouped by location and then by attendant. Only includes checked-out vehicles with payment_amount > 0.' 
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Income data retrieved successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async getContractorLocationWiseIncome(@Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const data = await this.incomeService.getContractorLocationWiseIncome(userId);
    return {
      success: true,
      data: data,
      message: 'Income data retrieved successfully',
    };
  }

  @Post('contractor/location-wise')
  @ApiOperation({ 
    summary: 'Get contractor income by location and attendant (POST)', 
    description: 'Get hierarchical income data grouped by location and then by attendant. Only includes checked-out vehicles with payment_amount > 0.' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        contractor_id: { type: 'string' },
        date_range: {
          type: 'object',
          properties: {
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
          },
        },
        include_attendants: { type: 'boolean', default: true },
      },
      required: [],
    },
    required: false,
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Income data retrieved successfully',
  })
  @ApiErrorResponse(404, 'Contractor not found')
  async getContractorLocationWiseIncomePost(@Request() req, @Body() body?: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const data = await this.incomeService.getContractorLocationWiseIncome(userId);
    return {
      success: true,
      data: data,
      message: 'Income data retrieved successfully',
    };
  }
}

