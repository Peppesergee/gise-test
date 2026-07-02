export type EnergyLevel = 'stanco' | 'normale' | 'energico';

export const ENERGY_ORDER: Record<EnergyLevel, number> = {
  stanco: 0,
  normale: 1,
  energico: 2,
};

export type TimeBudgetMinutes = 15 | 30 | 60 | 120 | 240;

export const TIME_BUDGET_OPTIONS: { minutes: TimeBudgetMinutes; label: string }[] = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 ora' },
  { minutes: 120, label: '2 ore' },
  { minutes: 240, label: 'Tutta la serata' },
];

export type WeatherCondition =
  | 'sereno'
  | 'nuvoloso'
  | 'nebbia'
  | 'pioggia'
  | 'temporale'
  | 'neve'
  | 'sconosciuto';

export interface WeatherSnapshot {
  condition: WeatherCondition;
  temperatureC: number | null;
  isDaytime: boolean;
  locationLabel: string | null;
}

export type TimeOfDay = 'mattina' | 'pomeriggio' | 'sera' | 'notte';

export interface DecisionContext {
  freeText: string;
  timeBudgetMinutes: TimeBudgetMinutes | null;
  energy: EnergyLevel | null;
  weather: WeatherSnapshot | null;
  timeOfDay: TimeOfDay;
  habits: HabitProfile;
}

export type ActivityCategory =
  | 'relax'
  | 'movimento'
  | 'sociale'
  | 'creativo'
  | 'commissioni'
  | 'intrattenimento'
  | 'natura'
  | 'cibo';

export type SuggestionKind = 'consigliata' | 'alternativa' | 'niente';

export interface Suggestion {
  kind: SuggestionKind;
  title: string;
  description: string;
  category?: ActivityCategory;
}

export type DecisionSource = 'ai' | 'regole';

export interface DecisionResult {
  recommended: Suggestion;
  alternative: Suggestion;
  doNothing: Suggestion;
  source: DecisionSource;
  createdAt: number;
}

export interface HabitProfile {
  categoryScores: Partial<Record<ActivityCategory, number>>;
  totalFeedback: number;
}

export function createEmptyHabitProfile(): HabitProfile {
  return { categoryScores: {}, totalFeedback: 0 };
}

export type FeedbackValue = 'fatto' | 'saltato';

export interface HistoryEntry {
  id: string;
  createdAt: number;
  freeText: string;
  timeBudgetMinutes: TimeBudgetMinutes | null;
  energy: EnergyLevel | null;
  weatherCondition: WeatherCondition | null;
  result: DecisionResult;
  chosen: SuggestionKind | null;
  feedback: FeedbackValue | null;
}
