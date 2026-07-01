import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { SpotStatus } from '../types';
import { statusLabel } from '../utils/spotStatus';

const BG: Record<SpotStatus, string> = {
  free: colors.freeBg,
  occupied: colors.occupiedBg,
  unknown: colors.unknownBg,
};
const FG: Record<SpotStatus, string> = {
  free: colors.free,
  occupied: colors.occupied,
  unknown: colors.unknown,
};

export function StatusBadge({ status }: { status: SpotStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: BG[status] }]}>
      <View style={[styles.dot, { backgroundColor: FG[status] }]} />
      <Text style={[styles.label, { color: FG[status] }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
