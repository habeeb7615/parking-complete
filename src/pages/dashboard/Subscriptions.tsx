import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AlertTriangle, Calendar, RefreshCw, Users, MapPin } from "lucide-react";
import { SubscriptionAPI, type SubscriptionPlan } from "@/services/subscriptionApi";
import { ContractorAPI } from "@/services/contractorApi";
import { useToast } from "@/hooks/use-toast";
import { SimpleSubscriptionDashboard } from "@/components/dashboard/SimpleSubscriptionDashboard";

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([]);
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(30);
  const { toast } = useToast();

  // Convert contractors to ComboboxOption format
  const contractorOptions: ComboboxOption[] = contractors.map((contractor) => ({
    value: contractor.user_id,
    label: `${contractor.company_name} - ${contractor.profiles?.user_name || contractor.profiles?.email}`,
    searchableText: `${contractor.company_name} ${contractor.profiles?.user_name || ''} ${contractor.profiles?.email || ''}`.toLowerCase()
  }));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching subscription data...');
      
      // Fetch data with individual error handling
      let plansData = [];
      let contractorsData = [];
      let expiringData = [];
      let expiredData = [];

      try {
        console.log('Fetching subscription plans...');
        plansData = await SubscriptionAPI.getSubscriptionPlans();
        console.log('Plans data received:', plansData);
        console.log('Plans count:', plansData?.length || 0);
      } catch (error) {
        console.error('Error fetching plans:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch subscription plans: ${error.message}`,
        });
      }

      try {
        contractorsData = await ContractorAPI.getAllContractors();
        console.log('Contractors data:', contractorsData);
      } catch (error) {
        console.error('Error fetching contractors:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch contractors",
        });
      }

      try {
        expiringData = await SubscriptionAPI.getExpiringSubscriptions(7);
        console.log('Expiring data:', expiringData);
      } catch (error) {
        console.error('Error fetching expiring subscriptions:', error);
      }

      try {
        expiredData = await SubscriptionAPI.getExpiredSubscriptions();
        console.log('Expired data:', expiredData);
      } catch (error) {
        console.error('Error fetching expired subscriptions:', error);
      }
      
      setPlans(plansData);
      setContractors(contractorsData);
      setExpiringSubscriptions(expiringData);
      setExpiredSubscriptions(expiredData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedContractor || !selectedPlan) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select contractor and plan",
      });
      return;
    }

    console.log('🔍 UI Assignment starting...');
    console.log('  selectedContractor:', selectedContractor);
    console.log('  selectedPlan:', selectedPlan);
    console.log('  durationDays:', durationDays);

    try {
      await SubscriptionAPI.assignSubscription(selectedContractor, selectedPlan, durationDays);
      console.log('✅ UI Assignment successful');
      toast({
        title: "Success",
        description: "Subscription assigned successfully",
      });
      setShowAssignDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('❌ UI Assignment failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign subscription",
      });
    }
  };

  const handleExtendSubscription = async (contractorId: string) => {
    try {
      await SubscriptionAPI.extendSubscription(contractorId, extendDays);
      toast({
        title: "Success",
        description: `Subscription extended for ${extendDays} days. Start date reset to current time.`,
      });
      setShowExtendDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to extend subscription",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Assign Subscription Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subscription</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to a contractor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractor">Select Contractor</Label>
              <Combobox
                options={contractorOptions}
                value={selectedContractor}
                onValueChange={setSelectedContractor}
                placeholder="Search and select a contractor..."
                emptyText="No contractors found"
              />
            </div>
            <div>
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select value={selectedPlan} onValueChange={(planId) => {
                setSelectedPlan(planId);
                // Automatically set duration days from selected plan
                const selectedPlanData = plans.find(p => p.id === planId);
                if (selectedPlanData) {
                  const planDays = selectedPlanData.days || selectedPlanData.duration_days || 30;
                  setDurationDays(planDays);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price} ({plan.days || plan.duration_days || 30} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (Days)</Label>
              <Input
                id="duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                min="1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Duration will be automatically set from the selected plan. You can modify it if needed.
              </div>
            </div>
            <Button onClick={handleAssignSubscription} className="w-full">
              Assign Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SimpleSubscriptionDashboard onAssignSubscription={() => setShowAssignDialog(true)} />
    </div>
  );
}
