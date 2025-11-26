import { useState, useEffect } from 'react';
import { DashboardAPI, DashboardMetrics, RecentActivity } from '@/services/dashboardApi';

export interface DashboardStats {
  totalContractors: number;
  totalLocations: number;
  activeAttendants: number;
  totalVehicles: number;
  totalRevenue: number;
  pendingApprovals: number;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalContractors: 0,
    totalLocations: 0,
    activeAttendants: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics using the API service
      const metrics: DashboardMetrics = await DashboardAPI.getDashboardMetrics();
      
      setStats({
        totalContractors: metrics.totalContractors,
        totalLocations: metrics.totalLocations,
        activeAttendants: metrics.activeAttendants,
        totalVehicles: metrics.totalVehicles,
        totalRevenue: metrics.totalRevenue,
        pendingApprovals: metrics.pendingApprovals,
      });

      // Fetch recent activity with pagination
      const activityResult = await DashboardAPI.getRecentActivityPaginated({
        page: 1,
        pageSize: 5,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      setRecentActivity(activityResult.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
