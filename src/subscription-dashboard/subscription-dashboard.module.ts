import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionDashboardController } from './subscription-dashboard.controller';
import { SubscriptionDashboardService } from './subscription-dashboard.service';
import { Profile } from '../entities/profile.entity';
import { Payment } from '../entities/payment.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { Attendant } from '../entities/attendant.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      Payment,
      SubscriptionPlan,
      SubscriptionHistory,
      Attendant,
      Location,
      Contractor,
    ]),
    AuthModule,
  ],
  controllers: [SubscriptionDashboardController],
  providers: [SubscriptionDashboardService],
})
export class SubscriptionDashboardModule {}

