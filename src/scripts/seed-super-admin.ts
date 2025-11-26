import { DataSource } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

async function seedSuperAdmin() {
  // Create data source
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_DATABASE || 'parkflow',
    entities: [Profile],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const profileRepository = dataSource.getRepository(Profile);

    // Check if super admin already exists
    const existingSuperAdmin = await profileRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN, is_deleted: false },
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists:', existingSuperAdmin.email);
      console.log('   ID:', existingSuperAdmin.id);
      console.log('   Name:', existingSuperAdmin.user_name);
      await dataSource.destroy();
      return;
    }

    // Get password from env or use default
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin
    const superAdmin = profileRepository.create({
      id: randomUUID(),
      user_name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@parkflow.com',
      password: hashedPassword,
      phone_number: process.env.SUPER_ADMIN_PHONE || null,
      role: UserRole.SUPER_ADMIN,
      status: 'active',
      is_first_login: false,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    const saved = await profileRepository.save(superAdmin);
    console.log('✅ Super Admin created successfully!');
    console.log('   ID:', saved.id);
    console.log('   Name:', saved.user_name);
    console.log('   Email:', saved.email);
    console.log('   Role:', saved.role);
    console.log('   Password:', password === (process.env.SUPER_ADMIN_PASSWORD || 'Admin@123') ? '*** (check .env or default: Admin@123)' : '***');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Run the seed
seedSuperAdmin();

