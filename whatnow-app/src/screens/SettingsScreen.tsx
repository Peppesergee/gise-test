import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { useUserLocation } from '../hooks/useUserLocation';
import { useWeather } from '../hooks/useWeather';
import { colors } from '../theme/colors';
import { WEATHER_LABELS } from '../utils/weatherLabels';

const aiConfigured = Boolean(process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <View style={[styles.row, !last && styles.rowDivider]}>{children}</View>;
}

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
      <Text style={styles.headerTitle}>Impostazioni</Text>

      <SectionHeader title="Posizione e meteo" />
      <View style={styles.group}>
        <Row>
          <Text style={styles.rowText}>Permesso posizione</Text>
          <Text style={styles.rowValue}>{permission}</Text>
        </Row>
        {weather && (
          <Row>
            <Text style={styles.rowText}>Meteo rilevato</Text>
            <Text style={styles.rowValue}>
              {weatherInfo?.emoji} {weatherInfo?.label}
              {weather.temperatureC != null ? `, ${weather.temperatureC}°C` : ''}
            </Text>
          </Row>
        )}
        {permission !== 'granted' && (
          <Row last>
            <Pressable onPress={requestPermission}>
              <Text style={styles.actionLink}>Attiva posizione</Text>
            </Pressable>
          </Row>
        )}
      </View>

      <SectionHeader title="Abitudini imparate" />
      <View style={styles.group}>
        <Row last={likedCategories.length === 0 && dislikedCategories.length === 0}>
          <Text style={styles.rowText}>Feedback raccolti finora</Text>
          <Text style={styles.rowValue}>{habits.totalFeedback}</Text>
        </Row>
        {likedCategories.length > 0 && (
          <Row last={dislikedCategories.length === 0}>
            <Text style={styles.rowText}>Categorie che apprezzi</Text>
            <Text style={styles.rowValue}>{likedCategories.map(([c]) => c).join(', ')}</Text>
          </Row>
        )}
        {dislikedCategories.length > 0 && (
          <Row last>
            <Text style={styles.rowText}>Categorie che eviti</Text>
            <Text style={styles.rowValue}>{dislikedCategories.map(([c]) => c).join(', ')}</Text>
          </Row>
        )}
        {habits.totalFeedback === 0 && (
          <Text style={styles.groupNote}>
            Ancora nessun dato: lascia un feedback (✅/👎) sui suggerimenti per affinarli nel tempo.
          </Text>
        )}
      </View>

      <SectionHeader title="Motore dei suggerimenti" />
      <View style={styles.group}>
        <Row last>
          <Text style={styles.rowText}>
            {aiConfigured ? '✨ AI (Claude) attiva' : '⚙️ Motore a regole locale'}
          </Text>
        </Row>
        <Text style={styles.groupNote}>
          {aiConfigured
            ? 'I suggerimenti vengono generati da Claude, con fallback automatico alle regole in caso di errore.'
            : 'Nessuna chiave AI configurata: funziona comunque, zero setup. Per abilitare l’AI imposta EXPO_PUBLIC_ANTHROPIC_API_KEY in un file .env (vedi .env.example).'}
          {' '}Nota: in questo prototipo la chiave viene usata direttamente dal dispositivo; per un uso in
          produzione andrebbe instradata tramite un backend che non la esponga mai.
        </Text>
      </View>

      <SectionHeader title="Dati e privacy" />
      <View style={styles.group}>
        <Text style={styles.groupNote}>
          Storico e abitudini restano solo su questo dispositivo. Non c’è account né sincronizzazione.
        </Text>
        <Pressable style={styles.dangerRow} onPress={confirmReset}>
          <Text style={styles.dangerText}>Reimposta abitudini e storico</Text>
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  group: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    fontSize: 15,
    color: colors.text,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  actionLink: {
    fontSize: 15,
    color: colors.accentGreen,
    fontWeight: '600',
  },
  groupNote: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    padding: 16,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerText: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '600',
  },
});
