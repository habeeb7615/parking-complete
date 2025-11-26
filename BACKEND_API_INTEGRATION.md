# Backend API Integration Guide

## Overview
This document outlines the integration of NestJS backend APIs with the Frontend services. All service files have been updated to use the new API client instead of direct Supabase calls.

## Base API Client
**File:** `Front/src/lib/apiClient.ts`

The base API client handles:
- Authentication token management (from Supabase session)
- Base URL configuration (defaults to `http://localhost:3000/api`)
- Standard request/response handling
- Error handling

**Environment Variable:**
- `VITE_API_BASE_URL` - Set this in your `.env` file to override the default API URL

## Updated Service Files

### ✅ Completed

1. **attendantApi.ts** - Updated to use backend APIs:
   - `getAllAttendants()` → `GET /attendants/paginated`
   - `getAttendantsByContractor()` → `GET /attendants/contractor/:contractorUserId`
   - `getAttendantByUserId()` → `GET /attendants/user/:userId`
   - `getAttendantById()` → `GET /attendants/:id`
   - `createAttendant()` → `POST /attendants`
   - `updateAttendant()` → `PUT /attendants/:id`
   - `deleteAttendant()` → `DELETE /attendants/:id`
   - `getAttendantStats()` → `GET /attendants/:id/stats` or `GET /attendants/stats/overall`
   - `getAttendantLocations()` → `GET /attendants/:id/locations`

2. **locationApi.ts** - Updated to use backend APIs:
   - `getAllLocations()` → `GET /locations`
   - `getPaginatedLocations()` → `GET /locations/paginated`
   - `getLocationById()` → `GET /locations/:id`
   - `getContractorLocations()` → `GET /locations/contractor/:userId`
   - `getAttendantLocations()` → `GET /locations/attendant/:attendantId`
   - `createLocation()` → `POST /locations`
   - `updateLocation()` → `PUT /locations/:id`
   - `deleteLocation()` → `DELETE /locations/:id`
   - `getLocationStats()` → `GET /locations/:id/stats`
   - `assignLocationToAttendant()` → `POST /locations/:id/assign-attendant`
   - `removeLocationFromAttendant()` → `DELETE /locations/:id/attendant/:attendantId`

### ⏳ Pending Updates

The following service files still need to be updated to use the backend APIs:

3. **vehicleApi.ts** - Needs update:
   - `getAllVehicles()` → `GET /vehicles`
   - `getVehiclesPaginated()` → `GET /vehicles/paginated`
   - `getVehicleById()` → `GET /vehicles/:id`
   - `getContractorVehicles()` → `GET /vehicles/contractor/:contractorId`
   - `getVehiclesByLocation()` → `GET /vehicles/location/:locationId`
   - `getAttendantVehicles()` → `GET /vehicles/attendant/:attendantUserId`
   - `createVehicle()` → `POST /vehicles`
   - `updateVehicle()` → `PUT /vehicles/:id`
   - `checkoutVehicle()` → `PATCH /vehicles/:id/checkout`
   - `deleteVehicle()` → `DELETE /vehicles/:id`
   - `getVehicleStats()` → `GET /vehicles/stats`
   - `getVehiclesByDateRange()` → `GET /vehicles/date-range`

4. **contractorApi.ts** - Needs update:
   - `getAllContractors()` → `GET /contractors`
   - `getContractorsPaginated()` → `GET /contractors/paginated`
   - `getContractorById()` → `GET /contractors/:id`
   - `getContractorByUserId()` → `GET /contractors/user/:userId`
   - `createContractor()` → `POST /contractors`
   - `updateContractor()` → `PUT /contractors/:id`
   - `deleteContractor()` → `DELETE /contractors/:id`
   - `getContractorStats()` → `GET /contractors/:id/stats`
   - `getContractorLocations()` → `GET /contractors/:id/locations`
   - `getContractorAttendants()` → `GET /contractors/:id/attendants`
   - `getContractorVehicles()` → `GET /contractors/:id/vehicles`
   - `getContractorPayments()` → `GET /contractors/:id/payments`
   - `getContractorDayWiseRevenue()` → `GET /contractors/:id/revenue/day-wise`
   - `getContractorMonthWiseRevenue()` → `GET /contractors/:id/revenue/month-wise`

