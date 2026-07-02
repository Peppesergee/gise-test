import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <RootNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
