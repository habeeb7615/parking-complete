# MySQL Setup Instructions

## Current Issue
MySQL is rejecting the connection because it requires a password for the root user.

## Solution Options

### Option 1: Set MySQL Password in .env (Recommended)

1. Open `.env` file in the `Back` folder
2. Update `DB_PASSWORD` with your MySQL root password:

```env
DB_PASSWORD=your_mysql_root_password_here
```

3. Restart the NestJS server

### Option 2: Allow Passwordless Login for Root (Less Secure)

If you want to use MySQL without a password, run these commands in MySQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
```

Then keep `DB_PASSWORD=` empty in `.env` file.

### Option 3: Create a New MySQL User (Most Secure)

1. Connect to MySQL:
```bash
mysql -u root -p
```

2. Create a new user and database:
```sql
CREATE DATABASE parkflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'parkflow_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON parkflow.* TO 'parkflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. Update `.env` file:
```env
DB_USERNAME=parkflow_user
DB_PASSWORD=your_secure_password
DB_DATABASE=parkflow
```

## Verify MySQL is Running

Check if MySQL service is running:
```bash
# Windows
Get-Service -Name MySQL*

# Or check if port 3306 is listening
netstat -an | findstr 3306
```

## Test Connection

You can test the connection manually:
```bash
mysql -u root -p -h localhost
```

Enter your password when prompted.

