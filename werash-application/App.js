import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Image, StatusBar, Animated, PanResponder } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import MechanicsScreen from './src/screens/MechanicsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import GarageScreen from './src/screens/GarageScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import Header from './src/components/Header';
import BottomNavBar from './src/components/BottomNavBar';
import SpecialistDetailModal from './src/components/SpecialistDetailModal';
import AdDetailModal from './src/components/AdDetailModal';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useThemeStyles, useTheme } from './src/styles/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_USER_VEHICLES = '@werash_user_vehicles';
const STORAGE_KEY_ACTIVE_VEHICLE_ID = '@werash_active_vehicle_id';
const STORAGE_KEY_CURRENT_USER = '@werash_current_user';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedSpecialistId, setExpandedSpecialistId] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id: 'mock-youssef',
    fullName: 'Youssef Helal',
    email: 'youssef@example.com',
    carBrand: 'Hyundai',
    carModel: 'Coupe',
    carYear: '2005',
    plateNumber: '1873 RW',
    plateNumberArabic: '١٨٧٣ ر و',
    phone: '+20 123 456 7890',
    avatar: null
  });
  const [signInVisible, setSignInVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState(null);
  const [activeAd, setActiveAd] = useState(null);
  const [communityScrollTrigger, setCommunityScrollTrigger] = useState(0);
  const [splashFinished, setSplashFinished] = useState(false);
  
  // Shared Garage States
  const [userVehicles, setUserVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);

  // Unified Home Screen Rubber-Band Bounce (Moves Header + Home Content together)
  const [homeTranslateY] = useState(() => new Animated.Value(0));
  const currentTabRef = useRef(currentTab);
  const isHomeAtTopRef = useRef(true);
  const maxDrag = 150;

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  const homePanResponder = useMemo(() => {
    const getRubberBandValue = (dy) => {
      const sign = Math.sign(dy);
      const absVal = Math.abs(dy);
      return sign * (1 - (1 / ((absVal * 0.45 / maxDrag) + 1))) * maxDrag;
    };

    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (currentTabRef.current !== 'home') return false;
        return Math.abs(gestureState.dy) > 14 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (currentTabRef.current !== 'home') return false;
        return Math.abs(gestureState.dy) > 14 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onPanResponderGrant: () => {
        homeTranslateY.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        const rubberBandY = getRubberBandValue(gestureState.dy);
        homeTranslateY.setValue(rubberBandY);
      },
      onPanResponderRelease: () => {
        Animated.spring(homeTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(homeTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, [homeTranslateY]);
  
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [fontsLoaded] = useFonts({
    'GuiltyTreasure': require('./assets/fonts/GuiltyTreasure.otf'),
    'ZafranArabic-Bold': require('./assets/fonts/zafran-arabic-bold.otf'),
    'ZafranArabic-Regular': require('./assets/fonts/zafran-arabic-regular.otf'),
    'ZafranArabic-Black': require('./assets/fonts/zafran-arabic-black.otf'),
    'AlkhalilArabic-Bold': require('./assets/fonts/Janna LT Bold.ttf'),
    'Caveat-Regular': require('./assets/fonts/Caveat-Regular.ttf'),
    'ArefRuqaa-Regular': require('./assets/fonts/ArefRuqaa-Regular.ttf'),
    'Fastup-Regular': require('./assets/fonts/Fastup-Regular.ttf'),
    'Fastup-Bold': require('./assets/fonts/Fastup-Bold.ttf'),
    'Airstrike-Regular': require('./assets/fonts/airstrike.ttf'),
    'Airstrike-Bold': require('./assets/fonts/airstrikebold.ttf'),
    'Janna-Bold': require('./assets/fonts/Janna LT Bold.ttf'),
    'OriginalBurger': require('./assets/fonts/Original Burger.otf'),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load stored user & vehicles on launch
  useEffect(() => {
    let isMounted = true;
    const loadStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser) setCurrentUser(parsedUser);
        }

        const storedVehicles = await AsyncStorage.getItem(STORAGE_KEY_USER_VEHICLES);
        const storedActiveId = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_VEHICLE_ID);
        if (storedVehicles && isMounted) {
          const parsedVehicles = JSON.parse(storedVehicles);
          if (Array.isArray(parsedVehicles) && parsedVehicles.length > 0) {
            setUserVehicles(parsedVehicles);
            setActiveVehicleId(storedActiveId || parsedVehicles[0].id);
          }
        }
      } catch (e) {
        console.warn('Storage load error:', e);
      }
    };
    loadStorage();
    return () => { isMounted = false; };
  }, []);

  // Save vehicles when updated
  useEffect(() => {
    if (userVehicles && userVehicles.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY_USER_VEHICLES, JSON.stringify(userVehicles)).catch(() => {});
    }
  }, [userVehicles]);

  // Save active vehicle ID when changed
  useEffect(() => {
    if (activeVehicleId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_VEHICLE_ID, activeVehicleId).catch(() => {});
    }
  }, [activeVehicleId]);

  // Save current user session when updated
  useEffect(() => {
    if (currentUser) {
      AsyncStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
    }
  }, [currentUser]);

  // Sync user cars on login/change
  useEffect(() => {
    if (currentUser) {
      // Seed mockup vehicles if the user has no registered vehicles
      const mockVehicles = [
        {
          id: 'mock-coupe',
          brand: 'Hyundai',
          model: 'Coupe',
          year: '2005',
          plateNumber: '1873 RW',
          plateNumberArabic: '١٨٧٣ ر و',
          cc: '2000 CC',
          odometer: 284000,
          isManual: false,
          is4WD: false,
          hasHydraulicPS: true,
          hasTimingBelt: true,
          services: {
            engineOil: { lastService: 274350, lifespan: 10000 },
            oilFilter: { lastService: 274350, lifespan: 10000 },
            airFilter: { lastService: 270000, lifespan: 20000 },
            cabinAirFilter: { lastService: 270000, lifespan: 20000 },
            sparkPlugs: { lastService: 260000, lifespan: 40000 },
            transmissionFluid: { lastService: 240000, lifespan: 60000 },
            coolant: { lastService: 260000, lifespan: 40000 },
            brakeFluid: { lastService: 270000, lifespan: 30000 },
            brakePads: { lastService: 270000, lifespan: 30000 },
            tires: { lastService: 250000, lifespan: 50000 }
          },
          notes: 'Welcome to Werash Notes! 📝\nمرحباً بك في ملاحظات وِرَش!\n\n• Use the arrows (◀/▶) above to flip pages.\n• استخدم الأسهم (◀/▶) في الأعلى للتنقل.\n\n• Tap the Date Chip to set a log date.\n• اضغط على شريحة التاريخ لتحديد يوم.\n• Add photos (🖼️) to attach sticky notes.\n• أضف صوراً (🖼️) لتظهر كملصقات على الورقة.\n• Text auto-wraps around the sticky notes!\n• يلتف النص تلقائياً حول الملصقات اللاصقة!',
          noteDate: '2026-07-10',
          noteImages: [
            'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop'
          ],
        },
        {
          id: 'mock-bmw',
          brand: 'BMW',
          model: 'M4 Coupe',
          year: '2023',
          plateNumber: '4321 SDE',
          plateNumberArabic: '٤٣٢١ س د ه',
          cc: '3000 CC',
          odometer: 24180,
          isManual: false,
          is4WD: false,
          hasHydraulicPS: false,
          hasTimingBelt: false,
          services: {
            engineOil: { lastService: 20000, lifespan: 10000 },
            oilFilter: { lastService: 20000, lifespan: 10000 },
            airFilter: { lastService: 20000, lifespan: 20000 },
            cabinAirFilter: { lastService: 20000, lifespan: 20000 },
            sparkPlugs: { lastService: 20000, lifespan: 40000 },
            transmissionFluid: { lastService: 20000, lifespan: 60000 },
            coolant: { lastService: 20000, lifespan: 40000 },
            brakeFluid: { lastService: 20000, lifespan: 30000 },
            brakePads: { lastService: 20000, lifespan: 30000 },
            tires: { lastService: 20000, lifespan: 50000 }
          },
          notes: 'BMW M4 — brake pads sound like they need attention soon. Noticed slight vibration above 120 km/h. Book alignment check. Oil change done May 10.',
        },
        {
          id: 'mock-merc',
          brand: 'Mercedes-Benz',
          model: 'G63 AMG',
          year: '2022',
          plateNumber: '7777 VIP',
          plateNumberArabic: '٧٧٧٧ و ي ب',
          cc: '4000 CC',
          odometer: 42300,
          isManual: false,
          is4WD: true,
          hasHydraulicPS: true,
          hasTimingBelt: false,
          services: {
            engineOil: { lastService: 40000, lifespan: 10000 },
            oilFilter: { lastService: 40000, lifespan: 10000 },
            airFilter: { lastService: 40000, lifespan: 20000 },
            cabinAirFilter: { lastService: 40000, lifespan: 20000 },
            sparkPlugs: { lastService: 30000, lifespan: 40000 },
            transmissionFluid: { lastService: 40000, lifespan: 60000 },
            coolant: { lastService: 30000, lifespan: 40000 },
            brakeFluid: { lastService: 40000, lifespan: 30000 },
            brakePads: { lastService: 40000, lifespan: 30000 },
            tires: { lastService: 30000, lifespan: 50000 }
          },
          notes: 'G63 — beast of a car. Full service done at 40k. Alignment fixed the jitter. Rear diff oil due soon. Check tow hitch wiring — trailer lights flickering.',
        },
        {
          id: 'mock-audi',
          brand: 'Audi',
          model: 'RS6 Avant',
          year: '2024',
          plateNumber: '1020 AXT',
          plateNumberArabic: '١٠٢٠ أ خ ت',
          cc: '4000 CC',
          odometer: 8900,
          isManual: false,
          is4WD: true,
          hasHydraulicPS: false,
          hasTimingBelt: false,
          services: {
            engineOil: { lastService: 5000, lifespan: 10000 },
            oilFilter: { lastService: 5000, lifespan: 10000 },
            airFilter: { lastService: 5000, lifespan: 20000 },
            cabinAirFilter: { lastService: 5000, lifespan: 20000 },
            sparkPlugs: { lastService: 5000, lifespan: 40000 },
            transmissionFluid: { lastService: 5000, lifespan: 60000 },
            coolant: { lastService: 5000, lifespan: 40000 },
            brakeFluid: { lastService: 5000, lifespan: 30000 },
            brakePads: { lastService: 5000, lifespan: 30000 },
            tires: { lastService: 5000, lifespan: 50000 }
          },
          notes: 'Audi RS6 — new car, barely used. Keep an eye on coolant level after long highway runs. Scheduled for first full service at 10,000 km.',
        },
        {
          id: 'mock-tipo',
          brand: 'Fiat',
          model: 'Tipo',
          year: '2020',
          plateNumber: '5843 UIE',
          plateNumberArabic: '٥٨٤٣ ع ي أ',
          cc: '1600 CC',
          odometer: 62450,
          isManual: true,
          is4WD: false,
          hasHydraulicPS: true,
          hasTimingBelt: true,
          services: {
            engineOil: { lastService: 60000, lifespan: 10000 },
            oilFilter: { lastService: 60000, lifespan: 10000 },
            airFilter: { lastService: 60000, lifespan: 20000 },
            cabinAirFilter: { lastService: 60000, lifespan: 20000 },
            sparkPlugs: { lastService: 40000, lifespan: 40000 },
            transmissionFluid: { lastService: 50000, lifespan: 60000 },
            coolant: { lastService: 40000, lifespan: 40000 },
            brakeFluid: { lastService: 50000, lifespan: 30000 },
            brakePads: { lastService: 50000, lifespan: 30000 },
            tires: { lastService: 30000, lifespan: 50000 }
          },
          notes: 'Fiat Tipo — timing belt changed at 40k, good for another 60k. Clutch fluid topped off. Air filter needs replacement next service. Watch out for the AC compressor noise at cold starts.',
        }
      ];
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserVehicles(prev => prev.length > 0 ? prev : mockVehicles);
      setActiveVehicleId(prev => prev || mockVehicles[0].id);
    } else {
      setUserVehicles([]);
      setActiveVehicleId(null);
    }
  }, [currentUser]);

  const handleNavigate = (tab, targetSpecialistId = null) => {
    homeTranslateY.setValue(0);
    isHomeAtTopRef.current = true;
    setCurrentTab(tab);
    if (targetSpecialistId) {
      setExpandedSpecialistId(targetSpecialistId);
    }
  };

  if (!fontsLoaded || !splashFinished) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />
        <View style={styles.splashContent}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.splashLogo} 
            resizeMode="contain" 
          />
          <Text style={[styles.splashText, fontsLoaded && { fontFamily: 'GuiltyTreasure' }]}>
            WERASH
          </Text>
          <Text style={[styles.splashTextArabic, fontsLoaded && { fontFamily: 'ZafranArabic-Bold' }]}>
            وِرَش
          </Text>
        </View>
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
            userVehicles={userVehicles}
            activeVehicleId={activeVehicleId}
            onSelectAd={setActiveAd}
            onSelectProfile={() => setProfileVisible(true)}
            onScrollPositionChange={(isAtTop) => {
              isHomeAtTopRef.current = isAtTop;
            }}
          />
        );
      case 'garage':
        return (
          <GarageScreen 
            currentUser={currentUser}
            onOpenSignIn={() => setSignInVisible(true)}
            selectedLanguage={selectedLanguage}
            userVehicles={userVehicles}
            setUserVehicles={setUserVehicles}
            activeVehicleId={activeVehicleId}
            setActiveVehicleId={setActiveVehicleId}
          />
        );
      case 'mechanics':
        return (
          <MechanicsScreen 
            initialExpandedCardId={expandedSpecialistId} 
            onClearInitialExpanded={() => setExpandedSpecialistId(null)} 
            onSelectSpecialist={setActiveSpecialist}
            activeVehicleId={activeVehicleId}
            userVehicles={userVehicles}
            selectedLanguage={selectedLanguage}
          />
        );
      case 'community':
        return <CommunityScreen currentUser={currentUser} scrollToTopTrigger={communityScrollTrigger} selectedLanguage={selectedLanguage} />;
      case 'more':
        return (
          <SettingsScreen 
            currentUser={currentUser}
            onLogOut={() => setCurrentUser(null)}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onSelectProfile={() => setProfileVisible(true)}
          />
        );
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
      {/* Animated Main Content Container (Moves Header + Home Content together on bounce) */}
      <Animated.View 
        style={[
          styles.mainContentContainer,
          currentTab === 'home' && { transform: [{ translateY: homeTranslateY }] }
        ]}
        {...(currentTab === 'home' ? homePanResponder.panHandlers : {})}
      >
        {/* Global Persistent Header (Stays mounted, prevents reload animations) */}
        <Header 
          currentTab={currentTab}
          currentUser={currentUser} 
          onSetCurrentUser={setCurrentUser} 
          signInVisible={signInVisible}
          onSetSignInVisible={setSignInVisible}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          onOpenSettings={() => setCurrentTab('more')}
        />

        {/* Core Page Layout switches underneath */}
        {renderScreen()}
      </Animated.View>

      {/* Custom Floating Bottom Navigation Bar */}
      {!activeSpecialist && !activeAd && (
        <BottomNavBar 
          activeTab={currentTab} 
          onTabPress={(tab) => {
            if (tab === 'community' && currentTab === 'community') {
              setCommunityScrollTrigger(prev => prev + 1);
            }
            homeTranslateY.setValue(0);
            isHomeAtTopRef.current = true;
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
          selectedLanguage={selectedLanguage}
          activeVehicle={userVehicles.find(v => v.id === activeVehicleId)}
        />
      )}

      {/* Ad Detail Modal */}
      {activeAd && (
        <AdDetailModal 
          ad={activeAd} 
          onClose={() => setActiveAd(null)} 
          selectedLanguage={selectedLanguage}
        />
      )}
      {/* Profile Edit Screen/Modal */}
      <ProfileScreen 
        visible={profileVisible} 
        onClose={() => setProfileVisible(false)} 
        currentUser={currentUser} 
        onSaveProfile={setCurrentUser} 
        onOpenSignIn={() => setSignInVisible(true)} 
        selectedLanguage={selectedLanguage}
      />
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
  mainContentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 72,
    color: '#F7F5F0',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  splashTextArabic: {
    fontSize: 60,
    color: '#F7F5F0',
    marginTop: 2,
    textAlign: 'center',
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
    fontFamily: 'Fastup-Bold',
    fontSize: 24,
    color: 'rgba(77, 110, 79, 0.3)',
  }
});
