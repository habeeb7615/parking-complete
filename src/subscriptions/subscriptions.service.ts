import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Profile } from '../entities/profile.entity';
import { randomUUID } from 'crypto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getSubscriptionPlans() {
    return this.subscriptionPlanRepository.find({
      where: { is_deleted: false },
      order: { price: 'ASC' },
    });
  }

  async getSubscriptionPlanById(id: string) {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async createSubscriptionPlan(data: CreateSubscriptionPlanDto) {
    const planId = randomUUID();
    const plan = this.subscriptionPlanRepository.create({
      id: planId,
      name: data.name,
      price: data.price,
      days: data.days,
      max_locations: 0,
      max_attendants: 0,
      features: {},
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    return this.subscriptionPlanRepository.save(plan);
  }

  async updateSubscriptionPlan(id: string, data: UpdateSubscriptionPlanDto) {
    const plan = await this.getSubscriptionPlanById(id);

    if (data.name !== undefined) plan.name = data.name;
    if (data.price !== undefined) plan.price = data.price;
    if (data.days !== undefined) plan.days = data.days;
    plan.updated_on = new Date();

    return this.subscriptionPlanRepository.save(plan);
  }

  async deleteSubscriptionPlan(id: string) {
    const plan = await this.getSubscriptionPlanById(id);
    plan.is_deleted = true;
    plan.updated_on = new Date();
    await this.subscriptionPlanRepository.save(plan);
  }

  async getContractorSubscription(contractorId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: contractorId },
      relations: ['subscription_plans'],
    });

    if (!profile) return null;

    const now = new Date();
    const endDate = profile.subscription_end_date
      ? new Date(profile.subscription_end_date)
      : null;
    const daysRemaining = endDate
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isValid =
      profile.subscription_status === 'active' &&
      endDate &&
      endDate > now;

    return {
      plan_id: profile.subscription_plan_id || '',
      plan_name: profile.subscription_plans?.name || 'No Plan',
      start_date: profile.subscription_start_date?.toISOString() || '',
      end_date: profile.subscription_end_date?.toISOString() || '',
      status: profile.subscription_status || 'expired',
      days_remaining: Math.max(0, daysRemaining),
      is_valid: isValid,
    };
  }

  async assignSubscription(data: AssignSubscriptionDto) {
    const { contractorId, planId, durationDays = 30 } = data;

    // Verify plan exists
    const plan = await this.getSubscriptionPlanById(planId);

    // Get contractor profile
    const profile = await this.profileRepository.findOne({
      where: { id: contractorId },
    });

    if (!profile) {
      throw new NotFoundException('Contractor not found');
    }

    // Check if contractor already has an active subscription
    const now = new Date();
    const hasActiveSubscription = 
      profile.subscription_status === 'active' &&
      profile.subscription_end_date &&
      new Date(profile.subscription_end_date) > now;

    if (hasActiveSubscription) {
      throw new ConflictException(
        'Contractor already has an active subscription plan. Please extend the current subscription or wait until it expires.'
      );
    }

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + durationDays);

    // If already has subscription, extend from current end date
    let startDate = now;
    if (profile.subscription_end_date && new Date(profile.subscription_end_date) > now) {
      startDate = new Date(profile.subscription_end_date);
      endDate.setTime(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    profile.subscription_plan_id = planId;
    profile.subscription_start_date = startDate;
    profile.subscription_end_date = endDate;
    profile.subscription_status = 'active';
    profile.updated_on = new Date();

    await this.profileRepository.save(profile);

    return this.getContractorSubscription(contractorId);
  }

  async extendSubscription(contractorId: string, additionalDays: number) {
    const profile = await this.profileRepository.findOne({
      where: { id: contractorId },
    });

    if (!profile) {
      throw new NotFoundException('Contractor not found');
    }

    if (!profile.subscription_end_date) {
      throw new ConflictException('No active subscription to extend');
    }

    const currentEndDate = new Date(profile.subscription_end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    profile.subscription_end_date = newEndDate;
    profile.subscription_status = 'active';
    profile.updated_on = new Date();

    await this.profileRepository.save(profile);

    return this.getContractorSubscription(contractorId);
  }

  async unassignSubscription(contractorId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: contractorId },
    });

    if (!profile) {
      throw new NotFoundException('Contractor not found');
    }

    // Check if contractor has a subscription
    if (!profile.subscription_plan_id) {
      throw new NotFoundException('Contractor does not have any subscription assigned');
    }

    // Unassign subscription by clearing subscription fields
    profile.subscription_plan_id = null;
    profile.subscription_start_date = null;
    profile.subscription_end_date = null;
    profile.subscription_status = 'expired';
    profile.updated_on = new Date();

    await this.profileRepository.save(profile);

    return { message: 'Subscription unassigned successfully' };
  }

  async getExpiringSubscriptions(daysThreshold: number = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const profiles = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.subscription_plans', 'plan')
      .where('profile.subscription_end_date IS NOT NULL')
      .andWhere('profile.subscription_end_date <= :thresholdDate', { thresholdDate })
      .andWhere('profile.subscription_end_date >= :now', { now: new Date() })
      .andWhere('profile.subscription_status = :status', { status: 'active' })
      .andWhere('profile.is_deleted = false')
      .orderBy('profile.subscription_end_date', 'ASC')
      .getMany();

    return profiles.map((profile) => {
      const endDate = new Date(profile.subscription_end_date!);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        contractor_id: profile.id,
        plan_name: profile.subscription_plans?.name || 'No Plan',
        end_date: profile.subscription_end_date?.toISOString(),
        days_remaining: Math.max(0, daysRemaining),
      };
    });
  }

  async getExpiredSubscriptions() {
    const now = new Date();

    const profiles = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.subscription_plans', 'plan')
      .where('profile.subscription_end_date IS NOT NULL')
      .andWhere('profile.subscription_end_date < :now', { now })
      .andWhere('profile.is_deleted = false')
      .orderBy('profile.subscription_end_date', 'DESC')
      .getMany();

    return profiles.map((profile) => {
      const endDate = new Date(profile.subscription_end_date!);
      const now = new Date();
      const daysExpired = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        contractor_id: profile.id,
        plan_name: profile.subscription_plans?.name || 'No Plan',
        end_date: profile.subscription_end_date?.toISOString(),
        days_expired: daysExpired,
        status: profile.subscription_status,
      };
    });
  }

  async getFinancialSummary() {
    const plans = await this.subscriptionPlanRepository.find({
      where: { is_deleted: false },
    });

    const profiles = await this.profileRepository.find({
      where: { is_deleted: false },
      relations: ['subscription_plans'],
    });

    const activeSubscriptions = profiles.filter(
      (p) => p.subscription_status === 'active' && p.subscription_end_date && new Date(p.subscription_end_date) > new Date(),
    );

    const totalRevenue = activeSubscriptions.reduce((sum, profile) => {
      return sum + (profile.subscription_plans?.price || 0);
    }, 0);

    const planCounts = plans.map((plan) => {
      const count = profiles.filter((p) => p.subscription_plan_id === plan.id).length;
      return {
        plan_id: plan.id,
        plan_name: plan.name,
        subscribers: count,
        revenue: count * plan.price,
      };
    });

    return {
      total_subscriptions: activeSubscriptions.length,
      total_revenue: totalRevenue,
      plan_breakdown: planCounts,
    };
  }
}
