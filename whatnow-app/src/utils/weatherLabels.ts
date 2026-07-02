import { WeatherCondition } from '../types';

export const WEATHER_LABELS: Record<WeatherCondition, { emoji: string; label: string }> = {
  sereno: { emoji: '☀️', label: 'sereno' },
  nuvoloso: { emoji: '☁️', label: 'nuvoloso' },
  nebbia: { emoji: '🌫️', label: 'nebbia' },
  pioggia: { emoji: '🌧️', label: 'pioggia' },
  temporale: { emoji: '⛈️', label: 'temporale' },
  neve: { emoji: '❄️', label: 'neve' },
  sconosciuto: { emoji: '🌡️', label: 'condizioni sconosciute' },
};
