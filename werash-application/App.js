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
import NotificationsModal from './src/components/NotificationsModal';
import ChatsModal from './src/components/ChatsModal';
import ChatRecipientPickerModal from './src/components/ChatRecipientPickerModal';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useThemeStyles, useTheme } from './src/styles/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase, getUserProfile } from './src/services/supabase';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

const STORAGE_KEY_USER_VEHICLES = '@werash_user_vehicles';
const STORAGE_KEY_ACTIVE_VEHICLE_ID = '@werash_active_vehicle_id';
const STORAGE_KEY_CURRENT_USER = '@werash_current_user';
const STORAGE_KEY_LANGUAGE = '@werash_selected_language';
const STORAGE_KEY_LOCAL_USERS = '@werash_local_users_db';

const CUSTOMER_ADMIN_COUPE = {
  id: 'customer-coupe-2005',
  brand: 'Hyundai',
  model: 'Coupe',
  year: '2005',
  plateNumber: '1873 RW',
  plateNumberArabic: '١٨٧٣ ر و',
  cc: '2000 CC',
  odometer: 290000,
  isManual: false,
  is4WD: false,
  hasHydraulicPS: true,
  hasTimingBelt: true,
  services: {
    engineOil: { lastService: 282000, lifespan: 10000 },
    oilFilter: { lastService: 282000, lifespan: 10000 },
    airFilter: { lastService: 276000, lifespan: 20000 },
    cabinAirFilter: { lastService: 276000, lifespan: 20000 },
    sparkPlugs: { lastService: 265000, lifespan: 40000 },
    transmissionFluid: { lastService: 250000, lifespan: 60000 },
    coolant: { lastService: 268000, lifespan: 40000 },
    brakeFluid: { lastService: 272000, lifespan: 30000 },
    brakePads: { lastService: 275000, lifespan: 30000 },
    tires: { lastService: 260000, lifespan: 50000 },
  },
  notes: 'Hyundai Coupe 2005 (2.0L) — Odometer at 290,000 km.\n• Engine oil & filter changed at 282,000 km (2,000 km remaining).\n• Brake pads inspected and in good shape.\n• Timing belt & tensioner checked at Hamdy Hyundai Workshop.',
  noteDate: '2026-10-19',
  noteImages: [],
};

