import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import StartCaptureScreen from './src/screens/StartCaptureScreen';
import LiveTrackingScreen from './src/screens/LiveTrackingScreen';
import CaptureResultsScreen from './src/screens/CaptureResultsScreen';
import TerritoryOverviewScreen from './src/screens/TerritoryOverviewScreen';
import LeaderboardsScreen from './src/screens/LeaderboardsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CommunityScreen from './src/screens/CommunityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopColor: 'rgba(91, 99, 211, 0.15)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#5B63D3',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Territories"
        component={TerritoryOverviewScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboards"
        component={LeaderboardsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={22} color={color} />
          ),
          tabBarLabel: 'Ranks',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Onboarding"
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="StartCapture" component={StartCaptureScreen} />
        <Stack.Screen
          name="LiveTracking"
          component={LiveTrackingScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="CaptureResults"
          component={CaptureResultsScreen}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
