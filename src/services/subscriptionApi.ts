import { apiClient } from '@/lib/apiClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  max_locations?: number;
  max_attendants?: number;
  days?: number;
  duration_days?: number;
  features: any;
  created_on: string;
  updated_on: string;
}

export interface SubscriptionDetails {
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'suspended';
  days_remaining: number;
  is_valid: boolean;
}

export class SubscriptionAPI {
  // Get all subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/subscriptions/plans');
    return response.data || [];
  }

  // Get subscription plan by ID
  static async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan> {
    const response = await apiClient.get<SubscriptionPlan>(`/subscriptions/plans/${id}`);
    return response.data;
  }

  // Get contractor's subscription details
  static async getContractorSubscription(contractorId: string): Promise<SubscriptionDetails | null> {
    const response = await apiClient.get<SubscriptionDetails>(`/subscriptions/contractor/${contractorId}`);
    return response.data;
  }

  // Assign subscription to contractor
  static async assignSubscription(
    contractorId: string, 
    planId: string, 
    durationDays: number = 30
  ): Promise<void> {
    await apiClient.post('/subscriptions/assign', {
      contractorId,
      planId,
      durationDays
    });
  }

  // Extend subscription
  static async extendSubscription(
    contractorId: string, 
    additionalDays: number
  ): Promise<void> {
    await apiClient.post(`/subscriptions/extend/${contractorId}`, {
      additionalDays
    });
  }

  // Check if contractor has valid subscription
  static async checkSubscriptionValidity(contractorId: string): Promise<boolean> {
    try {
      const subscription = await this.getContractorSubscription(contractorId);
      return subscription?.is_valid || false;
    } catch (error) {
      console.error('Error checking subscription validity:', error);
      return false;
    }
  }

  // Get subscription expiry message
  static async getExpiryMessage(contractorId: string): Promise<string> {
    const subscription = await this.getContractorSubscription(contractorId);
    
    if (!subscription) {
      return "No subscription found. Please contact administrator to assign a subscription plan.";
    }

    if (subscription.status === 'expired') {
      return `Your subscription has expired on ${new Date(subscription.end_date).toLocaleDateString()}. Please recharge to continue using the service.`;
    }

    if (subscription.status === 'suspended') {
      return "Your subscription has been suspended. Please contact administrator for assistance.";
    }

    if (subscription.days_remaining <= 7 && subscription.days_remaining > 0) {
      return `Your subscription will expire in ${subscription.days_remaining} days. Please recharge to avoid service interruption.`;
    }

    if (subscription.days_remaining <= 0) {
      return "Your subscription has expired. Please recharge to continue using the service.";
    }

    return "";
  }

  // Get contractors with expiring subscriptions
  static async getExpiringSubscriptions(daysThreshold: number = 7): Promise<any[]> {
    const response = await apiClient.get('/subscriptions/expiring', { days: daysThreshold });
    return response.data || [];
  }

  // Get expired subscriptions
  static async getExpiredSubscriptions(): Promise<any[]> {
    const response = await apiClient.get('/subscriptions/expired');
    return response.data || [];
  }

  // Update subscription plan
  static async updateSubscriptionPlan(
    planId: string, 
    updates: Partial<Pick<SubscriptionPlan, 'name' | 'price' | 'days' | 'duration_days' | 'max_locations' | 'max_attendants' | 'features'>>
  ): Promise<SubscriptionPlan> {
    const response = await apiClient.post<SubscriptionPlan>(`/subscriptions/plans/update/${planId}`, updates);
    return response.data;
  }

  // Create new subscription plan
  static async createSubscriptionPlan(
    planData: Pick<SubscriptionPlan, 'name' | 'price' | 'days' | 'duration_days' | 'max_locations' | 'max_attendants' | 'features'>
  ): Promise<SubscriptionPlan> {
    const response = await apiClient.post<SubscriptionPlan>('/subscriptions/plans', planData);
    return response.data;
  }

  // Delete subscription plan (soft delete)
  static async deleteSubscriptionPlan(planId: string): Promise<void> {
    await apiClient.get(`/subscriptions/plans/delete/${planId}`);
  }

  // Get financial summary data
  static async getFinancialSummary(): Promise<{
    todayAssignments: number;
    todayRevenue: number;
    last7DaysRevenue: number;
    lastMonthRevenue: number;
  }> {
    const response = await apiClient.get('/subscriptions/financial-summary');
    return response.data;
  }
}
