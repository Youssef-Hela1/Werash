import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Easing,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { 
  getSpecialistCover, 
  openSpecialistLocation, 
  callSpecialist, 
  messageSpecialist,
  getMechanicBrandLogo,
  getSpecialistCategoryIcon
} from '../data/specialistHelpers';

const { height: ScreenHeight, width: ScreenWidth } = Dimensions.get('window');

export default function SpecialistDetailModal({
  specialist,
  onClose,
  selectedLanguage,
  activeVehicle,
  onShareToFeed,
  onShareInMessage,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';

  // Bottom Sheet Share state & animation
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const shareTranslateY = useRef(new Animated.Value(ScreenHeight)).current;
  const isClosingShareRef = useRef(false);

  const openShareModal = useCallback(() => {
    isClosingShareRef.current = false;
    setShareModalVisible(true);
    shareTranslateY.setValue(ScreenHeight);
    Animated.spring(shareTranslateY, {
      toValue: 0,
      damping: 24,
      mass: 0.8,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
  }, [shareTranslateY]);

  const closeShareModal = useCallback((onFinish) => {
    if (isClosingShareRef.current) return;
    isClosingShareRef.current = true;
    Animated.timing(shareTranslateY, {
      toValue: ScreenHeight,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShareModalVisible(false);
      isClosingShareRef.current = false;
      if (typeof onFinish === 'function') onFinish();
    });
  }, [shareTranslateY]);

  const sharePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        shareTranslateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingShareRef.current) return;
        if (gestureState.dy > 0) {
          shareTranslateY.setValue(gestureState.dy);
        } else {
          shareTranslateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingShareRef.current) return;
        if (gestureState.dy > 60 || gestureState.vy > 0.5) {
          closeShareModal();
        } else {
          Animated.spring(shareTranslateY, {
            toValue: 0,
            damping: 24,
            mass: 0.8,
            stiffness: 240,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleShareToFeed = () => {
    closeShareModal(() => {
      if (typeof onShareToFeed === 'function') {
        onShareToFeed(specialist);
      }
    });
  };

  const handleShareAsMessage = () => {
    closeShareModal(() => {
      if (typeof onShareInMessage === 'function') {
        onShareInMessage(specialist);
      }
    });
  };

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

          {/* Share Button on Top Left */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.shareButton, isRtl && { left: undefined, right: 16 }]}
            onPress={openShareModal}
            accessibilityRole="button"
            accessibilityLabel="Share mechanic"
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
              size={21}
              color="#FFFFFF"
              style={Platform.OS === 'ios' ? { marginTop: -2 } : null}
            />
          </TouchableOpacity>

          {/* Close Button X */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.closeButton, isRtl && { right: undefined, left: 16 }]}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Workshop Cover Image */}
          {(() => {
            const showBrand = specialist._filterByVehicle !== false;
            const brandLogo = showBrand ? getMechanicBrandLogo(specialist, activeVehicle) : null;
            const specialtyIcon = getSpecialistCategoryIcon(specialist, specialist._selectedCategory);

            if (brandLogo) {
              return (
                <View
                  style={[
                    styles.expandedCover,
                    {
                      backgroundColor: '#EBEBEB',
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 20,
                      gap: 18,
                    }
                  ]}
                >
                  <Image source={brandLogo} resizeMode="contain" style={{ width: 84, height: 84 }} />
                  <View style={{ width: 1.5, height: 50, backgroundColor: 'rgba(0, 0, 0, 0.12)', borderRadius: 1 }} />
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 18,
                      backgroundColor: 'rgba(77, 110, 79, 0.12)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(77, 110, 79, 0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={specialtyIcon} size={32} color={colors.bgBrand} />
                  </View>
                </View>
              );
            }

            return (
              <View style={[styles.expandedCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    backgroundColor: 'rgba(77, 110, 79, 0.12)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(77, 110, 79, 0.22)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={specialtyIcon} size={38} color={colors.bgBrand} />
                </View>
              </View>
            );
          })()}

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
                isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold' }
              ]}>
                {isRtl ? (specialist.nameAr || specialist.name) : specialist.name}
              </Text>

              {/* Specialty */}
              <Text style={[
                styles.expandedSpecialty,
                isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11.0, letterSpacing: 0 }
              ]} numberOfLines={1}>
                {isRtl ? (specialist.specialtyAr || specialist.specialty) : specialist.specialty}
              </Text>

              {/* Location Row */}
              <View style={[styles.locationRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={[styles.locationIcon, isRtl ? { marginLeft: 2, marginRight: 0 } : { marginRight: 2 }]} />
                <Text style={[
                  styles.expandedLocation,
                  isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 11.5 }
                ]} numberOfLines={1}>
                  {isRtl ? (specialist.locationAr || specialist.location) : specialist.location}
                </Text>
              </View>
            </View>

            {/* Biography Description */}
            <Text style={[
              styles.expandedDescription,
              isRtl && { textAlign: 'right', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 13, lineHeight: 20 }
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
                  <Text style={[styles.expandedRatingText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 12.0 }]}>
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

      {/* Share Bottom Sheet Modal */}
      {shareModalVisible && (
        <Modal
          visible={shareModalVisible}
          animationType="none"
          transparent
          statusBarTranslucent
          onRequestClose={() => closeShareModal()}
        >
          <View style={styles.sheetOverlay}>
            {/* Dimmed, Softly Blurred Backdrop that fades in/out with the sheet */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: shareTranslateY.interpolate({
                    inputRange: [0, 260],
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
                onPress={() => closeShareModal()}
                activeOpacity={1}
              />
            </Animated.View>

            {/* Animated Compact Bottom Sheet */}
            <Animated.View
              style={[
                styles.shareSheet,
                {
                  paddingBottom: Math.max(insets?.bottom || 0, 16) + 16,
                  transform: [{ translateY: shareTranslateY }],
                },
              ]}
            >
              {/* Drag Handle with PanResponder */}
              <View {...sharePanResponder.panHandlers} style={styles.dragHandleHitBox}>
                <View style={styles.dragHandle} />
              </View>

              {/* Fixed Header Section (also draggable) */}
              <View
                {...sharePanResponder.panHandlers}
                style={[styles.sheetHeader, isRtl && { flexDirection: 'row-reverse' }]}
              >
                <View
                  style={[
                    styles.sheetHeaderTitles,
                    isRtl && { alignItems: 'flex-end', paddingRight: 0, paddingLeft: 12 },
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetTitle,
                      isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 18, textAlign: 'right' },
                    ]}
                  >
                    {isRtl ? 'مشاركة الفني' : 'Share mechanic'}
                  </Text>
                  <Text
                    style={[
                      styles.sheetSubtitle,
                      isRtl && { fontFamily: 'IBMPlexSansArabic-Regular', fontSize: 12, textAlign: 'right' },
                    ]}
                  >
                    {isRtl ? 'اختر طريقة مشاركة الفني' : 'Choose how you want to share'}
                  </Text>
                </View>

                {/* Circular Close Button */}
                <TouchableOpacity
                  onPress={() => closeShareModal()}
                  activeOpacity={0.7}
                  style={styles.sheetCloseButton}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* 2 Options Side-by-Side (A lot smaller than location section) */}
              <View style={[styles.shareOptionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                {/* Option 1: Share to feed */}
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.shareOptionCard}
                  onPress={handleShareToFeed}
                >
                  <View style={styles.shareOptionIconBadge}>
                    <Ionicons
                      name="newspaper-outline"
                      size={24}
                      color={isDarkMode ? '#4ADE80' : '#003514'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.shareOptionTitle,
                      isRtl && styles.shareOptionTitleRtl,
                    ]}
                  >
                    {isRtl ? 'نشر في المجتمع' : 'Share to feed'}
                  </Text>
                  <Text
                    style={[
                      styles.shareOptionSubtitle,
                      isRtl && styles.shareOptionSubtitleRtl,
                    ]}
                  >
                    {isRtl ? 'نشر في خلاصة المجتمع' : 'Post to community'}
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Share as a message */}
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.shareOptionCard}
                  onPress={handleShareAsMessage}
                >
                  <View style={styles.shareOptionIconBadge}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={24}
                      color={isDarkMode ? '#4ADE80' : '#003514'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.shareOptionTitle,
                      isRtl && styles.shareOptionTitleRtl,
                    ]}
                  >
                    {isRtl ? 'مشاركة في رسالة' : 'Share in message'}
                  </Text>
                  <Text
                    style={[
                      styles.shareOptionSubtitle,
                      isRtl && styles.shareOptionSubtitleRtl,
                    ]}
                  >
                    {isRtl ? 'إرسال في محادثة خاصة' : 'Send in direct chat'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
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
    elevation: 1000,
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
  shareButton: {
    position: 'absolute',
    top: 15,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: isDarkMode ? '#1E3224' : '#003514',
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(74, 222, 128, 0.45)' : 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.30,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  shareSheet: {
    backgroundColor: colors.white === '#FFFFFF' ? '#FFFFFF' : '#172019',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  shareOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 12,
  },
  shareOptionCard: {
    flex: 1,
    backgroundColor: colors.white === '#FFFFFF' ? '#EDF4EE' : '#1E2C21',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? '#D4E2D6' : 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  shareOptionIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white === '#FFFFFF' ? '#FFFFFF' : '#243427',
    borderWidth: 1,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(0, 53, 20, 0.08)' : 'rgba(74, 222, 128, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  shareOptionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white === '#FFFFFF' ? '#003514' : '#4ADE80',
    textAlign: 'center',
  },
  shareOptionTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 13,
  },
  shareOptionSubtitle: {
    fontSize: 11,
    color: colors.white === '#FFFFFF' ? '#6B7280' : '#9CA3AF',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },
  shareOptionSubtitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
    fontSize: 10.5,
  },
});
