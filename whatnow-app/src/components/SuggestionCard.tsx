import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { FeedbackValue, Suggestion } from '../types';

const KIND_META: Record<Suggestion['kind'], { emoji: string; label: string; color: string; bg: string }> = {
  consigliata: { emoji: '⭐', label: 'Ti consiglio', color: colors.recommended, bg: colors.recommendedBg },
  alternativa: { emoji: '🔁', label: 'In alternativa', color: colors.alternative, bg: colors.alternativeBg },
  niente: { emoji: '🌿', label: 'Oppure', color: colors.doNothing, bg: colors.doNothingBg },
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  feedback: FeedbackValue | null | undefined;
  onFeedback: (feedback: FeedbackValue) => void;
}

export function SuggestionCard({ suggestion, feedback, onFeedback }: SuggestionCardProps) {
  const meta = KIND_META[suggestion.kind];

  return (
    <View style={[styles.card, { backgroundColor: meta.bg, borderColor: meta.color }]}>
      <Text style={[styles.kindLabel, { color: meta.color }]}>
        {meta.emoji} {meta.label}
      </Text>
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
          style={[styles.actionButton, feedback === 'saltato' && styles.actionButtonActive]}
        >
          <Text style={[styles.actionText, feedback === 'saltato' && styles.actionTextActive]}>👎 Non fa per me</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  kindLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
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
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  actionButtonActive: {
    backgroundColor: colors.text,
  },
  actionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#FFFFFF',
  },
});
