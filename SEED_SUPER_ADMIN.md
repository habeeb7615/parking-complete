# Super Admin Creation Guide

## Method 1: Using Seed Script (Recommended)

### Step 1: Update .env file

Add these variables to your `.env` file:

```env
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@parkflow.com
SUPER_ADMIN_PASSWORD=Admin@123
SUPER_ADMIN_PHONE=+1234567890
```

**Important**: Change `SUPER_ADMIN_PASSWORD` to a strong password. If not provided, default password is `Admin@123`.

### Step 2: Run seed script

```bash
npm run seed:super-admin
```

This will create a super admin profile in the database.

## Method 2: Using API Endpoint

### Step 1: Get JWT Token

First, you need to authenticate (if you have another super admin):

```bash
POST /api/auth/login
{
  "email": "existing_admin@parkflow.com",
  "password": "password"
}
```

### Step 2: Create Super Admin

```bash
POST /api/profiles/super-admin
Authorization: Bearer <your_jwt_token>
{
  "user_name": "Super Admin",
  "email": "admin@parkflow.com",
  "password": "Admin@123",
  "phone_number": "+1234567890"
}
```

## Method 3: Direct Database Insert

If you want to create it directly in MySQL:

```sql
-- Note: Password must be hashed using bcrypt before inserting
-- Use this SQL only if you know how to hash the password
-- Recommended: Use seed script or API endpoint instead

INSERT INTO profiles (
  id, 
  user_name, 
  email, 
  password,  -- Must be bcrypt hashed
  phone_number, 
  role, 
  status, 
  is_first_login, 
  is_deleted, 
  created_on, 
  updated_on
) VALUES (
  UUID(),  -- or use a specific UUID
  'Super Admin',
  'admin@parkflow.com',
  '$2b$10$...',  -- Replace with actual bcrypt hash
  '+1234567890',
  'super_admin',
  'active',
  false,
  false,
  NOW(),
  NOW()
);
```

## Verify Super Admin

Check if super admin was created:

```sql
SELECT * FROM profiles WHERE role = 'super_admin' AND is_deleted = false;
```

## Default Credentials

If you use the seed script without setting `SUPER_ADMIN_PASSWORD` in `.env`:
- **Email**: `admin@parkflow.com` (or value from `SUPER_ADMIN_EMAIL`)
- **Password**: `Admin@123` (default)

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Login

After creating super admin, you can login using:

```bash
POST /api/auth/login
{
  "email": "admin@parkflow.com",
  "password": "Admin@123"
}
```

## Important Notes

1. **Only one Super Admin**: The seed script checks if super admin already exists
2. **Email must be unique**: Cannot create super admin with existing email
3. **Password is hashed**: Passwords are stored using bcrypt (10 salt rounds)
4. **Role**: Must be exactly `'super_admin'` (matches frontend)
5. **Change default password**: Always change the default password in production

## Next Steps

After creating the super admin profile:
1. Login using the API endpoint: `POST /api/auth/login`
2. Use the JWT token for authenticated requests
3. Change password (implement password change endpoint if needed)

