import { useState, useCallback, useEffect } from "react";

export function useCamera() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if camera is supported
  const checkSupport = useCallback(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(supported);
    return supported;
  }, []);

  // Check support on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Capture photo from camera
  const capturePhoto = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    
    try {
      if (!isSupported) {
        throw new Error("Camera not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Create video element to capture frame
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (!context) {
            reject(new Error("Canvas context not available"));
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          context.drawImage(video, 0, 0);
          
          // Convert to base64
          const dataURL = canvas.toDataURL("image/jpeg", 0.8);
          
          // Stop video stream
          stream.getTracks().forEach(track => track.stop());
          
          resolve(dataURL);
        };

        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error("Video loading failed"));
        };
      });
    } catch (error) {
      console.error("Camera capture failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    capturePhoto,
    isSupported,
    isLoading,
    checkSupport
  };
}
