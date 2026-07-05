import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function ChipGroup<T extends string | number>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.chip,
  },
  chipSelected: {
    backgroundColor: colors.accentGreen,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#04170A',
    fontWeight: '700',
  },
});
