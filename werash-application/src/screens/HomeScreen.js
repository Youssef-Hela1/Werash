import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Text, Image } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

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
  const isRtl = selectedLanguage === 'Arabic';
  const activeVehicle = userVehicles.find(v => v.id === activeVehicleId) || null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgCreamy} />

      <View style={styles.scrollView}>
        <View style={[styles.scrollContent, isRtl && { paddingTop: 6 }]}>
          {/* Main Top Row */}
          <View style={[styles.mainRow, isRtl && { flexDirection: 'row-reverse' }]}>
            {/* Left Column: Vertical Active Vehicle Card */}
            <View style={styles.leftColumn}>
              <ActiveVehicleCard 
                currentUser={currentUser} 
                onOpenSignIn={onOpenSignIn} 
                selectedLanguage={selectedLanguage} 
                activeVehicle={activeVehicle}
                variant="vertical"
                onPress={() => {
                  if (onNavigate) onNavigate('garage');
                }}
              />
            </View>

            {/* Right Column: Mechanics & Community Cards */}
            <View style={styles.rightColumn}>
              {/* Mechanics Card */}
              <TouchableOpacity
                style={styles.miniCardMechanic}
                activeOpacity={0.82}
                onPress={() => {
                  if (onNavigate) onNavigate('mechanics');
                }}
              >
                {/* Solid Opaque Multi-Tone Light Green Gradient */}
                <View style={styles.miniCardGlassLayer} pointerEvents="none">
                  <LinearGradient
                    colors={colors.white === '#FFFFFF' 
                      ? ['#EFF6EF', '#DFECDF', '#C3DAC5'] 
                      : ['#162318', '#1D2F20', '#273E2B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Subtle Atmospheric Icon Halo */}
                  <LinearGradient
                    colors={['rgba(77, 110, 79, 0.05)', 'transparent']}
                    style={[styles.watermarkHalo, isRtl && styles.watermarkHaloRtl]}
                  />
                </View>

                {/* Subtle Background Watermark Icon */}
                <View style={[styles.miniCardWatermarkWrapper, isRtl && styles.miniCardWatermarkWrapperRtl]} pointerEvents="none">
                  <Ionicons 
                    name="construct-outline" 
                    size={44} 
                    color={colors.white === '#FFFFFF' ? '#243E27' : '#8EBF92'} 
                    style={styles.miniCardWatermarkIcon} 
                  />
                </View>

                {/* Header: Title & Subtitle */}
                <View style={styles.miniCardHeader} pointerEvents="none">
                  <Text 
                    style={[
                      styles.miniCardTitle, 
                      { color: colors.white === '#FFFFFF' ? '#243E27' : '#8EBF92' }, 
                      isRtl && styles.miniCardTitleArabic
                    ]}
                    numberOfLines={1}
                  >
                    {isRtl ? 'الميكانيكيين' : 'Mechanics'}
                  </Text>
                  <Text 
                    style={[
                      styles.miniCardSubtitle, 
                      { color: colors.white === '#FFFFFF' ? 'rgba(36, 62, 39, 0.65)' : 'rgba(142, 191, 146, 0.70)' }, 
                      isRtl && styles.miniCardSubtitleArabic
                    ]}
                    numberOfLines={1}
                  >
                    {isRtl ? 'فنيين معتمدين' : 'Certified Experts'}
                  </Text>
                </View>

                {/* Premium Action Arrow Button (Bottom Left) */}
                <View style={styles.miniCardArrowButton} pointerEvents="none">
                  <Ionicons 
                    name={isRtl ? "arrow-back" : "arrow-forward"} 
                    size={13.5} 
                    color={colors.white === '#FFFFFF' ? '#243E27' : '#8EBF92'} 
                  />
                </View>
              </TouchableOpacity>

              {/* Community Card (Deeper Active Vehicle Sage Shade) */}
              <TouchableOpacity
                style={styles.miniCardCommunity}
                activeOpacity={0.82}
                onPress={() => {
                  if (onNavigate) onNavigate('community');
                }}
              >
                {/* Solid Opaque Multi-Tone Light Green Gradient */}
                <View style={styles.miniCardGlassLayer} pointerEvents="none">
                  <LinearGradient
                    colors={colors.white === '#FFFFFF' 
                      ? ['#E8F1E8', '#DAE7D9', '#BFD7C2'] 
                      : ['#131E15', '#1A291C', '#243727']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Subtle Atmospheric Icon Halo */}
                  <LinearGradient
                    colors={['rgba(77, 110, 79, 0.05)', 'transparent']}
                    style={[styles.watermarkHalo, isRtl && styles.watermarkHaloRtl]}
                  />
                </View>

                {/* Subtle Background Watermark Icon */}
                <View style={[styles.miniCardWatermarkWrapper, isRtl && styles.miniCardWatermarkWrapperRtl]} pointerEvents="none">
                  <Ionicons 
                    name="chatbubbles-outline" 
                    size={44} 
                    color={colors.white === '#FFFFFF' ? '#223C25' : '#8CBF90'} 
                    style={styles.miniCardWatermarkIcon} 
                  />
                </View>

                {/* Header: Title & Subtitle */}
                <View style={styles.miniCardHeader} pointerEvents="none">
                  <Text 
                    style={[
                      styles.miniCardTitle, 
                      { color: colors.white === '#FFFFFF' ? '#223C25' : '#8CBF90' }, 
                      isRtl && styles.miniCardTitleArabic
                    ]}
                    numberOfLines={1}
                  >
                    {isRtl ? 'المجتمع' : 'Community'}
                  </Text>
                  <Text 
                    style={[
                      styles.miniCardSubtitle, 
                      { color: colors.white === '#FFFFFF' ? 'rgba(34, 60, 37, 0.65)' : 'rgba(140, 191, 144, 0.70)' }, 
                      isRtl && styles.miniCardSubtitleArabic
                    ]}
                    numberOfLines={1}
                  >
                    {isRtl ? 'نقاشات وتجارب' : 'Feed & Posts'}
                  </Text>
                </View>

                {/* Premium Action Arrow Button (Bottom Left) */}
                <View style={styles.miniCardArrowButton} pointerEvents="none">
                  <Ionicons 
                    name={isRtl ? "arrow-back" : "arrow-forward"} 
                    size={13.5} 
                    color={colors.white === '#FFFFFF' ? '#223C25' : '#8CBF90'} 
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secondary Row: Tow & Profile Cards */}
          <View style={[styles.secondaryRow, isRtl && { flexDirection: 'row-reverse' }]}>
            {/* Tow Card (Dark Construction Theme with Hazard Ribbons & Coming Soon Sign) */}
            <TouchableOpacity
              style={styles.miniCardTow}
              activeOpacity={0.88}
              onPress={() => {
                // Feature currently under construction
              }}
            >
              {/* Medium-Dark Sage Green Opaque Gradient */}
              <View style={styles.miniCardGlassLayer} pointerEvents="none">
                <LinearGradient
                  colors={colors.white === '#FFFFFF' 
                    ? ['#D4E6D7', '#BAD4BE', '#9EBEA3'] 
                    : ['#1E3222', '#28422E', '#34543C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Subtle Atmospheric Halo Glow */}
                <LinearGradient
                  colors={['rgba(77, 110, 79, 0.06)', 'transparent']}
                  style={[styles.watermarkHalo, isRtl && styles.watermarkHaloRtl]}
                />
              </View>

              {/* Tow Truck Silhouette Watermark */}
              <View style={[styles.miniCardWatermarkWrapper, isRtl && styles.miniCardWatermarkWrapperRtl]} pointerEvents="none">
                <MaterialCommunityIcons 
                  name="tow-truck" 
                  size={44} 
                  color={colors.white === '#FFFFFF' ? '#274229' : '#72A876'} 
                  style={styles.miniCardWatermarkIcon} 
                />
              </View>

              {/* Header: Title & Subtitle */}
              <View style={[styles.miniCardHeader, styles.miniCardTowHeader]}>
                <Text 
                  style={[
                    styles.miniCardTitle, 
                    { color: colors.white === '#FFFFFF' ? '#243D26' : '#72A876' }, 
                    isRtl && styles.miniCardTitleArabic
                  ]}
                  numberOfLines={1}
                >
                  {isRtl ? 'سطحة' : 'Tow'}
                </Text>
                <Text 
                  style={[
                    styles.miniCardSubtitle, 
                    { color: colors.white === '#FFFFFF' ? 'rgba(36, 61, 38, 0.65)' : 'rgba(114, 168, 118, 0.70)' }, 
                    isRtl && styles.miniCardSubtitleArabic
                  ]}
                  numberOfLines={1}
                >
                  {isRtl ? 'طوارئ وسحب' : 'Roadside Assist'}
                </Text>
              </View>

              {/* 3 Crossing Minimalist Hazard Ribbons Reaching Both Edges */}
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
            </TouchableOpacity>

            {/* Profile Card (Cool Mint-to-Sage Light Green Gradient) */}
            <TouchableOpacity
              style={styles.miniCardProfile}
              activeOpacity={0.82}
              onPress={() => {
                if (onSelectProfile) {
                  onSelectProfile();
                } else if (onOpenSignIn) {
                  onOpenSignIn();
                }
              }}
            >
              {/* Solid Opaque Multi-Tone Light Green Gradient */}
              <View style={styles.miniCardGlassLayer} pointerEvents="none">
                <LinearGradient
                  colors={colors.white === '#FFFFFF' 
                    ? ['#F4F8F4', '#EBF2EB', '#D8E7D9'] 
                    : ['#1D2C20', '#253828', '#314835']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Subtle Atmospheric Icon Halo */}
                <LinearGradient
                  colors={['rgba(77, 110, 79, 0.05)', 'transparent']}
                  style={[styles.watermarkHalo, isRtl && styles.watermarkHaloRtl]}
                />
              </View>

              {/* Subtle Background Watermark Icon */}
              <View style={[styles.miniCardWatermarkWrapper, isRtl && styles.miniCardWatermarkWrapperRtl]} pointerEvents="none">
                <Ionicons 
                  name="person-outline" 
                  size={44} 
                  color={colors.white === '#FFFFFF' ? '#29452C' : '#9ACD9E'} 
                  style={styles.miniCardWatermarkIcon} 
                />
              </View>

              {/* Header: Title & Subtitle */}
              <View style={styles.miniCardHeader} pointerEvents="none">
                <Text 
                  style={[
                    styles.miniCardTitle, 
                    { color: colors.white === '#FFFFFF' ? '#29452C' : '#9ACD9E' }, 
                    isRtl && styles.miniCardTitleArabic
                  ]}
                  numberOfLines={1}
                >
                  {isRtl ? 'الملف الشخصي' : 'Profile'}
                </Text>
                <Text 
                  style={[
                    styles.miniCardSubtitle, 
                    { color: colors.white === '#FFFFFF' ? 'rgba(41, 69, 44, 0.65)' : 'rgba(154, 205, 158, 0.70)' }, 
                    isRtl && styles.miniCardSubtitleArabic
                  ]}
                  numberOfLines={1}
                >
                  {isRtl ? 'الحساب والمركبات' : 'Account & Garage'}
                </Text>
              </View>

              {/* Premium Action Arrow Button (Bottom Left) */}
              <View style={styles.miniCardArrowButton} pointerEvents="none">
                <Ionicons 
                  name={isRtl ? "arrow-back" : "arrow-forward"} 
                  size={13.5} 
                  color={colors.white === '#FFFFFF' ? '#29452C' : '#9ACD9E'} 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sponsored Ads Section */}
          <SpecialistSpotlight 
            onNavigate={onNavigate} 
            selectedLanguage={selectedLanguage} 
            onSelectAd={onSelectAd} 
          />
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
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 55,
    paddingHorizontal: 20,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  leftColumn: {
    width: '48.5%',
  },
  rightColumn: {
    width: '48.5%',
    height: 236, // Exact match with ActiveVehicleCard minHeight
    justifyContent: 'space-between',
  },
  // Profile Card (Lighter Active Vehicle Sage Shade - Solid Opaque)
  miniCardProfile: {
    width: '48.5%',
    height: 112,
    borderRadius: 20,
    backgroundColor: colors.white === '#FFFFFF' ? '#EAF1E9' : '#223325',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingHorizontal: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.065 : 0.35,
    shadowRadius: 14,
    elevation: 3,
  },

  // Community Card (Deeper Active Vehicle Sage Shade - Solid Opaque)
  miniCardCommunity: {
    height: 112, // (236 - 12) / 2 = 112px
    borderRadius: 20,
    backgroundColor: colors.white === '#FFFFFF' ? '#D6E4D6' : '#162318',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.24)' : 'rgba(93, 130, 96, 0.28)',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingHorizontal: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.065 : 0.35,
    shadowRadius: 14,
    elevation: 3,
  },

  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  // Tow Card (Medium-Dark Sage Green Shade - Solid Opaque)
  miniCardTow: {
    width: '48.5%',
    height: 112,
    borderRadius: 20,
    backgroundColor: colors.white === '#FFFFFF' ? '#AFD0B4' : '#1C2E20',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.30)' : 'rgba(93, 130, 96, 0.35)',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingHorizontal: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.065 : 0.35,
    shadowRadius: 14,
    elevation: 3,
  },

  // Mechanics Card (Sage Green Shade - Solid Opaque)
  miniCardMechanic: {
    height: 112, // (236 - 12) / 2 = 112px
    borderRadius: 20,
    backgroundColor: colors.white === '#FFFFFF' ? '#DBEADB' : '#1A2A1C',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.22)' : 'rgba(93, 130, 96, 0.26)',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingHorizontal: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.065 : 0.35,
    shadowRadius: 14,
    elevation: 3,
  },

  miniCardHeader: {
    width: '100%',
    zIndex: 3,
  },
  miniCardTowHeader: {
    zIndex: 2, // Behind hazard ribbons (zIndex: 4)
  },
  miniCardArrowButton: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white === '#FFFFFF' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(41, 69, 44, 0.10)' : 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#162D1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.35,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 3,
  },

  // 3 Clean Minimalist Construction Hazard Ribbons
  hazardTapeImageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4, // Over text (zIndex: 2)
    elevation: 3,
  },
  hazardTapeImage: {
    width: '100%',
    height: '100%',
  },

  // Construction Sign Plaque
  constructionSignWrapper: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    zIndex: 5,
  },
  constructionSignWrapperRtl: {
    left: undefined,
    right: 10,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
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
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 10.5,
    letterSpacing: 0,
  },

  miniCardGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    overflow: 'hidden',
  },

  watermarkHalo: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  watermarkHaloRtl: {
    right: undefined,
    left: -8,
  },

  miniCardWatermarkWrapper: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    zIndex: 1,
    opacity: colors.white === '#FFFFFF' ? 0.11 : 0.16,
  },
  miniCardWatermarkWrapperRtl: {
    right: undefined,
    left: 8,
  },
  miniCardWatermarkIcon: {
    transform: [{ rotate: '-8deg' }],
  },
  miniCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bgBrand,
    letterSpacing: -0.1,
    textAlign: 'left',
    zIndex: 2,
  },
  miniCardTitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 13.5,
    letterSpacing: 0,
    textAlign: 'right',
  },
  miniCardSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'left',
    marginTop: 2,
    zIndex: 2,
  },
  miniCardSubtitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 9.5,
    letterSpacing: 0,
    textAlign: 'right',
    marginTop: 1,
  },
});
