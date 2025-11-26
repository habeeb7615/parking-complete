# Frontend vs Backend API Comparison

## ✅ Implemented APIs

### Contractors
- ✅ GET /api/contractors - All contractors
- ✅ GET /api/contractors/paginated - With pagination, search, sort
- ✅ GET /api/contractors/:id - By ID
- ✅ GET /api/contractors/user/:userId - By user ID
- ✅ POST /api/contractors - Create
- ✅ PUT /api/contractors/:id - Update
- ✅ DELETE /api/contractors/:id - Delete

### Attendants
- ✅ GET /api/attendants - All attendants
- ✅ GET /api/attendants/paginated - With pagination, search, sort
- ✅ GET /api/attendants/contractor/:contractorUserId - By contractor with pagination
- ✅ GET /api/attendants/:id - By ID
- ✅ GET /api/attendants/user/:userId - By user ID
- ✅ POST /api/attendants - Create
- ✅ PUT /api/attendants/:id - Update
- ✅ DELETE /api/attendants/:id - Delete

### Locations
- ✅ GET /api/locations - All locations
- ✅ GET /api/locations/paginated - With pagination, search, sort
- ✅ GET /api/locations/:id - By ID
- ✅ GET /api/locations/contractor/:userId - Contractor locations
- ✅ POST /api/locations - Create
- ✅ PUT /api/locations/:id - Update
- ✅ DELETE /api/locations/:id - Delete

### Vehicles
- ✅ GET /api/vehicles - All vehicles
- ✅ GET /api/vehicles/paginated - With pagination, search, sort
- ✅ GET /api/vehicles/:id - By ID
- ✅ GET /api/vehicles/contractor/:contractorId - Contractor vehicles
- ✅ GET /api/vehicles/location/:locationId - By location
- ✅ POST /api/vehicles - Create (Check-in)
- ✅ PUT /api/vehicles/:id - Update
- ✅ PATCH /api/vehicles/:id/checkout - Checkout
- ✅ DELETE /api/vehicles/:id - Delete

### Payments
- ✅ GET /api/payments - All payments
- ✅ GET /api/payments/paginated - With pagination, search, sort
- ✅ GET /api/payments/contractor/:contractorId - Contractor payments with pagination
- ✅ GET /api/payments/attendant/:attendantId - Attendant payments with pagination

### Dashboard
- ✅ GET /api/dashboard/metrics - Dashboard metrics
- ✅ GET /api/dashboard/contractor-stats - Contractor statistics
- ✅ GET /api/dashboard/location-stats - Location statistics

### Profiles
- ✅ GET /api/profiles/:id - Get profile
- ✅ GET /api/profiles - All profiles
- ✅ GET /api/profiles/role/:role - By role
- ✅ POST /api/profiles/super-admin - Create super admin

### Auth
- ✅ POST /api/auth/login - Login
- ✅ GET /api/auth/profile - Get authenticated user profile

## ⚠️ Missing/Incomplete APIs

### Dashboard (Additional endpoints needed)
- ❌ GET /api/dashboard/recent-activity - Recent activity feed
- ❌ GET /api/dashboard/system-health - System health status
- ❌ GET /api/dashboard/analytics - System analytics (day-wise, month-wise revenue)

### Subscriptions (CRUD incomplete)
- ✅ GET /api/subscriptions/plans - Get plans
- ✅ GET /api/subscriptions/contractor/:contractorId - Get contractor subscription
- ❌ POST /api/subscriptions/plans - Create plan
- ❌ PUT /api/subscriptions/plans/:id - Update plan
- ❌ DELETE /api/subscriptions/plans/:id - Delete plan
- ❌ POST /api/subscriptions/assign - Assign subscription to contractor
- ❌ POST /api/subscriptions/extend - Extend subscription
- ❌ GET /api/subscriptions/expiring - Get expiring subscriptions
- ❌ GET /api/subscriptions/expired - Get expired subscriptions
- ❌ GET /api/subscriptions/financial-summary - Financial summary

### Payments (Additional endpoints)
- ❌ GET /api/payments/location/:locationId - Location payments
- ❌ GET /api/payments/stats - Payment statistics
- ❌ GET /api/payments/location-wise - Location-wise payments
- ❌ GET /api/payments/contractor-wise - Contractor-wise payments

### Profiles (Additional endpoints)
- ❌ PUT /api/profiles/:id - Update profile
- ❌ PATCH /api/profiles/:id/password - Change password
- ❌ PATCH /api/profiles/:id/email - Update email

### Locations (Additional endpoints)
- ❌ GET /api/locations/:id/stats - Location statistics
- ❌ POST /api/locations/:id/assign-attendant - Assign attendant to location
- ❌ DELETE /api/locations/:id/attendant/:attendantId - Remove attendant from location
- ❌ GET /api/locations/attendant/:attendantId - Attendant locations

### Vehicles (Additional endpoints)
- ❌ GET /api/vehicles/stats - Vehicle statistics
- ❌ GET /api/vehicles/attendant - Attendant vehicles
- ❌ GET /api/vehicles/date-range - Vehicles by date range

### Attendants (Additional endpoints)
- ❌ GET /api/attendants/:id/stats - Attendant statistics
- ❌ GET /api/attendants/:id/locations - Attendant locations
- ❌ GET /api/attendants/stats - Overall attendant statistics

### Contractors (Additional endpoints)
- ❌ GET /api/contractors/:id/stats - Contractor statistics
- ❌ GET /api/contractors/:id/locations - Contractor locations
- ❌ GET /api/contractors/:id/attendants - Contractor attendants
- ❌ GET /api/contractors/:id/vehicles - Contractor vehicles
- ❌ GET /api/contractors/:id/payments - Contractor payments
- ❌ GET /api/contractors/:id/revenue/day-wise - Day-wise revenue
- ❌ GET /api/contractors/:id/revenue/month-wise - Month-wise revenue

### Contractor Dashboard
- ❌ GET /api/contractor-dashboard/:userId - Contractor dashboard data
- ❌ GET /api/contractor-dashboard/:userId/stats - Contractor stats

### Subscription Dashboard
- ❌ GET /api/subscription-dashboard/contractor-details - Contractor subscription details
- ❌ GET /api/subscription-dashboard/payment-statistics - Payment statistics
- ❌ GET /api/subscription-dashboard/plan-purchase-statistics - Plan purchase statistics
- ❌ GET /api/subscription-dashboard/contractor/:contractorId/payments - Contractor payment details
- ❌ GET /api/subscription-dashboard/contractor/:contractorId/history - Subscription history
- ❌ GET /api/subscription-dashboard/payments - All payment details

## Summary

**Total Implemented**: ~40 endpoints
**Total Missing**: ~35 endpoints

**Priority Missing APIs**:
1. Dashboard analytics and recent activity
2. Subscription CRUD operations
3. Payment statistics
4. Profile update operations
5. Statistics endpoints for all modules
6. Contractor dashboard endpoints

