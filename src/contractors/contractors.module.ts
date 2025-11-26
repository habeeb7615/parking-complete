import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { Contractor } from '../entities/contractor.entity';
import { Profile } from '../entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contractor, Profile])],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService],
})
export class ContractorsModule {}

