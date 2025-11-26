import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorDashboardController } from './contractor-dashboard.controller';
import { ContractorDashboardService } from './contractor-dashboard.service';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contractor,
      Location,
      Attendant,
      Vehicle,
      Payment,
    ]),
  ],
  controllers: [ContractorDashboardController],
  providers: [ContractorDashboardService],
})
export class ContractorDashboardModule {}

