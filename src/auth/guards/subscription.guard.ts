import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../entities/profile.entity';
import { Attendant } from '../../entities/attendant.entity';
import { Location } from '../../entities/location.entity';
import { Contractor } from '../../entities/contractor.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen if JwtAuthGuard is used before this)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Allow SUPER_ADMIN to pass through without subscription check
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    let profileToCheck: Profile | null = null;

    // If user is CONTRACTOR, check their own subscription
    if (user.role === UserRole.CONTRACTOR) {
      profileToCheck = await this.profileRepository.findOne({
        where: { id: user.id, is_deleted: false },
        relations: ['subscription_plans'],
      });
    }
    // If user is ATTENDANT, check their contractor's subscription
    else if (user.role === UserRole.ATTENDANT) {
      // Get attendant record
      const attendant = await this.attendantRepository.findOne({
        where: { user_id: user.id, is_deleted: false },
      });

      if (!attendant || !attendant.location_id) {
        throw new ForbiddenException('Attendant not found or location not assigned');
      }

      // Get location to find contractor
      const location = await this.locationRepository.findOne({
        where: { id: attendant.location_id, is_deleted: false },
      });

      if (!location || !location.contractor_id) {
        throw new ForbiddenException('Location not found or contractor not assigned');
      }

      // Get contractor to find contractor's user_id (profile id)
      const contractor = await this.contractorRepository.findOne({
        where: { id: location.contractor_id, is_deleted: false },
      });

      if (!contractor || !contractor.user_id) {
        throw new ForbiddenException('Contractor not found');
      }

      // Get contractor's profile (which has subscription)
      profileToCheck = await this.profileRepository.findOne({
        where: { id: contractor.user_id, is_deleted: false },
        relations: ['subscription_plans'],
      });
    }
    // For any other role, check their own subscription
    else {
      profileToCheck = await this.profileRepository.findOne({
        where: { id: user.id, is_deleted: false },
        relations: ['subscription_plans'],
      });
    }

    if (!profileToCheck) {
      throw new ForbiddenException('User profile not found');
    }

    // Check subscription status
    // Get current UTC time for comparison
    const now = new Date();
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    ));

    // Get subscription end date (already in UTC from database)
    const endDate = profileToCheck.subscription_end_date
      ? new Date(profileToCheck.subscription_end_date)
      : null;

    // Subscription is valid if:
    // 1. Status is 'active' (case-insensitive check)
    // 2. End date exists
    // 3. End date is in the future (endDate > now)
    const statusIsActive = profileToCheck.subscription_status?.toLowerCase() === 'active';
    const endDateExists = endDate !== null;
    const endDateInFuture = endDate ? endDate.getTime() > nowUTC.getTime() : false;

    const isSubscriptionValid = statusIsActive && endDateExists && endDateInFuture;

    // Debug logging to help identify issues
    if (!isSubscriptionValid) {
      console.log('[SubscriptionGuard] Subscription validation failed:', {
        userId: user.id,
        userRole: user.role,
        contractorUserId: user.role === UserRole.ATTENDANT ? 'N/A (checking contractor)' : user.id,
        subscription_status: profileToCheck.subscription_status,
        subscription_end_date: profileToCheck.subscription_end_date?.toISOString() || null,
        current_time_utc: nowUTC.toISOString(),
        end_date_timestamp: endDate?.getTime(),
        current_timestamp: nowUTC.getTime(),
        time_difference_ms: endDate ? endDate.getTime() - nowUTC.getTime() : null,
        statusIsActive,
        endDateExists,
        endDateInFuture,
        plan_name: profileToCheck.subscription_plans?.name || 'No Plan',
      });
    }

    if (!isSubscriptionValid) {
      const daysRemaining = endDate
        ? Math.ceil((endDate.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      throw new ForbiddenException({
        message: 'Your subscription has expired. Please renew your subscription to continue using the service.',
        error: 'SubscriptionExpired',
        subscription_status: profileToCheck.subscription_status || 'expired',
        subscription_end_date: profileToCheck.subscription_end_date?.toISOString() || null,
        days_remaining: Math.max(0, daysRemaining),
        plan_name: profileToCheck.subscription_plans?.name || 'No Plan',
      });
    }

    // Subscription is valid, allow the request
    return true;
  }
}

