import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../entities/vehicle.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Location, Contractor])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}

