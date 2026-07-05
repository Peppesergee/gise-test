import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { FeedbackValue, Suggestion } from '../types';

const KIND_META: Record<Suggestion['kind'], { emoji: string; label: string; color: string; bg: string }> = {
  consigliata: { emoji: '⭐', label: 'Ti consiglio', color: colors.recommended, bg: colors.recommendedMuted },
  alternativa: { emoji: '🔁', label: 'In alternativa', color: colors.alternative, bg: colors.alternativeMuted },
  niente: { emoji: '🌿', label: 'Oppure', color: colors.doNothing, bg: colors.doNothingMuted },
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  feedback: FeedbackValue | null | undefined;
  onFeedback: (feedback: FeedbackValue) => void;
}

export function SuggestionCard({ suggestion, feedback, onFeedback }: SuggestionCardProps) {
  const meta = KIND_META[suggestion.kind];

  return (
    <View style={styles.card}>
      <View style={[styles.kindTag, { backgroundColor: meta.bg }]}>
        <Text style={[styles.kindLabel, { color: meta.color }]}>
          {meta.emoji} {meta.label}
        </Text>
      </View>
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.description}>{suggestion.description}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onFeedback('fatto')}
          style={[styles.actionButton, feedback === 'fatto' && styles.actionButtonActive]}
        >
          <Text style={[styles.actionText, feedback === 'fatto' && styles.actionTextActive]}>✅ Fatto</Text>
        </Pressable>
        <Pressable
          onPress={() => onFeedback('saltato')}
          style={[styles.actionButton, feedback === 'saltato' && styles.actionButtonMuted]}
        >
          <Text style={[styles.actionText, feedback === 'saltato' && styles.actionTextMuted]}>👎 Non fa per me</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 18,
    marginBottom: 12,
  },
  kindTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.chip,
  },
  actionButtonActive: {
    backgroundColor: colors.accentGreen,
  },
  actionButtonMuted: {
    backgroundColor: colors.surfaceRaised,
  },
  actionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#04170A',
  },
  actionTextMuted: {
    color: colors.text,
  },
});
