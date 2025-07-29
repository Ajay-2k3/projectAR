import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing camera access and video stream
 * Handles permission requests, device selection, and stream management
 */
export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestCameraAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request camera permission with rear camera preference for mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);
      
      // Attach stream to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
    } catch (err) {
      let errorMessage = 'Camera access failed';
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.';
            break;
          case 'NotSupportedError':
            errorMessage = 'Camera not supported by this browser.';
            break;
          default:
            errorMessage = `Camera error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream,
    error,
    isLoading,
    hasPermission,
    videoRef,
    requestCameraAccess,
    stopCamera,
  };
};