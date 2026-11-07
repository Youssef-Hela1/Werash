import React, { useRef } from 'react';
import { StyleSheet, View, StatusBar, Image, Text, Dimensions, Platform, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import PremiumCard from '../components/PremiumCard';
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
  const brandLogo = getBrandLogo(carBrand) || BRAND_LOGOS['hyundai'];

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
          <PremiumCard surfaceStyle={styles.cardSurface}>
            <View style={styles.cardContent}>
              {/* Left Side: Brand Logo (Exactly Centered in the 40% column) */}
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
              </View>

              {/* Vertical Divider Line at 40% boundary */}
              <View style={styles.cardMiddleDivider} />

              {/* Right Side: 60% column */}
              <View style={styles.cardRightSection} />
            </View>
          </PremiumCard>
        </Animated.View>
      </View>

      {/* Top Left Brand Header (Always in front: zIndex 100, elevation 100) */}
      <View 
        pointerEvents="box-none"
        style={[styles.headerContainer, { paddingTop: topInset + 2 }, isRtl && styles.headerContainerRtl]}
      >
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
    backgroundColor: '#FFFFFF', // Pure White
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
    alignItems: 'flex-start',
    zIndex: 100,
    elevation: 100,
  },
  headerContainerRtl: {
    alignItems: 'flex-end',
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
    fontFamily: 'ZafranArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
  cardLeftSection: {
    width: '40%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRightSection: {
    width: '60%',
    height: '100%',
    padding: 20,
  },
  cardBrandLogoContainer: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardBrandLogo: {
    width: 112,
    height: 112,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  cardMiddleDivider: {
    position: 'absolute',
    left: '40%',
    marginLeft: -0.75,
    top: 20,
    bottom: 20,
    width: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1,
    zIndex: 5,
  },
});
