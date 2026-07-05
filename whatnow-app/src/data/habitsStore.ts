import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyHabitProfile, FeedbackValue, HabitProfile, HistoryEntry, SuggestionKind } from '../types';

const HABITS_KEY = 'whatnow:habits';
const HISTORY_KEY = 'whatnow:history';
const HISTORY_LIMIT = 100;
const FEEDBACK_DELTA: Record<FeedbackValue, number> = { fatto: 1, saltato: -1 };

/**
 * Tutto ciò che riguarda abitudini e storico resta solo sul dispositivo
 * (AsyncStorage): nessun account, nessun server, zero setup.
 */
export async function loadHabitProfile(): Promise<HabitProfile> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  return raw ? (JSON.parse(raw) as HabitProfile) : createEmptyHabitProfile();
}

async function saveHabitProfile(profile: HabitProfile): Promise<void> {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(profile));
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
  return history.sort((a, b) => b.createdAt - a.createdAt);
}

async function saveHistory(history: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

export async function appendHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const history = await loadHistory();
  const next = [entry, ...history];
  await saveHistory(next);
  return next;
}

export async function recordFeedback(
  entryId: string,
  chosen: SuggestionKind,
  feedback: FeedbackValue
): Promise<{ history: HistoryEntry[]; habits: HabitProfile }> {
  const history = await loadHistory();
  const entry = history.find((e) => e.id === entryId);
  const updatedHistory = history.map((e) => (e.id === entryId ? { ...e, chosen, feedback } : e));
  await saveHistory(updatedHistory);

  const habits = await loadHabitProfile();
  const category =
    chosen === 'consigliata'
      ? entry?.result.recommended.category
      : chosen === 'alternativa'
        ? entry?.result.alternative.category
        : undefined;

  if (category) {
    const current = habits.categoryScores[category] ?? 0;
    const next = clamp(current + FEEDBACK_DELTA[feedback], -3, 3);
    habits.categoryScores[category] = next;
  }
  habits.totalFeedback += 1;
  await saveHabitProfile(habits);

  return { history: updatedHistory, habits };
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([HABITS_KEY, HISTORY_KEY]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
