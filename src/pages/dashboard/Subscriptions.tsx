import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AlertTriangle, Calendar, RefreshCw, Users, MapPin, Loader2 } from "lucide-react";
import { SubscriptionAPI, type SubscriptionPlan } from "@/services/subscriptionApi";
import { ContractorAPI } from "@/services/contractorApi";
import { useToast } from "@/hooks/use-toast";
import { SimpleSubscriptionDashboard } from "@/components/dashboard/SimpleSubscriptionDashboard";

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  // Convert contractors to ComboboxOption format
  const contractorOptions: ComboboxOption[] = contractors.map((contractor) => ({
    value: contractor.user_id,
    label: `${contractor.company_name} - ${contractor.profiles?.user_name || contractor.profiles?.email}`,
    searchableText: `${contractor.company_name} ${contractor.profiles?.user_name || ''} ${contractor.profiles?.email || ''}`.toLowerCase()
  }));

  useEffect(() => {
    // Fetch plans and contractors only for the assign dialog
    const fetchDialogData = async () => {
      try {
        const [plansData, contractorsData] = await Promise.all([
          SubscriptionAPI.getSubscriptionPlans(),
          ContractorAPI.getAllContractors()
        ]);
        setPlans(plansData);
        setContractors(contractorsData);
      } catch (error: any) {
        console.error('Error fetching dialog data:', error);
      }
    };
    fetchDialogData();
  }, []);

  const handleAssignSubscription = async () => {
    if (!selectedContractor || !selectedPlan) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select contractor and plan",
      });
      return;
    }

    setAssigning(true);

    try {
      await SubscriptionAPI.assignSubscription(selectedContractor, selectedPlan, durationDays);
      toast({
        title: "Success",
        description: "Subscription assigned successfully",
      });
      setShowAssignDialog(false);
      fetchData();
    } catch (error: any) {
      // Extract error message properly - handle both ApiError format and generic errors
      let errorMessage = "Failed to assign subscription";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setAssigning(false);
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
            <Button onClick={handleAssignSubscription} className="w-full" disabled={assigning}>
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Subscription"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SimpleSubscriptionDashboard onAssignSubscription={() => setShowAssignDialog(true)} />
    </div>
  );
}
