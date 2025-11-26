import { apiClient } from '@/lib/apiClient';

export interface ContractorSubscriptionDetails {
  contractor_id: string;
  company_name: string;
  user_name: string;
  email: string;
  current_plan: {
    id: string;
    name: string;
    price: number;
  };
  subscription_start_date: string;
  subscription_end_date: string;
  subscription_status: string;
  days_remaining: number;
  total_payments: number;
  last_payment_date: string;
  subscription_count: number;
}

export interface PaymentStatistics {
  today: {
    amount: number;
    count: number;
  };
  this_week: {
    amount: number;
    count: number;
  };
  this_month: {
    amount: number;
    count: number;
  };
  total: {
    amount: number;
    count: number;
  };
}

export interface PlanPurchaseStatistics {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
}

export interface PaymentDetails {
  id: string;
  contractor_name: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  subscription_start_date: string;
  subscription_end_date: string;
  duration_days: number;
}

export interface SubscriptionHistory {
  id: string;
  action: string;
  plan_name: string;
  previous_plan_name?: string;
  new_start_date: string;
  new_end_date: string;
  previous_start_date?: string;
  previous_end_date?: string;
  duration_days: number;
  amount_paid: number;
  created_on: string;
}

export class SubscriptionDashboardAPI {
  // Get all contractor subscription details
  static async getContractorSubscriptionDetails(): Promise<ContractorSubscriptionDetails[]> {
    const response = await apiClient.get<ContractorSubscriptionDetails[]>('/subscription-dashboard/contractor-details');
    return response.data || [];
  }

  // OLD METHOD - Keep for backward compatibility
  static async getContractorSubscriptionDetailsOld(): Promise<ContractorSubscriptionDetails[]> {
    const { data, error } = await supabase
      .from('contractors')
      .select(`
        id,
        user_id,
        company_name,
        profiles!inner(
          user_name,
          email,
          subscription_plan_id,
          subscription_start_date,
          subscription_end_date,
          subscription_status
        ),
        subscription_plans!inner(
          id,
          name,
          price
        )
      `)
      .eq('is_deleted', false)
      .not('profiles.subscription_plan_id', 'is', null);

    if (error) throw error;

    // Calculate additional fields
    const contractorDetails = data?.map(contractor => {
      const startDate = new Date(contractor.profiles.subscription_start_date);
      const endDate = new Date(contractor.profiles.subscription_end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        contractor_id: contractor.user_id,
        company_name: contractor.company_name,
        user_name: contractor.profiles.user_name,
        email: contractor.profiles.email,
        current_plan: {
          id: contractor.subscription_plans.id,
          name: contractor.subscription_plans.name,
          price: contractor.subscription_plans.price
        },
        subscription_start_date: contractor.profiles.subscription_start_date,
        subscription_end_date: contractor.profiles.subscription_end_date,
        subscription_status: contractor.profiles.subscription_status,
        days_remaining: daysRemaining,
        total_payments: 0, // Will be calculated separately
        last_payment_date: '', // Will be calculated separately
        subscription_count: 0 // Will be calculated separately
      };
    }) || [];

    // Get payment statistics for each contractor
    for (const contractor of contractorDetails) {
      const contractorId = contractor.contractor_id;
      
      // Get total payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, created_on')
        .eq('contractor_id', contractorId)
        .eq('payment_status', 'completed');

      if (paymentsData) {
        contractor.total_payments = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
        contractor.last_payment_date = paymentsData.length > 0 
          ? paymentsData.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())[0].created_on
          : '';
      }

      // Get subscription count
      const { data: historyData } = await supabase
        .from('subscription_history')
        .select('id')
        .eq('contractor_id', contractorId);

      contractor.subscription_count = historyData?.length || 0;
    }

