import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { repository } from '../data';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { colors } from '../theme/colors';
import { PointsEvent, POINTS_PER_FREE_HOUR } from '../types';
import { formatRelativeTime } from '../utils/geo';

export function PointsScreen() {
  const insets = useSafeAreaInsets();
  const { userId, nickname } = useAuth();
  const profile = useUserProfile(userId);
  const [history, setHistory] = useState<PointsEvent[]>([]);

  useEffect(() => {
    if (!userId) return;
    repository.getPointsHistory(userId).then(setHistory);
  }, [userId, profile?.totalPointsEarned]);

  const points = profile?.points ?? 0;
  const freeHours = profile?.freeHoursAvailable ?? 0;
  const progress = points % POINTS_PER_FREE_HOUR;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.greeting}>Ciao{nickname ? `, ${nickname}` : ''} 👋</Text>

      <View style={styles.card}>
        <Text style={styles.pointsValue}>{points}</Text>
        <Text style={styles.pointsLabel}>Punti Park</Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(progress / POINTS_PER_FREE_HOUR) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {progress}/{POINTS_PER_FREE_HOUR} punti per la prossima ora gratis
        </Text>
      </View>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardTitle}>🎁 Ore gratis disponibili: {freeHours}</Text>
        <Text style={styles.rewardBody}>
          Ogni 10 Punti Park sblocchi un&apos;ora di parcheggio gratuito. Il riscatto diretto in
          app sarà attivo non appena sarà definito l&apos;accordo con il Comune: per ora i punti
          restano in cassa e ti aspettano.
        </Text>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardBadgeText}>In arrivo, in collaborazione con il Comune</Text>
        </View>
      </View>

      <Text style={styles.historyTitle}>Le tue segnalazioni</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.historyList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Non hai ancora segnalato nessun posto libero. Quando lasci un parcheggio a pagamento,
            segnalalo dall&apos;app per guadagnare punti!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <View>
              <Text style={styles.historyAddress}>{item.spotAddress}</Text>
              <Text style={styles.historyTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.historyPoints}>+{item.points}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
  },
  pointsLabel: {
    color: '#DBEAFE',
    fontWeight: '600',
    marginBottom: 14,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressLabel: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 8,
  },
  rewardCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rewardBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  rewardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.unknownBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  rewardBadgeText: {
    color: colors.unknown,
    fontSize: 12,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  historyList: {
    paddingBottom: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyAddress: {
    fontWeight: '600',
    color: colors.text,
  },
  historyTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyPoints: {
    color: colors.free,
    fontWeight: '800',
    fontSize: 16,
  },
});
