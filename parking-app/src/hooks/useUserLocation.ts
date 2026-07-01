import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type LocationPermissionState = 'unknown' | 'granted' | 'denied';

interface UserLocationState {
  coords: { lat: number; lng: number } | null;
  permission: LocationPermissionState;
  requestPermission: () => Promise<void>;
}

export function useUserLocation(): UserLocationState {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<LocationPermissionState>('unknown');
  const subscription = useRef<Location.LocationSubscription | null>(null);

  async function startWatching() {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      (location) => {
        setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      }
    );
  }

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermission('granted');
      await startWatching();
    } else {
      setPermission('denied');
    }
  }

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
        await startWatching();
      } else {
        setPermission('unknown');
      }
    })();

    return () => {
      subscription.current?.remove();
    };
  }, []);

  return { coords, permission, requestPermission };
}
