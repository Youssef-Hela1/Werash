import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { StyleSheet, View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Image, Animated, Modal, Platform, FlatList, Alert, PanResponder, Dimensions, Easing } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import BouncyPressable from '../components/BouncyPressable';
import { ALL_MECHANICS } from '../data/mechanicsData';
import { getBrandOrigin } from '../data/brandOrigins';
import { getSpecialistCover, getMechanicBrandLogo, getSpecialistCategoryIcon } from '../data/specialistHelpers';

const REGION_KEYWORDS = {
  central_north_cairo: [
    'central', 'north cairo', 'downtown', 'ramses', 'abbaseya', 'abbasiya', 'shubra', 'shubra el kheima', 'shubra el-kheima', 'shubra elkheima', 'rod el farag', 'zamalek', 'wust el balad',
    'وسط', 'شمال القاهرة', 'وسط البلد', 'رمسيس', 'العباسية', 'شبرا', 'شبرا الخيمة', 'روض الفرج', 'الزمالك'
  ],
  east_cairo: [
    'east cairo', 'heliopolis', 'nasr city', 'nozha', 'sheraton', 'ain shams', 'matariya', 'matareya', 'el marg', 'marg',
    'شرق القاهرة', 'مصر الجديدة', 'مدينة نصر', 'النزهة', 'شيراتون', 'عين شمس', 'المطرية', 'المرج'
  ],
  new_cairo_eastern: [
    'new cairo', 'eastern cities', 'first settlement', 'third settlement', 'fifth settlement', 'settlement', 'tagamoa', 'rehab', 'madinaty', 'el shorouk', 'shorouk', 'badr',
    'القاهرة الجديدة', 'المدن الشرقية', 'التجمع الأول', 'التجمع الثالث', 'التجمع الخامس', 'التجمع', 'الرحاب', 'مدينتي', 'الشروق', 'بدر'
  ],
  south_cairo: [
    'south cairo', 'maadi', 'zahraa el maadi', 'mokattam', 'old cairo', 'manial', 'basateen', 'dar el salam', 'helwan', '15 may', '15th of may', 'fustat',
    'جنوب القاهرة', 'المعادي', 'زهراء المعادي', 'المقطم', 'مصر القديمة', 'المنيل', 'البساتين', 'دار السلام', 'حلوان', '١٥ مايو', '15 مايو', 'الفسطاط'
  ],
  giza_districts: [
    'giza', 'nearby districts', 'dokki', 'agouza', 'mohandessin', 'imbaba', 'warraq', 'haram', 'faisal', 'boulaq el dakrour', 'omraneya', 'talbiya', 'mounib', 'kerdasa',
    'الجيزة', 'ضواحيها', 'الأحياء المجاورة', 'الدقي', 'العجوزة', 'المهندسين', 'إمبابة', 'الوراق', 'الهرم', 'فيصل', 'بولاق الدكرور', 'العمرانية', 'الطالبية', 'المنيب', 'كرداسة'
  ],
  october_zayed: [
    'october', 'sheikh zayed', 'zayed', '6th of october', 'hadayek october', 'new october', 'new zayed',
    'أكتوبر', 'الشيخ زايد', 'زايد', '٦ أكتوبر', 'حدائق أكتوبر', 'أكتوبر الجديدة', 'زايد الجديدة'
  ],
};

