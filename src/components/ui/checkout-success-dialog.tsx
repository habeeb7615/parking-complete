import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { CheckCircle, Receipt, Clock, Car, Bike } from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: '2-wheeler' | '4-wheeler';
  check_in_time: string;
  check_out_time?: string;
  payment_amount?: number;
  payment_method?: string;
}

interface CheckoutSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  paymentAmount: number;
  paymentMethod: string;
  duration: string;
}

export function CheckoutSuccessDialog({
  isOpen,
  onClose,
  vehicle,
  paymentAmount,
  paymentMethod,
  duration
}: CheckoutSuccessDialogProps) {
  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Checkout Successful
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Message */}
          <p className="text-gray-600 text-center">
            Vehicle <span className="font-bold text-gray-900">**{vehicle.plate_number}**</span> has been checked out.
          </p>

          {/* Separator Line */}
          <div className="border-t border-gray-200"></div>

          {/* Payment Due */}
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Payment Due</div>
            <div className="text-4xl font-bold text-blue-600">
              ₹{paymentAmount.toFixed(2)}
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-4">
            <Button 
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
