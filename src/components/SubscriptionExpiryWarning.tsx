import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkAttendantContractorSubscription, getAttendantExpiryMessage } from '@/utils/subscriptionUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionExpiryWarningProps {
  className?: string;
}

export function SubscriptionExpiryWarning({ className = "" }: SubscriptionExpiryWarningProps) {
  const { profile } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (profile?.role === 'attendant') {
      checkAttendantContractorSubscription(profile.id).then(setSubscriptionStatus);
    }
  }, [profile]);

  // Don't show for non-attendants
  if (profile?.role !== 'attendant' || !subscriptionStatus) {
    return null;
  }

  // Don't show if subscription is active and not expiring soon
  if (!subscriptionStatus.isExpired && !subscriptionStatus.isSuspended && subscriptionStatus.daysRemaining > 7) {
    return null;
  }

  const message = getAttendantExpiryMessage(subscriptionStatus);
  if (!message) {
    return null;
  }

  const isExpired = subscriptionStatus.isExpired || subscriptionStatus.isSuspended;
  const alertVariant = isExpired ? 'destructive' : 'default';

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className={`${alertVariant === 'destructive' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'} ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">
          <strong>
            {isExpired ? 'Contractor Subscription Expired!' : 'Contractor Subscription Expiring Soon!'}
          </strong>
          <br />
          {message}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="ml-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
