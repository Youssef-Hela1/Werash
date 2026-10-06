import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, PanResponder, Animated, Dimensions } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { 
  getSpecialistCover, 
  openSpecialistLocation, 
  callSpecialist, 
  messageSpecialist 
} from '../data/specialistHelpers';

const { height: ScreenHeight, width: ScreenWidth } = Dimensions.get('window');

export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage }) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';

  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(ScreenHeight)).current;

  useEffect(() => {
    Animated.spring(panY, {
      toValue: 0,
      tension: 65,
      friction: 9,
      useNativeDriver: true
    }).start();
  }, [panY]);

  const handleClose = () => {
    Animated.timing(panY, {
      toValue: ScreenHeight,
      duration: 220,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };

  const handleCloseHorizontal = () => {
    Animated.timing(panX, {
      toValue: ScreenWidth,
      duration: 220,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond if downwards vertical drag OR rightwards horizontal drag is dominant
        const isSwipeDown = gestureState.dy > 6 && Math.abs(gestureState.vx) < Math.abs(gestureState.vy);
        const isSwipeRight = gestureState.dx > 6 && Math.abs(gestureState.vx) > Math.abs(gestureState.vy);
        return isSwipeDown || isSwipeRight;
      },
      onPanResponderMove: (evt, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontalSwipe) {
          if (gestureState.dx > 0) {
            panX.setValue(gestureState.dx);
            panY.setValue(0);
          }
        } else {
          if (gestureState.dy > 0) {
            panY.setValue(gestureState.dy);
            panX.setValue(0);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontalSwipe) {
          if (gestureState.dx > 120 || gestureState.vx > 0.5) {
            handleCloseHorizontal();
          } else {
            Animated.spring(panX, {
              toValue: 0,
              tension: 60,
              friction: 8,
              useNativeDriver: true
            }).start();
          }
        } else {
          if (gestureState.dy > 120 || gestureState.vy > 0.6) {
            handleClose();
          } else {
            Animated.spring(panY, {
              toValue: 0,
              tension: 60,
              friction: 8,
              useNativeDriver: true
            }).start();
          }
        }
      }
    })
  ).current;

  if (!specialist) return null;

  const backdropOpacity = Animated.multiply(
    panY.interpolate({
      inputRange: [0, ScreenHeight * 0.45],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    }),
    panX.interpolate({
      inputRange: [0, ScreenWidth * 0.45],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    })
  );

  return (
    <View style={styles.overlayContainer}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>
      </Animated.View>
      <View style={styles.overlayCardContainer}>
        <Animated.View 
          style={[
            styles.expandedCard,
            { transform: [{ translateY: panY }, { translateX: panX }] }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Top Drag Handle Indicator Bar overlaying cover */}
          <View style={{
            width: 42,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            position: 'absolute',
            top: 10,
            alignSelf: 'center',
            zIndex: 11
          }} />

          {/* Close Button X */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.closeButton, isRtl && { right: undefined, left: 16 }]}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Workshop Cover Image */}
          <Image source={getSpecialistCover(specialist)} style={styles.expandedCover} />

          {/* Card Content Area */}
          <View style={styles.expandedDetails}>
            {/* Top Info Area */}
            <View style={[
              styles.expandedTopDetails,
              isRtl ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
            ]}>
              {/* Name */}
              <Text style={[
                styles.expandedName,
                isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }
              ]}>
                {isRtl ? (specialist.nameAr || specialist.name) : specialist.name}
              </Text>

              {/* Specialty */}
              <Text style={[
                styles.expandedSpecialty,
                isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.0, letterSpacing: 0 }
              ]} numberOfLines={1}>
                {isRtl ? (specialist.specialtyAr || specialist.specialty) : specialist.specialty}
              </Text>

              {/* Location Row */}
              <View style={[styles.locationRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={[styles.locationIcon, isRtl ? { marginLeft: 2, marginRight: 0 } : { marginRight: 2 }]} />
                <Text style={[
                  styles.expandedLocation,
                  isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }
                ]} numberOfLines={1}>
                  {isRtl ? (specialist.locationAr || specialist.location) : specialist.location}
                </Text>
              </View>
            </View>

            {/* Biography Description */}
            <Text style={[
              styles.expandedDescription,
              isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13, lineHeight: 20 }
            ]} numberOfLines={3}>
              {isRtl ? (specialist.descriptionAr || specialist.description) : specialist.description}
            </Text>

            {/* Bottom Section */}
            <View style={styles.expandedBottomContainer}>
              {/* Thin Divider Line */}
              <View style={styles.cardDivider} />

              {/* Rating Row */}
              <View style={[styles.expandedStatsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                {/* Rating */}
                <View style={[styles.ratingContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="star" size={14} color={colors.gold} style={[styles.starIcon, isRtl ? { marginLeft: 3, marginRight: 0 } : { marginRight: 3 }]} />
                  <Text style={[styles.expandedRatingText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 12.0 }]}>
                    {specialist.rating}{' '}
                    <Text style={styles.reviewsText}>
                      ({isRtl ? `${specialist.reviews} تقييم` : `${specialist.reviews} reviews`})
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Actions Row */}
              <View style={[styles.expandedActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonOutline}
                  onPress={() => openSpecialistLocation(specialist)}
                >
                  <Ionicons name="location-outline" size={22} color={colors.bgBrand} />
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonOutline}
                  onPress={() => callSpecialist(specialist, isRtl)}
                >
                  <Ionicons name="call-outline" size={22} color={colors.bgBrand} />
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonSolid}
                  onPress={() => messageSpecialist(specialist, isRtl)}
                >
                  <Ionicons name="logo-whatsapp" size={21} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 3,
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
    zIndex: 1000,
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
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  expandedTopDetails: {
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 4,
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
    marginTop: 12,
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
    gap: 12,
    marginTop: 4,
  },
  expandedActionButtonOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    backgroundColor: 'transparent',
  },
  expandedActionButtonSolid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
