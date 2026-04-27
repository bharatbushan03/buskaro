/**
 * Driver Navigator
 * 
 * Bottom tab navigation for driver app screens.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { PickupsScreen } from '../screens/driver/PickupsScreen';
import { NavigationScreen } from '../screens/driver/NavigationScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';

import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export const DriverNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'bus';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'bus' : 'bus-outline';
              break;
            case 'Pickups':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Navigation':
              iconName = focused ? 'navigate' : 'navigate-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.grey[500],
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Pickups" component={PickupsScreen} />
      <Tab.Screen name="Navigation" component={NavigationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
