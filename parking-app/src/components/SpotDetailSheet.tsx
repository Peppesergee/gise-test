import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ParkingSpot, REPORT_PROXIMITY_METERS } from '../types';
import { distanceMeters, formatDistance, formatRelativeTime } from '../utils/geo';
import { getEffectiveStatus } from '../utils/spotStatus';
import { StatusBadge } from './StatusBadge';

interface Props {
  spot: ParkingSpot | null;
  userLocation: { lat: number; lng: number } | null;
  locationDenied: boolean;
  onClose: () => void;
  onReportFree: (spotId: string) => Promise<{ success: boolean; pointsAwarded: number; reason?: string }>;
  onReportOccupied: (spotId: string) => Promise<{ success: boolean; pointsAwarded: number; reason?: string }>;
}

export function SpotDetailSheet({
  spot,
  userLocation,
  locationDenied,
  onClose,
  onReportFree,
  onReportOccupied,
}: Props) {
  const [submitting, setSubmitting] = useState<'free' | 'occupied' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!spot) return null;

  const status = getEffectiveStatus(spot);
  const distance = userLocation
    ? distanceMeters(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
    : null;
  const withinRange = distance !== null && distance <= REPORT_PROXIMITY_METERS;

  async function handleReport(kind: 'free' | 'occupied') {
    setSubmitting(kind);
    setFeedback(null);
    const action = kind === 'free' ? onReportFree : onReportOccupied;
    const result = await action(spot!.id);
    setSubmitting(null);
    if (!result.success) {
      setFeedback(
        result.reason === 'too_far'
          ? `Sei troppo lontano per segnalare questo posto (max ${REPORT_PROXIMITY_METERS} m).`
          : 'Non è stato possibile inviare la segnalazione. Riprova.'
      );
      return;
    }
    if (kind === 'free' && result.pointsAwarded > 0) {
      setFeedback(`Grazie! Hai guadagnato ${result.pointsAwarded} punto park 🎉`);
    } else if (kind === 'free') {
      setFeedback('Segnalato come libero, grazie!');
    } else {
      setFeedback('Segnalato come occupato, grazie!');
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.address}>{spot.address}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Chiudi</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <StatusBadge status={status} />
          {spot.pricePerHour != null && (
            <Text style={styles.price}>{spot.pricePerHour.toFixed(2)} €/ora</Text>
          )}
        </View>

        <Text style={styles.updatedAt}>Aggiornato {formatRelativeTime(spot.statusUpdatedAt)}</Text>
        {distance !== null && (
          <Text style={styles.distance}>Sei a {formatDistance(distance)} da qui</Text>
        )}

        {locationDenied && (
          <Text style={styles.warning}>
            Attiva la posizione per poter segnalare questo parcheggio.
          </Text>
        )}
        {!locationDenied && distance !== null && !withinRange && (
          <Text style={styles.warning}>
            Avvicinati al parcheggio (entro {REPORT_PROXIMITY_METERS} m) per poterlo segnalare.
          </Text>
        )}

        {feedback && <Text style={styles.feedback}>{feedback}</Text>}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.freeButton, !withinRange && styles.buttonDisabled]}
            disabled={!withinRange || submitting !== null}
            onPress={() => handleReport('free')}
          >
            {submitting === 'free' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Ho lasciato il posto</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.button, styles.occupiedButton, !withinRange && styles.buttonDisabled]}
            disabled={!withinRange || submitting !== null}
            onPress={() => handleReport('occupied')}
          >
            {submitting === 'occupied' ? (
              <ActivityIndicator color={colors.occupied} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.occupied }]}>È occupato</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  address: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  close: {
    color: colors.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  price: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  updatedAt: {
    color: colors.textMuted,
    fontSize: 13,
  },
  distance: {
    color: colors.textMuted,
    fontSize: 13,
  },
  warning: {
    color: colors.unknown,
    fontSize: 13,
    marginTop: 4,
  },
  feedback: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeButton: {
    backgroundColor: colors.free,
  },
  occupiedButton: {
    backgroundColor: colors.occupiedBg,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
