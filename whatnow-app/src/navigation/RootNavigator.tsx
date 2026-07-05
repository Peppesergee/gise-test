import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_META: Record<string, { icon: string; label: string }> = {
  Ora: { icon: '🧠', label: 'Ora' },
  Storico: { icon: '🗒️', label: 'Storico' },
  Impostazioni: { icon: '⚙️', label: 'Impostazioni' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META[route.name];

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
            <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
              <Text style={styles.tabIcon}>{meta.icon}</Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{meta.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
        <Tab.Screen name="Ora" component={HomeScreen} />
        <Tab.Screen name="Storico" component={HistoryScreen} />
        <Tab.Screen name="Impostazioni" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: colors.surface,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
