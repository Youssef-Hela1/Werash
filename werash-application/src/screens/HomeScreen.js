import React from 'react';
import { StyleSheet, View, StatusBar, Image, Text, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Original image aspect ratio (852 width x 1846 height)
const BACKDROP_ASPECT = 1846 / 852;
const BACKDROP_HEIGHT = Math.round(screenWidth * BACKDROP_ASPECT);

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
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isRtl = selectedLanguage === 'Arabic';

  const getFirstName = () => {
    if (!currentUser || !currentUser.fullName) return '';
    return currentUser.fullName.trim().split(/\s+/)[0];
  };

  // Ensure comfortable top clearance on all devices (notch, Dynamic Island, status bar)
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 28));

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
      <View style={[styles.headerContainer, { paddingTop: topInset + 4 }, isRtl && styles.headerContainerRtl]}>
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

const createStyles = (colors) => StyleSheet.create({
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
    width: 52,
    height: 52,
    marginRight: 12,
  },
  logoImageRtl: {
    marginRight: 0,
    marginLeft: 12,
  },
  wordmarkImage: {
    height: 52,
    width: 154,
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 88,
    letterSpacing: 0,
    marginTop: -6,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 18,
    letterSpacing: -0.2,
  },
  greetingTextArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    textAlign: 'right',
  },
});