const MOCK_VEHICLES = [
  {
    ...CUSTOMER_ADMIN_COUPE,
    id: 'mock-coupe',
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

const createRegisteredCar = (user) => ({
  id: `car-${Date.now()}`,
  brand: user.carBrand,
  model: user.carModel,
  year: user.carYear || '2024',
  plateNumber: user.plateNumber || '1873 RW',
  plateNumberArabic: user.plateNumberArabic || '١٨٧٣ ر و',
  cc: user.cc || '2000 CC',
  odometer: 15000,
  isManual: false,
  is4WD: false,
  hasHydraulicPS: false,
  hasTimingBelt: false,
  services: {
    engineOil: { lastService: 10000, lifespan: 10000 },
    oilFilter: { lastService: 10000, lifespan: 10000 },
    airFilter: { lastService: 10000, lifespan: 20000 },
    cabinAirFilter: { lastService: 10000, lifespan: 20000 },
    sparkPlugs: { lastService: 10000, lifespan: 40000 },
    transmissionFluid: { lastService: 10000, lifespan: 60000 },
    coolant: { lastService: 10000, lifespan: 40000 },
    brakeFluid: { lastService: 10000, lifespan: 30000 },
    brakePads: { lastService: 10000, lifespan: 30000 },
    tires: { lastService: 10000, lifespan: 50000 }
  },
  notes: '',
  noteDate: new Date().toISOString().split('T')[0],
  noteImages: [],
});

function AppContent() {
  const [currentTab, setCurrentTab] = useState('home');
  const [isCommunityNavHidden, setIsCommunityNavHidden] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedSpecialistId, setExpandedSpecialistId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState(null);
  const [pendingSharedSpecialist, setPendingSharedSpecialist] = useState(null);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [chatInitialUser, setChatInitialUser] = useState(null);
  const [chatPendingSpecialist, setChatPendingSpecialist] = useState(null);
  const [recipientPickerVisible, setRecipientPickerVisible] = useState(false);
  const [specialistForRecipientPicker, setSpecialistForRecipientPicker] = useState(null);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [activeAd, setActiveAd] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      type: 'maintenance',
      title: 'Service Due Alert',
      titleAr: 'تنبيه موعد الصيانة',
      body: 'Your Hyundai Coupe is due for Engine Oil replacement in 350 km.',
      bodyAr: 'سيارتك هيونداي كوبيه مستحقة لتغيير زيت المحرك خلال 350 كم.',
      date: '2 hours ago',
      dateAr: 'منذ ساعتين',
      read: false
    },
    {
      id: 'n2',
      type: 'message',
      title: 'New Message',
      titleAr: 'رسالة جديدة',
      body: 'Samir Fahmy sent you a message: "Is the price negotiable for the BBS LM rims?"',
      bodyAr: 'سمير فهمي أرسل لك رسالة: "هل السعر قابل للتفاوض لجنوط BBS LM؟"',
      date: '1 day ago',
      dateAr: 'منذ يوم',
      read: false
    },
    {
      id: 'n3',
      type: 'offer',
      title: 'Exclusive Offer',
      titleAr: 'عرض حصري',
      body: 'Specialist Elena offered a 15% discount on computerized diagnostics today.',
      bodyAr: 'الأخصائية إيلينا قدمت خصماً بقيمة 15% على الفحص بالكمبيوتر اليوم.',
      date: '2 days ago',
      dateAr: 'منذ يومين',
      read: false
    }
  ]);
  const [communityScrollTrigger, setCommunityScrollTrigger] = useState(0);
  const [splashFinished, setSplashFinished] = useState(false);
  
  // Shared Garage States
  const [userVehicles, setUserVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);

  // Unified Home Screen Rubber-Band Bounce (Moves Header + Home Content together)
  const [homeTranslateY] = useState(() => new Animated.Value(0));
  const currentTabRef = useRef(currentTab);
  const isHomeAtTopRef = useRef(true);
  const maxDrag = 25;

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  const homePanResponder = useMemo(() => {
    const getRubberBandValue = (dy) => {
      const sign = Math.sign(dy);
      const absVal = Math.abs(dy);
      return sign * (1 - (1 / ((absVal * 0.85 / maxDrag) + 1))) * maxDrag;
    };

    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (currentTabRef.current !== 'home') return false;
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (currentTabRef.current !== 'home') return false;
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
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
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(homeTranslateY, {
          toValue: 0,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, [homeTranslateY]);
  
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [fontsLoaded] = useFonts({
    // Plus Jakarta Sans font family weights
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'PlusJakartaSans-Italic': require('./assets/fonts/PlusJakartaSans-Italic.ttf'),

    // IBM Plex Sans Arabic font family weights
    'IBMPlexSansArabic-Regular': require('./assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Medium': require('./assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    'IBMPlexSansArabic-SemiBold': require('./assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
    'IBMPlexSansArabic-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),

    // Backward compatibility aliases mapped to new fonts
    'IBMPlexSansArabic-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    'IBMPlexSansArabic-Regular': require('./assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    'IBMPlexSansArabic-Regular': require('./assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Fastup-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Airstrike-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Airstrike-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Janna-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),

    // Preserved handwriting fonts for Notes section
    'Caveat-Regular': require('./assets/fonts/Caveat-Regular.ttf'),
    'ArefRuqaa-Regular': require('./assets/fonts/ArefRuqaa-Regular.ttf'),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load stored user, language & vehicles on launch
  useEffect(() => {
    let isMounted = true;
    const loadStorage = async () => {
      try {
        const [
          [, storedLang],
          [, storedUser],
          [, storedVehicles],
          [, storedActiveId]
        ] = await AsyncStorage.multiGet([
          STORAGE_KEY_LANGUAGE,
          STORAGE_KEY_CURRENT_USER,
          STORAGE_KEY_USER_VEHICLES,
          STORAGE_KEY_ACTIVE_VEHICLE_ID,
        ]);

        if (!isMounted) return;

        // Restore Language
        if (storedLang && (storedLang === 'English' || storedLang === 'Arabic')) {
          setSelectedLanguage(storedLang);
        }

        // Restore User from Supabase session or cached storage
        let loadedUser = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            const profile = await getUserProfile(session.user.id);
            const cachedAvatar = await AsyncStorage.getItem(`@werash_user_avatar_${session.user.id}`).catch(() => null);
            const resolvedAvatar = cachedAvatar || profile?.avatar_url || session.user.user_metadata?.avatar_url || null;
            const cachedBanner = await AsyncStorage.getItem(`@werash_user_banner_${session.user.id}`).catch(() => null);
            const resolvedBanner = cachedBanner || profile?.banner_url || session.user.user_metadata?.banner_url || null;
            loadedUser = {
              id: session.user.id,
              email: session.user.email,
              fullName: profile?.full_name || session.user.user_metadata?.full_name || 'User',
              phone: profile?.phone || session.user.user_metadata?.phone || '',
              role: profile?.role || 'customer',
              carBrand: profile?.car_brand || null,
              carModel: profile?.car_model || null,
              carYear: profile?.car_year || null,
              plateNumber: profile?.plate_number || null,
              plateNumberArabic: profile?.plate_number_arabic || null,
              cc: profile?.cc || null,
              odometer: profile?.odometer || 0,
              avatar: resolvedAvatar,
              avatarUrl: resolvedAvatar,
              bannerUrl: resolvedBanner,
            };
            setCurrentUser(loadedUser);
          }
        } catch (_) {}

        if (!loadedUser && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id !== 'mock-youssef') {
              loadedUser = parsedUser;
              setCurrentUser(loadedUser);
            } else {
              // Clean up legacy mock user so app remains a blank slate
              AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
            }
          } catch (_) {}
        }

        // Vehicles belong strictly to an authenticated user!
        if (!loadedUser) {
          // If no user is signed in, app opens as an unauthenticated guest and prompts Sign In / Sign Up
          setUserVehicles([]);
          setActiveVehicleId(null);
          setSignInVisible(true);
          AsyncStorage.multiRemove([
            STORAGE_KEY_USER_VEHICLES,
            STORAGE_KEY_ACTIVE_VEHICLE_ID,
          ]).catch(() => {});
        } else {
          // Authenticated user: restore their vehicles
          if (loadedUser.email === 'customer@werash.com' || loadedUser.id === 'customer-admin') {
            setUserVehicles([CUSTOMER_ADMIN_COUPE]);
            setActiveVehicleId(CUSTOMER_ADMIN_COUPE.id);
          } else {
            let vehiclesLoadedFromDb = false;
            if (loadedUser.id) {
              try {
                const { data: dbVehicles, error: dbErr } = await supabase
                  .from('vehicles')
                  .select('*')
                  .eq('user_id', loadedUser.id)
                  .order('created_at', { ascending: true });

                if (!dbErr && Array.isArray(dbVehicles)) {
                  vehiclesLoadedFromDb = true;
                  if (dbVehicles.length > 0) {
                    const mapped = dbVehicles.map(v => ({
                      id: v.id,
                      brand: v.brand,
                      model: v.model,
                      year: v.year || new Date().getFullYear().toString(),
                      plateNumber: v.plate_number || '',
                      plateNumberArabic: v.plate_number_arabic || '',
                      cc: v.cc || '1600 CC',
                      odometer: v.odometer || 0,
                      isManual: !!v.is_manual,
                      is4WD: false,
                      hasHydraulicPS: false,
                      hasTimingBelt: false,
                      services: v.services && typeof v.services === 'object' ? v.services : {},
                      logs: Array.isArray(v.logs) ? v.logs : [],
                      isServiceSetup: Boolean(v.is_service_setup),
                      notes: Array.isArray(v.notes) ? v.notes.join('[PAGE]') : (typeof v.notes === 'string' ? v.notes : ''),
                      noteDate: Array.isArray(v.note_dates) ? v.note_dates.join('[PAGE]') : (typeof v.note_dates === 'string' ? v.note_dates : ''),
                      noteImages: Array.isArray(v.note_images) ? v.note_images : [],
                    }));
                    setUserVehicles(mapped);
                    const activeCar = dbVehicles.find(v => v.is_active) || mapped[0];
                    setActiveVehicleId(activeCar.id);
                  } else {
                    setUserVehicles([]);
                    setActiveVehicleId(null);
                  }
                }
              } catch (fetchErr) {
                console.warn('Supabase vehicles fetch error:', fetchErr);
              }
            }

            if (!vehiclesLoadedFromDb && storedVehicles) {
              try {
                const parsedVehicles = JSON.parse(storedVehicles);
                if (Array.isArray(parsedVehicles) && parsedVehicles.length > 0) {
                  const cleanVehicles = parsedVehicles.filter(v => v && !String(v.id || '').startsWith('mock-'));
                  if (cleanVehicles.length > 0) {
                    setUserVehicles(cleanVehicles);
                    const exists = storedActiveId && cleanVehicles.some(v => v.id === storedActiveId);
                    setActiveVehicleId(exists ? storedActiveId : cleanVehicles[0].id);
                  } else {
                    setUserVehicles([]);
                    setActiveVehicleId(null);
                  }
                }
              } catch (_) {}
            }
          }
        }
      } catch (e) {
        console.warn('Storage load error:', e);
      } finally {
        if (isMounted) {
          setIsStorageReady(true);
        }
      }
    };

    loadStorage();
    return () => { isMounted = false; };
  }, []);

  // Language change handler with caching
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, lang).catch(() => {});
  };

  // Save vehicles when updated (only for authenticated users)
  useEffect(() => {
    if (!isStorageReady) return;
    if (currentUser && userVehicles && userVehicles.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY_USER_VEHICLES, JSON.stringify(userVehicles)).catch(() => {});
    } else if (!currentUser) {
      AsyncStorage.removeItem(STORAGE_KEY_USER_VEHICLES).catch(() => {});
    }
  }, [userVehicles, currentUser, isStorageReady]);

  // Save active vehicle ID when changed (only for authenticated users)
  useEffect(() => {
    if (!isStorageReady) return;
    if (currentUser && activeVehicleId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_VEHICLE_ID, String(activeVehicleId)).catch(() => {});
    } else if (!currentUser) {
      AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_VEHICLE_ID).catch(() => {});
    }
  }, [activeVehicleId, currentUser, isStorageReady]);

  // Save current user session when updated (after storage is ready)
  useEffect(() => {
    if (!isStorageReady) return;
    if (currentUser) {
      AsyncStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser)).catch(() => {});
      // Also sync profile modifications with offline local users database
      AsyncStorage.getItem(STORAGE_KEY_LOCAL_USERS).then((stored) => {
        if (stored) {
          try {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
              const idx = list.findIndex(u => u.email === currentUser.email || u.id === currentUser.id);
              if (idx !== -1) {
                list[idx] = { ...list[idx], ...currentUser };
                AsyncStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(list)).catch(() => {});
              }
            }
          } catch (_) {}
        }
      }).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
    }
  }, [currentUser, isStorageReady]);

  // Sync user cars on explicit login / profile update
  const handleSetCurrentUser = async (user) => {
    setCurrentUser(user);
    if (user) {
      if (user.email === 'customer@werash.com' || user.id === 'customer-admin') {
        setUserVehicles([CUSTOMER_ADMIN_COUPE]);
        setActiveVehicleId(CUSTOMER_ADMIN_COUPE.id);
      } else if (user.id === 'mock-youssef') {
        setUserVehicles(MOCK_VEHICLES);
        setActiveVehicleId(MOCK_VEHICLES[0].id);
      } else if (user.id) {
        // Fetch from Supabase for real user
        try {
          const { data: dbVehicles, error: dbErr } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (!dbErr && Array.isArray(dbVehicles) && dbVehicles.length > 0) {
            const mapped = dbVehicles.map(v => ({
              id: v.id,
              brand: v.brand,
              model: v.model,
              year: v.year || new Date().getFullYear().toString(),
              plateNumber: v.plate_number || '',
              plateNumberArabic: v.plate_number_arabic || '',
              cc: v.cc || '1600 CC',
              odometer: v.odometer || 0,
              isManual: !!v.is_manual,
              is4WD: false,
              hasHydraulicPS: false,
              hasTimingBelt: false,
              services: v.services && typeof v.services === 'object' ? v.services : {},
              logs: Array.isArray(v.logs) ? v.logs : [],
              isServiceSetup: Boolean(v.is_service_setup),
              notes: Array.isArray(v.notes) ? v.notes.join('[PAGE]') : (typeof v.notes === 'string' ? v.notes : ''),
              noteDate: Array.isArray(v.note_dates) ? v.note_dates.join('[PAGE]') : (typeof v.note_dates === 'string' ? v.note_dates : ''),
              noteImages: Array.isArray(v.note_images) ? v.note_images : [],
            }));
            setUserVehicles(mapped);
            const activeCar = dbVehicles.find(v => v.is_active) || mapped[0];
            setActiveVehicleId(activeCar.id);
          } else {
            setUserVehicles([]);
            setActiveVehicleId(null);
          }
        } catch (_) {
          setUserVehicles([]);
          setActiveVehicleId(null);
        }
      } else {
        setUserVehicles([]);
        setActiveVehicleId(null);
      }
    } else {
      setUserVehicles([]);
      setActiveVehicleId(null);
      AsyncStorage.multiRemove([
        STORAGE_KEY_CURRENT_USER,
        STORAGE_KEY_USER_VEHICLES,
        STORAGE_KEY_ACTIVE_VEHICLE_ID,
      ]).catch(() => {});
    }
  };

  // Handle explicit Log Out
  const handleLogOut = () => {
    supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    setUserVehicles([]);
    setActiveVehicleId(null);
    AsyncStorage.multiRemove([
      STORAGE_KEY_CURRENT_USER,
      STORAGE_KEY_USER_VEHICLES,
      STORAGE_KEY_ACTIVE_VEHICLE_ID,
    ]).catch(() => {});
  };

  // Robustly resolve active vehicle with fallback to userVehicles[0], strictly when user is authenticated
  const activeVehicle = useMemo(() => {
    if (!currentUser || !userVehicles || userVehicles.length === 0) return null;
    return userVehicles.find(v => v.id === activeVehicleId) || userVehicles[0];
  }, [currentUser, userVehicles, activeVehicleId]);

  const resolvedActiveVehicleId = activeVehicle?.id || null;

  useEffect(() => {
    if (currentTab !== 'community') {
      setIsCommunityNavHidden(false);
    }
  }, [currentTab]);

  // Global Realtime Subscription for incoming messages unread counter
  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadChatsCount(0);
      return;
    }

    const fetchGlobalUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('conversation_id')
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false);

        if (!error && data) {
          const uniqueConvIds = new Set(data.map(m => m.conversation_id).filter(Boolean));
          setUnreadChatsCount(uniqueConvIds.size);
        }
      } catch (_) {}
    };

    fetchGlobalUnreadCount();

    const globalDmChannel = supabase
      .channel(`global_unread_dms_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          fetchGlobalUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalDmChannel);
    };
  }, [currentUser?.id]);

  // Push Notifications: Register device token and handle notification banner tap
  useEffect(() => {
    if (currentUser?.id) {
      registerForPushNotificationsAsync(currentUser.id);
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data && (data.conversationId || data.senderId)) {
        setChatInitialUser({
          conversationId: data.conversationId || null,
          userId: data.senderId || null,
          name: data.senderName || null,
        });
        setChatsVisible(true);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [currentUser?.id]);

  const handleNavigate = (tab, targetSpecialistId = null) => {
    homeTranslateY.setValue(0);
    isHomeAtTopRef.current = true;
    setCurrentTab(tab);
    if (targetSpecialistId) {
      setExpandedSpecialistId(targetSpecialistId);
    }
  };

  const handleShareToFeed = (specialist) => {
    setActiveSpecialist(null);
    setPendingSharedSpecialist(specialist);
    setCurrentTab('community');
  };

  const handleShareInMessage = (specialist) => {
    setActiveSpecialist(null);
    setSpecialistForRecipientPicker(specialist);
    setRecipientPickerVisible(true);
  };

  const handleSelectChatRecipient = (recipient) => {
    setRecipientPickerVisible(false);
    setChatPendingSpecialist(specialistForRecipientPicker);
    setSpecialistForRecipientPicker(null);
    if (recipient.type === 'user') {
      setChatInitialUser(recipient);
    } else if (recipient.type === 'conversation') {
      setChatInitialUser({
        conversationId: recipient.conversationId,
        otherUserId: recipient.otherUserId,
        name: recipient.name,
        avatar: recipient.avatar,
      });
    }
    setChatsVisible(true);
  };

  if (!fontsLoaded || !splashFinished || !isStorageReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />
        <View style={styles.splashContent}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.splashLogo} 
            resizeMode="contain" 
          />
          <Image 
            source={require('./assets/Werash_wordmark.png')} 
            style={styles.splashWordmark} 
            resizeMode="contain" 
          />
          <Text style={[styles.splashTextArabic, fontsLoaded && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
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
            activeVehicleId={resolvedActiveVehicleId}
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
            activeVehicleId={resolvedActiveVehicleId}
            setActiveVehicleId={setActiveVehicleId}
          />
        );
      case 'mechanics':
        return (
          <MechanicsScreen 
            initialExpandedCardId={expandedSpecialistId} 
            onClearInitialExpanded={() => setExpandedSpecialistId(null)} 
            onSelectSpecialist={setActiveSpecialist}
            currentUser={currentUser}
            activeVehicleId={resolvedActiveVehicleId}
            userVehicles={userVehicles}
            selectedLanguage={selectedLanguage}
          />
        );
      case 'community':
        return (
          <CommunityScreen 
            currentUser={currentUser} 
            scrollToTopTrigger={communityScrollTrigger} 
            selectedLanguage={selectedLanguage}
            userVehicles={userVehicles}
            activeVehicleId={resolvedActiveVehicleId}
            onOpenSignIn={() => setSignInVisible(true)}
            onUpdateCurrentUser={handleSetCurrentUser}
            onToggleNavBar={setIsCommunityNavHidden}
            onSelectSpecialist={setActiveSpecialist}
            pendingSharedSpecialist={pendingSharedSpecialist}
            onClearPendingSharedSpecialist={() => setPendingSharedSpecialist(null)}
            unreadChatsCount={unreadChatsCount}
          />
        );
      case 'more':
        return (
          <SettingsScreen 
            currentUser={currentUser}
            onLogOut={handleLogOut}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectProfile={() => setProfileVisible(true)}
            onClose={() => setCurrentTab('home')}
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
    <View style={[styles.appContainer, (currentTab === 'home' || currentTab === 'more') && { backgroundColor: '#FFFFFF' }]}>
      {/* Animated Main Content Container (Moves Header + Home Content together on bounce) */}
      <Animated.View 
        style={styles.mainContentContainer}
      >
        {/* Global Persistent Header (Stays mounted, prevents reload animations) */}
        <Header 
          currentTab={currentTab}
          currentUser={currentUser} 
          onSetCurrentUser={handleSetCurrentUser} 
          signInVisible={signInVisible}
          onSetSignInVisible={setSignInVisible}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleSelectLanguage}
          onOpenSettings={() => setCurrentTab('more')}
          onOpenChats={() => setChatsVisible(true)}
          unreadChatsCount={unreadChatsCount}
        />

        {/* Core Page Layout switches underneath */}
        {renderScreen()}
      </Animated.View>

      {/* Custom Floating Bottom Navigation Bar */}
      {currentTab !== 'more' && (
        <BottomNavBar 
          activeTab={currentTab} 
          hidden={currentTab === 'community' && isCommunityNavHidden}
          unreadNotificationsCount={notifications.filter(n => !n.read).length}
          onTabPress={(tab) => {
            if (tab === 'notifications') {
              setNotificationsVisible(true);
              return;
            }
            if (tab === 'community' && currentTab === 'community') {
              setCommunityScrollTrigger(prev => prev + 1);
            }
            homeTranslateY.setValue(0);
            isHomeAtTopRef.current = true;
            setIsCommunityNavHidden(false);
            setCurrentTab(tab);
            setExpandedSpecialistId(null);
          }} 
        />
      )}

      {/* Notifications Drawer Modal */}
      <NotificationsModal 
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        selectedLanguage={selectedLanguage}
      />

      {/* Specialist Recipient Picker Modal */}
      <ChatRecipientPickerModal
        visible={recipientPickerVisible}
        onClose={() => {
          setRecipientPickerVisible(false);
          setSpecialistForRecipientPicker(null);
        }}
        specialist={specialistForRecipientPicker}
        currentUser={currentUser}
        selectedLanguage={selectedLanguage}
        onSelectRecipient={handleSelectChatRecipient}
      />

      {/* Global Chats Drawer Modal */}
      <ChatsModal 
        visible={chatsVisible}
        onClose={() => {
          setChatsVisible(false);
          setChatInitialUser(null);
          setChatPendingSpecialist(null);
        }}
        selectedLanguage={selectedLanguage}
        currentUser={currentUser}
        initialUser={chatInitialUser}
        pendingSpecialist={chatPendingSpecialist}
        onClearPendingSpecialist={() => setChatPendingSpecialist(null)}
        onSelectSpecialist={setActiveSpecialist}
        onUnreadCountChange={(count) => {
          setUnreadChatsCount(prev => (prev !== count ? count : prev));
        }}
        activeVehicle={activeVehicle}
        onShareToFeed={handleShareToFeed}
        onShareInMessage={handleShareInMessage}
      />

      {/* Specialist Detail Modal */}
      {activeSpecialist && (
        <SpecialistDetailModal 
          specialist={activeSpecialist} 
          onClose={() => setActiveSpecialist(null)} 
          selectedLanguage={selectedLanguage}
          activeVehicle={activeVehicle}
          onShareToFeed={handleShareToFeed}
          onShareInMessage={handleShareInMessage}
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
        onSaveProfile={handleSetCurrentUser} 
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
  splashWordmark: {
    width: 232,
    height: 76,
    tintColor: '#FFFFFF',
    marginTop: 6,
    marginBottom: 4,
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
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    color: 'rgba(77, 110, 79, 0.3)',
  }
});