const CategoryPill = React.memo(function CategoryPill({ cat, isSelected, onSelect, isRtl, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onSelect(cat.id)}
      style={styles.categoryPillBase}
    >
      <View
        style={[
          styles.categoryPillInner,
          isSelected ? styles.categoryPillInnerSelected : styles.categoryPillInnerUnselected,
          isRtl && { flexDirection: 'row-reverse' },
        ]}
      >
        <Ionicons
          name={cat.icon}
          size={15}
          color={isSelected ? '#FFFFFF' : '#285834'}
        />
        <Text
          style={[
            styles.categoryPillText,
            isSelected ? styles.categoryPillTextSelected : styles.categoryPillTextUnselected,
            isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11.5, letterSpacing: 0 },
          ]}
        >
          {cat.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const VehicleToggle = React.memo(function VehicleToggle({
  filterByVehicle,
  onToggle,
  activeVehicle,
  isRtl,
  styles,
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const toggleAnim = useRef(new Animated.Value(filterByVehicle ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: filterByVehicle ? 0 : 1,
      friction: 9,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [filterByVehicle]);

  const pillWidth = containerWidth > 0 ? (containerWidth - 8) / 2 : 0;

  const pillTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isRtl ? [0, -pillWidth] : [0, pillWidth],
  });

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 1) {
          setContainerWidth(w);
        }
      }}
      style={[styles.vehicleToggleContainer, isRtl && { flexDirection: 'row-reverse' }]}
    >
      {/* Animated Sliding Selection Pill */}
      {pillWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.vehicleToggleSlider,
            {
              width: pillWidth,
              transform: [{ translateX: pillTranslateX }],
            },
            isRtl ? { right: 4, left: undefined } : { left: 4 },
          ]}
        />
      )}

      {/* Tab 0: My Vehicle */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onToggle(true)}
        style={[styles.vehicleToggleTab, isRtl && { flexDirection: 'row-reverse' }]}
      >
        <Ionicons
          name="car-sport"
          size={15}
          color={filterByVehicle ? '#003514' : '#A8C7AA'}
          style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }}
        />
        <Text
          style={[
            styles.vehicleToggleText,
            filterByVehicle ? styles.vehicleToggleTextActive : styles.vehicleToggleTextInactive,
            isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11, letterSpacing: 0 },
          ]}
        >
          {isRtl
            ? (activeVehicle ? `سيارتي ${activeVehicle.brand.toUpperCase()}` : 'سيارتي هيونداي')
            : (activeVehicle ? `MY ${activeVehicle.brand.toUpperCase()}` : 'MY HYUNDAI')}
        </Text>
      </TouchableOpacity>

      {/* Tab 1: All Specialists */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onToggle(false)}
        style={styles.vehicleToggleTab}
      >
        <Text
          style={[
            styles.vehicleToggleText,
            !filterByVehicle ? styles.vehicleToggleTextActive : styles.vehicleToggleTextInactive,
            isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11, letterSpacing: 0 },
          ]}
        >
          {isRtl ? 'جميع الخبراء' : 'ALL SPECIALISTS'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const SpecialistsHeader = React.memo(function SpecialistsHeader({
  topInset,
  isRtl,
  activeVehicle,
  filterByVehicle,
  onToggleFilterByVehicle,
  searchQuery,
  onSearchChange,
  onClearSearch,
  selectedLocation,
  onOpenLocationModal,
  categories,
  selectedCategory,
  onSelectCategory,
  styles,
}) {
  const categoryScrollOffset = useRef(0);

  return (
    <View style={styles.headerWrapper}>
      {/* Top bounce backdrop behind status bar for iOS overscroll - scrolls away with header */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -1000,
          left: 0,
          right: 0,
          height: 1000,
          backgroundColor: '#003816',
        }}
      />

      {/* 1. Curved Deep Forest-Green Hero Header */}
      <View style={styles.curvedHeader}>
        <LinearGradient
          colors={['#003816', '#00260D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.headerContent, { paddingTop: topInset + 6 }]}>
          {/* Animated Vehicle Filter Toggle Selector */}
          <VehicleToggle
            filterByVehicle={filterByVehicle}
            onToggle={onToggleFilterByVehicle}
            activeVehicle={activeVehicle}
            isRtl={isRtl}
            styles={styles}
          />

          {/* Search and Location Bar */}
          <View style={[
            styles.searchBarWrapper,
            isRtl && { flexDirection: 'row-reverse', paddingLeft: 6, paddingRight: 16 }
          ]}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#003514"
              style={isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }}
            />
            <TextInput
              style={[
                styles.searchBarInput,
                isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 13 }
              ]}
              placeholder={isRtl ? 'ابحث عن فنيين، ماركات، أو مشاكل...' : 'Search specialists, brands, or symptoms...'}
              placeholderTextColor="#8E9990"
              value={searchQuery}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={onClearSearch} style={styles.searchClearBtn}>
                <Ionicons name="close-circle" size={17} color="#8E9990" />
              </TouchableOpacity>
            )}
            {/* Circular Green Location Button Inside Right End */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.locationCircleBtn,
                selectedLocation !== 'overall' && styles.locationCircleBtnActive
              ]}
              onPress={onOpenLocationModal}
              accessibilityRole="button"
              accessibilityLabel="Location Filter"
            >
              <Ionicons
                name="location-outline"
                size={20}
                color="#FFFFFF"
              />
              {selectedLocation !== 'overall' && (
                <View style={styles.activeLocationDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Category Filters (Sits below curved header on white page background) */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            categoryScrollOffset.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.categoriesScrollContent,
            isRtl && { flexDirection: 'row-reverse' }
          ]}
        >
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              cat={cat}
              isSelected={cat.id === selectedCategory}
              onSelect={onSelectCategory}
              isRtl={isRtl}
              styles={styles}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

export default function MechanicsScreen({ 
  initialExpandedCardId, 
  onClearInitialExpanded, 
  onSelectSpecialist,
  currentUser,
  activeVehicleId,
  userVehicles,
  selectedLanguage
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [filterByVehicle, setFilterByVehicle] = useState(true);

  // Deferred values allow taps and pill animations to run smoothly at 60fps without waiting for list filtering
  const deferredCategory = useDeferredValue(selectedCategory);
  const deferredFilterByVehicle = useDeferredValue(filterByVehicle);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleToggleFilterByVehicle = useCallback((val) => {
    setFilterByVehicle(val);
  }, []);

  const handleSelectCategory = useCallback((catId) => {
    setSelectedCategory(catId);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  const [selectedLocation, setSelectedLocation] = useState('overall');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);
  const isOpeningRef = useRef(false);

  const openLocationModal = useCallback(() => {
    if (isClosingRef.current) return;
    isOpeningRef.current = true;
    translateY.setValue(SCREEN_HEIGHT);
    setLocationModalVisible(true);

    requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        isOpeningRef.current = false;
      });
    });
  }, [translateY]);

  const closeLocationModal = useCallback((onFinish) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setLocationModalVisible(false);
      isClosingRef.current = false;
      if (typeof onFinish === 'function') {
        onFinish();
      }
    });
  }, [translateY]);

  const handleSelectLocation = useCallback(async (locId) => {
    if (isClosingRef.current) return;

    if (locId === 'nearest') {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(isRtl ? 'عذراً' : 'Sorry', isRtl ? 'نحتاج إذن للوصول إلى موقعك.' : 'Permission to access location was denied');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords(location.coords);
        closeLocationModal(() => {
          setSelectedLocation('nearest');
        });
      } catch (e) {
        Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'لم نتمكن من تحديد موقعك.' : 'Could not fetch your location');
      }
    } else {
      closeLocationModal(() => {
        setSelectedLocation(locId);
      });
    }
  }, [closeLocationModal, isRtl]);

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          closeLocationModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 24,
            mass: 0.8,
            stiffness: 240,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (isClosingRef.current) return;
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          mass: 0.8,
          stiffness: 240,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          closeLocationModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 24,
            mass: 0.8,
            stiffness: 240,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (isClosingRef.current) return;
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          mass: 0.8,
          stiffness: 240,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;
  const [userCoords, setUserCoords] = useState(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const flatListRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const showScrollToTopRef = useRef(false);
  const backToTopAnim = useRef(new Animated.Value(0)).current;
  const isScrolledRef = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    Animated.spring(backToTopAnim, {
      toValue: showScrollToTop ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [showScrollToTop, backToTopAnim]);

  const handleScrollToTop = () => {
    if (flatListRef.current) {
      const list = flatListRef.current.scrollToOffset ? flatListRef.current : flatListRef.current?.getNode?.();
      if (list?.scrollToOffset) {
        try {
          list.scrollToOffset({ offset: 0, animated: true });
        } catch (e) {
          flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
        }
      }
    }
  };

  useEffect(() => {
    showScrollToTopRef.current = false;
    setShowScrollToTop(false);

    if (flatListRef.current) {
      const list = flatListRef.current.scrollToOffset ? flatListRef.current : flatListRef.current?.getNode?.();
      if (list?.scrollToOffset) {
        try {
          list.scrollToOffset({ offset: 0, animated: false });
        } catch (e) {}
      }
    }
  }, [deferredCategory, deferredSearchQuery, deferredFilterByVehicle, selectedLocation]);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24));

  const activeVehicle = (currentUser && userVehicles && userVehicles.length > 0)
    ? (userVehicles.find((v) => v.id === activeVehicleId) || userVehicles[0])
    : null;

  const locations = [
    { 
      id: 'nearest', 
      label: isRtl ? 'الأقرب إليّ' : 'Nearest to me',
      subtext: isRtl ? 'استخدم موقعك الحالي' : 'Use your current location',
    },
    { 
      id: 'overall', 
      label: isRtl ? 'جميع المناطق' : 'All Areas',
      subtext: isRtl ? 'كل أنحاء القاهرة الكبرى' : 'All of Greater Cairo',
    },
    { 
      id: 'central_north_cairo', 
      label: isRtl ? 'وسط وشمال القاهرة' : 'Central & North Cairo',
      subtext: isRtl 
        ? 'وسط البلد، رمسيس، العباسية، شبرا، شبرا الخيمة، روض الفرج، الزمالك' 
        : 'Downtown, Ramses, Abbaseya, Shubra, Shubra El Kheima, Rod El Farag, Zamalek',
    },
    { 
      id: 'east_cairo', 
      label: isRtl ? 'شرق القاهرة' : 'East Cairo',
      subtext: isRtl 
        ? 'مصر الجديدة، مدينة نصر، النزهة، شيراتون، عين شمس، المطرية، المرج' 
        : 'Heliopolis, Nasr City, Nozha, Sheraton, Ain Shams, Matariya, El Marg',
    },
    { 
      id: 'new_cairo_eastern', 
      label: isRtl ? 'القاهرة الجديدة والمدن الشرقية' : 'New Cairo & Eastern Cities',
      subtext: isRtl 
        ? 'التجمع الأول والثالث والخامس، الرحاب، مدينتي، الشروق، بدر' 
        : 'First, Third and Fifth Settlements, Rehab, Madinaty, El Shorouk, Badr',
    },
    { 
      id: 'south_cairo', 
      label: isRtl ? 'جنوب القاهرة' : 'South Cairo',
      subtext: isRtl 
        ? 'المعادي، زهراء المعادي، المقطم، مصر القديمة، المنيل، البساتين، دار السلام، حلوان، ١٥ مايو' 
        : 'Maadi, Zahraa El Maadi, Mokattam, Old Cairo, Manial, Basateen, Dar El Salam, Helwan, 15 May',
    },
    { 
      id: 'giza_districts', 
      label: isRtl ? 'الجيزة وضواحيها' : 'Giza & Nearby Districts',
      subtext: isRtl 
        ? 'الدقي، العجوزة، المهندسين، إمبابة، الوراق، الهرم، فيصل، بولاق الدكرور، العمرانية، الطالبية، المنيب، كرداسة' 
        : 'Dokki, Agouza, Mohandessin, Imbaba, Warraq, Haram, Faisal, Boulaq El Dakrour, Omraneya, Talbiya, Mounib, Kerdasa',
    },
    { 
      id: 'october_zayed', 
      label: isRtl ? 'أكتوبر والشيخ زايد' : 'October & Sheikh Zayed',
      subtext: isRtl 
        ? '٦ أكتوبر، حدائق أكتوبر، أكتوبر الجديدة، الشيخ زايد، زايد الجديدة' 
        : '6th of October, Hadayek October, New October, Sheikh Zayed, New Zayed',
    },
  ];

  useEffect(() => {
    if (initialExpandedCardId) {
      const found = ALL_MECHANICS.find((spec) => spec.id === initialExpandedCardId);
      if (found) {
        onSelectSpecialist && onSelectSpecialist(found);
      }
      onClearInitialExpanded && onClearInitialExpanded();
    }
  }, [initialExpandedCardId, onClearInitialExpanded, onSelectSpecialist]);

  const categories = useMemo(() => [
    { id: 'overall', label: isRtl ? 'الكل' : 'OVERALL', icon: 'grid-outline' },
    { id: 'mechanical', label: isRtl ? 'ميكانيكا' : 'MECHANICAL', icon: 'build-outline' },
    { id: 'body', label: isRtl ? 'سمكرة ودهان' : 'BODY SHOP', icon: 'car-outline' },
    { id: 'suspension', label: isRtl ? 'عفشة وتعليق' : 'SUSPENSION', icon: 'disc-outline' },
    { id: 'electrician', label: isRtl ? 'كهرباء سيارات' : 'ELECTRICIAN', icon: 'flash-outline' },
    { id: 'parts', label: isRtl ? 'قطع غيار' : 'PARTS', icon: 'cog-outline' },
  ], [isRtl]);

  const filteredSpecialists = useMemo(() => {
    const list = ALL_MECHANICS.filter((spec) => {
      // 1. Category Filter using deferredCategory so tab switch is immediate
      const matchesCategory =
        deferredCategory === 'overall' ||
        spec.category === deferredCategory ||
        (Array.isArray(spec.categories) && spec.categories.includes(deferredCategory));

      // 2. Search Query Filter using deferredSearchQuery
      const query = deferredSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (spec.name && spec.name.toLowerCase().includes(query)) ||
        (spec.nameAr && spec.nameAr.toLowerCase().includes(query)) ||
        (spec.specialty && spec.specialty.toLowerCase().includes(query)) ||
        (spec.specialtyAr && spec.specialtyAr.toLowerCase().includes(query)) ||
        (spec.location && spec.location.toLowerCase().includes(query)) ||
        (spec.locationAr && spec.locationAr.toLowerCase().includes(query)) ||
        (spec.carOrigin && spec.carOrigin.toLowerCase().includes(query)) ||
        (spec.phone && spec.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')));

      // 3. Vehicle Filter using deferredFilterByVehicle
      let matchesVehicle = true;
      if (deferredFilterByVehicle && activeVehicle) {
        const brand = (activeVehicle.brand || '').toLowerCase().trim();
        const origin = getBrandOrigin(activeVehicle.brand);
        const originLower = origin ? origin.toLowerCase() : null;

        const matchesOrigin = originLower && spec.carOrigin && spec.carOrigin.toLowerCase().includes(originLower);
        const isOverall = spec.carOrigin === 'Overall' || (spec.carOrigin && spec.carOrigin.toLowerCase().includes('overall'));

        const inName = (spec.name && spec.name.toLowerCase().includes(brand)) ||
                       (spec.nameAr && spec.nameAr.toLowerCase().includes(brand));
        const inSpecialty = (spec.specialty && spec.specialty.toLowerCase().includes(brand)) ||
                            (spec.specialtyAr && spec.specialtyAr.toLowerCase().includes(brand));
        const inDesc = (spec.description && spec.description.toLowerCase().includes(brand)) ||
                       (spec.descriptionAr && spec.descriptionAr.toLowerCase().includes(brand));

        matchesVehicle = matchesOrigin || isOverall || inName || inSpecialty || inDesc;
      }

      // 4. Location Filter (6 areas + all + nearest)
      const matchesLocation =
        selectedLocation === 'overall' ||
        selectedLocation === 'nearest' ||
        spec.region === selectedLocation ||
        (() => {
          const keywords = REGION_KEYWORDS[selectedLocation] || [];
          const locCombined = `${spec.location || ''} ${spec.locationAr || ''} ${spec.area || ''}`.toLowerCase();
          return keywords.some((kw) => locCombined.includes(kw.toLowerCase()));
        })();

      return matchesCategory && matchesSearch && matchesVehicle && matchesLocation;
    });

    const distanceCache = {};

    list.sort((a, b) => {
      if (selectedLocation === 'nearest' && userCoords) {
        const getDistanceFor = (spec) => {
          if (distanceCache[spec.id] !== undefined) return distanceCache[spec.id];
          if (!spec.url) return distanceCache[spec.id] = Infinity;
          const latM = spec.url.match(/!3d([-.\d]+)/);
          const lngM = spec.url.match(/!4d([-.\d]+)/);
          if (latM && lngM) {
            const lat = parseFloat(latM[1]);
            const lng = parseFloat(lngM[1]);
            const R = 6371; 
            const dLat = (lat - userCoords.latitude) * Math.PI / 180;
            const dLon = (lng - userCoords.longitude) * Math.PI / 180;
            const aVal = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(userCoords.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            return distanceCache[spec.id] = R * (2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1-aVal)));
          }
          return distanceCache[spec.id] = Infinity;
        };

        const distA = getDistanceFor(a);
        const distB = getDistanceFor(b);

        const getDistanceBand = (dist) => {
          if (dist <= 5) return 1;
          if (dist <= 12) return 2;
          if (dist <= 20) return 3;
          if (dist <= 35) return 4;
          return 5;
        };

        const bandA = getDistanceBand(distA);
        const bandB = getDistanceBand(distB);
        
        if (bandA !== bandB) {
          return bandA - bandB;
        }
      }

      let aPriority = 0;
      let bPriority = 0;

      if (activeVehicle && (activeVehicle.brand || '').toLowerCase().trim() === 'hyundai') {
        const aName = `${a.name || ''} ${a.nameAr || ''}`.toLowerCase();
        const bName = `${b.name || ''} ${b.nameAr || ''}`.toLowerCase();
        const isRelevant = (name) => name.includes('hyundai') || name.includes('هيونداي') || name.includes('korean') || name.includes('كوري');
        
        aPriority = isRelevant(aName) ? 1 : 0;
        bPriority = isRelevant(bName) ? 1 : 0;
      }

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      const aRating = parseFloat(a.rating) || 0;
      const bRating = parseFloat(b.rating) || 0;
      
      if (aRating !== bRating) {
        return bRating - aRating;
      }

      const aReviews = parseInt(a.reviews) || 0;
      const bReviews = parseInt(b.reviews) || 0;
      
      return bReviews - aReviews;
    });

    return list;
  }, [deferredCategory, deferredSearchQuery, deferredFilterByVehicle, activeVehicle, selectedLocation, userCoords]);

  const renderSpecialistItem = ({ item: specialist }) => {
    return (
      <View
        key={specialist.id}
        style={styles.cardShadow}
      >
        <BouncyPressable
          onPress={() => onSelectSpecialist && onSelectSpecialist({ ...specialist, _filterByVehicle: filterByVehicle, _selectedCategory: selectedCategory })}
          style={styles.card}
        >
          {/* Workshop Cover Image */}
          {(() => {
            const brandLogo = filterByVehicle ? getMechanicBrandLogo(specialist, activeVehicle) : null;
            const specialtyIcon = getSpecialistCategoryIcon(specialist, selectedCategory);

            return (
              <View style={styles.cardCover}>
                {/* Fallback "No image" watermark placeholder in the center */}
                <View style={styles.noImagePlaceholder} pointerEvents="none">
                  <View style={styles.noImageIconBadge}>
                    <Ionicons
                      name="image-outline"
                      size={22}
                      color={isDarkMode ? '#526956' : '#94A396'}
                    />
                  </View>
                  <Text style={[styles.noImageText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 10 }]}>
                    {isRtl ? 'لا توجد صورة' : 'No image'}
                  </Text>
                </View>

                {/* Badges in top-left (or top-right for RTL) */}
                <View
                  style={[
                    styles.cardBadgesRow,
                    isRtl && { flexDirection: 'row-reverse', left: undefined, right: 9 }
                  ]}
                >
                  {brandLogo && (
                    <View style={styles.cardBrandBadge}>
                      <Image source={brandLogo} resizeMode="contain" style={styles.cardBrandLogo} />
                    </View>
                  )}
                  <View style={styles.cardCategoryBadge}>
                    <Ionicons name={specialtyIcon} size={13} color={colors.forestGreen || colors.bgBrand} />
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Card Content Area */}
          <View style={styles.cardDetails}>
            {/* Top Info Area */}
            <View style={isRtl && { alignItems: 'flex-end' }}>
              {/* Name */}
              <Text
                style={[
                  styles.cardName,
                  isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 15 }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isRtl ? (specialist.nameAr || specialist.name) : specialist.name}
              </Text>

              {/* Specialty */}
              <Text
                style={[
                  styles.cardSpecialty,
                  isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 10.5 }
                ]}
                numberOfLines={1}
              >
                {isRtl ? (specialist.specialtyAr || specialist.specialty) : specialist.specialty}
              </Text>

              {/* Location Row */}
              <View style={[styles.locationRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons
                  name="location-sharp"
                  size={12}
                  color={colors.textMuted}
                  style={[styles.locationIcon, isRtl ? { marginLeft: 2, marginRight: 0 } : { marginRight: 2 }]}
                />
                <Text
                  style={[
                    styles.cardLocation,
                    isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11.5 }
                  ]}
                  numberOfLines={1}
                >
                  {isRtl ? (specialist.locationAr || specialist.location) : specialist.location}
                </Text>
              </View>
            </View>

            {/* Bottom Info Area */}
            <View>
              {/* Thin Divider Line */}
              <View style={styles.cardDivider} />

              {/* Rating Row */}
              <View style={styles.statsRow}>
                {/* Rating */}
                <View style={[styles.ratingContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="star" size={12} color={colors.gold} style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }} />
                  <Text
                    style={[
                      styles.ratingText,
                      isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11.5 }
                    ]}
                  >
                    {specialist.rating || '4.5'}{' '}
                    <Text style={styles.reviewsText}>
                      ({isRtl ? `${specialist.reviews || '0'} تقييم` : `${specialist.reviews || '0'}`})
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BouncyPressable>
      </View>
    );
  };

  const memoizedHeader = useMemo(() => (
    <SpecialistsHeader
      topInset={topInset}
      isRtl={isRtl}
      activeVehicle={activeVehicle}
      filterByVehicle={filterByVehicle}
      onToggleFilterByVehicle={handleToggleFilterByVehicle}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onClearSearch={handleClearSearch}
      selectedLocation={selectedLocation}
      onOpenLocationModal={openLocationModal}
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={handleSelectCategory}
      styles={styles}
    />
  ), [
    topInset,
    isRtl,
    activeVehicle,
    filterByVehicle,
    handleToggleFilterByVehicle,
    searchQuery,
    handleClearSearch,
    selectedLocation,
    openLocationModal,
    categories,
    selectedCategory,
    handleSelectCategory,
    styles,
  ]);

  const renderEmpty = () => (
    <View style={styles.noResultsContainer}>
      <Ionicons name="search-outline" size={48} color="rgba(77, 110, 79, 0.18)" style={{ marginBottom: 12 }} />
      <Text style={[styles.noResultsText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 14 }]}>
        {isRtl ? 'لم نجد خبراء يطابقون خيارات البحث.' : 'No experts found matching your search.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isScrolled ? (colors.white === '#FFFFFF' ? 'dark-content' : 'light-content') : 'light-content'} 
        translucent 
        backgroundColor="transparent" 
      />

      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Floating Back to Top Button */}
          <Animated.View
            pointerEvents={showScrollToTop ? 'auto' : 'none'}
            style={[
              styles.backToTopContainer,
              {
                top: topInset + 12,
                opacity: backToTopAnim,
                transform: [
                  {
                    translateY: backToTopAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, 0],
                    }),
                  },
                  {
                    scale: backToTopAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <BouncyPressable
              onPress={handleScrollToTop}
              style={[styles.backToTopButton, isRtl && { flexDirection: 'row-reverse' }]}
              activeOpacity={0.85}
            >
              <Ionicons 
                name="arrow-up" 
                size={14} 
                color="#FFFFFF" 
                style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} 
              />
              <Text style={[styles.backToTopText, isRtl && styles.backToTopTextArabic]}>
                {isRtl ? 'العودة للأعلى' : 'Back to Top'}
              </Text>
            </BouncyPressable>
          </Animated.View>

          {/* Specialists Card List with scrollable HeaderComponent */}
          <Animated.FlatList
            ref={flatListRef}
            data={filteredSpecialists}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={filteredSpecialists.length > 0 ? styles.columnWrapper : undefined}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
            ListHeaderComponent={memoizedHeader}
            ListEmptyComponent={renderEmpty}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { 
                useNativeDriver: true,
                listener: (event) => {
                  const offsetY = event?.nativeEvent?.contentOffset?.y || 0;
                  const shouldShow = offsetY > 350;
                  if (shouldShow !== showScrollToTopRef.current) {
                    showScrollToTopRef.current = shouldShow;
                    setShowScrollToTop(shouldShow);
                  }
                  const pastHeader = offsetY > (topInset + 40);
                  if (pastHeader !== isScrolledRef.current) {
                    isScrolledRef.current = pastHeader;
                    setIsScrolled(pastHeader);
                  }
                }
              }
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderSpecialistItem}
          />

          {/* Service Location Bottom Sheet */}
          {locationModalVisible && (
            <Modal
              visible={locationModalVisible}
              animationType="none"
              transparent
              statusBarTranslucent
              onRequestClose={() => closeLocationModal()}
            >
              <View style={styles.sheetOverlay}>
                {/* Dimmed, Softly Blurred Backdrop that fades in/out with the sheet */}
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: translateY.interpolate({
                        inputRange: [0, SCREEN_HEIGHT * 0.6],
                        outputRange: [1, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.45)' }]} />
                  <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    onPress={() => closeLocationModal()} 
                    activeOpacity={1} 
                  />
                </Animated.View>

                {/* Animated White Bottom Sheet */}
                <Animated.View 
                  style={[
                    styles.bottomSheet,
                    {
                      paddingBottom: Math.max(insets.bottom, 16) + 8 + 120,
                      marginBottom: -120,
                      transform: [{ translateY }]
                    }
                  ]}
                >
                  {/* Top Drag Handle Bar with dedicated PanResponder */}
                  <View {...handlePanResponder.panHandlers} style={styles.dragHandleHitBox}>
                    <View style={styles.dragHandle} />
                  </View>

                  {/* Fixed Header Section (also supports dragging) */}
                  <View 
                    {...headerPanResponder.panHandlers}
                    style={[styles.sheetHeader, isRtl && { flexDirection: 'row-reverse' }]}
                  >
                    <View style={[styles.sheetHeaderTitles, isRtl && { alignItems: 'flex-end', paddingRight: 0, paddingLeft: 12 }]}>
                      <Text style={[styles.sheetTitle, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 18, textAlign: 'right' }]}>
                        {isRtl ? 'منطقة الخدمة' : 'Service location'}
                      </Text>
                      <Text style={[styles.sheetSubtitle, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 12, textAlign: 'right' }]}>
                        {isRtl ? 'اختر منطقة في القاهرة الكبرى' : 'Choose an area in Greater Cairo'}
                      </Text>
                    </View>

                    {/* Circular Close Button */}
                    <TouchableOpacity 
                      onPress={() => closeLocationModal()}
                      activeOpacity={0.7}
                      style={styles.sheetCloseButton}
                      accessibilityLabel="Close"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={18} color="#4B5563" />
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable Content: Nearest Row + AREAS Section */}
                  <ScrollView 
                    style={styles.sheetScroll}
                    contentContainerStyle={styles.sheetScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* "Nearest to me" Pale Sage Row */}
                    {(() => {
                      const nearestLoc = locations.find((l) => l.id === 'nearest');
                      const isNearestSelected = selectedLocation === 'nearest';
                      return (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSelectLocation('nearest')}
                          style={[
                            styles.nearestRow,
                            isNearestSelected && styles.nearestRowSelected,
                            isRtl && { flexDirection: 'row-reverse' }
                          ]}
                        >
                          {/* Navigation Icon Tile */}
                          <View style={[
                            styles.locationIconTile,
                            isNearestSelected && styles.locationIconTileSelected,
                            isRtl ? { marginLeft: 12 } : { marginRight: 12 }
                          ]}>
                            <Ionicons name="navigate" size={18} color="#003514" />
                          </View>

                          {/* Titles */}
                          <View style={[styles.locationTextContainer, isRtl && { alignItems: 'flex-end' }]}>
                            <Text style={[
                              styles.nearestTitle,
                              isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 13.5, textAlign: 'right' }
                            ]}>
                              {nearestLoc?.label || (isRtl ? 'الأقرب إليّ' : 'Nearest to me')}
                            </Text>
                            <Text style={[
                              styles.nearestSubtitle,
                              isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11, textAlign: 'right' }
                            ]}>
                              {nearestLoc?.subtext || (isRtl ? 'استخدم موقعك الحالي' : 'Use your current location')}
                            </Text>
                          </View>

                          {/* Radio Indicator */}
                          <View style={[
                            styles.radioIndicator,
                            isNearestSelected && styles.radioIndicatorSelected
                          ]}>
                            {isNearestSelected && (
                              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })()}

                    {/* Small Grey "AREAS" Label */}
                    <Text style={[
                      styles.areasSectionLabel,
                      isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11, textAlign: 'right' }
                    ]}>
                      {isRtl ? 'المناطق' : 'AREAS'}
                    </Text>

                    {/* Region Rows */}
                    {locations.filter((l) => l.id !== 'nearest').map((loc) => {
                      const isSelected = loc.id === selectedLocation;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          activeOpacity={0.8}
                          onPress={() => handleSelectLocation(loc.id)}
                          style={[
                            styles.regionRow,
                            isSelected && styles.regionRowSelected,
                            isRtl && { flexDirection: 'row-reverse' }
                          ]}
                        >
                          {/* Small Green Location Icon Inside Pale Tile */}
                          <View style={[
                            styles.locationIconTile,
                            isSelected && styles.locationIconTileSelected,
                            isRtl ? { marginLeft: 12 } : { marginRight: 12 }
                          ]}>
                            <Ionicons 
                              name={loc.id === 'overall' ? 'globe-outline' : 'location-sharp'} 
                              size={18} 
                              color={isSelected ? '#003514' : '#1E4327'} 
                            />
                          </View>

                          {/* Clear Region Name and District Descriptions */}
                          <View style={[styles.locationTextContainer, isRtl && { alignItems: 'flex-end' }]}>
                            <Text style={[
                              styles.regionName,
                              isSelected && styles.regionNameSelected,
                              isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 13.5, textAlign: 'right' }
                            ]}>
                              {loc.label}
                            </Text>
                            {loc.subtext ? (
                              <Text style={[
                                styles.regionDescription,
                                isSelected && styles.regionDescriptionSelected,
                                isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11, textAlign: 'right' }
                              ]}>
                                {loc.subtext}
                              </Text>
                            ) : null}
                          </View>

                          {/* Radio Indicator on Right */}
                          <View style={[
                            styles.radioIndicator,
                            isSelected && styles.radioIndicatorSelected
                          ]}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              </View>
            </Modal>
          )}

          {/* Expanded Specialist Overlay is rendered at root level in App.js */}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  curvedHeader: {
    width: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#003514',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  vehicleToggleContainer: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 199, 170, 0.38)',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  vehicleToggleSlider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 3,
  },
  vehicleToggleTab: {
    flex: 1,
    height: '100%',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  vehicleToggleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  vehicleToggleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  vehicleToggleTextActive: {
    color: '#003514',
  },
  vehicleToggleTextInactive: {
    color: '#A8C7AA',
  },
  searchBarWrapper: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    fontWeight: '500',
    color: '#1E2D1F',
    paddingVertical: 0,
    paddingRight: 8,
  },
  searchClearBtn: {
    padding: 4,
    marginRight: 4,
  },
  locationCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#285834',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  locationCircleBtnActive: {
    backgroundColor: '#003514',
    borderWidth: 1.5,
    borderColor: '#A8C7AA',
  },
  activeLocationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#285834',
  },
  categoriesSection: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.screenBg,
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  categoryPillBase: {
    height: 38,
    borderRadius: 19,
    shadowColor: '#285834',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryPillInner: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  categoryPillInnerSelected: {
    backgroundColor: '#285834',
    borderColor: '#285834',
  },
  categoryPillInnerUnselected: {
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  categoryPillTextUnselected: {
    color: '#285834',
  },
  backToTopContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.22 : 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  backToTopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.20)',
  },
  backToTopText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backToTopTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 12,
    letterSpacing: 0,
  },
  cardsScroll: {
    paddingTop: 0,
    paddingBottom: 110,
  },
  columnWrapper: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardShadow: {
    width: '48.2%',
    height: 240,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.22 : 0.14,
        shadowRadius: 3.5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardCover: {
    width: '100%',
    height: 116,
    backgroundColor: isDarkMode ? '#172019' : '#E8ECE9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgesRow: {
    position: 'absolute',
    top: 9,
    left: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  cardBrandBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDarkMode ? 0.25 : 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  cardBrandLogo: {
    width: '100%',
    height: '100%',
  },
  cardCategoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.35)' : 'rgba(77, 110, 79, 0.12)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(74, 222, 128, 0.25)' : 'rgba(77, 110, 79, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
    marginTop: 18,
  },
  noImageIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 53, 20, 0.04)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 53, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: isDarkMode ? '#687E6D' : '#8A9E8D',
    letterSpacing: 0.3,
  },
  cardDetails: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.forestGreen || colors.bgBrand,
    marginBottom: 3,
  },
  cardSpecialty: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.forestGreen || colors.bgBrand,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 2,
  },
  cardLocation: {
    fontSize: 11,
    color: colors.secondaryText || colors.textMuted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 3,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryText || colors.textDark,
  },
  reviewsText: {
    fontWeight: '400',
    color: colors.secondaryText || colors.textMuted,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  overlayCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 45, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedCover: {
    width: '100%',
    height: 160,
  },
  expandedExpBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 45, 31, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 8,
  },
  expandedExpBadgeText: {
    color: colors.bgCreamy,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expandedAvatar: {
    position: 'absolute',
    top: 125,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.white,
    zIndex: 9,
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  expandedTopDetails: {
    paddingLeft: 96,
    minHeight: 65,
    justifyContent: 'center',
  },
  expandedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  expandedSpecialty: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.bgBrand,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  expandedLocation: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  expandedDescription: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    marginTop: 18,
    marginBottom: 10,
  },
  expandedBottomContainer: {
    marginTop: 8,
  },
  expandedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  expandedRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  expandedActionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    backgroundColor: 'transparent',
    gap: 6,
  },
  expandedActionButtonSolid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    gap: 6,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bottomSheet: {
    backgroundColor: colors.white === '#FFFFFF' ? '#FFFFFF' : '#172019',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  dragHandleHitBox: {
    width: '100%',
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: colors.white === '#FFFFFF' ? '#D1D5DB' : '#4B5563',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.white === '#FFFFFF' ? '#F3F4F6' : 'rgba(255, 255, 255, 0.08)',
  },
  sheetHeaderTitles: {
    flex: 1,
    paddingRight: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.white === '#FFFFFF' ? '#6B7280' : '#9CA3AF',
    fontWeight: '500',
    marginTop: 3,
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white === '#FFFFFF' ? '#F3F4F6' : '#263328',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flexGrow: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  nearestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white === '#FFFFFF' ? '#EDF4EE' : '#1E2C21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.white === '#FFFFFF' ? '#D4E2D6' : 'rgba(255, 255, 255, 0.12)',
    padding: 13,
    marginBottom: 16,
  },
  nearestRowSelected: {
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
    backgroundColor: colors.white === '#FFFFFF' ? '#E4EFE6' : '#233726',
  },
  nearestTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
  },
  nearestSubtitle: {
    fontSize: 12,
    color: colors.white === '#FFFFFF' ? '#6B7280' : '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  areasSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white === '#FFFFFF' ? '#FFFFFF' : '#1C261E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.white === '#FFFFFF' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.08)',
    padding: 13,
    marginBottom: 10,
  },
  regionRowSelected: {
    backgroundColor: colors.white === '#FFFFFF' ? '#EDF4EE' : '#203223',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
  },
  locationIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.white === '#FFFFFF' ? '#F0F5F1' : '#243427',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconTileSelected: {
    backgroundColor: colors.white === '#FFFFFF' ? '#D7E9DB' : '#2F4834',
  },
  locationTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  regionName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.white === '#FFFFFF' ? '#1F2937' : '#E5E7EB',
  },
  regionNameSelected: {
    color: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
    fontWeight: '800',
  },
  regionDescription: {
    fontSize: 12,
    color: colors.white === '#FFFFFF' ? '#6B7280' : '#9CA3AF',
    marginTop: 2,
    lineHeight: 16.5,
  },
  regionDescriptionSelected: {
    color: colors.white === '#FFFFFF' ? '#3B6044' : '#A7D4B0',
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? '#D1D5DB' : '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelected: {
    borderWidth: 0,
    backgroundColor: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E04A4A',
  },
});
