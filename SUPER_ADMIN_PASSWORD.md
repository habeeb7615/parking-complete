# Super Admin Password Information

## Default Password

If you create Super Admin using the seed script without setting `SUPER_ADMIN_PASSWORD` in `.env`:

- **Email**: `admin@parkflow.com` (or value from `SUPER_ADMIN_EMAIL`)
- **Password**: `Admin@123` (default)

## How to Set Custom Password

### Method 1: Using .env file (Recommended)

1. Open `.env` file in the `Back` folder
2. Add or update:
   ```env
   SUPER_ADMIN_PASSWORD=YourSecurePassword123!
   ```
3. Run seed script:
   ```bash
   npm run seed:super-admin
   ```

### Method 2: Using API Endpoint

```bash
POST /api/profiles/super-admin
{
  "user_name": "Super Admin",
  "email": "admin@parkflow.com",
  "password": "YourSecurePassword123!",
  "phone_number": "+1234567890"
}
```

## Password Security

- Passwords are **hashed using bcrypt** (10 salt rounds) before storing in database
- Passwords are **never stored in plain text**
- The `password` field in Profile entity is excluded from queries by default (`select: false`)

## Login

After creating super admin, login using:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@parkflow.com",
  "password": "Admin@123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@parkflow.com",
    "role": "super_admin",
    "user_name": "Super Admin"
  }
}
```

## Change Password

Currently, there's no password change endpoint. To change password:

1. Update directly in database (requires bcrypt hashing):
   ```sql
   -- Generate bcrypt hash first, then update
   UPDATE profiles 
   SET password = '$2b$10$...' 
   WHERE email = 'admin@parkflow.com';
   ```

2. Or delete and recreate super admin (if no other super admin exists)

## Important Security Notes

1. **Always change default password** in production
2. **Use strong passwords** (min 8 characters, mix of letters, numbers, symbols)
3. **Never commit passwords** to version control
4. **Use environment variables** for sensitive data
5. **Password is hashed** - cannot be retrieved, only reset

## Troubleshooting

### "Invalid credentials" error

- Check if email is correct
- Verify password matches (case-sensitive)
- Ensure super admin profile exists in database
- Check if profile is not deleted (`is_deleted = false`)

### "Super Admin already exists" error

- Only one super admin is allowed
- Delete existing super admin first (set `is_deleted = true`)
- Or use existing super admin credentials to login

