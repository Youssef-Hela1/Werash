import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import MechanicsScreen from './src/screens/MechanicsScreen';
import Header from './src/components/Header';
import BottomNavBar from './src/components/BottomNavBar';
import { COLORS } from './src/styles/theme';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  
  const [fontsLoaded] = useFonts({
    'GuiltyTreasure': require('./assets/fonts/GuiltyTreasure.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.bgBrand} />
      </View>
    );
  }

  // Render active screen content
  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentTab} />;
      case 'mechanics':
        return <MechanicsScreen />;
      default:
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>
              {currentTab.toUpperCase()} SCREEN
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {/* Global Persistent Header (Stays mounted, prevents reload animations) */}
        <Header />

        {/* Core Page Layout switches underneath */}
        {renderScreen()}

        {/* Custom Floating Bottom Navigation Bar */}
        <BottomNavBar activeTab={currentTab} onTabPress={setCurrentTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCreamy,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCreamy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainer: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  placeholderText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 24,
    color: 'rgba(77, 110, 79, 0.3)',
  }
});
