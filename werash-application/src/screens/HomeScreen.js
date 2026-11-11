import React, { useRef } from 'react';
import { StyleSheet, View, StatusBar, Image, Text, Dimensions, Platform, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PremiumCard from '../components/PremiumCard';
import SpecialistSpotlight from '../components/SpecialistSpotlight';
import { BRAND_LOGOS } from '../data/brandLogos';

const { width: screenWidth } = Dimensions.get('window');

// Original image aspect ratio (852 width x 1846 height)
const BACKDROP_ASPECT = 1846 / 852;
const BACKDROP_HEIGHT = Math.round(screenWidth * BACKDROP_ASPECT);

// The green satin arched boundary in the backdrop asset peaks at y = 540 / 852
const TRANSITION_RATIO = 540 / 852;
const GREEN_BOUNDARY = Math.round(screenWidth * TRANSITION_RATIO);

// Card dimensions: 1.96 width-to-height ratio with horizontal margin 20 on each side
const CARD_WIDTH = screenWidth - 40;
const OVERLAP_CARD_HEIGHT = Math.round(CARD_WIDTH / 1.96);
const OVERLAP_CARD_TOP = GREEN_BOUNDARY - Math.round(OVERLAP_CARD_HEIGHT / 2);

const ARABIC_BRAND_MAP = {
  'مرسيدس': 'mercedes',
  'بي إم دبليو': 'bmw',
  'أودي': 'audi',
  'بورشه': 'porsche',
  'فولكس فاجن': 'volkswagen',
  'هيونداي': 'hyundai',
  'نيسان': 'nissan',
  'تويوتا': 'toyota',
  'كيا': 'kia',
  'فيات': 'fiat',
  'رينو': 'renault',
  'بيجو': 'peugeot',
  'شيري': 'chery',
  'إم جي': 'mg',
  'ميتسوبيشي': 'mitsubishi',
  'أوبل': 'opel',
  'سكودا': 'skoda',
  'سيات': 'seat',
  'شيفروليه': 'chevrolet',
  'فورد': 'ford',
  'هوندا': 'honda',
  'سوبارو': 'subaru',
  'سوزوكي': 'suzuki',
  'تسلا': 'tesla',
  'فولفو': 'volvo',
  'لاند روفر': 'land rover',
  'مازدا': 'mazda',
  'جيب': 'jeep',
  'شانجان': 'changan',
  'هافال': 'haval',
  'جيلي': 'geely',
  'بايك': 'baic',
  'بي واي دي': 'byd',
};

const getBrandLogo = (brandName) => {
  if (!brandName || typeof brandName !== 'string') return null;
  const trimmed = brandName.trim();
  const normalized = trimmed.toLowerCase();
  const key = ARABIC_BRAND_MAP[trimmed] || normalized;
  return (
    BRAND_LOGOS[key] || 
    BRAND_LOGOS[key.replace(/\s+/g, '-')] || 
    BRAND_LOGOS[key.replace(/-/g, ' ')] || 
    (key.includes('mercedes') ? BRAND_LOGOS['mercedes'] : null) || 
    (key.includes('bmw') ? BRAND_LOGOS['bmw'] : null) || 
    (key.includes('hyundai') ? BRAND_LOGOS['hyundai'] : null) || 
    null
  );
};

// Helper to split numbers (left) and letters (right) on Egyptian license plates
const splitPlate = (plateStr) => {
  if (!plateStr || typeof plateStr !== 'string') return { numbers: '', letters: '', lettersList: [] };
  
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const digitRegex = /[0-9٠-٩]/g;
  const digits = (plateStr.match(digitRegex) || []).map(d =>
    /[0-9]/.test(d) ? arabicDigits[parseInt(d, 10)] : d
  );
  
  const rawLetters = plateStr.replace(digitRegex, '').replace(/\s+/g, '');
  const lettersList = Array.from(rawLetters);
  
  return {
    numbers: digits.join(''),
    letters: lettersList.join(' '),
    lettersList,
  };
};

export default function HomeScreen({ 
  onNavigate, 
  currentUser, 
  onOpenSignIn, 
  selectedLanguage, 
  userVehicles = [], 
  activeVehicleId, 
  onSelectAd, 
  onSelectProfile,
  onScrollPositionChange 
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isRtl = selectedLanguage === 'Arabic';

  const getFirstName = () => {
    if (!currentUser || !currentUser.fullName) return '';
    return currentUser.fullName.trim().split(/\s+/)[0];
  };

  // Comfortable top clearance across devices
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 26));

  // Resolve active vehicle & brand logo
  const activeVehicle = (userVehicles && userVehicles.length > 0)
    ? (userVehicles.find(v => v.id === activeVehicleId) || userVehicles[0])
    : (currentUser && (currentUser.carBrand || currentUser.carModel) ? {
        brand: currentUser.carBrand,
        model: currentUser.carModel,
        year: currentUser.carYear,
      } : {
        brand: 'Hyundai',
        model: 'Coupe',
        year: '2005',
      });

  const carBrand = activeVehicle?.brand || 'Hyundai';
  const carModel = activeVehicle?.model || 'Coupe';
  const carYear = activeVehicle?.year ? String(activeVehicle.year) : '2005';
  const brandLogo = getBrandLogo(carBrand) || BRAND_LOGOS['hyundai'];
  const plateNumber = activeVehicle ? (activeVehicle.plateNumberArabic || activeVehicle.plateNumber || '١٨٧٣ ر و') : '١٨٧٣ ر و';

  // Elastic spring animation for cards movement in both directions
  const cardsTranslateY = useRef(new Animated.Value(0)).current;

  // Balanced 12px travel limit: loosened feel while staying safely clear of header text
  const MAX_TRAVEL = 12;
  const calculateDampedDelta = (dy) => {
    const sign = dy < 0 ? -1 : 1;
    const absDy = Math.abs(dy);
    return sign * (absDy / (absDy + 75)) * MAX_TRAVEL;
  };

  const cardsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        cardsTranslateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        cardsTranslateY.setValue(calculateDampedDelta(gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(cardsTranslateY, {
          toValue: 0,
          velocity: (gestureState.vy || 0) * 0.2,
          tension: 110,
          friction: 14,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(cardsTranslateY, {
          toValue: 0,
          tension: 110,
          friction: 14,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Forest Green Satin Backdrop (Static) */}
      <Image 
        source={require('../../assets/forest_green_satin_backdrop.png')}
        style={styles.satinBackdrop}
        resizeMode="cover"
      />

      {/* Spring / Scroll Area for Cards Only (Rendered behind Header) */}
      <View 
        style={styles.cardsScrollArea}
        {...cardsPanResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.cardsWrapper,
            {
              transform: [{ translateY: cardsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (onNavigate) {
                onNavigate('garage');
              }
            }}
          >
            <PremiumCard surfaceStyle={styles.cardSurface}>
              <View style={styles.cardContent}>
                {/* Top Center "Active Vehicle" Header Label */}
                <View style={[styles.activeVehicleLabelRow, isRtl && styles.activeVehicleLabelRowRtl]}>
                  <Ionicons 
                    name="car-sport-outline" 
                    size={12} 
                    color={colors.activeHighlight} 
                    style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} 
                  />
                  <Text style={[styles.activeVehicleText, isRtl && styles.activeVehicleTextArabic]}>
                    {isRtl ? 'المركبة النشطة' : 'ACTIVE VEHICLE'}
                  </Text>
                </View>

                {/* Left Side: Brand Logo & License Plate Badge (50% column) */}
                <View style={styles.cardLeftSection}>
                  <View style={styles.cardBrandLogoContainer}>
                    {brandLogo && (
                      <Image 
                        source={brandLogo} 
                        style={styles.cardBrandLogo} 
                        resizeMode="contain" 
                      />
                    )}
                  </View>

                  {/* Egyptian License Plate Badge */}
                  {plateNumber ? (
                    <View style={styles.plateBadge}>
                      <View style={styles.plateBadgeHeader}>
                        <Text style={[styles.plateBadgeHeaderText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                          {isRtl ? 'مصر' : 'EGYPT'}
                        </Text>
                      </View>
                      {(() => {
                        const { numbers, lettersList } = splitPlate(plateNumber);
                        return (
                          <View style={styles.plateBadgeContent}>
                            <Text style={styles.plateBadgeNumbers}>{numbers}</Text>
                            {lettersList && lettersList.length > 0 ? (
                              <>
                                <View style={styles.plateBadgeDivider} />
                                <View style={styles.plateBadgeLettersRow}>
                                  {lettersList.map((char, idx) => (
                                    <Text key={idx} style={styles.plateBadgeLetters}>{char}</Text>
                                  ))}
                                </View>
                              </>
                            ) : null}
                          </View>
                        );
                      })()}
                    </View>
                  ) : null}
                </View>

                {/* Vertical Divider Line in the middle (50%) */}
                <View style={styles.cardMiddleDivider} />

                {/* Right Side: Vehicle Info (50% column) */}
                <View style={styles.cardRightSection}>
                  <View style={styles.vehicleInfoGroup}>
                    <Text 
                      style={[styles.brandNameText, isRtl && styles.brandNameTextArabic]}
                      numberOfLines={1}
                    >
                      {carBrand}
                    </Text>
                    <Text 
                      style={[styles.modelNameText, isRtl && styles.modelNameTextArabic]}
                      numberOfLines={2}
                    >
                      {carModel}
                    </Text>
                    <Text 
                      style={[styles.yearText, isRtl && styles.yearTextArabic]}
                      numberOfLines={1}
                    >
                      {carYear}
                    </Text>
                  </View>
                </View>
              </View>
            </PremiumCard>
          </TouchableOpacity>

          {/* 4 Smaller Cards Equally Spaced in a 2x2 Grid */}
          <View style={styles.cardsGrid}>
            <View style={styles.gridRow}>
              {/* Top Left Card: Mechanics */}
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.miniCardShadow}
                onPress={() => onNavigate && onNavigate('mechanics')}
              >
                <View style={styles.miniCardSurface}>
                  <View style={[styles.miniCardHeader, isRtl && styles.miniCardHeaderRtl]}>
                    <Text 
                      style={[styles.miniCardTitle, isRtl && styles.miniCardTitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'الميكانيكيين' : 'Mechanics'}
                    </Text>
                    <Text 
                      style={[styles.miniCardSubtitle, isRtl && styles.miniCardSubtitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'فنيين وورش' : 'Top Specialists'}
                    </Text>
                  </View>
                  <View style={[styles.miniCardIconWrapper, isRtl && styles.miniCardIconWrapperRtl]}>
                    <Ionicons name="construct-outline" size={86} color={colors.mutedDecor} />
                  </View>

                  {/* Circular Arrow Button (Bottom Left) */}
                  <View style={[styles.miniCardArrowButton, isRtl && styles.miniCardArrowButtonRtl]} pointerEvents="none">
                    <Ionicons 
                      name={isRtl ? "arrow-back" : "arrow-forward"} 
                      size={13.5} 
                      color={colors.activeHighlight} 
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Top Right Card: Community */}
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.miniCardShadow}
                onPress={() => onNavigate && onNavigate('community')}
              >
                <View style={styles.miniCardSurface}>
                  <View style={[styles.miniCardHeader, isRtl && styles.miniCardHeaderRtl]}>
                    <Text 
                      style={[styles.miniCardTitle, isRtl && styles.miniCardTitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'المجتمع' : 'Community'}
                    </Text>
                    <Text 
                      style={[styles.miniCardSubtitle, isRtl && styles.miniCardSubtitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'نقاشات وتجارب' : 'Feed & Posts'}
                    </Text>
                  </View>
                  <View style={[styles.miniCardIconWrapper, isRtl && styles.miniCardIconWrapperRtl]}>
                    <Ionicons name="chatbubbles-outline" size={86} color={colors.mutedDecor} />
                  </View>

                  {/* Circular Arrow Button (Bottom Left) */}
                  <View style={[styles.miniCardArrowButton, isRtl && styles.miniCardArrowButtonRtl]} pointerEvents="none">
                    <Ionicons 
                      name={isRtl ? "arrow-back" : "arrow-forward"} 
                      size={13.5} 
                      color={colors.activeHighlight} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              {/* Bottom Left Card: Tow */}
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.miniCardShadowTow}
                onPress={() => {
                  // Feature currently under construction
                }}
              >
                <View style={styles.miniCardSurfaceTow}>
                  <View style={[styles.miniCardHeader, isRtl && styles.miniCardHeaderRtl]}>
                    <Text 
                      style={[styles.miniCardTitle, isRtl && styles.miniCardTitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'سطحة' : 'Tow'}
                    </Text>
                    <Text 
                      style={[styles.miniCardSubtitle, isRtl && styles.miniCardSubtitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'طوارئ وسحب' : 'Roadside Assist'}
                    </Text>
                  </View>
                  <View style={[styles.miniCardIconWrapper, isRtl && styles.miniCardIconWrapperRtl]}>
                    <MaterialCommunityIcons name="tow-truck" size={86} color={colors.mutedDecor} />
                  </View>

                  {/* 3 Crossing Minimalist Hazard Ribbons */}
                  <View style={styles.hazardTapeImageLayer} pointerEvents="none">
                    <Image 
                      source={require('../../assets/hazard_tape_cartoon.png')} 
                      style={styles.hazardTapeImage} 
                      resizeMode="cover" 
                    />
                  </View>

                  {/* Construction Sign Plaque: Coming Soon */}
                  <View style={[styles.constructionSignWrapper, isRtl && styles.constructionSignWrapperRtl]} pointerEvents="none">
                    <View style={styles.constructionSign}>
                      {/* Metallic Corner Rivets */}
                      <View style={[styles.signBolt, { top: 2.5, left: 2.5 }]} />
                      <View style={[styles.signBolt, { top: 2.5, right: 2.5 }]} />
                      <View style={[styles.signBolt, { bottom: 2.5, left: 2.5 }]} />
                      <View style={[styles.signBolt, { bottom: 2.5, right: 2.5 }]} />

                      <Ionicons 
                        name="warning" 
                        size={11.5} 
                        color="#141414" 
                        style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} 
                      />
                      <Text style={[styles.constructionSignText, isRtl && styles.constructionSignTextArabic]}>
                        {isRtl ? 'قريباً' : 'COMING SOON'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Bottom Right Card: Profile */}
              <TouchableOpacity 
                activeOpacity={1} 
                style={styles.miniCardShadow}
                onPress={() => {
                  if (onSelectProfile) {
                    onSelectProfile();
                  } else if (onOpenSignIn) {
                    onOpenSignIn();
                  }
                }}
              >
                <View style={styles.miniCardSurface}>
                  <View style={[styles.miniCardHeader, isRtl && styles.miniCardHeaderRtl]}>
                    <Text 
                      style={[styles.miniCardTitle, isRtl && styles.miniCardTitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'الملف الشخصي' : 'Profile'}
                    </Text>
                    <Text 
                      style={[styles.miniCardSubtitle, isRtl && styles.miniCardSubtitleArabic]}
                      numberOfLines={1}
                    >
                      {isRtl ? 'الحساب والمركبات' : 'Account & Garage'}
                    </Text>
                  </View>
                  <View style={[styles.miniCardIconWrapper, isRtl && styles.miniCardIconWrapperRtl]}>
                    <Ionicons name="person-outline" size={86} color={colors.mutedDecor} />
                  </View>

                  {/* Circular Arrow Button (Bottom Left) */}
                  <View style={[styles.miniCardArrowButton, isRtl && styles.miniCardArrowButtonRtl]} pointerEvents="none">
                    <Ionicons 
                      name={isRtl ? "arrow-back" : "arrow-forward"} 
                      size={13.5} 
                      color={colors.activeHighlight} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 10 Auto-Scrolling Sponsored Ad Cards */}
          <SpecialistSpotlight 
            onNavigate={onNavigate} 
            selectedLanguage={selectedLanguage} 
            onSelectAd={onSelectAd} 
          />
        </Animated.View>
      </View>

      {/* Top Brand Header (Always in front: zIndex 100, elevation 100) */}
      <View 
        pointerEvents="box-none"
        style={[styles.headerContainer, { paddingTop: topInset + 2 }]}
      >
        <View style={[styles.headerTopRow, isRtl && styles.headerTopRowRtl]}>
          <View style={[styles.logoContainer, isRtl && styles.logoContainerRtl]}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={[styles.logoImage, isRtl && styles.logoImageRtl]} 
              resizeMode="contain" 
            />
            {isRtl ? (
              <Text style={[styles.brandNameArabic, { color: '#FFFFFF' }]}>
                وِرَش
              </Text>
            ) : (
              <Image 
                source={require('../../assets/Werash_wordmark.png')}
                style={[styles.wordmarkImage, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Settings Icon on top right, level with Werash text */}
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.7}
            onPress={() => onNavigate && onNavigate('more')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Small Greeting beneath Logo */}
        <Text style={[
          styles.greetingText,
          isRtl && styles.greetingTextArabic
        ]}>
          {isRtl 
            ? (getFirstName() ? `أهلاً ${getFirstName()}` : 'أهلاً بك')
            : (getFirstName() ? `Hello ${getFirstName()}` : 'Hello Guest')}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
    position: 'relative',
    overflow: 'hidden',
  },
  satinBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: BACKDROP_HEIGHT,
  },
  headerContainer: {
    paddingHorizontal: 20,
    width: '100%',
    zIndex: 100,
    elevation: 100,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTopRowRtl: {
    flexDirection: 'row-reverse',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainerRtl: {
    flexDirection: 'row-reverse',
  },
  logoImage: {
    width: 48,
    height: 48,
    marginRight: 11,
  },
  logoImageRtl: {
    marginRight: 0,
    marginLeft: 11,
  },
  wordmarkImage: {
    height: 48,
    width: 142,
  },
  brandNameArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 82,
    letterSpacing: 0,
    marginTop: -5,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  greetingTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'right',
  },

  /* Scrollable / Spring Cards Container */
  cardsScrollArea: {
    position: 'absolute',
    top: OVERLAP_CARD_TOP,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
    overflow: 'visible',
  },
  cardsWrapper: {
    width: '100%',
    overflow: 'visible',
  },

  /* Premium Card Styles */
  cardSurface: {
    padding: 0,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  activeVehicleLabelRow: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  activeVehicleLabelRowRtl: {
    flexDirection: 'row-reverse',
  },
  activeVehicleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.activeHighlight,
    letterSpacing: 0.8,
  },
  activeVehicleTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 10.5,
    letterSpacing: 0,
  },
  cardLeftSection: {
    width: '50%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
  },
  cardRightSection: {
    width: '50%',
    height: '100%',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfoGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandNameText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryText,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 12,
  },
  brandNameTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 11,
    letterSpacing: 0,
    textAlign: 'center',
    lineHeight: 14,
  },
  modelNameText: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.4,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  modelNameTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 21,
    letterSpacing: 0,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 3,
  },
  yearText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondaryText,
    letterSpacing: 1.4,
    textAlign: 'center',
    lineHeight: 12,
  },
  yearTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 11,
    letterSpacing: 0,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardBrandLogoContainer: {
    width: 96,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardBrandLogo: {
    width: 92,
    height: 76,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 4,
  },
  plateBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 3.5,
    borderWidth: 1.2,
    borderColor: '#222222',
    overflow: 'hidden',
    width: 76,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  plateBadgeHeader: {
    backgroundColor: '#0077C2',
    height: 10,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
  },
  plateBadgeHeaderText: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  plateBadgeContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 4,
  },
  plateBadgeNumbers: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  plateBadgeDivider: {
    width: 1,
    height: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginHorizontal: 3.5,
  },
  plateBadgeLettersRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  plateBadgeLetters: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  cardMiddleDivider: {
    position: 'absolute',
    left: '50%',
    marginLeft: -0.75,
    top: 38,
    bottom: 38,
    width: 1.5,
    backgroundColor: colors.cardBorder,
    borderRadius: 1,
    zIndex: 5,
  },

  /* 4 Smaller Cards Grid Styles */
  cardsGrid: {
    marginHorizontal: 20,
    marginTop: 12,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCardShadow: {
    flex: 1,
    borderRadius: 17,
    backgroundColor: colors.cardBg,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  miniCardSurface: {
    width: '100%',
    aspectRatio: 1.62,
    backgroundColor: colors.cardBg,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  miniCardShadowTow: {
    flex: 1,
    borderRadius: 17,
    backgroundColor: colors.cardBg,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  miniCardSurfaceTow: {
    width: '100%',
    aspectRatio: 1.62,
    backgroundColor: colors.cardBg,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  miniCardIconWrapper: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    opacity: isDarkMode ? 0.18 : 0.22,
    transform: [{ rotate: '-20deg' }],
  },
  miniCardIconWrapperRtl: {
    right: 'auto',
    left: -12,
    opacity: isDarkMode ? 0.18 : 0.22,
    transform: [{ rotate: '20deg' }],
  },
  miniCardHeader: {
    position: 'absolute',
    top: 13,
    left: 14,
    right: 14,
    zIndex: 2,
  },
  miniCardHeaderRtl: {
    alignItems: 'flex-end',
  },
  miniCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  miniCardTitleArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 16.5,
    letterSpacing: 0,
    textAlign: 'right',
  },
  miniCardSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.secondaryText,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  miniCardSubtitleArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 10,
    letterSpacing: 0,
    textAlign: 'right',
    marginTop: 1.5,
  },
  miniCardArrowButton: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : 'rgba(55, 99, 59, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: isDarkMode ? 0.15 : 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 3,
  },
  miniCardArrowButtonRtl: {
    left: 'auto',
    right: 14,
  },

  /* 3 Crossing Minimalist Hazard Ribbons */
  hazardTapeImageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
    elevation: 3,
  },
  hazardTapeImage: {
    width: '100%',
    height: '100%',
  },

  /* Construction Sign Plaque */
  constructionSignWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    zIndex: 5,
  },
  constructionSignWrapperRtl: {
    left: 'auto',
    right: 12,
  },
  constructionSign: {
    backgroundColor: '#FFD000',
    borderWidth: 1.5,
    borderColor: '#141414',
    borderRadius: 6,
    paddingVertical: 3.5,
    paddingHorizontal: 8.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  signBolt: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#141414',
  },
  constructionSignText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#141414',
    letterSpacing: 0.8,
  },
  constructionSignTextArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 10.5,
    letterSpacing: 0,
  },
});
