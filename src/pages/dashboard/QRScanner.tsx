import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Camera, CheckCircle, XCircle, AlertTriangle, Car, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VehicleAPI } from "@/services/vehicleApi";
import { AttendantAPI } from "@/services/attendantApi";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/utils/dateUtils";
import { checkAttendantContractorSubscription } from "@/utils/subscriptionUtils";

interface QRData {
  type: 'vehicle_entry' | 'vehicle_exit';
  plate_number?: string;
  vehicle_type?: string;
  location_id?: string;
  vehicle_id?: string;
  timestamp: string;
}

export default function QRScanner() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);

  // Check if user is attendant
  if (profile?.role !== 'attendant') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-muted-foreground">Only attendants can access the QR Scanner.</p>
      </div>
    );
  }

  // Check subscription status for attendants (non-blocking)
  useEffect(() => {
    if (profile?.role === 'attendant' && profile?.id) {
      // Run subscription check in background without blocking page load
      checkAttendantContractorSubscription(profile.id)
        .then((status) => {
          console.log('Subscription status for attendant (QRScanner):', status);
          if (status.isExpired || status.isSuspended) {
            setSubscriptionBlocked(true);
            toast({
              variant: "destructive",
              title: "Access Blocked",
              description: "Your contractor's subscription has expired. Please contact your contractor to recharge.",
            });
          }
        })
        .catch((error) => {
          console.error('Error checking subscription status (QRScanner):', error);
          // Don't block access if there's an error checking subscription
        });
    }
  }, [profile, toast]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const processQRCode = (qrData: string) => {
    try {
      const data: QRData = JSON.parse(qrData);
      setScannedData(data);
      setShowResult(true);
      stopCamera();
    } catch (error) {
      console.error('Error parsing QR code:', error);
      toast({
        variant: "destructive",
        title: "Invalid QR Code",
        description: "The scanned QR code is not valid.",
      });
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a valid QR code data.",
      });
      return;
    }

    processQRCode(manualInput);
  };

  const handleVehicleAction = async () => {
    if (!scannedData || !user?.id) return;

    setLoading(true);
    try {
      if (scannedData.type === 'vehicle_entry') {
        // Handle vehicle check-in
        const vehicleData = {
          plate_number: scannedData.plate_number!,
          vehicle_type: scannedData.vehicle_type as '2-wheeler' | '4-wheeler',
          location_id: scannedData.location_id!,
          contractor_id: '', // Will be filled by the API
        };

        await VehicleAPI.checkInVehicle(vehicleData);
        toast({
          title: "Vehicle Checked In",
          description: `Vehicle ${scannedData.plate_number} has been checked in successfully.`,
        });
      } else if (scannedData.type === 'vehicle_exit') {
        // Handle vehicle check-out
        const checkoutData = {
          check_out_time: new Date().toISOString(),
          payment_amount: 0, // Will be calculated by the API
          payment_method: 'cash' as const,
        };

        await VehicleAPI.checkoutVehicle(scannedData.vehicle_id!, checkoutData);
        toast({
          title: "Vehicle Checked Out",
          description: `Vehicle has been checked out successfully.`,
        });
      }

      setShowResult(false);
      setScannedData(null);
    } catch (error: any) {
      console.error('Error processing vehicle action:', error);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message || "Failed to process vehicle action.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setShowResult(false);
    setScannedData(null);
    setManualInput("");
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Block access if subscription is expired
  if (subscriptionBlocked) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Blocked</h2>
          <p className="text-muted-foreground mb-4">
            Your contractor's subscription has expired. Please contact your contractor to recharge.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Scanner</h1>
          <p className="text-muted-foreground">
            Scan vehicle QR codes for check-in and check-out
          </p>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Camera Scanner</span>
            </CardTitle>
            <CardDescription>
              Use your device camera to scan QR codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Click to start camera scanning
                </p>
                <Button onClick={startCamera} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                </div>
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Manual Input</span>
            </CardTitle>
            <CardDescription>
              Enter QR code data manually if camera scanning is not available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-qr">QR Code Data</Label>
              <Input
                id="manual-qr"
                placeholder="Paste QR code data here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleManualSubmit} 
              className="w-full"
              disabled={!manualInput.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Process QR Code
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Instructions for using the QR Scanner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>Vehicle Check-In</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Scan QR code on vehicle entry</li>
                <li>• QR code should contain vehicle details</li>
                <li>• System will automatically check in the vehicle</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Vehicle Check-Out</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Scan QR code on vehicle exit</li>
                <li>• QR code should contain vehicle ID</li>
                <li>• System will calculate payment and check out</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {scannedData?.type === 'vehicle_entry' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-blue-600" />
              )}
              <span>
                {scannedData?.type === 'vehicle_entry' ? 'Vehicle Check-In' : 'Vehicle Check-Out'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {scannedData?.type === 'vehicle_entry' 
                ? 'Confirm vehicle check-in details'
                : 'Confirm vehicle check-out details'
              }
            </DialogDescription>
          </DialogHeader>
          
          {scannedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {scannedData.type === 'vehicle_entry' ? 'Check-In' : 'Check-Out'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(scannedData.timestamp)}
                  </p>
                </div>
              </div>
              
              {scannedData.plate_number && (
                <div>
                  <Label className="text-sm font-medium">Plate Number</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {scannedData.plate_number}
                  </p>
                </div>
              )}
              
              {scannedData.vehicle_type && (
                <div>
                  <Label className="text-sm font-medium">Vehicle Type</Label>
                  <Badge variant="outline">
                    {scannedData.vehicle_type}
                  </Badge>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleVehicleAction} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {scannedData.type === 'vehicle_entry' ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {scannedData.type === 'vehicle_entry' ? 'Check In' : 'Check Out'}
                    </>
                  )}
                </Button>
                <Button 
                  onClick={resetScanner} 
                  variant="outline"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
