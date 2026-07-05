import { TimeOfDay } from '../types';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 6 && hour < 13) return 'mattina';
  if (hour >= 13 && hour < 19) return 'pomeriggio';
  if (hour >= 19 && hour < 24) return 'sera';
  return 'notte';
}
