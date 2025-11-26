import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, TrendingUp, Calendar, Download, Building, Users, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/dateUtils";

// PaymentStats interface
interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  monthlyRevenue: number;
  averagePayment: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    digital: number;
    free: number;
  };
}

interface ContractorIncome {
  contractor_id: string;
  contractor_name: string;
  total_revenue: number;
  today_revenue: number;
  this_week_revenue: number;
  this_month_revenue: number;
}

interface AttendantIncome {
  attendant_id: string;
  attendant_name: string;
  total_revenue: number;
  today_revenue: number;
  this_week_revenue: number;
  this_month_revenue: number;
}

export default function Income() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [contractorIncomes, setContractorIncomes] = useState<ContractorIncome[]>([]);
  const [attendantIncomes, setAttendantIncomes] = useState<AttendantIncome[]>([]);
  
  const isSuperAdmin = profile?.role === "super_admin";
  const isContractor = profile?.role === "contractor";

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch overall payment stats from vehicles table
      await fetchOverallStats();
      
      // Fetch contractor-wise income
      await fetchContractorIncome();
      
      // Fetch attendant-wise income
      await fetchAttendantIncome();
      
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      let data, error;
      
      // Use PaymentAPI to get stats
      const { PaymentAPI } = await import('@/services/paymentApi');
      
      if (isContractor && profile?.id) {
        // For contractors, get their contractor ID first
        const { ContractorAPI } = await import('@/services/contractorApi');
        const contractor = await ContractorAPI.getContractorByUserId(profile.id);
        
        if (!contractor) {
          setPaymentStats({
            totalRevenue: 0,
            todayRevenue: 0,
            thisWeekRevenue: 0,
            thisMonthRevenue: 0,
            monthlyRevenue: 0,
            averagePayment: 0,
            paymentMethodBreakdown: { cash: 0, card: 0, digital: 0, free: 0 }
          });
          return;
        }

        // Get payment stats for contractor
        const stats = await PaymentAPI.getPaymentStats(contractor.id);
        setPaymentStats({
          totalRevenue: stats.totalRevenue,
          todayRevenue: stats.todayRevenue,
          thisWeekRevenue: stats.thisWeekRevenue,
          thisMonthRevenue: stats.thisMonthRevenue,
          monthlyRevenue: stats.thisMonthRevenue,
          averagePayment: stats.averagePayment,
          paymentMethodBreakdown: stats.paymentMethodBreakdown
        });
        return;
      } else {
        // For super admin, get all payment stats
        const stats = await PaymentAPI.getPaymentStats();
        setPaymentStats({
          totalRevenue: stats.totalRevenue,
          todayRevenue: stats.todayRevenue,
          thisWeekRevenue: stats.thisWeekRevenue,
          thisMonthRevenue: stats.thisMonthRevenue,
          monthlyRevenue: stats.thisMonthRevenue,
          averagePayment: stats.averagePayment,
          paymentMethodBreakdown: stats.paymentMethodBreakdown
        });
        return;
      }

      if (error) {
        console.error('Error fetching overall stats:', error);
        throw error;
      }

      console.log('Overall stats data:', data);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalRevenue = 0;
      let todayRevenue = 0;
      let thisWeekRevenue = 0;
      let thisMonthRevenue = 0;

      data?.forEach(payment => {
        const amount = payment.amount || 0;
        const createdAt = new Date(payment.created_at);
        
        totalRevenue += amount;
        
        if (createdAt >= today) {
          todayRevenue += amount;
        }
        
        if (createdAt >= weekAgo) {
          thisWeekRevenue += amount;
        }
        
        if (createdAt >= monthStart) {
          thisMonthRevenue += amount;
        }
      });

      setPaymentStats({
        totalRevenue,
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        monthlyRevenue: thisMonthRevenue,
        averagePayment: data?.length ? totalRevenue / data.length : 0,
        paymentMethodBreakdown: {
          cash: 0,
          card: 0,
          digital: 0,
          free: 0
        }
      });
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchContractorIncome = async () => {
    try {
      const { PaymentAPI } = await import('@/services/paymentApi');
      
      if (isContractor && profile?.id) {
        // For contractors, only show their own income
        const { ContractorAPI } = await import('@/services/contractorApi');
        const contractor = await ContractorAPI.getContractorByUserId(profile.id);
        
        if (!contractor) {
          setContractorIncomes([]);
          return;
        }

        // Get contractor payments and calculate income
        const payments = await PaymentAPI.getContractorPayments(contractor.id, { pageSize: 1000 });
        
        const contractorIncome: ContractorIncome = {
          contractor_id: contractor.id,
          contractor_name: contractor.company_name || 'Unknown',
          total_revenue: 0,
          today_revenue: 0,
          this_week_revenue: 0,
          this_month_revenue: 0
        };

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        payments.data.forEach(payment => {
          if (payment.payment_status === 'completed' && payment.amount) {
            const createdAt = new Date(payment.created_at);
            contractorIncome.total_revenue += payment.amount;
            
            if (createdAt.toDateString() === now.toDateString()) {
              contractorIncome.today_revenue += payment.amount;
            }
            if (createdAt >= weekAgo) {
              contractorIncome.this_week_revenue += payment.amount;
            }
            if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
              contractorIncome.this_month_revenue += payment.amount;
            }
          }
        });
        
        setContractorIncomes([contractorIncome]);
      } else {
        // For super admin, show all contractors' income
        const contractorWise = await PaymentAPI.getContractorWisePayments();
        
        const contractorIncomes: ContractorIncome[] = contractorWise.map(item => ({
          contractor_id: item.contractor_id,
          contractor_name: item.contractor_name,
          total_revenue: item.total_revenue,
          today_revenue: 0, // TODO: Calculate from payments if needed
          this_week_revenue: 0, // TODO: Calculate from payments if needed
          this_month_revenue: 0 // TODO: Calculate from payments if needed
        }));
        
        setContractorIncomes(contractorIncomes);
      }
    } catch (error) {
      console.error('Error fetching contractor income:', error);
    }
  };

  const fetchAttendantIncome = async () => {
    try {
      // TODO: Implement attendant-wise payments endpoint in backend
      // For now, set empty array
      setAttendantIncomes([]);
    } catch (error) {
      console.error('Error fetching attendant income:', error);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Income</h1>
          <p className="text-muted-foreground">
            Track revenue and financial performance
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Income Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Revenue"
          value={formatCurrency(paymentStats?.todayRevenue || 0)}
          description="+0% from yesterday"
          icon={Banknote}
          variant="success"
        />
        <MetricCard
          title="This Week"
          value={formatCurrency(paymentStats?.thisWeekRevenue || 0)}
          description="+0% from last week"
          icon={TrendingUp}
          variant="info"
        />
        <MetricCard
          title="This Month"
          value={formatCurrency(paymentStats?.thisMonthRevenue || 0)}
          description="+0% from last month"
          icon={Calendar}
          variant="warning"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(paymentStats?.totalRevenue || 0)}
          description="All time earnings"
          icon={Banknote}
          variant="success"
        />
      </div>

      {/* Income Breakdown Tabs */}
      <Tabs defaultValue="contractors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1">
          <TabsTrigger 
            value="contractors" 
            className="flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            <Building className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Contractor Income</span>
            <span className="sm:hidden">Contractors</span>
          </TabsTrigger>
          <TabsTrigger 
            value="attendants" 
            className="flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Attendant Income</span>
            <span className="sm:hidden">Attendants</span>
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            <BarChart3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contractors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor-wise Income</CardTitle>
              <CardDescription>
                Revenue breakdown by contractor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractorIncomes.length > 0 ? (
                <div className="space-y-4">
                  {contractorIncomes.map((contractor) => (
                    <div key={contractor.contractor_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{contractor.contractor_name}</h3>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(contractor.total_revenue)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Today</p>
                          <p className="font-medium">{formatCurrency(contractor.today_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Week</p>
                          <p className="font-medium">{formatCurrency(contractor.this_week_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Month</p>
                          <p className="font-medium">{formatCurrency(contractor.this_month_revenue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contractor income data</h3>
                  <p className="text-muted-foreground">
                    Contractor income will appear here once payments are recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendant-wise Income</CardTitle>
              <CardDescription>
                Revenue breakdown by attendant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendantIncomes.length > 0 ? (
                <div className="space-y-4">
                  {attendantIncomes.map((attendant) => (
                    <div key={attendant.attendant_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{attendant.attendant_name}</h3>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(attendant.total_revenue)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Today</p>
                          <p className="font-medium">{formatCurrency(attendant.today_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Week</p>
                          <p className="font-medium">{formatCurrency(attendant.this_week_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Month</p>
                          <p className="font-medium">{formatCurrency(attendant.this_month_revenue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No attendant income data</h3>
                  <p className="text-muted-foreground">
                    Attendant income will appear here once payments are recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Visual representation of income over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentStats && paymentStats.totalRevenue > 0 ? (
                <div className="space-y-6">
                  {/* Revenue Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Daily Average</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(paymentStats.totalRevenue / 30)}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Best Day</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(paymentStats.todayRevenue)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Average Transaction</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {formatCurrency(paymentStats.averagePayment)}
                          </p>
                        </div>
                        <Banknote className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Revenue Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Revenue Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Today</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(paymentStats.todayRevenue)}</p>
                          <p className="text-xs text-gray-500">+0% from yesterday</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">This Week</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatCurrency(paymentStats.thisWeekRevenue)}</p>
                          <p className="text-xs text-gray-500">+0% from last week</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">This Month</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{formatCurrency(paymentStats.thisMonthRevenue)}</p>
                          <p className="text-xs text-gray-500">+0% from last month</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="font-medium">All Time</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{formatCurrency(paymentStats.totalRevenue)}</p>
                          <p className="text-xs text-gray-500">Total earnings</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Distribution */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Revenue Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Today</span>
                          <span>{((paymentStats.todayRevenue / paymentStats.totalRevenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(paymentStats.todayRevenue / paymentStats.totalRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>This Week</span>
                          <span>{((paymentStats.thisWeekRevenue / paymentStats.totalRevenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(paymentStats.thisWeekRevenue / paymentStats.totalRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>This Month</span>
                          <span>{((paymentStats.thisMonthRevenue / paymentStats.totalRevenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(paymentStats.thisMonthRevenue / paymentStats.totalRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Revenue Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Revenue charts will appear here once transactions are recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
