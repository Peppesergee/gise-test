import { WeatherCondition, WeatherSnapshot } from '../types';

// Mappa i WMO weather code restituiti da Open-Meteo (nessuna API key richiesta)
// nelle condizioni sintetiche usate dall'app.
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'sereno';
  if (code === 2 || code === 3) return 'nuvoloso';
  if (code === 45 || code === 48) return 'nebbia';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'pioggia';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'neve';
  if ([95, 96, 99].includes(code)) return 'temporale';
  return 'sconosciuto';
}

async function fetchLocationLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=it`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

export async function fetchWeatherSnapshot(lat: number, lng: number): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=auto`;

  const [weatherResult, locationLabel] = await Promise.all([
    fetch(url).then((res) => (res.ok ? res.json() : null)),
    fetchLocationLabel(lat, lng),
  ]);

  if (!weatherResult?.current) {
    return { condition: 'sconosciuto', temperatureC: null, isDaytime: true, locationLabel };
  }

  return {
    condition: mapWeatherCode(weatherResult.current.weather_code),
    temperatureC: Math.round(weatherResult.current.temperature_2m),
    isDaytime: weatherResult.current.is_day === 1,
    locationLabel,
  };
}
