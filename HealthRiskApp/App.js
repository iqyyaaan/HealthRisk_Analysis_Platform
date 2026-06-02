import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { FormProvider } from './src/context/FormContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import DemographicsScreen from './src/screens/DemographicsScreen';
import LifestyleScreen from './src/screens/LifestyleScreen';
import RiskScreen from './src/screens/RiskScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <FormProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFFFFF' },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            }),
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Demographics" component={DemographicsScreen} />
          <Stack.Screen name="Lifestyle" component={LifestyleScreen} />
          <Stack.Screen name="Risk" component={RiskScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </FormProvider>
  );
}