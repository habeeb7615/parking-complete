import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../entities/vehicle.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { Payment } from '../entities/payment.entity';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationService } from '../common/services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Location, Contractor, Payment, Attendant, Profile]),
    AuthModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, NotificationService],
  exports: [VehiclesService],
})
export class VehiclesModule {}

