import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import MechanicsScreen from './src/screens/MechanicsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import Header from './src/components/Header';
import BottomNavBar from './src/components/BottomNavBar';
import { COLORS } from './src/styles/theme';
import SpecialistDetailModal from './src/components/SpecialistDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [expandedSpecialistId, setExpandedSpecialistId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [signInVisible, setSignInVisible] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState(null);
  
  const [fontsLoaded] = useFonts({
    'GuiltyTreasure': require('./assets/fonts/GuiltyTreasure.otf'),
  });

  const handleNavigate = (tab, targetSpecialistId = null) => {
    setCurrentTab(tab);
    if (targetSpecialistId) {
      setExpandedSpecialistId(targetSpecialistId);
    }
  };

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
        return (
          <HomeScreen 
            onNavigate={handleNavigate} 
            currentUser={currentUser} 
            onOpenSignIn={() => setSignInVisible(true)} 
          />
        );
      case 'mechanics':
        return (
          <MechanicsScreen 
            initialExpandedCardId={expandedSpecialistId} 
            onClearInitialExpanded={() => setExpandedSpecialistId(null)} 
            onSelectSpecialist={setActiveSpecialist}
          />
        );
      case 'community':
        return <CommunityScreen currentUser={currentUser} />;
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
        <Header 
          currentUser={currentUser} 
          onSetCurrentUser={setCurrentUser} 
          signInVisible={signInVisible}
          onSetSignInVisible={setSignInVisible}
        />

        {/* Core Page Layout switches underneath */}
        {renderScreen()}

        {/* Custom Floating Bottom Navigation Bar */}
        {!activeSpecialist && (
          <BottomNavBar 
            activeTab={currentTab} 
            onTabPress={(tab) => {
              setCurrentTab(tab);
              setExpandedSpecialistId(null);
            }} 
          />
        )}

        {/* Specialist Detail Modal (renders over top header and bottom navbar, keeping them mounted) */}
        {activeSpecialist && (
          <SpecialistDetailModal 
            specialist={activeSpecialist} 
            onClose={() => setActiveSpecialist(null)} 
          />
        )}
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
