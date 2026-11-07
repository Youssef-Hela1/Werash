import React from 'react';
import { StyleSheet, View, StatusBar, Image, Text, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Original image aspect ratio (852 width x 1846 height)
const BACKDROP_ASPECT = 1846 / 852;
const BACKDROP_HEIGHT = Math.round(screenWidth * BACKDROP_ASPECT);

// The green-to-cream transition boundary in the backdrop asset occurs at y = 535 / 852
const TRANSITION_RATIO = 535 / 852;
const GREEN_BOUNDARY = Math.round(screenWidth * TRANSITION_RATIO);

// Card dimensions: 180 height centered on GREEN_BOUNDARY so exactly half is on green and half on cream
const OVERLAP_CARD_HEIGHT = 180;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Forest Green Satin Backdrop */}
      <Image 
        source={require('../../assets/forest_green_satin_backdrop.png')}
        style={styles.satinBackdrop}
        resizeMode="contain"
      />

      {/* Top Left Brand Header (Logo & Wordmark only) */}
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

      {/* Premium Ivory White Overlapping Card */}
      <View style={[styles.overlapCardContainer, { top: OVERLAP_CARD_TOP }]}>
        <View style={styles.premiumIvoryCard}>
          {/* Subtle top inner highlight for depth */}
          <View style={styles.cardInnerHighlight} pointerEvents="none" />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
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

  /* Overlapping Ivory Card */
  overlapCardContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: OVERLAP_CARD_HEIGHT,
    zIndex: 20,
  },
  premiumIvoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFB', // Premium Ivory White
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    // Multi-layer ambient drop shadow for elevation over both dark green & light cream
    shadowColor: '#051E0A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  cardInnerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
