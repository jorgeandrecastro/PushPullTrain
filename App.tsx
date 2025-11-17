import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWindowDimensions, Platform, LogBox } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import CreateProgramScreen from './src/screens/CreateProgramScreen';
import EditProgramScreen from './src/screens/EditProgramScreen';
import StatsScreen from './src/screens/StatsScreen';
import PRScreen from './src/screens/PRScreen';
import { Program } from './src/types';

export type RootStackParamList = {
  Home: undefined;
  Workout: { date: string; programId?: string };
  Programs: undefined;
  CreateProgram: undefined;
  EditProgram: { program: Program };
  Stats: undefined;
  PRScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Ignorer les warnings spécifiques pendant le développement
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const useHeaderOptions = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  return {
    headerStyle: {
      backgroundColor: '#ffffff',
    },
    headerTintColor: '#000',
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: isSmallScreen ? 16 : 18,
    },
    contentStyle: {
      backgroundColor: '#f8f9fa',
    },
    headerShadowVisible: true,
    headerBackTitle: 'Retour',
  };
};

export default function App() {
  const headerOptions = useHeaderOptions();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={headerOptions}
          initialRouteName="Home"
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'Calendrier',
              headerLargeTitle: Platform.OS === 'ios',
              headerLargeTitleStyle: {
                fontWeight: '700',
              },
            }}
          />
          <Stack.Screen 
            name="Workout" 
            component={WorkoutScreen}
            options={{ 
              title: 'Séance',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="Programs" 
            component={ProgramsScreen}
            options={{ 
              title: 'Mes Programmes',
              headerLargeTitle: Platform.OS === 'ios',
            }}
          />
          <Stack.Screen 
            name="CreateProgram" 
            component={CreateProgramScreen}
            options={{ 
              title: 'Créer un Programme',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="EditProgram" 
            component={EditProgramScreen}
            options={({ route }) => ({ 
              title: `Modifier ${route.params.program?.name || 'le Programme'}`,
              headerLargeTitle: false,
            })}
          />
          <Stack.Screen 
            name="Stats" 
            component={StatsScreen}
            options={{ 
              title: 'Statistiques',
              headerLargeTitle: Platform.OS === 'ios',
            }}
          />
          <Stack.Screen 
            name="PRScreen" 
            component={PRScreen}
            options={{ 
              title: 'Mes Records',
              headerLargeTitle: Platform.OS === 'ios',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}