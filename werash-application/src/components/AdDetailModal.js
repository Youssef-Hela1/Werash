import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, Alert, PanResponder, Animated, Dimensions } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ServiceBrandLogo from './ServiceBrandLogo';

const { height: ScreenHeight, width: ScreenWidth } = Dimensions.get('window');

export default function AdDetailModal({ ad, onClose, selectedLanguage }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const isRtl = selectedLanguage === 'Arabic';
  const labelCoupon = isRtl ? 'كود الخصم:' : 'Promo Code:';
  const labelVisit = isRtl ? 'زيارة الموقع' : 'Visit Website';
  const labelCopy = isRtl ? 'نسخ الكود' : 'Copy Code';
  const labelSponsored = isRtl ? 'إعلان ممول' : 'SPONSORED PROMOTION';

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

  if (!ad) return null;

  const handleVisitWebsite = () => {
    if (ad.website) {
      Linking.openURL(ad.website).catch(() => {
        Alert.alert(
          isRtl ? 'زيارة الموقع' : 'Visit Website',
          isRtl 
            ? `سيتم توجيهك إلى الموقع الإلكتروني للمعلن:\n${ad.website}`
            : `Redirecting you to the sponsor's website:\n${ad.website}`
        );
      });
    }
  };

  const handleCopyCode = () => {
    Alert.alert(
      isRtl ? 'تم نسخ الكود!' : 'Promo Code Copied!',
      isRtl 
        ? `استخدم الكود "${ad.coupon}" لدى "${ad.sponsor}" للاستفادة من العرض الحصري.`
        : `Use promo code "${ad.coupon}" at "${ad.sponsor}" to redeem this exclusive offer.`
    );
  };

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
          {/* Drag Handle Indicator */}
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

          {/* Ad Banner Image */}
          <View style={[styles.expandedCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
            {ad.serviceBrand ? (
              <ServiceBrandLogo brand={ad.serviceBrand} />
            ) : (
              <Image source={ad.image} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
            )}
          </View>

          {/* Sponsored Label */}
          <View style={[styles.expandedBadge, isRtl ? { left: undefined, right: 16 } : { left: 16 }]}>
            <Text style={[styles.expandedBadgeText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10 }]}>{labelSponsored}</Text>
          </View>

          {/* Card Content Area */}
          <View style={styles.expandedDetails}>
            {/* Top Details (Sponsor & Category) */}
            <View style={[styles.detailsHeader, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.titleGroup, isRtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.sponsorName, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13 }]}>{ad.sponsor}</Text>
                <Text style={[styles.adTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 18.0 }, isRtl && { textAlign: 'right' }]}>
                  {ad.title}
                </Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: ad.color + '1A', borderColor: ad.color }]}>
                <Text style={[styles.categoryText, { color: ad.color }, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11 }]}>{ad.badge}</Text>
              </View>
            </View>

            {/* Description Description */}
            <Text style={[styles.expandedDescription, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13, lineHeight: 20 }]}>
              {ad.desc}
            </Text>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Coupon Code Section */}
            <View style={[styles.couponRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.couponLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.5 }]}>{labelCoupon}</Text>
              <View style={[styles.couponContainer, { borderColor: ad.color, backgroundColor: ad.color + '0F' }]}>
                <Text style={[styles.couponText, { color: ad.color }]}>{ad.coupon}</Text>
              </View>
            </View>

            {/* Actions Row */}
            <View style={[styles.expandedActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={[styles.expandedActionButtonOutline, isRtl && { flexDirection: 'row-reverse' }]}
                onPress={handleCopyCode}
              >
                <Ionicons name="copy-outline" size={18} color={colors.bgBrand} />
                <Text style={[styles.actionButtonLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>{labelCopy}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={[styles.expandedActionButtonSolid, isRtl && { flexDirection: 'row-reverse' }]}
                onPress={handleVisitWebsite}
              >
                <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.actionButtonLabelSolid, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>{labelVisit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000, // Make sure it renders above bottom nav and headers
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
    resizeMode: 'cover',
  },
  expandedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 45, 31, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 8,
  },
  expandedBadgeText: {
    color: colors.bgCreamy,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
  },
  sponsorName: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 2,
  },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
  },
  expandedDescription: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    marginTop: 12,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginVertical: 16,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  couponLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  couponContainer: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  couponText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  expandedActionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
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
    height: 44,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
