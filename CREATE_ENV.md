# Create .env File

The `.env` file is missing. Please create it manually:

## Steps:

1. In the `Back` folder, create a new file named `.env`

2. Copy the content from `env.example` and paste it into `.env`

3. **IMPORTANT**: Update the `DB_PASSWORD` with your actual MySQL password:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_actual_mysql_password_here
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

## Quick Fix:

If your MySQL root user has no password, you can leave `DB_PASSWORD=` empty, but you need to ensure MySQL allows passwordless login for root@localhost.

## Verify:

After creating `.env`, restart your NestJS server.

