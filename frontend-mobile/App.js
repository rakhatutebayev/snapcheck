import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import PresentationsScreen from './src/screens/PresentationsScreen';
import SlideViewerScreen from './src/screens/SlideViewerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Presentations" component={PresentationsScreen} />
        <Stack.Screen name="Slides" component={SlideViewerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
