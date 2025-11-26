import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Clock, Car, Bike } from 'lucide-react';
import { calculateParkingFee, ParkingRates } from '../../utils/parkingCalculator';
import { formatDateTime } from '../../utils/dateUtils';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: '2-wheeler' | '4-wheeler';
  check_in_time: string;
  location?: {
    locations_name: string;
    address: string;
  };
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { payment_amount: number; payment_method: string }) => void;
  vehicle: Vehicle | null;
  contractorRates: {
    rates_2wheeler: ParkingRates;
    rates_4wheeler: ParkingRates;
  } | null;
  loading?: boolean;
}

export function CheckoutDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicle,
  contractorRates,
  loading = false
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    if (vehicle && contractorRates) {
      const rates = vehicle.vehicle_type === '2-wheeler' 
        ? contractorRates.rates_2wheeler 
        : contractorRates.rates_4wheeler;
      
      const calc = calculateParkingFee(
        vehicle.check_in_time,
        new Date().toISOString(),
        vehicle.vehicle_type,
        rates
      );
      setCalculation(calc);
    }
  }, [vehicle, contractorRates]);

  const handleConfirm = () => {
    if (calculation) {
      onConfirm({
        payment_amount: calculation.amount,
        payment_method: paymentMethod
      });
    }
  };

  if (!vehicle || !calculation) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Check Out Vehicle</DialogTitle>
          <DialogDescription>
            Review parking details and complete payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                {vehicle.vehicle_type === '2-wheeler' ? (
                  <Bike className="h-5 w-5" />
                ) : (
                  <Car className="h-5 w-5" />
                )}
                <span>{vehicle.plate_number}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{vehicle.vehicle_type}</span>
                </div>
                {vehicle.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{vehicle.location.locations_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check In:</span>
                  <span className="font-medium">
                    {formatDateTime(vehicle.check_in_time)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration & Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Parking Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-mono text-lg font-bold">
                    {calculation.duration.formatted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="text-sm">{calculation.breakdown}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{calculation.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="digital">Digital Payment</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Confirm Checkout'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
