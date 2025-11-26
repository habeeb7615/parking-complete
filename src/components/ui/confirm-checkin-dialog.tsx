import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Car, Bike } from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: '2-wheeler' | '4-wheeler';
  mobile_number?: string;
  location?: {
    locations_name: string;
    address: string;
  };
}

interface ConfirmCheckinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicle: Vehicle | null;
  loading?: boolean;
}

export function ConfirmCheckinDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicle,
  loading = false
}: ConfirmCheckinDialogProps) {
  if (!vehicle) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Confirm Vehicle Check-in</DialogTitle>
          <DialogDescription>
            Please confirm the vehicle details are correct to avoid errors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {vehicle.vehicle_type === '2-wheeler' ? (
                <Bike className="h-8 w-8 text-blue-600" />
              ) : (
                <Car className="h-8 w-8 text-blue-600" />
              )}
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Plate Number: {vehicle.plate_number}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Vehicle Type: {vehicle.vehicle_type === '2-wheeler' ? '2 Wheeler' : '4 Wheeler'}
                </div>
                {vehicle.mobile_number && (
                  <div className="text-sm text-gray-600">
                    Mobile: {vehicle.mobile_number}
                  </div>
                )}
                {vehicle.location && (
                  <div className="text-sm text-gray-600">
                    Location: {vehicle.location.locations_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Processing...
                </>
              ) : (
                'Confirm Check-in'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
