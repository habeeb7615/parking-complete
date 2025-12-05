import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Profile } from '../entities/profile.entity';
import { Session } from '../entities/session.entity';
import { Payment } from '../entities/payment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contractor,
      Location,
      Attendant,
      Vehicle,
      Profile,
      Session,
      Payment,
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

