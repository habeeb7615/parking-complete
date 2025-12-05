# Subscription Guard Usage Guide

## Overview

The `SubscriptionGuard` is a NestJS guard that automatically checks if a contractor's subscription is active and not expired before allowing access to protected endpoints.

## Features

- ✅ Automatically checks subscription status for contractors
- ✅ Allows other roles (SUPER_ADMIN, ATTENDANT) to pass through
- ✅ Returns detailed error message if subscription is expired
- ✅ Works seamlessly with existing guards (JwtAuthGuard, RolesGuard)

## How It Works

1. **Checks User Role**: Only validates subscription for contractors
2. **Fetches Subscription**: Retrieves contractor's subscription details from database
3. **Validates Subscription**: Checks if:
   - `subscription_status === 'active'`
   - `subscription_end_date` exists and is in the future
4. **Blocks or Allows**: 
   - Blocks with `ForbiddenException` if expired
   - Allows request if subscription is valid

## Usage Examples

### Example 1: Protect a Single Endpoint

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';

@Controller('contractors')
@UseGuards(JwtAuthGuard) // Must be used before SubscriptionGuard
export class ContractorsController {
  
  @Get('dashboard')
  @UseGuards(SubscriptionGuard) // Add subscription check
  async getDashboard(@Request() req) {
    // This endpoint will only work if contractor has active subscription
    return this.contractorsService.getDashboard(req.user.id);
  }
}
```

### Example 2: Protect All Endpoints in a Controller

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('contractor-dashboard')
@UseGuards(JwtAuthGuard, SubscriptionGuard) // Apply to all endpoints
export class ContractorDashboardController {
  
  @Get()
  @UseGuards(RolesGuard) // Can combine with other guards
  @Roles(UserRole.CONTRACTOR)
  async getDashboard(@Request() req) {
    // All endpoints in this controller require active subscription
    return this.dashboardService.getDashboard(req.user.id);
  }
}
```

### Example 3: Combine with RolesGuard

```typescript
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  
  @Post('checkout/:id')
  @UseGuards(SubscriptionGuard, RolesGuard) // Multiple guards
  @Roles(UserRole.CONTRACTOR, UserRole.ATTENDANT)
  async checkoutVehicle(@Param('id') id: string, @Body() data: any) {
    // Only contractors need active subscription
    // Attendants can access without subscription check
    return this.vehiclesService.checkout(id, data);
  }
}
```

## Error Response Format

When subscription is expired, the guard returns:

```json
{
  "statusCode": 403,
  "message": "Your subscription has expired. Please renew your subscription to continue using the service.",
  "error": "SubscriptionExpired",
  "subscription_status": "expired",
  "subscription_end_date": "2024-12-31T23:59:59.000Z",
  "days_remaining": 0,
  "plan_name": "Basic Plan"
}
```

## Important Notes

1. **Always use JwtAuthGuard first**: `SubscriptionGuard` requires `req.user` which is set by `JwtAuthGuard`
2. **Order matters**: Guards execute in the order they're specified
3. **Other roles pass through**: SUPER_ADMIN and ATTENDANT are not checked
4. **Only contractors are validated**: The guard only checks subscription for contractors

## Guard Execution Order

```typescript
@UseGuards(JwtAuthGuard, SubscriptionGuard, RolesGuard)
```

Execution flow:
1. `JwtAuthGuard` - Validates JWT token and sets `req.user`
2. `SubscriptionGuard` - Checks subscription (only for contractors)
3. `RolesGuard` - Checks user role permissions

## Best Practices

1. **Use at Controller Level**: Apply to all contractor endpoints in a controller
2. **Combine with RolesGuard**: Use both for role-based and subscription-based access
3. **Document in Swagger**: Add `@ApiErrorResponse(403, 'Subscription expired')` to your endpoints
4. **Test Expired Subscriptions**: Ensure your frontend handles 403 errors gracefully

## Example: Complete Controller with Subscription Guard

```typescript
import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiErrorResponse } from '../common/decorators/api-response.decorator';

@ApiTags('contractor-features')
@Controller('contractor-features')
@UseGuards(JwtAuthGuard, SubscriptionGuard) // Applied to all endpoints
@ApiBearerAuth('JWT-auth')
export class ContractorFeaturesController {
  
  @Get('locations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Get contractor locations' })
  @ApiErrorResponse(403, 'Subscription expired')
  async getLocations(@Request() req) {
    // Requires active subscription
    return this.locationsService.getContractorLocations(req.user.id);
  }
  
  @Post('vehicles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Create vehicle' })
  @ApiErrorResponse(403, 'Subscription expired')
  async createVehicle(@Request() req, @Body() data: any) {
    // Requires active subscription
    return this.vehiclesService.create(req.user.id, data);
  }
}
```