5. **paymentApi.ts** - Needs update:
   - `getAllPayments()` → `GET /payments`
   - `getPaymentsPaginated()` → `GET /payments/paginated`
   - `getContractorPayments()` → `GET /payments/contractor/:contractorId`
   - `getAttendantPayments()` → `GET /payments/attendant/:attendantId`
   - `getLocationPayments()` → `GET /payments/location/:locationId`
   - `getPaymentStats()` → `GET /payments/stats`
   - `getLocationWisePayments()` → `GET /payments/location-wise`
   - `getContractorWisePayments()` → `GET /payments/contractor-wise`

6. **subscriptionApi.ts** - Needs update:
   - `getSubscriptionPlans()` → `GET /subscriptions/plans`
   - `getSubscriptionPlanById()` → `GET /subscriptions/plans/:id`
   - `createSubscriptionPlan()` → `POST /subscriptions/plans`
   - `updateSubscriptionPlan()` → `PUT /subscriptions/plans/:id`
   - `deleteSubscriptionPlan()` → `DELETE /subscriptions/plans/:id`
   - `getContractorSubscription()` → `GET /subscriptions/contractor/:contractorId`
   - `assignSubscription()` → `POST /subscriptions/assign`
   - `extendSubscription()` → `POST /subscriptions/extend/:contractorId`
   - `getExpiringSubscriptions()` → `GET /subscriptions/expiring`
   - `getExpiredSubscriptions()` → `GET /subscriptions/expired`
   - `getFinancialSummary()` → `GET /subscriptions/financial-summary`

7. **dashboardApi.ts** - Needs update:
   - `getDashboardMetrics()` → `GET /dashboard/metrics`
   - `getContractorStats()` → `GET /dashboard/contractor-stats`
   - `getLocationStats()` → `GET /dashboard/location-stats`
   - `getRecentActivity()` → `GET /dashboard/recent-activity`
   - `getSystemHealth()` → `GET /dashboard/system-health`
   - `getSystemAnalytics()` → `GET /dashboard/analytics`
   - `getDayWiseRevenue()` → `GET /dashboard/revenue/day-wise`

8. **contractorDashboardApi.ts** - Needs update:
   - `getContractorDashboard()` → `GET /contractor-dashboard/:userId`
   - `getContractorStats()` → `GET /contractor-dashboard/:userId/stats`

9. **subscriptionDashboardApi.ts** - Needs update:
   - `getContractorSubscriptionDetails()` → `GET /subscription-dashboard/contractor-details`
   - `getPaymentStatistics()` → `GET /subscription-dashboard/payment-statistics`
   - `getPlanPurchaseStatistics()` → `GET /subscription-dashboard/plan-purchase-statistics`
   - `getContractorPaymentDetails()` → `GET /subscription-dashboard/contractor/:contractorId/payments`
   - `getContractorSubscriptionHistory()` → `GET /subscription-dashboard/contractor/:contractorId/history`
   - `getAllPaymentDetails()` → `GET /subscription-dashboard/payments`

## Usage Example

```typescript
import { apiClient } from '@/lib/apiClient';

// Example: Get all attendants
const response = await apiClient.get('/attendants/paginated', {
  page: 1,
  pageSize: 10,
  search: 'john',
  sortBy: 'created_on',
  sortOrder: 'desc'
});

// The response follows the standard format:
// {
//   success: boolean,
//   statusCode: number,
//   message: string,
//   data: T,
//   timestamp: string
// }

const attendants = response.data; // PaginatedResponse<Attendant>
```

## Authentication

The API client automatically retrieves the JWT token from the Supabase session and includes it in the `Authorization` header for all requests.

## Error Handling

All API errors are automatically converted to a standard `ApiError` format:
```typescript
{
  success: false,
  statusCode: number,
  message: string,
  error?: string,
  timestamp: string,
  path?: string
}
```

## Next Steps

1. Update remaining service files (vehicleApi, contractorApi, paymentApi, etc.)
2. Test all API endpoints
3. Update any components that directly call Supabase to use the new service methods
4. Set `VITE_API_BASE_URL` environment variable in production

## Notes

- Some methods that use Supabase for device restrictions or QR code generation are kept as-is
- The old Supabase methods are preserved for backward compatibility where needed
- All pagination, search, and sorting parameters are passed as query parameters

