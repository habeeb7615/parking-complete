import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Use useMemo to prevent hydration errors - only calculate when dialog is open and data is available
  const calculation = useMemo(() => {
    console.log('CheckoutDialog: Calculation useMemo triggered', { 
      isOpen, 
      vehicle: !!vehicle, 
      contractorRates: !!contractorRates,
      contractorRatesData: contractorRates 
    });
    
    if (!isOpen || !vehicle || !contractorRates) {
      console.log('CheckoutDialog: Missing required data', { 
        isOpen, 
        hasVehicle: !!vehicle, 
        hasContractorRates: !!contractorRates 
      });
      return null;
    }
    
    try {
      const rates = vehicle.vehicle_type === '2-wheeler' 
        ? contractorRates.rates_2wheeler 
        : contractorRates.rates_4wheeler;
      
      console.log('CheckoutDialog: Selected rates', { 
        vehicleType: vehicle.vehicle_type, 
        rates,
        hasRates: !!rates 
      });
      
      if (!rates) {
        console.error('CheckoutDialog: Rates are null or undefined', { 
          vehicleType: vehicle.vehicle_type,
          contractorRates 
        });
        return null;
      }
      
      // Check if rates have required properties
      if (!rates.upTo2Hours && rates.upTo2Hours !== 0) {
        console.error('CheckoutDialog: Rates structure is invalid', rates);
        return null;
      }
      
      // Use Date.now() instead of new Date() to avoid hydration issues
      const currentTime = Date.now();
      const checkOutTime = new Date(currentTime).toISOString();
      
      console.log('CheckoutDialog: Calling calculateParkingFee', {
        checkInTime: vehicle.check_in_time,
        checkOutTime,
        vehicleType: vehicle.vehicle_type
      });
      
      const result = calculateParkingFee(
        vehicle.check_in_time,
        checkOutTime,
        vehicle.vehicle_type,
        rates
      );
      
      console.log('CheckoutDialog: Calculation result', result);
      return result;
    } catch (error) {
      console.error('CheckoutDialog: Error calculating parking fee:', error);
      return null;
    }
  }, [isOpen, vehicle, contractorRates]);

  const handleConfirm = () => {
    console.log('CheckoutDialog: handleConfirm called', { calculation, vehicle, contractorRates });
    
    if (!calculation) {
      console.error('CheckoutDialog: Calculation is null, cannot proceed');
      return;
    }
    
    if (!vehicle) {
      console.error('CheckoutDialog: Vehicle is null, cannot proceed');
      return;
    }
    
    try {
      onConfirm({
        payment_amount: calculation.amount,
        payment_method: paymentMethod
      });
    } catch (error) {
      console.error('CheckoutDialog: Error in handleConfirm', error);
    }
  };

  // Show loading state if calculation is not ready
  if (!vehicle) {
    return null;
  }
  
  if (!contractorRates) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Check Out Vehicle</DialogTitle>
            <DialogDescription>
              Error: Contractor rates not available
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-red-600">
            Unable to calculate parking fee. Please try again.
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!calculation) {
    // Check if it's a data issue or calculation issue
    const hasRates = contractorRates && (
      (vehicle?.vehicle_type === '2-wheeler' && contractorRates.rates_2wheeler) ||
      (vehicle?.vehicle_type === '4-wheeler' && contractorRates.rates_4wheeler)
    );
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Check Out Vehicle</DialogTitle>
            <DialogDescription>
              {hasRates ? 'Calculating parking fee...' : 'Error: Parking rates not configured'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center">
            {hasRates ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-parkflow-blue mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Please wait...</p>
              </>
            ) : (
              <>
                <div className="text-red-600 mb-4">
                  <p className="font-semibold">Unable to calculate parking fee</p>
                  <p className="text-sm mt-2">Parking rates are not configured for this vehicle type.</p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Please contact your contractor to set up parking rates.
                  </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
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
