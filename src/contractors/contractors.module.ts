import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { Contractor } from '../entities/contractor.entity';
import { Profile } from '../entities/profile.entity';
import { Attendant } from '../entities/attendant.entity';
import { Location } from '../entities/location.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contractor, Profile, Attendant, Location]),
    AuthModule,
  ],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService],
})
export class ContractorsModule {}

