import { useEffect, useState } from 'react';
import { fetchWeatherSnapshot } from '../services/weather';
import { WeatherSnapshot } from '../types';

export function useWeather(coords: { lat: number; lng: number } | null) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) {
      setWeather(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWeatherSnapshot(coords.lat, coords.lng)
      .then((snapshot) => {
        if (!cancelled) setWeather(snapshot);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng]);

  return { weather, loading };
}
