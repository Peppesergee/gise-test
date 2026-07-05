import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChipGroup } from '../components/ChipGroup';
import { SuggestionCard } from '../components/SuggestionCard';
import { useHabits } from '../hooks/useHabits';
import { useUserLocation } from '../hooks/useUserLocation';
import { useWeather } from '../hooks/useWeather';
import { generateDecision } from '../services/decisionEngine';
import { colors } from '../theme/colors';
import {
  DecisionContext,
  DecisionResult,
  EnergyLevel,
  FeedbackValue,
  SuggestionKind,
  TIME_BUDGET_OPTIONS,
  TimeBudgetMinutes,
} from '../types';
import { getTimeOfDay } from '../utils/time';
import { WEATHER_LABELS } from '../utils/weatherLabels';

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'stanco', label: '😴 Stanco' },
  { value: 'normale', label: '🙂 Normale' },
  { value: 'energico', label: '⚡ Energico' },
];

export function HomeScreen() {
  const [freeText, setFreeText] = useState('');
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [timeBudgetMinutes, setTimeBudgetMinutes] = useState<TimeBudgetMinutes | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [feedbackByKind, setFeedbackByKind] = useState<Partial<Record<SuggestionKind, FeedbackValue>>>({});
  const [submitting, setSubmitting] = useState(false);

  const { coords, permission, requestPermission } = useUserLocation();
  const { weather, loading: weatherLoading } = useWeather(coords);
  const { habits, recordDecision, giveFeedback } = useHabits();

  async function handleSubmit() {
    setSubmitting(true);
    setFeedbackByKind({});
    try {
      const context: DecisionContext = {
        freeText,
        timeBudgetMinutes,
        energy,
        weather,
        timeOfDay: getTimeOfDay(),
        habits,
      };
      const decision = await generateDecision(context);
      const id = await recordDecision({
        freeText,
        timeBudgetMinutes,
        energy,
        weatherCondition: weather?.condition ?? null,
        result: decision,
      });
      setResult(decision);
      setEntryId(id);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFeedback(kind: SuggestionKind, feedback: FeedbackValue) {
    if (!entryId) return;
    setFeedbackByKind((prev) => ({ ...prev, [kind]: feedback }));
    await giveFeedback(entryId, kind, feedback);
  }

  const weatherInfo = weather ? WEATHER_LABELS[weather.condition] : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.appTitle}>WhatNow?</Text>
        <Text style={styles.tagline}>Non decidere. Chiedi.</Text>

        {permission !== 'granted' ? (
          <Pressable style={styles.pillRow} onPress={requestPermission}>
            <Text style={styles.pillRowText}>📍 Attiva la posizione per il meteo del momento</Text>
          </Pressable>
        ) : weatherLoading ? (
          <View style={styles.pillRow}>
            <ActivityIndicator color={colors.textMuted} />
          </View>
        ) : weather ? (
          <View style={styles.pillRow}>
            <Text style={styles.pillRowText}>
              {weatherInfo?.emoji} {weatherInfo?.label}
              {weather.temperatureC != null ? `, ${weather.temperatureC}°C` : ''}
              {weather.locationLabel ? ` · ${weather.locationLabel}` : ''}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Come stai? Cosa hai in mente?</Text>
        <TextInput
          style={styles.textArea}
          placeholder={'Es. "ho 2 ore libere, sono stanco, piove"'}
          placeholderTextColor={colors.textFaint}
          value={freeText}
          onChangeText={setFreeText}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.sectionLabel, styles.labelSpaced]}>Energia</Text>
        <ChipGroup options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />

        <Text style={[styles.sectionLabel, styles.labelSpaced]}>Tempo libero</Text>
        <ChipGroup
          options={TIME_BUDGET_OPTIONS.map((o) => ({ value: o.minutes, label: o.label }))}
          value={timeBudgetMinutes}
          onChange={setTimeBudgetMinutes}
        />

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#04170A" />
          ) : (
            <Text style={styles.buttonText}>Dimmi cosa fare</Text>
          )}
        </Pressable>

        {result && (
          <View style={styles.results}>
            <SuggestionCard
              suggestion={result.recommended}
              feedback={feedbackByKind.consigliata}
              onFeedback={(f) => handleFeedback('consigliata', f)}
            />
            <SuggestionCard
              suggestion={result.alternative}
              feedback={feedbackByKind.alternativa}
              onFeedback={(f) => handleFeedback('alternativa', f)}
            />
            <SuggestionCard
              suggestion={result.doNothing}
              feedback={feedbackByKind.niente}
              onFeedback={(f) => handleFeedback('niente', f)}
            />
            <Text style={styles.sourceLabel}>
              {result.source === 'ai' ? '✨ Generato dall’AI' : '⚙️ Motore a regole locale'}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 20,
  },
  pillRow: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  pillRowText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  labelSpaced: {
    marginTop: 20,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.text,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.accentGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#04170A',
    fontWeight: '700',
    fontSize: 16,
  },
  results: {
    marginTop: 28,
  },
  sourceLabel: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 4,
  },
});
