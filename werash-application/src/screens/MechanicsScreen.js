import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Image, Animated, Modal, Platform, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import BouncyPressable from '../components/BouncyPressable';
import { ALL_MECHANICS } from '../data/mechanicsData';
import { getBrandOrigin } from '../data/brandOrigins';
import { getSpecialistCover, getMechanicBrandLogo } from '../data/specialistHelpers';

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

export default function MechanicsScreen({ 
  initialExpandedCardId, 
  onClearInitialExpanded, 
  onSelectSpecialist,
  activeVehicleId,
  userVehicles,
  selectedLanguage
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [filterByVehicle, setFilterByVehicle] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('overall');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const [categoriesScrollX] = useState(() => new Animated.Value(0));
  const [categoriesContentWidth, setCategoriesContentWidth] = useState(0);
  const [categoriesLayoutWidth, setCategoriesLayoutWidth] = useState(0);
  const maxCategoriesScroll = Math.max(0, categoriesContentWidth - categoriesLayoutWidth);
  const [listAnim] = useState(() => new Animated.Value(0));
  const flatListRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const showScrollToTopRef = useRef(false);
  const backToTopAnim = useRef(new Animated.Value(0)).current;

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
    listAnim.setValue(0);
    Animated.spring(listAnim, {
      toValue: 1,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();

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
  }, [selectedCategory, searchQuery, filterByVehicle, selectedLocation, listAnim]);

  const leftFadeOpacity = categoriesScrollX.interpolate({
    inputRange: [0, 15],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightFadeOpacity = maxCategoriesScroll > 0 ? categoriesScrollX.interpolate({
    inputRange: [maxCategoriesScroll - 15, maxCategoriesScroll],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  }) : 1;

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24));

  const activeVehicle = userVehicles?.find((v) => v.id === activeVehicleId);
  const hasActiveVehicle = !!activeVehicle;
  const cardsScrollPaddingTop = topInset + (hasActiveVehicle ? 190 : 132);
  const noResultsPaddingTop = topInset + (hasActiveVehicle ? 180 : 122);

  const locations = [
    { 
      id: 'nearest', 
      label: isRtl ? 'الأقرب لي' : 'Nearest to Me',
      subtext: isRtl ? 'بناءً على موقعك الحالي' : 'Based on your current location',
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

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 130],
    outputRange: [0, -130],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const categories = [
    { id: 'overall', label: isRtl ? 'الكل' : 'OVERALL', icon: 'grid-outline' },
    { id: 'mechanical', label: isRtl ? 'ميكانيكا' : 'MECHANICAL', icon: 'build-outline' },
    { id: 'body', label: isRtl ? 'سمكرة ودهان' : 'BODY SHOPS', icon: 'car-outline' },
    { id: 'suspension', label: isRtl ? 'عفشة وتعليق' : 'SUSPENSION', icon: 'disc-outline' },
    { id: 'electrician', label: isRtl ? 'كهرباء سيارات' : 'ELECTRICIAN', icon: 'flash-outline' },
    { id: 'parts', label: isRtl ? 'قطع غيار' : 'PARTS', icon: 'cog-outline' },
  ];

  const filteredSpecialists = ALL_MECHANICS.filter((spec) => {
    // 1. Category Filter
    const matchesCategory =
      selectedCategory === 'overall' ||
      spec.category === selectedCategory ||
      (Array.isArray(spec.categories) && spec.categories.includes(selectedCategory));

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
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

    // 3. Vehicle Filter (when "MY [BRAND]" toggle is selected)
    let matchesVehicle = true;
    if (filterByVehicle && activeVehicle) {
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

  filteredSpecialists.sort((a, b) => {
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

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid creamy block covering the status bar region (y = 0 to y = topInset)
    lines.push(
      <View
        key="top-solid-block"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topInset,
          backgroundColor: colors.bgCreamy,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    );

    // 2. 15 thin overlapping gradient lines from y = topInset to y = topInset + 18
    const numLines = 15;
    const startY = topInset;
    const endY = topInset + 18;
    const step = (endY - startY) / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: colors.bgCreamy,
            opacity: opacity,
            zIndex: 3, // Above cards (zIndex: 1) but below absolute headers
            pointerEvents: 'none',
          }}
        />
      );
    }
    return lines;
  };

  const renderHorizontalFade = () => {
    const leftLines = [];
    const rightLines = [];
    const numLines = 15;
    const fadeWidth = 35; // width of the fade area in pixels
    const step = fadeWidth / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const width = step;
      const left = i * step;
      // Left fade (fades from solid bgCreamy on left to transparent on right)
      const leftOpacity = 1.0 - (i / numLines);
      leftLines.push(
        <View
          key={`left-fade-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: left,
            width: width + 0.5,
            backgroundColor: colors.bgCreamy,
            opacity: leftOpacity,
            zIndex: 5,
          }}
        />
      );

      // Right fade (fades from transparent on left to solid bgCreamy on right)
      const rightOpacity = i / numLines;
      rightLines.push(
        <View
          key={`right-fade-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: left,
            width: width + 0.5,
            backgroundColor: colors.bgCreamy,
            opacity: rightOpacity,
            zIndex: 5,
          }}
        />
      );
    }
    
    return (
      <>
        {/* Left Fade Overlay */}
        <Animated.View 
          pointerEvents="none" 
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: fadeWidth,
            zIndex: 5,
            opacity: leftFadeOpacity,
          }}
        >
          {leftLines}
        </Animated.View>

        {/* Right Fade Overlay */}
        <Animated.View 
          pointerEvents="none" 
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: fadeWidth,
            zIndex: 5,
            opacity: rightFadeOpacity,
          }}
        >
          {rightLines}
        </Animated.View>
      </>
    );
  };

  const renderSpecialistItem = ({ item: specialist, index }) => {
    const cardOpacity = index < 8 ? listAnim.interpolate({
      inputRange: [0, index * 0.1, Math.min(1, index * 0.1 + 0.3)],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp'
    }) : 1;

    const cardTranslateY = index < 8 ? listAnim.interpolate({
      inputRange: [0, index * 0.1, Math.min(1, index * 0.1 + 0.3)],
      outputRange: [15, 15, 0],
      extrapolate: 'clamp'
    }) : 0;

    return (
      <Animated.View
        key={specialist.id}
        style={{
          width: '48.2%',
          height: 240,
          marginBottom: 16,
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }]
        }}
      >
        <BouncyPressable
          onPress={() => onSelectSpecialist && onSelectSpecialist(specialist)}
          style={[
            styles.card,
            {
              width: '100%',
              height: '100%',
              marginBottom: 0
            }
          ]}
        >
          <BlurView
            intensity={65}
            tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
            style={StyleSheet.absoluteFill}
          />

          {/* Workshop Cover Image */}
          {(() => {
            const brandLogo = getMechanicBrandLogo(specialist, activeVehicle);
            if (brandLogo) {
              return (
                <View style={[styles.cardCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
                  <Image source={brandLogo} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
                </View>
              );
            }
            return <Image source={getSpecialistCover(specialist)} style={styles.cardCover} />;
          })()}

          {/* Card Content Area */}
          <View style={styles.cardDetails}>
            {/* Top Info Area */}
            <View style={isRtl && { alignItems: 'flex-end' }}>
              {/* Name */}
              <Text style={[styles.cardName, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.5 }]} numberOfLines={1} ellipsizeMode="tail">
                {isRtl ? (specialist.nameAr || specialist.name) : specialist.name}
              </Text>

              {/* Specialty */}
              <Text style={[styles.cardSpecialty, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }]} numberOfLines={1}>
                {isRtl ? (specialist.specialtyAr || specialist.specialty) : specialist.specialty}
              </Text>

              {/* Location Row */}
              <View style={[styles.locationRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={[styles.locationIcon, isRtl ? { marginLeft: 2, marginRight: 0 } : { marginRight: 2 }]} />
                <Text style={[styles.cardLocation, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]} numberOfLines={1}>
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
                  <Text style={[styles.ratingText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                    {specialist.rating || '4.5'}{' '}
                    <Text style={styles.reviewsText}>({isRtl ? `${specialist.reviews || '0'} تقييم` : `${specialist.reviews || '0'}`})</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BouncyPressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgCreamy} />
      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Top Fade Gradient Overlay */}
          {renderGradientOverlay()}

          {/* Floating Back to Top Button */}
          <Animated.View
            pointerEvents={showScrollToTop ? 'auto' : 'none'}
            style={[
              styles.backToTopContainer,
              {
                top: topInset + 8,
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
                color={colors.white === '#FFFFFF' ? '#FFFFFF' : colors.textCream} 
                style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} 
              />
              <Text style={[styles.backToTopText, isRtl && styles.backToTopTextArabic]}>
                {isRtl ? 'العودة للأعلى' : 'Back to Top'}
              </Text>
            </BouncyPressable>
          </Animated.View>

          {/* Collapsible Header Group */}
          <Animated.View style={[
            styles.collapsibleHeader,
            {
              top: topInset + 6,
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }]
            }
          ]}>

            {/* Vehicle Filter Toggle Selector */}
            {activeVehicle && (
              <View style={[styles.vehicleFilterWrapper, isRtl && { flexDirection: 'row-reverse' }]}>
                {/* 1. My Vehicle Tab (First & Default) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setFilterByVehicle(true)}
                  style={[styles.vehicleFilterTab, filterByVehicle && styles.vehicleFilterTabActive]}
                >
                  <Ionicons 
                    name="car-sport" 
                    size={13} 
                    color={filterByVehicle ? colors.bgBrand : colors.textMuted} 
                    style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.vehicleFilterText, 
                    filterByVehicle ? styles.vehicleFilterTextActive : styles.vehicleFilterTextUnselected,
                    isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5, letterSpacing: 0 }
                  ]}>
                    {isRtl ? 'سيارتي ' + activeVehicle.brand.toUpperCase() : 'MY ' + activeVehicle.brand.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                {/* 2. All Specialists Tab (Second) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setFilterByVehicle(false)}
                  style={[styles.vehicleFilterTab, !filterByVehicle && styles.vehicleFilterTabActive]}
                >
                  <Text style={[
                    styles.vehicleFilterText, 
                    !filterByVehicle ? styles.vehicleFilterTextActive : styles.vehicleFilterTextUnselected,
                    isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5, letterSpacing: 0 }
                  ]}>
                    {isRtl ? 'جميع الخبراء' : 'ALL SPECIALISTS'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* High-End Capsule Search Bar */}
            <View style={[styles.searchContainer, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.searchRow, isRtl && { flexDirection: 'row-reverse', marginRight: 0, marginLeft: 10 }]}>
                <Ionicons name="search-outline" size={18} color={colors.bgBrand} style={[styles.searchIcon, isRtl && { marginRight: 0, marginLeft: 8 }]} />
                <TextInput
                  style={[styles.searchInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                  placeholder={isRtl ? 'ابحث عن فنيين، ماركات، أو مشاكل...' : 'Search specialists, brands, or symptoms...'}
                  placeholderTextColor="#ADADAD"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={[
                  styles.filterButton, 
                  selectedLocation !== 'overall' && { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.bgBrand }
                ]}
                onPress={() => setLocationModalVisible(true)}
              >
                <Ionicons 
                  name={selectedLocation !== 'overall' ? "location" : "location-outline"} 
                  size={18} 
                  color={selectedLocation !== 'overall' ? colors.bgBrand : colors.white} 
                />
                {selectedLocation !== 'overall' && (
                  <View style={styles.activeFilterDot} />
                )}
              </TouchableOpacity>
            </View>

            {/* Premium Icon-based Categories Pill Selector Row */}
            <View style={styles.categoriesContainer}>
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: categoriesScrollX } } }],
                  { useNativeDriver: true }
                )}
                onContentSizeChange={(w) => setCategoriesContentWidth(w)}
                onLayout={(e) => setCategoriesLayoutWidth(e.nativeEvent.layout.width)}
              >
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedCategory;
                  return (
                    <BouncyPressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[
                        styles.categoryPill,
                        isSelected ? styles.categoryPillSelected : styles.categoryPillUnselected
                      ]}
                    >
                      <Ionicons 
                        name={cat.icon} 
                        size={13.5} 
                        color={isSelected ? colors.bgCreamy : colors.bgBrand} 
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected ? styles.categoryTextSelected : styles.categoryTextUnselected,
                          isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5, letterSpacing: 0 }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </Animated.ScrollView>
              {renderHorizontalFade()}
            </View>
          </Animated.View>

          {/* Specialists Card List */}
          {filteredSpecialists.length === 0 ? (
            <View style={[styles.noResultsContainer, { paddingTop: noResultsPaddingTop }]}>
              <Ionicons name="search-outline" size={48} color="rgba(77, 110, 79, 0.18)" style={{ marginBottom: 12 }} />
              <Text style={[styles.noResultsText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14 }]}>
                {isRtl ? 'لم نجد خبراء يطابقون خيارات البحث.' : 'No experts found matching your search.'}
              </Text>
            </View>
          ) : (
            <Animated.FlatList
              ref={flatListRef}
              data={filteredSpecialists}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.cardsScroll, { paddingTop: cardsScrollPaddingTop }]}
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
                  }
                }
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={renderSpecialistItem}
            />
          )}

          {/* Custom Location Selection Dialog Overlay */}
          {locationModalVisible && (
            <Modal
              visible={locationModalVisible}
              animationType="fade"
              transparent
              statusBarTranslucent
              onRequestClose={() => setLocationModalVisible(false)}
            >
              <View style={styles.alertOverlay}>
                <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
                  <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setLocationModalVisible(false)} activeOpacity={1} />
                </BlurView>

                <View style={styles.alertCard}>
                  {/* Top Close Button */}
                  <TouchableOpacity 
                    style={styles.alertCloseIcon} 
                    onPress={() => setLocationModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={16} color={colors.textDark} style={{ opacity: 0.7 }} />
                  </TouchableOpacity>

                  {/* Icon & Title Block */}
                  <View style={styles.alertHeaderContainer}>
                    <View style={styles.alertIconBadge}>
                      <Ionicons name="location-outline" size={24} color={colors.bgBrand} />
                    </View>
                    <Text style={[styles.alertTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 16.0 }]}>
                      {isRtl ? 'منطقة الخدمة' : 'Service Location'}
                    </Text>
                    <Text style={[styles.alertDesc, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 12.0, textAlign: 'center' }]}>
                      {isRtl ? 'اختر منطقة في نطاق القاهرة الكبرى' : 'Choose a region in Greater Cairo Area'}
                    </Text>
                  </View>
                  
                  <ScrollView style={styles.locationScroll} showsVerticalScrollIndicator={false}>
                    {locations.map((loc) => {
                      const isSelected = loc.id === selectedLocation;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          activeOpacity={0.8}
                          onPress={async () => {
                            if (loc.id === 'nearest') {
                              let { status } = await Location.requestForegroundPermissionsAsync();
                              if (status !== 'granted') {
                                Alert.alert(isRtl ? 'عذراً' : 'Sorry', isRtl ? 'نحتاج إذن للوصول إلى موقعك.' : 'Permission to access location was denied');
                                return;
                              }
                              try {
                                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                                setUserCoords(location.coords);
                                setSelectedLocation(loc.id);
                                setLocationModalVisible(false);
                              } catch (e) {
                                Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'لم نتمكن من تحديد موقعك.' : 'Could not fetch your location');
                              }
                            } else {
                              setSelectedLocation(loc.id);
                              setLocationModalVisible(false);
                            }
                          }}
                          style={[
                            styles.locationRowItem,
                            isRtl && { flexDirection: 'row-reverse' },
                            isSelected && styles.locationRowItemSelected
                          ]}
                        >
                          <View style={[styles.locationRowLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                            <View style={[
                              styles.locationIconBadge, 
                              isSelected && styles.locationIconBadgeSelected,
                              isRtl ? { marginLeft: 10 } : { marginRight: 10 }
                            ]}>
                              <Ionicons 
                                name={loc.id === 'overall' ? "globe-outline" : loc.id === 'nearest' ? "navigate" : "location-sharp"} 
                                size={15} 
                                color={isSelected ? colors.white : colors.bgBrand} 
                              />
                            </View>
                            <View style={[styles.locationTextGroup, isRtl && { alignItems: 'flex-end' }]}>
                              <Text style={[
                                styles.locationRowLabel,
                                isSelected && styles.locationRowLabelSelected,
                                isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0, textAlign: 'right' }
                              ]}>
                                {loc.label}
                              </Text>
                              {loc.subtext ? (
                                <Text style={[
                                  styles.locationRowSubtext,
                                  isSelected && styles.locationRowSubtextSelected,
                                  isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5, textAlign: 'right' }
                                ]}>
                                  {loc.subtext}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color={colors.bgBrand} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}

          {/* Expanded Specialist Overlay is rendered at root level in App.js */}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
  },
  subtitleText: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    marginRight: 10,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textDark,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  categoriesContainer: {
    marginBottom: 16,
    marginHorizontal: -20,
    position: 'relative',
  },
  categoriesScroll: {
    paddingLeft: 20,
    paddingRight: 35,
    paddingVertical: 4,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 22,
    justifyContent: 'center',
    gap: 6,
    height: 38,
  },
  categoryPillSelected: {
    backgroundColor: colors.bgBrand,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.2,
    borderColor: colors.bgBrand,
  },
  categoryPillUnselected: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.24)' : 'rgba(93, 130, 96, 0.30)',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryTextSelected: {
    color: colors.bgCreamy,
  },
  categoryTextUnselected: {
    color: colors.bgBrand,
  },
  vehicleFilterWrapper: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    height: 44,
    marginBottom: 14,
  },
  vehicleFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: '100%',
  },
  vehicleFilterTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#1E2D1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  vehicleFilterText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  vehicleFilterTextActive: {
    color: colors.bgBrand,
  },
  vehicleFilterTextUnselected: {
    color: colors.textMuted,
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
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 12,
    letterSpacing: 0,
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 25, // Shifted up to fit the shorter green header
    left: 0,
    right: 0,
    zIndex: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  cardsScroll: {
    paddingTop: 140, // Shifted up to fit the shorter green header
    paddingBottom: 110, // snug above bottom navigation bar
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.2%', // leaves 3.6% gap space in between
    height: 240,    // fixed height to make all boxes identical
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.35)' : 'rgba(24, 30, 24, 0.45)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 16 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  cardCover: {
    width: '100%',
    height: 100,
  },
  cardDetails: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  cardSpecialty: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.bgBrand,
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
    color: colors.textMuted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
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
    color: colors.textDark,
  },
  reviewsText: {
    fontWeight: '400',
    color: colors.textMuted,
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
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 325,
    backgroundColor: colors.bgCreamy,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    padding: 24,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  alertCloseIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  locationScroll: {
    maxHeight: 380,
  },
  locationRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  locationRowItemSelected: {
    borderColor: colors.bgBrand,
    backgroundColor: colors.bgBrandLight,
  },
  locationRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgCreamy,
    borderWidth: 1,
    borderColor: colors.borderGreen + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconBadgeSelected: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  locationTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  locationRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  locationRowLabelSelected: {
    color: colors.bgBrand,
    fontWeight: '800',
  },
  locationRowSubtext: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  locationRowSubtextSelected: {
    color: colors.bgBrand,
    opacity: 0.85,
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
