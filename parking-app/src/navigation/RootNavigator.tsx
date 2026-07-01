import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import { MapScreen } from '../screens/MapScreen';
import { PointsScreen } from '../screens/PointsScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen
          name="Mappa"
          component={MapScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
          }}
        />
        <Tab.Screen
          name="Punti Park"
          component={PointsScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⭐</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
