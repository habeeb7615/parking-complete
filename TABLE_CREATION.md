# Automatic Table Creation

## How Tables Are Created Automatically

TypeORM automatically creates all database tables when the server starts, based on the entity files.

### Current Configuration

In `src/config/database.config.ts`:
```typescript
synchronize: this.configService.get<string>('NODE_ENV') === 'development'
```

This means:
- ✅ **Development mode**: Tables are automatically created/updated
- ❌ **Production mode**: Auto-sync is disabled (for safety)

### How It Works

1. **Entity Files** → Define table structure
2. **TypeORM** → Reads all entity files from `src/entities/`
3. **Auto-Sync** → Creates/updates tables to match entities
4. **On Server Start** → All tables are ready!

### Tables That Will Be Created

Based on your entities, these tables will be automatically created:

1. **profiles** - User profiles with roles
2. **contractors** - Contractor information
3. **parking_locations** - Parking location details
4. **attendants** - Attendant records
5. **vehicles** - Vehicle check-in/checkout records
6. **payments** - Payment transactions
7. **sessions** - Parking sessions
8. **subscription_plans** - Subscription plan details

### What Happens on Server Start

```
1. Server starts
2. TypeORM connects to MySQL
3. Checks if database exists (creates if not)
4. Reads all entity files
5. Compares with existing tables
6. Creates missing tables
7. Updates existing tables (in development only)
8. Server ready! ✅
```

### Important Notes

⚠️ **Development Mode Only**: Auto-sync only works when `NODE_ENV=development`

⚠️ **Production**: In production, use migrations instead:
```bash
npm run typeorm migration:run
```

### Verify Tables Created

After server starts successfully, check MySQL:
```sql
USE parkflow;
SHOW TABLES;
```

You should see all 8 tables listed!

