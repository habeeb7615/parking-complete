import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, CreditCard, RefreshCw } from "lucide-react";
import { SubscriptionAPI, type SubscriptionDetails } from "@/services/subscriptionApi";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionExpiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
}

export function SubscriptionExpiryDialog({ 
  isOpen, 
  onClose, 
  contractorId 
}: SubscriptionExpiryDialogProps) {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen && contractorId) {
      fetchSubscriptionDetails();
    }
  }, [isOpen, contractorId]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const details = await SubscriptionAPI.getContractorSubscription(contractorId);
      setSubscription(details);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = () => {
    // This would typically redirect to a payment page or contact admin
    window.open('mailto:admin@parkflow.com?subject=Subscription Recharge Request', '_blank');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <RefreshCw className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-parkflow-blue"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!subscription) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              No Subscription Found
            </DialogTitle>
            <DialogDescription>
              No subscription plan has been assigned to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the administrator to assign a subscription plan to your account.
            </p>
            <Button onClick={handleRecharge} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Contact Administrator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(subscription.status)}
            Subscription Status
          </DialogTitle>
          <DialogDescription>
            Your current subscription details and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{subscription.plan_name}</CardTitle>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                {subscription.is_valid ? 'Active subscription' : 'Subscription expired or invalid'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start Date:</span>
                <span>{new Date(subscription.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">End Date:</span>
                <span className={subscription.days_remaining <= 0 ? 'text-red-600 font-medium' : ''}>
                  {new Date(subscription.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className={subscription.days_remaining <= 7 ? 'text-yellow-600 font-medium' : ''}>
                  {Math.max(0, subscription.days_remaining)} days
                </span>
              </div>
            </CardContent>
          </Card>

          {!subscription.is_valid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Access Restricted</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Your subscription has expired. Please recharge to continue using the service.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscription.days_remaining <= 7 && subscription.days_remaining > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Subscription Expiring Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your subscription will expire in {subscription.days_remaining} days. Please recharge to avoid service interruption.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleRecharge} 
              className="flex-1"
              disabled={!subscription.is_valid}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Recharge Now
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
