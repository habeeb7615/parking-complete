import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Profile } from '../entities/profile.entity';
import { SubscriptionHistory } from '../entities/subscription-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, Profile, SubscriptionHistory])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}

