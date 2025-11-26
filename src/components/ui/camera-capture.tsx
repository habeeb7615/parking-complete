import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onClose();
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Capture Plate Number</h3>
          <Button variant="ghost" size="sm" onClick={stopCamera}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-gray-200 rounded-lg"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
        
        <div className="flex justify-center mt-4 space-x-2">
          <Button onClick={capturePhoto} disabled={!stream}>
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
          <Button variant="outline" onClick={stopCamera}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
