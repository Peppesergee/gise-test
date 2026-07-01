import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export function OnboardingScreen() {
  const { setNickname } = useAuth();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (!value.trim()) return;
    setSubmitting(true);
    await setNickname(value);
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🅿️</Text>
        <Text style={styles.title}>Benvenuto su ParkFree</Text>
        <Text style={styles.subtitle}>
          Trova parcheggi liberi vicino a te e segnala quando lasci un posto: guadagni Punti Park
          da trasformare in ore di sosta gratuita.
        </Text>

        <Text style={styles.label}>Come vuoi essere chiamato?</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Giuseppe"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={setValue}
          autoFocus
          maxLength={24}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        <Pressable
          style={[styles.button, !value.trim() && styles.buttonDisabled]}
          disabled={!value.trim() || submitting}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Inizia</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
