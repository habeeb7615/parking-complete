import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Attendant } from '../entities/attendant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Contractor, Vehicle, Attendant])],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}

