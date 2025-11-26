# Environment Configuration for MySQL

Create a `.env` file in the `Back` directory with the following configuration:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=parkflow

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:8080
```

## MySQL Database Setup

1. Create the database:
```sql
CREATE DATABASE parkflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Make sure MySQL is running on port 3306 (default)

3. Update the `.env` file with your MySQL credentials

## Notes

- All UUID columns are stored as VARCHAR(36) for MySQL compatibility
- The database will auto-sync in development mode (synchronize: true)
- In production, set `NODE_ENV=production` to disable auto-sync

