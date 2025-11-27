import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const password = this.configService.get<string>('DB_PASSWORD');
    // If password is empty string or undefined, don't pass it (for passwordless MySQL)
    const dbPassword = password && password.trim() !== '' ? password : undefined;
    
    return {
      type: 'mysql',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 3306),
      username: this.configService.get<string>('DB_USERNAME', 'root'),
      password: dbPassword,
      database: this.configService.get<string>('DB_DATABASE', 'parkflow'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // synchronize: true only in development - it adds missing columns/tables, does NOT drop data
      // It's safe: only adds new columns, creates missing tables, never deletes existing data
      // synchronize: this.configService.get<string>('NODE_ENV') === 'development',
      synchronize: this.configService.get<string>('NODE_ENV') === 'production',
      // migrations: ['dist/migrations/*.js'], // Uncomment for production migrations
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      charset: 'utf8mb4',
      timezone: '+00:00',
      // Disable foreign key creation to avoid constraint errors
      relationLoadStrategy: 'join',
      // Connection pool settings to prevent ECONNRESET and ETIMEDOUT errors
      extra: {
        connectionLimit: 10,
        // Connection timeout settings (in milliseconds)
        connectTimeout: 60000, // 60 seconds to establish connection (increased from default)
        // Keep connections alive to prevent MySQL from closing idle connections
        keepAliveInitialDelay: 0,
        enableKeepAlive: true,
        // Additional MySQL connection options
        multipleStatements: false,
        dateStrings: false,
        // Retry connection on failure
        reconnect: true,
        // Queue timeout - how long to wait for a connection from pool
        queueLimit: 0, // Unlimited queue
        // Socket timeout - how long to wait for response from MySQL
        socketTimeout: 60000, // 60 seconds
      },
      // Retry connection on failure
      maxQueryExecutionTime: 60000,
      // Auto reconnect on connection loss
      autoLoadEntities: true,
    };
  }
}

