import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import MechanicsScreen from './src/screens/MechanicsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import Header from './src/components/Header';
import BottomNavBar from './src/components/BottomNavBar';
import SpecialistDetailModal from './src/components/SpecialistDetailModal';
import { ThemeProvider, useThemeStyles, useTheme } from './src/styles/ThemeContext';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedSpecialistId, setExpandedSpecialistId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [signInVisible, setSignInVisible] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState(null);
  const [communityScrollTrigger, setCommunityScrollTrigger] = useState(0);
  
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [fontsLoaded] = useFonts({
    'GuiltyTreasure': require('./assets/fonts/GuiltyTreasure.otf'),
    'ZafranArabic-Bold': require('./assets/fonts/zafran-arabic-bold.otf'),
    'ZafranArabic-Regular': require('./assets/fonts/zafran-arabic-regular.otf'),
    'ZafranArabic-Black': require('./assets/fonts/zafran-arabic-black.otf'),
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
        <ActivityIndicator size="large" color={colors.bgBrand} />
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
            selectedLanguage={selectedLanguage}
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
        return <CommunityScreen currentUser={currentUser} scrollToTopTrigger={communityScrollTrigger} />;
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
    <View style={styles.appContainer}>
      {/* Global Persistent Header (Stays mounted, prevents reload animations) */}
      <Header 
        currentUser={currentUser} 
        onSetCurrentUser={setCurrentUser} 
        signInVisible={signInVisible}
        onSetSignInVisible={setSignInVisible}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      {/* Core Page Layout switches underneath */}
      {renderScreen()}

      {/* Custom Floating Bottom Navigation Bar */}
      {!activeSpecialist && (
        <BottomNavBar 
          activeTab={currentTab} 
          onTabPress={(tab) => {
            if (tab === 'community' && currentTab === 'community') {
              setCommunityScrollTrigger(prev => prev + 1);
            }
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const createStyles = (colors) => StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
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
