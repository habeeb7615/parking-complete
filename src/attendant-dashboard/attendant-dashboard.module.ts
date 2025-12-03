import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendantDashboardController } from './attendant-dashboard.controller';
import { AttendantDashboardService } from './attendant-dashboard.service';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendant,
      Vehicle,
    ]),
  ],
  controllers: [AttendantDashboardController],
  providers: [AttendantDashboardService],
})
export class AttendantDashboardModule {}

