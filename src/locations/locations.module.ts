import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Contractor, Vehicle, Attendant, Profile]),
    AuthModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}

