import { useState, useEffect } from "react";

interface GeolocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setIsLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache for 1 minute
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { coords } = position;
      
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed
      });
      
      setAccuracy(coords.accuracy);
      setError(null);
      setIsLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = "Unknown location error";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    };

    // Get current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position changes
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return {
    location,
    accuracy,
    isLoading,
    error
  };
}
