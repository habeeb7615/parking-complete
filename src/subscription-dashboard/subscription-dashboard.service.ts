import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Payment } from '../entities/payment.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SubscriptionDashboardService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionHistory)
    private subscriptionHistoryRepository: Repository<SubscriptionHistory>,
  ) {}

  async getContractorSubscriptionDetails() {
    const contractors = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.subscription_plans', 'plan')
      .where('profile.role = :role', { role: UserRole.CONTRACTOR })
      .andWhere('profile.is_deleted = false')
      .getMany();

    return contractors.map((profile) => {
      const now = new Date();
      const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
      const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isValid = profile.subscription_status === 'active' && endDate && endDate > now;

      return {
        contractor_id: profile.id,
        contractor_name: profile.user_name,
        email: profile.email,
        plan_id: profile.subscription_plan_id || null,
        plan_name: profile.subscription_plans?.name || 'No Plan',
        start_date: profile.subscription_start_date?.toISOString() || null,
        end_date: profile.subscription_end_date?.toISOString() || null,
        status: profile.subscription_status || 'expired',
        days_remaining: Math.max(0, daysRemaining),
        is_valid: isValid,
      };
    });
  }

  async getPaymentStatistics() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayData, weekData, monthData, totalData] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .addSelect('COUNT(payment.id)', 'count')
        .where('payment.payment_status = :status', { status: 'completed' })
        .andWhere('payment.created_at >= :startOfToday', { startOfToday })
        .getRawOne(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .addSelect('COUNT(payment.id)', 'count')
        .where('payment.payment_status = :status', { status: 'completed' })
        .andWhere('payment.created_at >= :startOfWeek', { startOfWeek })
        .getRawOne(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .addSelect('COUNT(payment.id)', 'count')
        .where('payment.payment_status = :status', { status: 'completed' })
        .andWhere('payment.created_at >= :startOfMonth', { startOfMonth })
        .getRawOne(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .addSelect('COUNT(payment.id)', 'count')
        .where('payment.payment_status = :status', { status: 'completed' })
        .getRawOne(),
    ]);

    return {
      today: {
        amount: Number(todayData?.total || 0),
        count: Number(todayData?.count || 0),
      },
      this_week: {
        amount: Number(weekData?.total || 0),
        count: Number(weekData?.count || 0),
      },
      this_month: {
        amount: Number(monthData?.total || 0),
        count: Number(monthData?.count || 0),
      },
      total: {
        amount: Number(totalData?.total || 0),
        count: Number(totalData?.count || 0),
      },
    };
  }

  async getPlanPurchaseStatistics() {
    const plans = await this.subscriptionPlanRepository.find({
      where: { is_deleted: false },
    });

    const profiles = await this.profileRepository.find({
      where: { is_deleted: false },
      relations: ['subscription_plans'],
    });

    return plans.map((plan) => {
      const subscribers = profiles.filter((p) => p.subscription_plan_id === plan.id).length;
      return {
        plan_id: plan.id,
        plan_name: plan.name,
        price: Number(plan.price),
        subscribers,
        total_revenue: subscribers * Number(plan.price),
      };
    });
  }

  async getContractorPaymentDetails(contractorId: string) {
    const payments = await this.paymentRepository.find({
      where: { contractor_id: contractorId },
      relations: ['vehicles', 'parking_locations'],
      order: { created_at: 'DESC' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      created_at: payment.created_at.toISOString(),
      vehicle: payment.vehicles ? {
        plate_number: payment.vehicles.plate_number,
        vehicle_type: payment.vehicles.vehicle_type,
      } : null,
      location: payment.parking_locations ? {
        name: payment.parking_locations.locations_name,
        address: payment.parking_locations.address,
      } : null,
    }));
  }

  async getContractorSubscriptionHistory(contractorId: string) {
    // Verify contractor exists
    const profile = await this.profileRepository.findOne({
      where: { id: contractorId },
    });

    if (!profile) {
      return [];
    }

    // Fetch subscription history from subscription_history table
    const history = await this.subscriptionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.subscription_plan', 'plan')
      .where('history.contractor_id = :contractorId', { contractorId })
      .orderBy('history.created_at', 'DESC')
      .getMany();

    return history.map((item) => ({
      id: item.id,
      plan_id: item.subscription_plan_id,
      plan_name: item.subscription_plan?.name || 'No Plan',
      plan_price: item.subscription_plan?.price || 0,
      start_date: item.subscription_start_date?.toISOString() || null,
      end_date: item.subscription_end_date?.toISOString() || null,
      status: item.subscription_status,
      action: item.action, // 'assigned', 'extended', 'unassigned', 'expired'
      notes: item.notes,
      created_at: item.created_at.toISOString(),
    }));
  }

  async getAllPaymentDetails() {
    const payments = await this.paymentRepository.find({
      relations: ['vehicles', 'parking_locations', 'contractors'],
      order: { created_at: 'DESC' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      created_at: payment.created_at.toISOString(),
      vehicle: payment.vehicles ? {
        plate_number: payment.vehicles.plate_number,
        vehicle_type: payment.vehicles.vehicle_type,
      } : null,
      location: payment.parking_locations ? {
        name: payment.parking_locations.locations_name,
        address: payment.parking_locations.address,
      } : null,
      contractor: payment.contractors ? {
        name: payment.contractors.company_name,
      } : null,
    }));
  }
}

