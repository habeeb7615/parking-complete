import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionDashboardController } from './subscription-dashboard.controller';
import { SubscriptionDashboardService } from './subscription-dashboard.service';
import { Profile } from '../entities/profile.entity';
import { Payment } from '../entities/payment.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionHistory } from '../entities/subscription-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      Payment,
      SubscriptionPlan,
      SubscriptionHistory,
    ]),
  ],
  controllers: [SubscriptionDashboardController],
  providers: [SubscriptionDashboardService],
})
export class SubscriptionDashboardModule {}

