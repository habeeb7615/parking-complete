import { AttendantAPI } from '@/services/attendantApi';
import { LocationAPI } from '@/services/locationApi';
import { ContractorAPI } from '@/services/contractorApi';
import { AuthAPI } from '@/services/authApi';

export interface SubscriptionStatus {
  isExpired: boolean;
  isSuspended: boolean;
  daysRemaining: number;
  endDate: Date | null;
  status: string;
}

/**
 * Check if a contractor's subscription is expired or suspended
 */
export async function checkContractorSubscription(contractorUserId: string): Promise<SubscriptionStatus> {
  try {
    // Get contractor's profile which contains subscription_end_date and subscription_status
    const contractorProfile = await AuthAPI.getProfileById(contractorUserId);

    if (!contractorProfile) {
      return {
        isExpired: true,
        isSuspended: true,
        daysRemaining: 0,
        endDate: null,
        status: 'unknown'
      };
    }

    const now = new Date();
    const endDate = contractorProfile.subscription_end_date ? new Date(contractorProfile.subscription_end_date) : null;
    const isExpired = endDate && endDate < now;
    const isSuspended = contractorProfile.subscription_status === 'expired' || contractorProfile.subscription_status === 'suspended';
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      isExpired: isExpired || false,
      isSuspended: isSuspended || false,
      daysRemaining: Math.max(0, daysRemaining),
      endDate,
      status: contractorProfile.subscription_status || 'unknown'
    };
  } catch (error) {
    console.error('Error checking contractor subscription:', error);
    return {
      isExpired: true,
      isSuspended: true,
      daysRemaining: 0,
      endDate: null,
      status: 'error'
    };
  }
}

/**
 * Check if an attendant's contractor subscription is expired
 * Flow: Attendant → Location → Contractor → Contractor's Profile (subscription_end_date)
 */
export async function checkAttendantContractorSubscription(attendantUserId: string): Promise<SubscriptionStatus> {
  try {
    // Step 1: Get attendant by user_id to get location_id
    const attendant = await AttendantAPI.getAttendantByUserId(attendantUserId);
    
    if (!attendant || !attendant.location_id) {
      return {
        isExpired: true,
        isSuspended: true,
        daysRemaining: 0,
        endDate: null,
        status: 'unknown'
      };
    }

    // Step 2: Get location by location_id to get contractor_id
    const location = await LocationAPI.getLocationById(attendant.location_id);
    
    if (!location || !location.contractor_id) {
      return {
        isExpired: true,
        isSuspended: true,
        daysRemaining: 0,
        endDate: null,
        status: 'unknown'
      };
    }

    // Step 3: Get contractor by contractor_id (includes profiles relation with subscription_end_date)
    const contractor = await ContractorAPI.getContractorById(location.contractor_id);
    
    if (!contractor || !contractor.profiles) {
      return {
        isExpired: true,
        isSuspended: true,
        daysRemaining: 0,
        endDate: null,
        status: 'unknown'
      };
    }

    // Step 4: Check subscription based on contractor's profile subscription_end_date
    const contractorProfile = contractor.profiles;
    const now = new Date();
    const endDate = contractorProfile.subscription_end_date ? new Date(contractorProfile.subscription_end_date) : null;
    const isExpired = endDate && endDate < now;
    const isSuspended = contractorProfile.subscription_status === 'expired' || contractorProfile.subscription_status === 'suspended';
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      isExpired: isExpired || false,
      isSuspended: isSuspended || false,
      daysRemaining: Math.max(0, daysRemaining),
      endDate,
      status: contractorProfile.subscription_status || 'unknown'
    };
  } catch (error) {
    console.error('Error checking attendant contractor subscription:', error);
    return {
      isExpired: true,
      isSuspended: true,
      daysRemaining: 0,
      endDate: null,
      status: 'error'
    };
  }
}

/**
 * Get subscription expiry message for attendants
 */
export function getAttendantExpiryMessage(subscriptionStatus: SubscriptionStatus): string {
  if (subscriptionStatus.isExpired) {
    return "Your contractor's subscription has expired. Please contact your contractor to recharge.";
  } else if (subscriptionStatus.daysRemaining <= 7) {
    return `Your contractor's subscription will expire in ${subscriptionStatus.daysRemaining} days. Please contact your contractor to recharge.`;
  }
  return "";
}

/**
 * Get subscription expiry message for contractors
 */
export function getContractorExpiryMessage(subscriptionStatus: SubscriptionStatus): string {
  if (subscriptionStatus.isExpired) {
    return "Your subscription has expired. Please recharge to continue using the service.";
  } else if (subscriptionStatus.daysRemaining <= 7) {
    return `Your subscription will expire in ${subscriptionStatus.daysRemaining} days. Please recharge to avoid service interruption.`;
  }
  return "";
}
