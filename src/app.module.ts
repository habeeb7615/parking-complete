import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ContractorsModule } from './contractors/contractors.module';
import { LocationsModule } from './locations/locations.module';
import { AttendantsModule } from './attendants/attendants.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContractorDashboardModule } from './contractor-dashboard/contractor-dashboard.module';
import { AttendantDashboardModule } from './attendant-dashboard/attendant-dashboard.module';
import { SubscriptionDashboardModule } from './subscription-dashboard/subscription-dashboard.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    ProfilesModule,
    ContractorsModule,
    LocationsModule,
    AttendantsModule,
    VehiclesModule,
    PaymentsModule,
    SubscriptionsModule,
    DashboardModule,
    ContractorDashboardModule,
    AttendantDashboardModule,
    SubscriptionDashboardModule,
  ],
})
export class AppModule {}

