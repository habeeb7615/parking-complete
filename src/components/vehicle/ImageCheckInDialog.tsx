import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlateRecognitionService } from '@/services/plateRecognitionService';

interface ImageCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateDetected: (plateNumber: string) => void;
}

export function ImageCheckInDialog({
  isOpen,
  onClose,
  onPlateDetected
}: ImageCheckInDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)"
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 10MB"
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input with camera capture
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.style.display = 'none';
        
        cameraInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleImageSelect({ target: { files: [file] } } as any);
          }
        };
        
        document.body.appendChild(cameraInput);
        cameraInput.click();
        document.body.removeChild(cameraInput);
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use rear camera
        } 
      });

      // Create video element for camera preview
      const video = document.createElement('video');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.zIndex = '9999';
      video.style.backgroundColor = 'black';
      video.autoplay = true;
      video.muted = true;
      video.srcObject = stream;

      // Create overlay with capture button
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '10000';
      overlay.style.backgroundColor = 'transparent';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'flex-end';
      overlay.style.alignItems = 'center';
      overlay.style.padding = '20px';
      overlay.style.pointerEvents = 'none';

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.innerHTML = '📷 Capture';
      captureBtn.style.padding = '12px 24px';
      captureBtn.style.fontSize = '16px';
      captureBtn.style.fontWeight = '600';
      captureBtn.style.backgroundColor = '#10b981';
      captureBtn.style.color = 'white';
      captureBtn.style.border = 'none';
      captureBtn.style.borderRadius = '25px';
      captureBtn.style.cursor = 'pointer';
      captureBtn.style.marginBottom = '15px';
      captureBtn.style.pointerEvents = 'auto';
      captureBtn.style.userSelect = 'none';
      captureBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
      captureBtn.style.transition = 'all 0.2s ease';

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.innerHTML = '✕ Cancel';
      cancelBtn.style.padding = '10px 20px';
      cancelBtn.style.fontSize = '14px';
      cancelBtn.style.fontWeight = '500';
      cancelBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = '2px solid rgba(255, 255, 255, 0.3)';
      cancelBtn.style.borderRadius = '20px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.pointerEvents = 'auto';
      cancelBtn.style.userSelect = 'none';
      cancelBtn.style.backdropFilter = 'blur(10px)';
      cancelBtn.style.transition = 'all 0.2s ease';

      // Add hover effects
      captureBtn.addEventListener('mouseenter', () => {
        captureBtn.style.transform = 'scale(1.05)';
        captureBtn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.6)';
      });
      
      captureBtn.addEventListener('mouseleave', () => {
        captureBtn.style.transform = 'scale(1)';
        captureBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
      });

      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.transform = 'scale(1.05)';
        cancelBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      });
      
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.transform = 'scale(1)';
        cancelBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      });

      // Add elements to overlay
      overlay.appendChild(captureBtn);
      overlay.appendChild(cancelBtn);
      document.body.appendChild(video);
      document.body.appendChild(overlay);

      // Wait for video to load before enabling capture
      video.addEventListener('loadedmetadata', () => {
        console.log('Camera ready for capture');
      });

      // Disable capture button initially
      captureBtn.disabled = true;
      captureBtn.style.opacity = '0.5';
      
      // Enable capture after video loads
      video.addEventListener('canplay', () => {
        setTimeout(() => {
          captureBtn.disabled = false;
          captureBtn.style.opacity = '1';
          console.log('Capture button enabled');
        }, 500); // Small delay to ensure video is fully ready
      });

      // Fallback: Enable button after 3 seconds regardless
      setTimeout(() => {
        if (captureBtn.disabled) {
          captureBtn.disabled = false;
          captureBtn.style.opacity = '1';
          console.log('Capture button enabled (fallback)');
        }
      }, 3000);

      // Capture photo function
      const capturePhoto = () => {
        try {
          // Wait for video to be ready
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            toast({
              variant: "destructive",
              title: "Camera not ready",
              description: "Please wait for camera to initialize"
            });
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Canvas context not available');
          }
          
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
              handleImageSelect({ target: { files: [file] } } as any);
              
              // Show success message
              toast({
                title: "Photo Captured!",
                description: "Image captured successfully. You can now detect the plate number.",
              });
            } else {
              throw new Error('Failed to create image blob');
            }
          }, 'image/jpeg', 0.8);
          
        } catch (error) {
          console.error('Capture error:', error);
          toast({
            variant: "destructive",
            title: "Capture failed",
            description: "Failed to capture photo. Please try again."
          });
        } finally {
          // Cleanup
          try {
            stream.getTracks().forEach(track => track.stop());
            if (document.body.contains(video)) {
              document.body.removeChild(video);
            }
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      };

      // Cancel function
      const cancelCapture = () => {
        try {
          stream.getTracks().forEach(track => track.stop());
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        } catch (error) {
          console.error('Cancel error:', error);
        }
      };

      // Add event listeners with better handling
      const handleCaptureClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Capture button clicked');
        capturePhoto();
      };

      const handleCancelClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Cancel button clicked');
        cancelCapture();
      };

      // Remove any existing listeners first
      captureBtn.removeEventListener('click', handleCaptureClick);
      cancelBtn.removeEventListener('click', handleCancelClick);
      
      // Add new listeners with multiple event types for better compatibility
      captureBtn.addEventListener('click', handleCaptureClick, { once: false });
      captureBtn.addEventListener('mousedown', handleCaptureClick, { once: false });
      captureBtn.addEventListener('touchend', handleCaptureClick, { once: false });
      
      cancelBtn.addEventListener('click', handleCancelClick, { once: false });
      cancelBtn.addEventListener('mousedown', handleCancelClick, { once: false });
      cancelBtn.addEventListener('touchend', handleCancelClick, { once: false });

    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please allow camera access or use 'Select Image' instead"
      });
      
      // Fallback to file input
      const cameraInput = document.createElement('input');
      cameraInput.type = 'file';
      cameraInput.accept = 'image/*';
      cameraInput.capture = 'environment';
      cameraInput.style.display = 'none';
      
      cameraInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleImageSelect({ target: { files: [file] } } as any);
        }
      };
      
      document.body.appendChild(cameraInput);
      cameraInput.click();
      document.body.removeChild(cameraInput);
    }
  };

  const handleSelectImage = () => {
    // Create a new file input for gallery selection
    const galleryInput = document.createElement('input');
    galleryInput.type = 'file';
    galleryInput.accept = 'image/*';
    galleryInput.style.display = 'none';
    
    galleryInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageSelect({ target: { files: [file] } } as any);
      }
    };
    
    document.body.appendChild(galleryInput);
    galleryInput.click();
    document.body.removeChild(galleryInput);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDetectPlate = async () => {
    if (!selectedImage) {
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please select an image of the vehicle"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await PlateRecognitionService.extractPlateNumber(selectedImage);

      if (result.success && result.plateNumber) {
        // Fill the plate number in the form
        onPlateDetected(result.plateNumber);
        
        toast({
          title: "Plate Number Detected!",
          description: `License plate "${result.plateNumber}" has been filled in the form. Please complete the check-in process.`,
        });
        
        // Close the dialog automatically
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to detect plate number');
      }

    } catch (error) {
      console.error('Plate detection error:', error);
      toast({
        variant: "destructive",
        title: "Detection failed",
        description: error instanceof Error ? error.message : 'Failed to detect license plate'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Detect License Plate</span>
          </DialogTitle>
          <DialogDescription>
            Take or upload a photo of the vehicle to automatically extract the license plate number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Vehicle Image *</Label>
            
            {!imagePreview ? (
              <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Camera className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Take a photo or upload an image of the vehicle
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSelectImage}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTakePhoto}
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      JPG, PNG up to 10MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vehicle preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedImage?.name} ({(selectedImage?.size! / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </CardContent>
              </Card>
            )}

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDetectPlate}
              disabled={!selectedImage || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Detect Plate Number
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
