import { useEffect, useState } from 'react';
import { repository } from '../data';
import { ParkingSpot } from '../types';

export function useParkingSpots(): ParkingSpot[] {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  useEffect(() => {
    const unsubscribe = repository.subscribeToSpots(setSpots);
    return unsubscribe;
  }, []);

  return spots;
}
