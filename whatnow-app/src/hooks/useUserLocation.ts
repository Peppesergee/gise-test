import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LocationPermissionState = 'unknown' | 'granted' | 'denied';

interface UserLocationState {
  coords: { lat: number; lng: number } | null;
  permission: LocationPermissionState;
  requestPermission: () => Promise<void>;
}

async function readCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

export function useUserLocation(): UserLocationState {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<LocationPermissionState>('unknown');

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermission('granted');
      setCoords(await readCurrentPosition());
    } else {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
        setCoords(await readCurrentPosition());
      } else {
        setPermission('unknown');
      }
    })();
  }, []);

  return { coords, permission, requestPermission };
}
