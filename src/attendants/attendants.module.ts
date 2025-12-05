import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendantsController } from './attendants.controller';
import { AttendantsService } from './attendants.service';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendant, Profile, Location, Contractor]),
    AuthModule,
  ],
  controllers: [AttendantsController],
  providers: [AttendantsService],
  exports: [AttendantsService],
})
export class AttendantsModule {}

