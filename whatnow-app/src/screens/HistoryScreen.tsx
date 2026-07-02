import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { colors } from '../theme/colors';
import { ActivityCategory, HistoryEntry } from '../types';
import { WEATHER_LABELS } from '../utils/weatherLabels';

const CATEGORY_EMOJI: Record<ActivityCategory, string> = {
  relax: '🛋️',
  movimento: '🏃',
  sociale: '💬',
  creativo: '🎨',
  commissioni: '🧹',
  intrattenimento: '🎬',
  natura: '🌳',
  cibo: '🍽️',
};

const CHOSEN_META: Record<NonNullable<HistoryEntry['chosen']>, { label: string; color: string }> = {
  consigliata: { label: 'Consiglio seguito', color: colors.recommended },
  alternativa: { label: 'Alternativa seguita', color: colors.alternative },
  niente: { label: 'Non fatto niente', color: colors.doNothing },
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const emoji = entry.result.recommended.category ? CATEGORY_EMOJI[entry.result.recommended.category] : '🧠';
  const weatherInfo = entry.weatherCondition ? WEATHER_LABELS[entry.weatherCondition] : null;
  const chosenMeta = entry.chosen ? CHOSEN_META[entry.chosen] : null;

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{emoji}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {entry.freeText ? entry.freeText : entry.result.recommended.title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          ⭐ {entry.result.recommended.title}
        </Text>
        <View style={styles.metaRow}>
          {entry.energy && <Text style={styles.metaText}>{entry.energy}</Text>}
          {entry.timeBudgetMinutes != null && <Text style={styles.metaText}>· {entry.timeBudgetMinutes} min</Text>}
          {weatherInfo && <Text style={styles.metaText}>· {weatherInfo.emoji} {weatherInfo.label}</Text>}
        </View>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
        {chosenMeta ? (
          <Text style={[styles.outcome, { color: chosenMeta.color }]}>{chosenMeta.label}</Text>
        ) : (
          <Text style={styles.outcomePending}>In sospeso</Text>
        )}
      </View>
    </View>
  );
}

export function HistoryScreen() {
  const { history, loading } = useHabits();

  if (loading) return <View style={styles.container} />;

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Storico</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🗒️</Text>
          <Text style={styles.emptyText}>Le decisioni che chiedi a WhatNow? finiranno qui.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Storico</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <HistoryRow entry={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textFaint,
  },
  rowMeta: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 13,
    color: colors.textFaint,
    marginBottom: 6,
  },
  outcome: {
    fontSize: 12,
    fontWeight: '700',
  },
  outcomePending: {
    fontSize: 12,
    color: colors.textFaint,
  },
  emptyContainer: {
    flex: 1,
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
