import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Trash2,
  Save,
  X,
  CalendarPlus,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ContractorAPI } from '@/services/contractorApi';
// We use ContractorAPI which already returns subscription fields in profiles join
import { SubscriptionAPI } from '@/services/subscriptionApi';
import { SubscriptionDashboardAPI } from '@/services/subscriptionDashboardApi';
import { formatDate } from '@/utils/dateUtils';

interface SimpleSubscriptionDashboardProps {
  onAssignSubscription: () => void;
}

export function SimpleSubscriptionDashboard({ onAssignSubscription }: SimpleSubscriptionDashboardProps) {
  const [allContractors, setAllContractors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Plan editing states
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    days: 0,
    features: {} as any
  });
  
  // Extend subscription states
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [contractorToExtend, setContractorToExtend] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [extendMode, setExtendMode] = useState<'extend' | 'change'>('extend');
  
  // Subscription history states
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [selectedContractorHistory, setSelectedContractorHistory] = useState<any>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // History pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  
  // Unassign subscription states
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [contractorToUnassign, setContractorToUnassign] = useState<any | null>(null);
  const [unassigning, setUnassigning] = useState(false);
  
  const { toast } = useToast();


  // Force refresh on component mount to avoid cache issues
  useEffect(() => {
    fetchData(true);
  }, []);


  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Clear existing data first for force refresh
      if (forceRefresh) {
        setAllContractors([]);
        setContractors([]);
      }
      
      const [contractorsData, plansData] = await Promise.all([
        ContractorAPI.getAllContractors(),
        SubscriptionAPI.getSubscriptionPlans()
      ]);
      
      // Save all and compute initial page
      setAllContractors(contractorsData || []);
      setPlans(plansData);
      
      // Force re-render by updating a dummy state
      if (forceRefresh) {
        setPage(prev => prev + 0.001); // Trigger re-render
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      // Set empty arrays on error to prevent infinite loading
      setAllContractors([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // derive filtered + paginated contractors whenever inputs change
  useEffect(() => {
    const lower = search.trim().toLowerCase();
    let filtered = allContractors;
    if (lower) {
      filtered = filtered.filter((c: any) => {
        const company = c.company_name || '';
        const name = c.profiles?.user_name || '';
        const email = c.profiles?.email || '';
        return (
          company.toLowerCase().includes(lower) ||
          name.toLowerCase().includes(lower) ||
          email.toLowerCase().includes(lower)
        );
      });
    }
    // Only those who have a subscription
    const withSubs = filtered.filter((c: any) => c.profiles?.subscription_plan_id);
    const total = withSubs.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    setTotalPages(pages);
    const currentPage = Math.min(page, pages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setContractors(withSubs.slice(start, end));
    if (currentPage !== page) setPage(currentPage);
  }, [allContractors, search, page, pageSize]);

  const getStatusBadge = (subscription: any) => {
    if (!subscription) return <Badge variant="secondary">No Subscription</Badge>;
    
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // First check if subscription is actually expired (either by status or by date)
    if (subscription.subscription_status === 'expired' || daysRemaining <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (daysRemaining <= 7) {
      return <Badge variant="destructive">Expiring Soon</Badge>;
    }
    if (daysRemaining <= 30) {
      return <Badge variant="secondary">Expires Soon</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getStatusIcon = (subscription: any) => {
    if (!subscription) return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // First check if subscription is actually expired (either by status or by date)
    if (subscription.subscription_status === 'expired' || daysRemaining <= 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (daysRemaining <= 7) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (daysRemaining <= 30) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getDaysRemaining = (subscription: any) => {
    if (!subscription) return 'N/A';
    
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysRemaining > 0 ? `${daysRemaining} days` : 'Expired';
  };

  // Helper function to get raw days remaining for conditional logic
  const getDaysRemainingNumber = (subscription: any) => {
    if (!subscription || !subscription.subscription_end_date) return 0;
    
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysRemaining;
  };

  const isSubscriptionExpiring = (subscription: any) => {
    if (!subscription || !subscription.subscription_end_date) {
      return false;
    }
    
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show extend button for subscriptions that are expiring (≤30 days) OR already expired
    return daysRemaining <= 30;
  };

  const contractorsWithSubscriptions = contractors.filter(contractor => 
    contractor.profiles?.subscription_plan_id
  );

  // Plan editing functions
  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      days: plan.days || plan.duration_days || 30,
      features: plan.features || {}
    });
    setShowEditDialog(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      price: 0,
      days: 30,
      features: {}
    });
    setShowCreateDialog(true);
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        // Update existing plan
        await SubscriptionAPI.updateSubscriptionPlan(editingPlan.id, {
          name: planForm.name,
          price: planForm.price,
          days: planForm.days,
          features: planForm.features
        });
        toast({
          title: "Success",
          description: "Plan updated successfully"
        });
      } else {
        // Create new plan
        await SubscriptionAPI.createSubscriptionPlan({
          name: planForm.name,
          price: planForm.price,
          days: planForm.days,
          features: planForm.features
        });
        toast({
          title: "Success",
          description: "Plan created successfully"
        });
      }
      
      // Refresh plans
      await fetchData();
      setShowEditDialog(false);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save plan"
      });
    }
  };

  const handleDeletePlan = (plan: any) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      await SubscriptionAPI.deleteSubscriptionPlan(planToDelete.id);
      toast({
        title: "Success",
        description: "Plan deleted successfully"
      });
      await fetchData();
      setShowDeleteDialog(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete plan"
      });
    }
  };

  // Extend subscription functions
  const handleExtendSubscription = (contractor: any) => {
    setContractorToExtend(contractor);
    setExtendDays(30);
    setSelectedPlanId(contractor.profiles?.subscription_plan_id || '');
    setExtendMode('extend'); // Default to extend mode
    setShowExtendDialog(true);
  };

  const handleUnassignSubscription = (contractor: any) => {
    setContractorToUnassign(contractor);
    setShowUnassignDialog(true);
  };

  const confirmUnassignSubscription = async () => {
    if (!contractorToUnassign || unassigning) {
      return;
    }

    setUnassigning(true);
    try {
      await SubscriptionAPI.unassignSubscription(contractorToUnassign.user_id);
      toast({
        title: "Success",
        description: `Subscription unassigned successfully for ${contractorToUnassign.company_name}`,
      });
      // Close modal only on success
      setShowUnassignDialog(false);
      setContractorToUnassign(null);
      // Refresh data after unassign
      setTimeout(async () => {
        await fetchData(true);
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to unassign subscription",
      });
      // On error, keep modal open (don't close it)
    } finally {
      // Always reset loading state to prevent UI from getting stuck
      setUnassigning(false);
    }
  };

  const confirmExtendSubscription = async () => {
    
    if (!contractorToExtend) {
      console.error('❌ No contractor selected for extension');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No contractor selected for extension",
      });
      return;
    }
    
    if (extendMode === 'change' && !selectedPlanId) {
      console.error('❌ No plan selected for change');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a plan to change to",
      });
      return;
    }
    
    try {
      if (extendMode === 'extend') {
        await SubscriptionAPI.extendSubscription(contractorToExtend.user_id, extendDays);
        
        // Update local state immediately
        const now = new Date();
        const newEndDate = new Date(now.getTime() + (extendDays * 24 * 60 * 60 * 1000));
        
        setAllContractors(prev => prev.map(contractor => {
          if (contractor.user_id === contractorToExtend.user_id) {
            return {
              ...contractor,
              profiles: {
                ...contractor.profiles,
                subscription_start_date: now.toISOString(),
                subscription_end_date: newEndDate.toISOString(),
                subscription_status: 'active'
              }
            };
          }
          return contractor;
        }));
        
        toast({
          title: "Success",
          description: `Subscription extended for ${extendDays} days. Start date reset to current time.`,
        });
      } else {
        await SubscriptionAPI.assignSubscription(contractorToExtend.user_id, selectedPlanId, extendDays);
        
        // Update local state immediately
        const now = new Date();
        const newEndDate = new Date(now.getTime() + (extendDays * 24 * 60 * 60 * 1000));
        
        setAllContractors(prev => prev.map(contractor => {
          if (contractor.user_id === contractorToExtend.user_id) {
            return {
              ...contractor,
              profiles: {
                ...contractor.profiles,
                subscription_plan_id: selectedPlanId,
                subscription_start_date: now.toISOString(),
                subscription_end_date: newEndDate.toISOString(),
                subscription_status: 'active'
              }
            };
          }
          return contractor;
        }));
        
        toast({
          title: "Success",
          description: `Subscription plan changed and extended for ${extendDays} days.`,
        });
      }
      
      setShowExtendDialog(false);
      setContractorToExtend(null);
      setSelectedPlanId('');
      setExtendMode('extend');
      
      // Force refresh with delay to ensure database is updated
      setTimeout(async () => {
        await fetchData(true);
      }, 1000); // 1 second delay
    } catch (error: any) {
      console.error('❌ Error processing subscription:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process subscription",
      });
    }
  };

  // Calculate subscription status counts correctly
  const activeSubscriptions = contractorsWithSubscriptions.filter(contractor => {
    if (!contractor.profiles?.subscription_end_date) return false;
    const endDate = new Date(contractor.profiles.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return contractor.profiles?.subscription_status === 'active' && daysRemaining > 0;
  });

  const expiringSubscriptions = contractorsWithSubscriptions.filter(contractor => {
    if (!contractor.profiles?.subscription_end_date) return false;
    const endDate = new Date(contractor.profiles.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 7 && daysRemaining > 0;
  });

  const expiredSubscriptions = contractorsWithSubscriptions.filter(contractor => {
    if (!contractor.profiles?.subscription_end_date) return false;
    const endDate = new Date(contractor.profiles.subscription_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return contractor.profiles?.subscription_status === 'expired' || daysRemaining <= 0;
  });

  // Calculate financial summaries
  const totalPlanAmount = contractorsWithSubscriptions.reduce((total, contractor) => {
    const planPrice = contractor.profiles?.subscription_plan_id ? 
      plans.find(plan => plan.id === contractor.profiles.subscription_plan_id)?.price || 0 : 0;
    return total + planPrice;
  }, 0);

  // Financial data state
  const [financialData, setFinancialData] = useState({
    todayAssignments: 0,
    todayRevenue: 0,
    last7DaysRevenue: 0,
    lastMonthRevenue: 0
  });

  // Calculate financial data from current subscriptions (faster)
  useEffect(() => {
    if (contractorsWithSubscriptions.length > 0 && plans.length > 0) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todayAssignments = contractorsWithSubscriptions.filter(contractor => {
        const startDate = new Date(contractor.profiles?.subscription_start_date || '');
        return startDate >= todayStart;
      }).length;

      const todayRevenue = contractorsWithSubscriptions.reduce((total, contractor) => {
        const startDate = new Date(contractor.profiles?.subscription_start_date || '');
        if (startDate >= todayStart) {
          const planPrice = contractor.profiles?.subscription_plan_id ? 
            plans.find(plan => plan.id === contractor.profiles.subscription_plan_id)?.price || 0 : 0;
          return total + planPrice;
        }
        return total;
      }, 0);

      const calculatedData = {
        todayAssignments,
        todayRevenue,
        last7DaysRevenue: todayRevenue * 2, // Mock calculation
        lastMonthRevenue: todayRevenue * 4 // Mock calculation
      };
      
      setFinancialData(calculatedData);
    }
  }, [contractorsWithSubscriptions, plans]);

  const { todayAssignments, todayRevenue, last7DaysRevenue, lastMonthRevenue } = financialData;

  // Fetch subscription history for a contractor
  const fetchContractorHistory = async (contractorId: string, page: number = 1, pageSize?: number) => {
    try {
      setHistoryLoading(true);
      const currentPageSize = pageSize || historyPageSize;
      const history = await SubscriptionDashboardAPI.getContractorSubscriptionHistory(contractorId);
      
      // Calculate pagination
      const totalItems = history.length;
      const totalPages = Math.ceil(totalItems / currentPageSize);
      const startIndex = (page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      const paginatedHistory = history.slice(startIndex, endIndex);
      
      setSubscriptionHistory(paginatedHistory);
      setHistoryTotalPages(totalPages);
      setHistoryPage(page);
      if (pageSize) {
        setHistoryPageSize(pageSize);
      }
      setSelectedContractorHistory(contractors.find(c => c.user_id === contractorId));
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('❌ Error fetching subscription history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription history",
      });
    } finally {
      setHistoryLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Contractors"
          value={contractors.length.toString()}
          description="Registered contractors"
          icon={Users}
          variant="info"
        />

        <MetricCard
          title="Active Subscriptions"
          value={activeSubscriptions.length.toString()}
          description="Currently active"
          icon={CheckCircle}
          variant="success"
        />

        <MetricCard
          title="Expiring Soon"
          value={expiringSubscriptions.length.toString()}
          description="Next 7 days"
          icon={AlertTriangle}
          variant="warning"
        />

        <MetricCard
          title="Expired Subscriptions"
          value={expiredSubscriptions.length.toString()}
          description="Need renewal"
          icon={X}
          variant="danger"
        />

        <MetricCard
          title="Available Plans"
          value={plans.length.toString()}
          description="Subscription plans"
          icon={CreditCard}
          variant="default"
        />
      </div>

      {/* Financial Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Plan Value"
          value={`₹${totalPlanAmount}`}
          description="All active plans"
          icon={CreditCard}
          variant="success"
        />

        <MetricCard
          title="Today's Assignments"
          value={todayAssignments.toString()}
          description="Plans assigned today"
          icon={CalendarPlus}
          variant="info"
        />

        <MetricCard
          title="Today's Revenue"
          value={`₹${todayRevenue}`}
          description="Revenue today"
          icon={CreditCard}
          variant="success"
        />

        <MetricCard
          title="Last 7 Days"
          value={`₹${last7DaysRevenue}`}
          description="Weekly revenue"
          icon={TrendingUp}
          variant="warning"
        />

        <MetricCard
          title="Last Month"
          value={`₹${lastMonthRevenue}`}
          description="Monthly revenue"
          icon={Calendar}
          variant="info"
        />
      </div> */}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Subscription Plans</CardTitle>
              <CardDescription>Current subscription plans available for assignment</CardDescription>
            </div>
            <Button onClick={handleCreatePlan} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No subscription plans found</h3>
              <p className="text-muted-foreground">
                Please check if the database migration has been applied
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4 relative group hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">₹{plan.price}</span>
                      {/* Edit/Delete buttons - always visible */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPlan(plan)}
                          className="h-7 w-7 p-0 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                          title="Edit Plan"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePlan(plan)}
                          className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          title="Delete Plan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {plan.days || plan.duration_days || 30} days
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contractor Subscriptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contractor Subscriptions</CardTitle>
              <CardDescription>All contractor subscription details and status</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Search contractors..."
                className="h-9 w-56 rounded-md border px-3 text-sm"
              />
              <select
                value={pageSize}
                onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                className="h-9 rounded-md border px-2 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <Button onClick={onAssignSubscription}>
                <CreditCard className="h-4 w-4 mr-2" />
                Assign Subscription
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contractorsWithSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contractor subscriptions found</h3>
              <p className="text-muted-foreground mb-4">
                No contractors have active subscriptions yet
              </p>
              <Button onClick={onAssignSubscription}>
                <CreditCard className="h-4 w-4 mr-2" />
                Assign First Subscription
              </Button>
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Current Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractorsWithSubscriptions.map((contractor) => {
                  return (
                  <TableRow key={contractor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contractor.company_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contractor.profiles?.user_name || contractor.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contractor.profiles?.subscription_plans?.name || 'Unknown Plan'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ₹{contractor.profiles?.subscription_plans?.price || 0}/month
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contractor.profiles)}
                        {getStatusBadge(contractor.profiles)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contractor.profiles?.subscription_end_date 
                        ? formatDate(contractor.profiles.subscription_end_date)
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <span className={
                        getDaysRemaining(contractor.profiles).includes('Expired') || 
                        getDaysRemaining(contractor.profiles).includes('7 days') ||
                        getDaysRemaining(contractor.profiles).includes('6 days') ||
                        getDaysRemaining(contractor.profiles).includes('5 days') ||
                        getDaysRemaining(contractor.profiles).includes('4 days') ||
                        getDaysRemaining(contractor.profiles).includes('3 days') ||
                        getDaysRemaining(contractor.profiles).includes('2 days') ||
                        getDaysRemaining(contractor.profiles).includes('1 days')
                          ? 'text-red-500 font-medium' 
                          : ''
                      }>
                        {getDaysRemaining(contractor.profiles)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHistoryPage(1);
                            setHistoryPageSize(5);
                            fetchContractorHistory(contractor.user_id, 1);
                          }}
                          disabled={historyLoading}
                        >
                          {historyLoading ? 'Loading...' : 'History'}
                        </Button>
                        {(() => {
                          const daysRemaining = getDaysRemainingNumber(contractor.profiles);
                          const isExpired = daysRemaining <= 0;
                          const isExpiring = isSubscriptionExpiring(contractor.profiles);
                          const hasSubscription = contractor.profiles?.subscription_plan_id;
                          
                          // Show button for all contractors with subscriptions
                          if (!hasSubscription) return null;
                          
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExtendSubscription(contractor)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-500 hover:text-blue-700"
                                >
                                  <CalendarPlus className="h-4 w-4 mr-1" />
                                  {isExpired ? 'Renew' : 'Extend'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {isExpired 
                                    ? 'Renew expired subscription for' 
                                    : 'Extend subscription for'
                                  } {contractor.company_name}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassignSubscription(contractor)}
                          className="text-red-600 border-red-300 hover:bg-red-100 hover:border-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Unassign
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>


      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the details of this subscription plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={planForm.name}
                onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter plan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-price">Price (₹)</Label>
              <Input
                id="plan-price"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="Enter price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-days">Days</Label>
              <Input
                id="plan-days"
                type="number"
                value={planForm.days}
                onChange={(e) => setPlanForm(prev => ({ ...prev, days: Number(e.target.value) }))}
                placeholder="Enter number of days"
                min="1"
              />
              <div className="text-xs text-muted-foreground">
                Number of days the subscription plan will be valid for when assigned
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subscription Plan</DialogTitle>
            <DialogDescription>
              Add a new subscription plan to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-plan-name">Plan Name</Label>
              <Input
                id="new-plan-name"
                value={planForm.name}
                onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter plan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan-price">Price (₹)</Label>
              <Input
                id="new-plan-price"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="Enter price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan-days">Days</Label>
              <Input
                id="new-plan-days"
                type="number"
                value={planForm.days}
                onChange={(e) => setPlanForm(prev => ({ ...prev, days: Number(e.target.value) }))}
                placeholder="Enter number of days"
                min="1"
              />
              <div className="text-xs text-muted-foreground">
                Number of days the subscription plan will be valid for when assigned
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Subscription Plan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete the <strong>"{planToDelete?.name}"</strong> plan?
              <br /><br />
              This action cannot be undone. The plan will be permanently removed from the system.
              <br /><br />
              <span className="text-red-600 font-medium">
                ⚠️ This may affect contractors who are currently using this plan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlan}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
              {extendMode === 'extend' ? 'Extend Subscription' : 'Change Plan & Extend'}
            </DialogTitle>
            <DialogDescription>
              {extendMode === 'extend' 
                ? `Extend the subscription for ${contractorToExtend?.company_name || 'this contractor'}`
                : `Change plan and extend subscription for ${contractorToExtend?.company_name || 'this contractor'}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {contractorToExtend && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Contractor Details</div>
                <div className="font-medium">{contractorToExtend.company_name}</div>
                <div className="text-sm text-muted-foreground">
                  {contractorToExtend.profiles?.user_name || contractorToExtend.profiles?.email}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current Plan: {contractorToExtend.profiles?.subscription_plans?.name || 'Unknown Plan'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires: {contractorToExtend.profiles?.subscription_end_date 
                    ? formatDate(contractorToExtend.profiles.subscription_end_date)
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Days Remaining: {getDaysRemaining(contractorToExtend.profiles)}
                </div>
              </div>
            )}
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Action Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="extendMode"
                    value="extend"
                    checked={extendMode === 'extend'}
                    onChange={(e) => setExtendMode(e.target.value as 'extend' | 'change')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Extend Current Plan</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="extendMode"
                    value="change"
                    checked={extendMode === 'change'}
                    onChange={(e) => setExtendMode(e.target.value as 'extend' | 'change')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Change Plan & Extend</span>
                </label>
              </div>
            </div>

            {/* Plan Selection (only show when changing plan) */}
            {extendMode === 'change' && (
              <div className="space-y-2">
                <Label htmlFor="plan-select">Select New Plan</Label>
                <Select value={selectedPlanId} onValueChange={(planId) => {
                  setSelectedPlanId(planId);
                  // Automatically set extension days from selected plan
                  const selectedPlanData = plans.find(p => p.id === planId);
                  if (selectedPlanData) {
                    const planDays = selectedPlanData.days || selectedPlanData.duration_days || 30;
                    setExtendDays(planDays);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price} ({plan.days || plan.duration_days || 30} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Select the new plan to assign to this contractor. Duration will be automatically set from the plan.
                </div>
              </div>
            )}

            {/* Extension Period */}
            <div className="space-y-2">
              <Label htmlFor="extend-days">Extension Period (Days)</Label>
              <Input
                id="extend-days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                min="1"
                max="365"
                placeholder="Enter number of days to extend"
              />
              <div className="text-xs text-muted-foreground">
                {extendMode === 'extend' 
                  ? 'The subscription will be extended from the current end date'
                  : 'The new plan will be assigned and extended for the specified days'
                }
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  confirmExtendSubscription();
                }}
                disabled={!contractorToExtend || extendDays <= 0 || (extendMode === 'change' && !selectedPlanId)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                {extendMode === 'extend' ? 'Extend Subscription' : 'Change Plan & Extend'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unassign Subscription Dialog */}
      <AlertDialog 
        open={showUnassignDialog} 
        onOpenChange={(open) => {
          // Prevent closing modal during unassigning
          if (!open && !unassigning) {
            setShowUnassignDialog(false);
            setContractorToUnassign(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign the subscription from {contractorToUnassign?.company_name}? 
              This action will remove their current subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassigning}>Cancel</AlertDialogCancel>
            <Button
              onClick={confirmUnassignSubscription}
              disabled={unassigning}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {unassigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unassigning...
                </>
              ) : (
                'Unassign'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription History</DialogTitle>
            <DialogDescription>
              Complete subscription timeline for {selectedContractorHistory?.company_name}
            </DialogDescription>
          </DialogHeader>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading history...</span>
            </div>
          ) : subscriptionHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscription history found for this contractor.
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptionHistory.map((history, index) => {
                // Calculate duration in days
                const startDate = new Date(history.start_date);
                const endDate = new Date(history.end_date);
                const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={history.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            history.action === 'assigned' ? 'default' :
                            history.action === 'extended' ? 'secondary' :
                            history.action === 'unassigned' ? 'destructive' : 'outline'
                          }>
                            {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                          </Badge>
                          <span className="font-medium">{history.plan_name}</span>
                          <Badge variant={history.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                            {history.status}
                          </Badge>
                        </div>
                        
                        {history.notes && (
                          <div className="mb-3 text-sm text-muted-foreground italic">
                            {history.notes}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-muted-foreground">Start Date</div>
                            <div>{formatDate(history.start_date)}</div>
                          </div>
                          <div>
                            <div className="font-medium text-muted-foreground">End Date</div>
                            <div>{formatDate(history.end_date)}</div>
                          </div>
                          <div>
                            <div className="font-medium text-muted-foreground">Duration</div>
                            <div>{durationDays} days</div>
                          </div>
                          <div>
                            <div className="font-medium text-muted-foreground">Plan Price</div>
                            <div className="font-semibold text-green-600">₹{history.plan_price}</div>
                          </div>
                        </div>
                        
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{formatDate(history.created_at)}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {/* Pagination Controls */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <select
                      value={historyPageSize}
                      onChange={(e) => {
                        const newPageSize = Number(e.target.value);
                        fetchContractorHistory(selectedContractorHistory?.user_id, 1, newPageSize);
                      }}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchContractorHistory(selectedContractorHistory?.user_id, historyPage - 1, historyPageSize)}
                      disabled={historyPage <= 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(historyTotalPages - 4, historyPage - 2)) + i;
                        if (pageNum > historyTotalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === historyPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => fetchContractorHistory(selectedContractorHistory?.user_id, pageNum, historyPageSize)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchContractorHistory(selectedContractorHistory?.user_id, historyPage + 1, historyPageSize)}
                      disabled={historyPage >= historyTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
