# ParkFlow Backend API

NestJS backend API for ParkFlow parking management system.

## Features

- **Authentication**: JWT-based authentication
- **Database**: PostgreSQL (Supabase compatible)
- **Modules**:
  - Dashboard
  - Contractors
  - Locations
  - Attendants
  - Vehicles
  - Payments
  - Subscriptions
  - Profiles

## Installation

```bash
npm install
```

## Configuration

1. Create a `.env` file in the `Back` directory
2. Update database credentials and JWT secret (see `ENV_SETUP.md` for details)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=parkflow
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000
CORS_ORIGIN=http://localhost:8080
```

## MySQL Database Setup

1. Create the database:
```sql
CREATE DATABASE parkflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

## API Documentation

Swagger documentation is available at: `http://localhost:3000/api/docs`

You can explore all API endpoints, test them, and see request/response schemas in the Swagger UI.

## API Endpoints

Base URL: `http://localhost:3000/api`

### Authentication
- `POST /auth/login` - Login
- `GET /auth/profile` - Get user profile (protected)

### Dashboard
- `GET /dashboard/metrics` - Get dashboard metrics
- `GET /dashboard/contractor-stats` - Get contractor statistics
- `GET /dashboard/location-stats` - Get location statistics

### Contractors
- `GET /contractors` - Get all contractors
- `GET /contractors/user/:userId` - Get contractor by user ID

### Locations
- `GET /locations` - Get all locations
- `GET /locations/:id` - Get location by ID
- `GET /locations/contractor/:userId` - Get contractor locations

### Vehicles
- `GET /vehicles` - Get all vehicles
- `GET /vehicles/contractor/:contractorId` - Get contractor vehicles
- `POST /vehicles` - Create vehicle (check-in)
- `PATCH /vehicles/:id/checkout` - Checkout vehicle

### Attendants
- `GET /attendants` - Get all attendants
- `GET /attendants/user/:userId` - Get attendant by user ID

### Payments
- `GET /payments` - Get all payments
- `GET /payments/contractor/:contractorId` - Get contractor payments

### Subscriptions
- `GET /subscriptions/plans` - Get subscription plans
- `GET /subscriptions/contractor/:contractorId` - Get contractor subscription

## Database Schema

The backend uses TypeORM entities that match the MySQL database schema:
- `profiles`
- `contractors`
- `parking_locations`
- `attendants`
- `vehicles`
- `payments`
- `sessions`
- `subscription_plans`

## Creating Super Admin

To create the first Super Admin profile, use the seed script:

1. Update `.env` file with super admin details (optional):
   ```env
   SUPER_ADMIN_NAME=Super Admin
   SUPER_ADMIN_EMAIL=admin@parkflow.com
   SUPER_ADMIN_PASSWORD=Admin@123
   SUPER_ADMIN_PHONE=+1234567890
   ```

2. Run the seed script:
   ```bash
   npm run seed:super-admin
   ```

3. **Default Login Credentials** (if using defaults):
   - **Email**: `admin@parkflow.com`
   - **Password**: `Admin@123`
   
   ⚠️ **Important**: Change the default password immediately after first login!

4. Login using the API:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@parkflow.com",
     "password": "Admin@123"
   }
   ```

Or use the API endpoint to create super admin:
```bash
POST /api/profiles/super-admin
{
  "user_name": "Super Admin",
  "email": "admin@parkflow.com",
  "password": "Admin@123",
  "phone_number": "+1234567890"
}
```

See `SEED_SUPER_ADMIN.md` for detailed instructions.

## Notes

- All endpoints (except `/auth/login`) require JWT authentication
- Include `Authorization: Bearer <token>` header for protected routes
- The backend is designed to work with the existing frontend without any changes to UI/UX
- Database connection uses MySQL (all UUID fields are stored as VARCHAR(36))
- Super Admin role: `'super_admin'` (matches frontend)

