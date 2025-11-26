import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Eye,
  History,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  SubscriptionDashboardAPI, 
  type ContractorSubscriptionDetails, 
  type PaymentStatistics, 
  type PlanPurchaseStatistics,
  type PaymentDetails,
  type SubscriptionHistory
} from '@/services/subscriptionDashboardApi';
import { formatDate } from '@/utils/dateUtils';

interface SubscriptionManagementDashboardProps {
  onAssignSubscription: () => void;
}

export function SubscriptionManagementDashboard({ onAssignSubscription }: SubscriptionManagementDashboardProps) {
  const [contractorDetails, setContractorDetails] = useState<ContractorSubscriptionDetails[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStatistics | null>(null);
  const [planStats, setPlanStats] = useState<PlanPurchaseStatistics | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<ContractorSubscriptionDetails | null>(null);
  const [contractorPayments, setContractorPayments] = useState<PaymentDetails[]>([]);
  const [contractorHistory, setContractorHistory] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [details, payments, plans] = await Promise.all([
        SubscriptionDashboardAPI.getContractorSubscriptionDetails(),
        SubscriptionDashboardAPI.getPaymentStatistics(),
        SubscriptionDashboardAPI.getPlanPurchaseStatistics()
      ]);
      
      setContractorDetails(details);
      setPaymentStats(payments);
      setPlanStats(plans);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContractorDetails = async (contractor: ContractorSubscriptionDetails) => {
    setSelectedContractor(contractor);
    try {
      const [payments, history] = await Promise.all([
        SubscriptionDashboardAPI.getContractorPaymentDetails(contractor.contractor_id),
        SubscriptionDashboardAPI.getContractorSubscriptionHistory(contractor.contractor_id)
      ]);
      setContractorPayments(payments);
      setContractorHistory(history);
    } catch (error) {
      console.error('Error fetching contractor details:', error);
    }
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'expired') {
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

  const getStatusIcon = (status: string, daysRemaining: number) => {
    if (status === 'expired') {
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
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payment Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats?.today.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats?.today.count || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats?.this_week.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats?.this_week.count || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats?.this_month.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats?.this_month.count || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats?.total.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStats?.total.count || 0} total payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Purchase Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Purchase Statistics</CardTitle>
          <CardDescription>Subscription plan purchases over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{planStats?.today || 0}</div>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{planStats?.this_week || 0}</div>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{planStats?.this_month || 0}</div>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{planStats?.total || 0}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
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
            <Button onClick={onAssignSubscription}>
              <CreditCard className="h-4 w-4 mr-2" />
              Assign Subscription
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractorDetails.map((contractor) => (
                <TableRow key={contractor.contractor_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contractor.company_name}</div>
                      <div className="text-sm text-muted-foreground">{contractor.user_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contractor.current_plan.name}</div>
                      <div className="text-sm text-muted-foreground">${contractor.current_plan.price}/month</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(contractor.subscription_status, contractor.days_remaining)}
                      {getStatusBadge(contractor.subscription_status, contractor.days_remaining)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(contractor.subscription_end_date)}
                  </TableCell>
                  <TableCell>
                    <span className={contractor.days_remaining <= 7 ? 'text-red-500 font-medium' : ''}>
                      {contractor.days_remaining} days
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${contractor.total_payments.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {contractor.subscription_count} purchases
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewContractorDetails(contractor)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{contractor.company_name} - Subscription Details</DialogTitle>
                          <DialogDescription>
                            Complete subscription and payment history
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="payments">Payment History</TabsTrigger>
                            <TabsTrigger value="subscriptions">Subscription History</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Current Subscription</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div><strong>Plan:</strong> {contractor.current_plan.name}</div>
                                    <div><strong>Price:</strong> ${contractor.current_plan.price}/month</div>
                                    <div><strong>Status:</strong> {contractor.subscription_status}</div>
                                    <div><strong>Start Date:</strong> {formatDate(contractor.subscription_start_date)}</div>
                                    <div><strong>End Date:</strong> {formatDate(contractor.subscription_end_date)}</div>
                                    <div><strong>Days Remaining:</strong> {contractor.days_remaining}</div>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Payment Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div><strong>Total Paid:</strong> ${contractor.total_payments.toFixed(2)}</div>
                                    <div><strong>Total Purchases:</strong> {contractor.subscription_count}</div>
                                    <div><strong>Last Payment:</strong> {contractor.last_payment_date ? formatDate(contractor.last_payment_date) : 'N/A'}</div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="payments">
                            <Card>
                              <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Plan</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Method</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Duration</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {contractorPayments.map((payment) => (
                                      <TableRow key={payment.id}>
                                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                        <TableCell>{payment.plan_name}</TableCell>
                                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                        <TableCell>{payment.payment_method}</TableCell>
                                        <TableCell>
                                          <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}>
                                            {payment.payment_status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{payment.duration_days} days</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          </TabsContent>
                          
                          <TabsContent value="subscriptions">
                            <Card>
                              <CardHeader>
                                <CardTitle>Subscription History</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Action</TableHead>
                                      <TableHead>Plan</TableHead>
                                      <TableHead>Previous Plan</TableHead>
                                      <TableHead>Duration</TableHead>
                                      <TableHead>Amount</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {contractorHistory.map((history) => (
                                      <TableRow key={history.id}>
                                        <TableCell>{formatDate(history.created_on)}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{history.action}</Badge>
                                        </TableCell>
                                        <TableCell>{history.plan_name}</TableCell>
                                        <TableCell>{history.previous_plan_name || 'N/A'}</TableCell>
                                        <TableCell>{history.duration_days} days</TableCell>
                                        <TableCell>${history.amount_paid.toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
