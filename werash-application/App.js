import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import BottomNavBar from './src/components/BottomNavBar';
import { COLORS } from './src/styles/theme';

export default function App() {
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

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {/* Core Page Layout */}
        <HomeScreen />

        {/* Custom Floating Bottom Navigation Bar */}
        <BottomNavBar />
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
  }
});
