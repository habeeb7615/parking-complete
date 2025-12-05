import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendantDashboardController } from './attendant-dashboard.controller';
import { AttendantDashboardService } from './attendant-dashboard.service';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Profile } from '../entities/profile.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendant,
      Vehicle,
      Profile,
      Location, // Required for SubscriptionGuard
      Contractor, // Required for SubscriptionGuard
    ]),
    AuthModule, // Import AuthModule to use SubscriptionGuard
  ],
  controllers: [AttendantDashboardController],
  providers: [AttendantDashboardService],
})
export class AttendantDashboardModule {}

