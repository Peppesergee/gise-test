import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { colors } from '../theme/colors';
import { HistoryEntry } from '../types';
import { WEATHER_LABELS } from '../utils/weatherLabels';

const CHOSEN_LABEL: Record<NonNullable<HistoryEntry['chosen']>, string> = {
  consigliata: '⭐ Ha seguito il consiglio principale',
  alternativa: '🔁 Ha seguito l’alternativa',
  niente: '🌿 Ha scelto di non fare niente',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) +
    ' · ' +
    date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const weatherInfo = entry.weatherCondition ? WEATHER_LABELS[entry.weatherCondition] : null;

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
      {entry.freeText ? <Text style={styles.freeText}>“{entry.freeText}”</Text> : null}
      <View style={styles.metaRow}>
        {entry.energy && <Text style={styles.metaChip}>{entry.energy}</Text>}
        {entry.timeBudgetMinutes != null && <Text style={styles.metaChip}>{entry.timeBudgetMinutes} min</Text>}
        {weatherInfo && <Text style={styles.metaChip}>{weatherInfo.emoji} {weatherInfo.label}</Text>}
      </View>
      <Text style={styles.recommended}>⭐ {entry.result.recommended.title}</Text>
      {entry.chosen ? (
        <Text style={styles.outcome}>{CHOSEN_LABEL[entry.chosen]}</Text>
      ) : (
        <Text style={styles.outcomePending}>Nessun feedback lasciato</Text>
      )}
    </View>
  );
}

export function HistoryScreen() {
  const { history, loading } = useHabits();

  if (loading) return null;

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🗒️</Text>
        <Text style={styles.emptyText}>Le decisioni che chiedi a WhatNow? finiranno qui.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <HistoryCard entry={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  freeText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recommended: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  outcome: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  outcomePending: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
