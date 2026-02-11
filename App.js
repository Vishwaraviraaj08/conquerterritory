import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';

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
import SettingsScreen from './src/screens/SettingsScreen';

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
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#5B63D3',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tab.Screen name="Territories" component={TerritoryOverviewScreen}
        options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="map-marker-radius" size={22} color={color} /> }} />
      <Tab.Screen name="Ranks" component={LeaderboardsScreen}
        options={{ tabBarIcon: ({ color }) => <Ionicons name="trophy" size={22} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
      <Tab.Screen name="Community" component={CommunityScreen}
        options={{ tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a' }}>
        <ActivityIndicator size="large" color="#5B63D3" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="StartCapture" component={StartCaptureScreen} />
          <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="CaptureResults" component={CaptureResultsScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