    return contractorDetails;
  }

  // Get payment statistics
  static async getPaymentStatistics(): Promise<PaymentStatistics> {
    const response = await apiClient.get<PaymentStatistics>('/subscription-dashboard/payment-statistics');
    return response.data;
  }

  // OLD METHOD - Keep for backward compatibility
  static async getPaymentStatisticsOld(): Promise<PaymentStatistics> {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayData, weekData, monthData, totalData] = await Promise.all([
        // Today's payments
        supabase
          .from('payments')
          .select('amount')
          .eq('payment_status', 'completed')
          .gte('created_on', startOfToday.toISOString()),
        
        // This week's payments
        supabase
          .from('payments')
          .select('amount')
          .eq('payment_status', 'completed')
          .gte('created_on', startOfWeek.toISOString()),
        
        // This month's payments
        supabase
          .from('payments')
          .select('amount')
          .eq('payment_status', 'completed')
          .gte('created_on', startOfMonth.toISOString()),
        
        // Total payments
        supabase
          .from('payments')
          .select('amount')
          .eq('payment_status', 'completed')
      ]);

      const calculateStats = (data: any) => ({
        amount: data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0,
        count: data?.length || 0
      });

      return {
        today: calculateStats(todayData.data),
        this_week: calculateStats(weekData.data),
        this_month: calculateStats(monthData.data),
        total: calculateStats(totalData.data)
      };
    } catch (error) {
      console.warn('Payments table not available, returning zero statistics');
      return {
        today: { amount: 0, count: 0 },
        this_week: { amount: 0, count: 0 },
        this_month: { amount: 0, count: 0 },
        total: { amount: 0, count: 0 }
      };
    }
  }

  // Get plan purchase statistics
  static async getPlanPurchaseStatistics(): Promise<PlanPurchaseStatistics> {
    const response = await apiClient.get<PlanPurchaseStatistics>('/subscription-dashboard/plan-purchase-statistics');
    return response.data;
  }

  // OLD METHOD - Keep for backward compatibility
  static async getPlanPurchaseStatisticsOld(): Promise<PlanPurchaseStatistics> {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayData, weekData, monthData, totalData] = await Promise.all([
        // Today's purchases
        supabase
          .from('subscription_history')
          .select('id')
          .eq('action', 'assigned')
          .gte('created_on', startOfToday.toISOString()),
        
        // This week's purchases
        supabase
          .from('subscription_history')
          .select('id')
          .eq('action', 'assigned')
          .gte('created_on', startOfWeek.toISOString()),
        
        // This month's purchases
        supabase
          .from('subscription_history')
          .select('id')
          .eq('action', 'assigned')
          .gte('created_on', startOfMonth.toISOString()),
        
        // Total purchases
        supabase
          .from('subscription_history')
          .select('id')
          .eq('action', 'assigned')
      ]);

      return {
        today: todayData.data?.length || 0,
        this_week: weekData.data?.length || 0,
        this_month: monthData.data?.length || 0,
        total: totalData.data?.length || 0
      };
    } catch (error) {
      console.warn('Subscription history table not available, returning zero statistics');
      return {
        today: 0,
        this_week: 0,
        this_month: 0,
        total: 0
      };
    }
  }

  // Get payment details for a specific contractor
  static async getContractorPaymentDetails(contractorId: string): Promise<PaymentDetails[]> {
    const response = await apiClient.get<PaymentDetails[]>(`/subscription-dashboard/contractor/${contractorId}/payments`);
    return response.data || [];
  }

  // OLD METHOD - Keep for backward compatibility
  static async getContractorPaymentDetailsOld(contractorId: string): Promise<PaymentDetails[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        payment_status,
        created_on,
        subscription_start_date,
        subscription_end_date,
        duration_days,
        contractors!inner(
          company_name
        ),
        subscription_plans!inner(
          name
        )
      `)
      .eq('contractor_id', contractorId)
      .order('created_on', { ascending: false });

    if (error) throw error;

    return data?.map(payment => ({
      id: payment.id,
      contractor_name: payment.contractors.company_name,
      plan_name: payment.subscription_plans.name,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_date: payment.created_on,
      subscription_start_date: payment.subscription_start_date,
      subscription_end_date: payment.subscription_end_date,
      duration_days: payment.duration_days
    })) || [];
  }

  // Get subscription history for a specific contractor
  static async getContractorSubscriptionHistory(contractorId: string): Promise<SubscriptionHistory[]> {
    const response = await apiClient.get<SubscriptionHistory[]>(`/subscription-dashboard/contractor/${contractorId}/history`);
    return response.data || [];
  }

  // OLD METHOD - Keep for backward compatibility
  static async getContractorSubscriptionHistoryOld(contractorId: string): Promise<SubscriptionHistory[]> {
    const { data, error } = await supabase
      .from('subscription_history')
      .select(`
        id,
        action,
        new_start_date,
        new_end_date,
        duration_days,
        amount_paid,
        created_on,
        subscription_plan_id
      `)
      .eq('contractor_id', contractorId)
      .order('created_on', { ascending: false });

    if (error) throw error;

    // Get plan names separately to avoid relationship conflicts
    const planIds = [...new Set([
      ...data?.map(h => h.subscription_plan_id).filter(Boolean) || []
    ])];

    let planNames: { [key: string]: string } = {};
    if (planIds.length > 0) {
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .in('id', planIds);
      
      planNames = plansData?.reduce((acc, plan) => {
        acc[plan.id] = plan.name;
        return acc;
      }, {} as { [key: string]: string }) || {};
    }

    return data?.map(history => ({
      id: history.id,
      action: history.action,
      plan_name: planNames[history.subscription_plan_id] || 'Unknown Plan',
      previous_plan_name: undefined, // Column doesn't exist
      new_start_date: history.new_start_date,
      new_end_date: history.new_end_date,
      previous_start_date: undefined, // Column doesn't exist
      previous_end_date: undefined, // Column doesn't exist
      duration_days: history.duration_days,
      amount_paid: history.amount_paid,
      created_on: history.created_on
    })) || [];
  }

  // Get all payment details (for super admin)
  static async getAllPaymentDetails(): Promise<PaymentDetails[]> {
    const response = await apiClient.get<PaymentDetails[]>('/subscription-dashboard/payments');
    return response.data || [];
  }

  // OLD METHOD - Keep for backward compatibility
  static async getAllPaymentDetailsOld(): Promise<PaymentDetails[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        payment_status,
        created_on,
        subscription_start_date,
        subscription_end_date,
        duration_days,
        contractors!inner(
          company_name
        ),
        subscription_plans!inner(
          name
        )
      `)
      .order('created_on', { ascending: false });

    if (error) throw error;

    return data?.map(payment => ({
      id: payment.id,
      contractor_name: payment.contractors.company_name,
      plan_name: payment.subscription_plans.name,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_date: payment.created_on,
      subscription_start_date: payment.subscription_start_date,
      subscription_end_date: payment.subscription_end_date,
      duration_days: payment.duration_days
    })) || [];
  }
}
