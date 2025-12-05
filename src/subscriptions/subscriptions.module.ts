import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Profile } from '../entities/profile.entity';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { Attendant } from '../entities/attendant.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, Profile, SubscriptionHistory, Attendant, Location, Contractor]),
    AuthModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}

