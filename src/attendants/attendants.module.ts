import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendantsController } from './attendants.controller';
import { AttendantsService } from './attendants.service';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { Location } from '../entities/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendant, Profile, Location])],
  controllers: [AttendantsController],
  providers: [AttendantsService],
  exports: [AttendantsService],
})
export class AttendantsModule {}

