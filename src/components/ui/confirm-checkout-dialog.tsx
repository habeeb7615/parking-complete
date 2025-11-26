import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Car, Bike } from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: '2-wheeler' | '4-wheeler';
  check_in_time: string;
}

interface ConfirmCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicle: Vehicle | null;
}

export function ConfirmCheckoutDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicle
}: ConfirmCheckoutDialogProps) {
  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Confirm Vehicle Check-out
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to check out the vehicle with plate number{' '}
            <span className="font-bold text-gray-900">**{vehicle.plate_number}**</span>?
          </p>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {vehicle.vehicle_type === '2-wheeler' ? (
              <Bike className="h-5 w-5 text-gray-600" />
            ) : (
              <Car className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <div className="font-medium text-gray-900">{vehicle.plate_number}</div>
              <div className="text-sm text-gray-600">
                {vehicle.vehicle_type === '2-wheeler' ? '2 Wheeler' : '4 Wheeler'}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Check-out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
