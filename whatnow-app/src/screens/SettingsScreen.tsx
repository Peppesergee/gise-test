import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { useUserLocation } from '../hooks/useUserLocation';
import { useWeather } from '../hooks/useWeather';
import { colors } from '../theme/colors';
import { WEATHER_LABELS } from '../utils/weatherLabels';

const aiConfigured = Boolean(process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);

export function SettingsScreen() {
  const { coords, permission, requestPermission } = useUserLocation();
  const { weather } = useWeather(coords);
  const { habits, resetData } = useHabits();

  function confirmReset() {
    Alert.alert(
      'Reimposta abitudini e storico',
      'Verranno cancellati tutti i dati salvati su questo dispositivo (storico decisioni e preferenze imparate). L’operazione non è reversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Reimposta', style: 'destructive', onPress: () => resetData() },
      ]
    );
  }

  const likedCategories = Object.entries(habits.categoryScores).filter(([, s]) => (s as number) > 0);
  const dislikedCategories = Object.entries(habits.categoryScores).filter(([, s]) => (s as number) < 0);
  const weatherInfo = weather ? WEATHER_LABELS[weather.condition] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Posizione e meteo</Text>
      <View style={styles.card}>
        <Text style={styles.rowText}>
          Permesso posizione: <Text style={styles.bold}>{permission}</Text>
        </Text>
        {weather && (
          <Text style={styles.rowText}>
            Meteo rilevato: {weatherInfo?.emoji} {weatherInfo?.label}
            {weather.temperatureC != null ? `, ${weather.temperatureC}°C` : ''}
            {weather.locationLabel ? ` · ${weather.locationLabel}` : ''}
          </Text>
        )}
        {permission !== 'granted' && (
          <Pressable style={styles.smallButton} onPress={requestPermission}>
            <Text style={styles.smallButtonText}>Attiva posizione</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>Abitudini imparate</Text>
      <View style={styles.card}>
        <Text style={styles.rowText}>Feedback raccolti finora: {habits.totalFeedback}</Text>
        {likedCategories.length > 0 && (
          <Text style={styles.rowText}>Categorie che apprezzi: {likedCategories.map(([c]) => c).join(', ')}</Text>
        )}
        {dislikedCategories.length > 0 && (
          <Text style={styles.rowText}>Categorie che eviti: {dislikedCategories.map(([c]) => c).join(', ')}</Text>
        )}
        {habits.totalFeedback === 0 && (
          <Text style={styles.rowTextMuted}>
            Ancora nessun dato: lascia un feedback (✅/👎) sui suggerimenti per affinarli nel tempo.
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Motore dei suggerimenti</Text>
      <View style={styles.card}>
        <Text style={styles.rowText}>
          {aiConfigured
            ? '✨ Chiave AI configurata: i suggerimenti vengono generati da Claude.'
            : '⚙️ Nessuna chiave AI configurata: i suggerimenti vengono generati da un motore a regole locale (funziona comunque, zero setup).'}
        </Text>
        <Text style={styles.rowTextMuted}>
          Per abilitare l’AI, imposta EXPO_PUBLIC_ANTHROPIC_API_KEY in un file .env (vedi .env.example).
          Nota: in questo prototipo la chiave viene usata direttamente dal telefono/browser; per un uso in
          produzione andrebbe instradata tramite un backend che non la esponga mai al dispositivo.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Dati e privacy</Text>
      <View style={styles.card}>
        <Text style={styles.rowTextMuted}>
          Storico e abitudini restano solo su questo dispositivo. Non c’è account né sincronizzazione.
        </Text>
        <Pressable style={styles.dangerButton} onPress={confirmReset}>
          <Text style={styles.dangerButtonText}>Reimposta abitudini e storico</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  rowText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  rowTextMuted: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  smallButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dangerButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
});
