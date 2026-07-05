import { useCallback, useEffect, useState } from 'react';
import { appendHistoryEntry, loadHabitProfile, loadHistory, recordFeedback, resetAllData } from '../data/habitsStore';
import { createEmptyHabitProfile, DecisionResult, FeedbackValue, HabitProfile, HistoryEntry, SuggestionKind } from '../types';
import { generateId } from '../utils/id';

interface RecordDecisionInput {
  freeText: string;
  timeBudgetMinutes: HistoryEntry['timeBudgetMinutes'];
  energy: HistoryEntry['energy'];
  weatherCondition: HistoryEntry['weatherCondition'];
  result: DecisionResult;
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitProfile>(createEmptyHabitProfile());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profile, entries] = await Promise.all([loadHabitProfile(), loadHistory()]);
      setHabits(profile);
      setHistory(entries);
      setLoading(false);
    })();
  }, []);

  const recordDecision = useCallback(async (input: RecordDecisionInput) => {
    const entry: HistoryEntry = {
      id: generateId(),
      createdAt: Date.now(),
      freeText: input.freeText,
      timeBudgetMinutes: input.timeBudgetMinutes,
      energy: input.energy,
      weatherCondition: input.weatherCondition,
      result: input.result,
      chosen: null,
      feedback: null,
    };
    const nextHistory = await appendHistoryEntry(entry);
    setHistory(nextHistory);
    return entry.id;
  }, []);

  const giveFeedback = useCallback(async (entryId: string, chosen: SuggestionKind, feedback: FeedbackValue) => {
    const { history: nextHistory, habits: nextHabits } = await recordFeedback(entryId, chosen, feedback);
    setHistory(nextHistory);
    setHabits(nextHabits);
  }, []);

  const resetData = useCallback(async () => {
    await resetAllData();
    setHabits(createEmptyHabitProfile());
    setHistory([]);
  }, []);

  return { habits, history, loading, recordDecision, giveFeedback, resetData };
}
