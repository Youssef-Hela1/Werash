import React, { useRef } from 'react';
import { StyleSheet, View, StatusBar, Image, Text, Dimensions, Platform, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import PremiumCard from '../components/PremiumCard';

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

  // Spring animation for cards movement with tight, highly limited travel
  const cardsTranslateY = useRef(new Animated.Value(0)).current;

  // Very limited travel range (~20px max) with stiff resistance
  const MAX_TRAVEL = 20;
  const calculateDampedDelta = (dy) => {
    const sign = dy < 0 ? -1 : 1;
    const absDy = Math.abs(dy);
    return sign * (absDy / (absDy + 80)) * MAX_TRAVEL;
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
          velocity: (gestureState.vy || 0) * 0.1,
          tension: 140,
          friction: 18,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(cardsTranslateY, {
          toValue: 0,
          tension: 140,
          friction: 18,
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

      {/* Top Left Brand Header (Static Logo, Wordmark & Greeting) */}
      <View style={[styles.headerContainer, { paddingTop: topInset + 2 }, isRtl && styles.headerContainerRtl]}>
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

      {/* Spring / Scroll Area for Cards Only */}
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
          <PremiumCard />
        </Animated.View>
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
    zIndex: 10,
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
    zIndex: 20,
    overflow: 'visible',
  },
  cardsWrapper: {
    width: '100%',
    overflow: 'visible',
  },
});
