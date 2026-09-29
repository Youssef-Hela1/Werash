import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Image, Animated, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BouncyPressable from '../components/BouncyPressable';

const specialists = [
  {
    id: 'kareem',
    name: 'Kareem El-Sayed',
    nameAr: 'كريم السيد',
    specialty: 'ENGINE & TUNING',
    specialtyAr: 'محركات وضبط محرك',
    category: 'mechanical',
    rating: '5.0',
    reviews: '184',
    price: '$65/hr',
    priceAr: '٦٥ دولار/ساعة',
    location: 'Sheikh Zayed, Giza',
    locationAr: 'الشيخ زايد، الجيزة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_kareem.png'),
    exp: '12 Years Exp.',
    expAr: 'خبرة ١٢ سنة',
    description: 'Master Porsche & German Specialist. Former OEM certified master tech specializing in high-performance German engineering, ECU remapping, and track prep.',
    descriptionAr: 'متخصص وخبير سيارات بورشه والألماني. فني معتمد سابق متخصص في الهندسة الألمانية عالية الأداء، إعادة برمجة كمبيوتر السيارة، وتجهيز الحلبات.',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    nameAr: 'إيلينا روستوفا',
    specialty: 'DIAGNOSTICS & ECU',
    specialtyAr: 'كهرباء وبرمجة العقول (ECU)',
    category: 'electrician',
    rating: '4.9',
    reviews: '112',
    price: '$75/hr',
    priceAr: '٧٥ دولار/ساعة',
    location: 'Heliopolis, Cairo',
    locationAr: 'مصر الجديدة، القاهرة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_elena.png'),
    exp: '9 Years Exp.',
    expAr: 'خبرة ٩ سنوات',
    description: 'Diagnostics & ECU Tuning Guru. Expert in automotive electrical systems, ECU flashing, wiring harness repairs, and advanced diagnostics.',
    descriptionAr: 'خبيرة فحص الكهرباء وضبط كمبيوتر السيارة. متخصصة في الأنظمة الكهربائية المعقدة، فحص وإعادة ضبط الضفيرة والكمبيوتر.',
  },
  {
    id: 'tariq',
    name: 'Tariq Mansour',
    nameAr: 'طارق منصور',
    specialty: 'BRAKES & SUSPENSION',
    specialtyAr: 'فرامل وأنظمة تعليق',
    category: 'suspension',
    rating: '4.8',
    reviews: '96',
    price: '$55/hr',
    priceAr: '٥٥ دولار/ساعة',
    location: 'Maadi, Cairo',
    locationAr: 'المعادي، القاهرة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_tariq.png'),
    exp: '8 Years Exp.',
    expAr: 'خبرة ٨ سنوات',
    description: 'Brake & Suspension Specialist. Certified technician focusing on performance suspension upgrades, brake system design, alignments, and track setup.',
    descriptionAr: 'أخصائي الفرامل والعفشة. فني معتمد يركز على ترقية أنظمة التعليق الرياضي والفرامل، وضبط الزوايا وتجهيز السيارات.',
  },
  {
    id: 'samir',
    name: 'Samir Soliman',
    nameAr: 'سمير سليمان',
    specialty: 'TRANSMISSION & PARTS',
    specialtyAr: 'فتيس وقطع غيار',
    category: 'parts',
    rating: '4.7',
    reviews: '84',
    price: '$50/hr',
    priceAr: '٥٠ دولار/ساعة',
    location: 'New Cairo, Cairo',
    locationAr: 'القاهرة الجديدة، القاهرة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_samir.png'),
    exp: '10 Years Exp.',
    expAr: 'خبرة ١٠ سنوات',
    description: 'Transmission & Parts Expert. Master technician specializing in automatic/manual transmission rebuilds, differential upgrades, and custom parts sourcing.',
    descriptionAr: 'خبير الفتيس وناقل الحركة. أخصائي في تجديد الفتيس المانيوال والأوتوماتيك، أنظمة الدفع الخلفي وتوفير قطع الغيار النادرة.',
  },
  {
    id: 'sherif',
    name: 'Sherif Abdel-Meguid',
    nameAr: 'شريف عبد المجيد',
    specialty: 'BODY SHOPS & PAINT',
    specialtyAr: 'سمكرة ودهان',
    category: 'body',
    rating: '4.9',
    reviews: '128',
    price: '$80/hr',
    priceAr: '٨٠ دولار/ساعة',
    location: '6th of October, Giza',
    locationAr: '٦ أكتوبر، الجيزة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_sherif.png'),
    exp: '15 Years Exp.',
    expAr: 'خبرة ١٥ سنة',
    description: 'Body Restoration & Custom Paint Master. Specializing in dent repair, carbon fiber panel fabrication, and custom high-end paint finishes.',
    descriptionAr: 'أخصائي دهان وسمكرة السيارات. متخصص في إصلاح الصدمات والاعوجاج، تصنيع أجزاء الكاربون فايبر، والدهانات الفاخرة.',
  },
  {
    id: 'michael',
    name: 'Michael Chang',
    nameAr: 'مايكل تشانغ',
    specialty: 'GERMAN ENGINE SPECIALIST',
    specialtyAr: 'خبير محركات ألماني',
    category: 'mechanical',
    rating: '5.0',
    reviews: '142',
    price: '$90/hr',
    priceAr: '٩٠ دولار/ساعة',
    location: 'Zamalek, Cairo',
    locationAr: 'الزمالك، القاهرة',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_michael.png'),
    exp: '14 Years Exp.',
    expAr: 'خبرة ١٤ سنة',
    description: 'German Engine & Powertrain Expert. Certified master specialist for Audi, BMW, and Mercedes engine diagnostics, major rebuilds, and power optimization.',
    descriptionAr: 'خبير المحركات الألمانية وناقل الحركة. فني معتمد متخصص في تشخيص محركات أودي، بي إم دبليو، ومرسيدس وعمراتها الكاملة.',
  },
];

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
  const [scrollY] = useState(() => new Animated.Value(0));
  const [categoriesScrollX] = useState(() => new Animated.Value(0));
  const [categoriesContentWidth, setCategoriesContentWidth] = useState(0);
  const [categoriesLayoutWidth, setCategoriesLayoutWidth] = useState(0);
  const maxCategoriesScroll = Math.max(0, categoriesContentWidth - categoriesLayoutWidth);
  const [listAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    listAnim.setValue(0);
    Animated.spring(listAnim, {
      toValue: 1,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();
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
    { id: 'overall', label: isRtl ? 'جميع المناطق / القاهرة الكبرى' : 'All Areas / Greater Cairo' },
    { id: 'sheikh zayed', label: isRtl ? 'الشيخ زايد، الجيزة' : 'Sheikh Zayed, Giza' },
    { id: '6th of october', label: isRtl ? '٦ أكتوبر، الجيزة' : '6th of October, Giza' },
    { id: 'heliopolis', label: isRtl ? 'مصر الجديدة، القاهرة' : 'Heliopolis, Cairo' },
    { id: 'maadi', label: isRtl ? 'المعادي، القاهرة' : 'Maadi, Cairo' },
    { id: 'new cairo', label: isRtl ? 'القاهرة الجديدة، القاهرة' : 'New Cairo, Cairo' },
    { id: 'zamalek', label: isRtl ? 'الزمالك، القاهرة' : 'Zamalek, Cairo' },
  ];

  useEffect(() => {
    if (initialExpandedCardId) {
      const found = specialists.find((spec) => spec.id === initialExpandedCardId);
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

  const filteredSpecialists = specialists.filter((spec) => {
    const matchesCategory =
      selectedCategory === 'overall' || spec.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      spec.name.toLowerCase().includes(query) ||
      (spec.nameAr && spec.nameAr.toLowerCase().includes(query)) ||
      spec.specialty.toLowerCase().includes(query) ||
      (spec.specialtyAr && spec.specialtyAr.toLowerCase().includes(query)) ||
      spec.location.toLowerCase().includes(query) ||
      (spec.locationAr && spec.locationAr.toLowerCase().includes(query));

    let matchesVehicle = true;
    if (filterByVehicle && activeVehicle) {
      const brand = activeVehicle.brand.toLowerCase();
      const inDescription = spec.description.toLowerCase().includes(brand) || 
                          (spec.descriptionAr && spec.descriptionAr.toLowerCase().includes(brand));
      const inSpecialty = spec.specialty.toLowerCase().includes(brand) || 
                        (spec.specialtyAr && spec.specialtyAr.toLowerCase().includes(brand));
      const inName = spec.name.toLowerCase().includes(brand) || 
                    (spec.nameAr && spec.nameAr.toLowerCase().includes(brand));
      const isGermanBrand = ['porsche', 'bmw', 'mercedes', 'audi', 'volkswagen'].includes(brand);
      const specializesInGerman = isGermanBrand && 
        (spec.description.toLowerCase().includes('german') || (spec.descriptionAr && spec.descriptionAr.toLowerCase().includes('ألماني')));
      
      matchesVehicle = inDescription || inSpecialty || inName || specializesInGerman;
    }

    const matchesLocation =
      selectedLocation === 'overall' ||
      spec.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      (spec.locationAr && spec.locationAr.toLowerCase().includes(selectedLocation.toLowerCase()));

    return matchesCategory && matchesSearch && matchesVehicle && matchesLocation;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgCreamy} />
      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Top Fade Gradient Overlay */}
          {renderGradientOverlay()}

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
                  name="location-outline" 
                  size={18} 
                  color={selectedLocation !== 'overall' ? colors.bgBrand : colors.white} 
                />
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
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.cardsScroll, { paddingTop: cardsScrollPaddingTop }]}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
            >
              <View style={styles.gridContainer}>
                {filteredSpecialists.map((specialist, index) => {
                  const cardOpacity = listAnim.interpolate({
                    inputRange: [0, Math.min(1, index * 0.12), Math.min(1, index * 0.12 + 0.25)],
                    outputRange: [0, 0, 1],
                    extrapolate: 'clamp'
                  });

                  const cardTranslateY = listAnim.interpolate({
                    inputRange: [0, Math.min(1, index * 0.12), Math.min(1, index * 0.12 + 0.25)],
                    outputRange: [15, 15, 0],
                    extrapolate: 'clamp'
                  });

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
                        <Image source={specialist.image} style={styles.cardCover} />

                        {/* Card Content Area */}
                        <View style={styles.cardDetails}>
                          {/* Top Info Area */}
                          <View style={isRtl && { alignItems: 'flex-end' }}>
                            {/* Name */}
                            <Text style={[styles.cardName, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5 }]} numberOfLines={2}>
                              {isRtl ? specialist.nameAr : specialist.name}
                            </Text>

                            {/* Specialty */}
                            <Text style={[styles.cardSpecialty, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }]} numberOfLines={1}>
                              {isRtl ? specialist.specialtyAr : specialist.specialty}
                            </Text>

                            {/* Location Row */}
                            <View style={[styles.locationRow, isRtl && { flexDirection: 'row-reverse' }]}>
                              <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={[styles.locationIcon, isRtl ? { marginLeft: 2, marginRight: 0 } : { marginRight: 2 }]} />
                              <Text style={[styles.cardLocation, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]} numberOfLines={1}>
                                {isRtl ? specialist.locationAr : specialist.location}
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
                                  {specialist.rating}{' '}
                                  <Text style={styles.reviewsText}>({isRtl ? `${specialist.reviews} تقييم` : `${specialist.reviews}`})</Text>
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* 3D Glossy Bevel Highlight Overlay */}
                        <View style={{
                          ...StyleSheet.absoluteFillObject,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: 'transparent',
                          borderTopColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                          borderLeftColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                        }} pointerEvents="none" />
                      </BouncyPressable>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.ScrollView>
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
                          onPress={() => {
                            setSelectedLocation(loc.id);
                            setLocationModalVisible(false);
                          }}
                          style={[
                            styles.locationRowItem,
                            isRtl && { flexDirection: 'row-reverse' },
                            isSelected && styles.locationRowItemSelected
                          ]}
                        >
                          <View style={[styles.locationRowLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                            <Ionicons 
                              name="location-sharp" 
                              size={16} 
                              color={isSelected ? colors.bgBrand : colors.textMuted} 
                              style={isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }} 
                            />
                            <Text style={[
                              styles.locationRowLabel,
                              isSelected && styles.locationRowLabelSelected,
                              isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0, textAlign: 'right' }
                            ]}>
                              {loc.label}
                            </Text>
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
    maxHeight: 250,
  },
  locationRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  },
  locationRowLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textDark,
  },
  locationRowLabelSelected: {
    color: colors.bgBrand,
    fontWeight: '700',
  },
});
