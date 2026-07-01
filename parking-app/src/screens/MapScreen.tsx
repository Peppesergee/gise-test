import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeafletMap, LeafletMapHandle } from '../components/LeafletMap';
import { SpotDetailSheet } from '../components/SpotDetailSheet';
import { repository } from '../data';
import { useAuth } from '../context/AuthContext';
import { useParkingSpots } from '../hooks/useParkingSpots';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../theme/colors';
import { getEffectiveStatus } from '../utils/spotStatus';

const BOLOGNA_CENTER = { lat: 44.4949, lng: 11.3426 };

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const spots = useParkingSpots();
  const { coords, permission, requestPermission } = useUserLocation();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const mapRef = useRef<LeafletMapHandle>(null);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

  const counts = spots.reduce(
    (acc, spot) => {
      acc[getEffectiveStatus(spot)] += 1;
      return acc;
    },
    { free: 0, occupied: 0, unknown: 0 }
  );

  function recenter() {
    if (coords) {
      mapRef.current?.centerOn(coords.lat, coords.lng, 17);
    } else {
      requestPermission();
    }
  }

  return (
    <View style={styles.container}>
      <LeafletMap
        ref={mapRef}
        initialCenter={coords ?? BOLOGNA_CENTER}
        spots={spots}
        userLocation={coords}
        onSpotTap={setSelectedSpotId}
      />

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.legendCard}>
          <LegendItem color={colors.free} label={`${counts.free} liberi`} />
          <LegendItem color={colors.occupied} label={`${counts.occupied} occupati`} />
          <LegendItem color={colors.unknown} label={`${counts.unknown} da verificare`} />
        </View>
      </View>

      {permission === 'denied' && (
        <View style={[styles.permissionBanner, { top: insets.top + 60 }]}>
          <Text style={styles.permissionText}>
            Attiva la posizione per vedere quanto sei vicino ai parcheggi e poterli segnalare.
          </Text>
          <Pressable onPress={requestPermission}>
            <Text style={styles.permissionAction}>Attiva</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={recenter}
        accessibilityLabel="Centra sulla mia posizione"
      >
        <View style={styles.fabDot} />
      </Pressable>

      <SpotDetailSheet
        spot={selectedSpot}
        userLocation={coords}
        locationDenied={permission === 'denied'}
        onClose={() => setSelectedSpotId(null)}
        onReportFree={(spotId) => {
          if (!userId || !coords) {
            return Promise.resolve({ success: false, pointsAwarded: 0, reason: 'too_far' as const });
          }
          return repository.reportSpotFree(spotId, userId, coords.lat, coords.lng);
        }}
        onReportOccupied={(spotId) => {
          if (!userId || !coords) {
            return Promise.resolve({ success: false, pointsAwarded: 0, reason: 'too_far' as const });
          }
          return repository.reportSpotOccupied(spotId, userId, coords.lat, coords.lng);
        }}
      />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  legendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  permissionBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  permissionText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  permissionAction: {
    color: '#93C5FD',
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: colors.primary,
  },
});
