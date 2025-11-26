# Environment Setup

## Create .env File

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

   Or manually create a `.env` file in the `Back` directory with the following content:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=parkflow

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:8080
```

## Configuration Steps

1. **Update MySQL Password**: Replace `your_mysql_password` with your actual MySQL root password

2. **Update JWT Secret**: Replace `your_jwt_secret_key_here_change_this_in_production` with a strong random string (use a password generator)

3. **Create Database**: 
   ```sql
   CREATE DATABASE parkflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Verify MySQL is running** on port 3306

## Example JWT Secret Generation

You can generate a secure JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use any random string generator.

