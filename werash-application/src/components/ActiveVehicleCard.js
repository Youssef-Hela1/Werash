import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { BRAND_LOGOS } from '../data/brandLogos';
import { CAR_BRANDS_AND_MODELS } from '../data/carModels';
import { LinearGradient } from 'expo-linear-gradient';

// Helper to split numbers (left) and letters (right) on license plates
const splitPlate = (plateStr) => {
  if (!plateStr) return { numbers: '', letters: '' };
  
  // Match digits (0-9 and Arabic numerals ٠-٩)
  const digitRegex = /[0-9\u0660-\u0669]/g;
  const digits = plateStr.match(digitRegex) || [];
  
  // Replace digits to extract letters only, normalizing spacing
  const lettersOnly = plateStr.replace(digitRegex, '').trim().replace(/\s+/g, ' ');
  
  return {
    numbers: digits.join(''),
    letters: lettersOnly
  };
};

export default function ActiveVehicleCard({ 
  currentUser, 
  onOpenSignIn, 
  selectedLanguage, 
  activeVehicle, 
  showExtendedInfo = false,
  style,
  onChangePress,
  onAddPress,
  variant = 'horizontal'
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  
  // Guest state exists if there is no logged-in user AND no explicit active vehicle passed
  const isGuest = !currentUser && !activeVehicle;
  const hasFooter = !isGuest && (onChangePress || onAddPress);
  
  // Use activeVehicle if provided, fallback to currentUser details
  const vehicle = activeVehicle || (currentUser ? {
    brand: currentUser.carBrand,
    model: currentUser.carModel,
    year: currentUser.carYear,
    plateNumber: currentUser.plateNumber || '1873 RW',
    plateNumberArabic: currentUser.plateNumberArabic || '١٨٧٣ ر و',
    cc: currentUser.cc || '2000 CC'
  } : null);

  const carBrand = vehicle ? vehicle.brand : '';
  const carModel = vehicle ? vehicle.model : '';
  const carYear = vehicle ? vehicle.year : '';
  const plateNumber = vehicle ? (vehicle.plateNumberArabic || vehicle.plateNumber) : '';

  // Resolve vehicle image: first look for exact model/year profile image in CAR_BRANDS_AND_MODELS, then fallback to brand emblem, then default profile
  let carImageSource = require('../../assets/car_side_profile.png');
  let hasCustomImage = false;
  let isModelProfileImage = false;

  if (carBrand) {
    const normalizedBrand = carBrand.trim().toLowerCase();
    const brandModels = CAR_BRANDS_AND_MODELS[normalizedBrand] || 
                        (normalizedBrand === 'mercedes' ? CAR_BRANDS_AND_MODELS['mercedes-benz'] : []) || [];

    if (carModel && brandModels.length > 0) {
      const cleanCarModel = carModel.trim().toLowerCase();
      const matchedModel = brandModels.find(m => m.name.toLowerCase() === cleanCarModel);
      if (matchedModel) {
        if (Array.isArray(matchedModel.images) && matchedModel.images.length > 0) {
          const parsedYear = parseInt(carYear) || new Date().getFullYear();
          const matchedGen = matchedModel.images.find(imgObj => parsedYear >= imgObj.startYear && parsedYear <= imgObj.endYear) || matchedModel.images[0];
          if (matchedGen && matchedGen.image) {
            carImageSource = matchedGen.image;
            hasCustomImage = true;
            isModelProfileImage = true;
          }
        } else if (matchedModel.image) {
          carImageSource = matchedModel.image;
          hasCustomImage = true;
          isModelProfileImage = true;
        }
      }
    }

    // Fallback to brand emblem if no specific model profile image exists
    if (!isModelProfileImage) {
      const brandLogo = BRAND_LOGOS[normalizedBrand];
      if (brandLogo) {
        carImageSource = brandLogo;
        hasCustomImage = true;
      }
    }
  }

  const isRtl = selectedLanguage === 'Arabic';
  const labelActiveVehicle = isRtl ? 'المركبة النشطة' : 'ACTIVE VEHICLE';
  const labelNoVehicle = isRtl ? 'سجل دخولك أو أنشئ حساباً لإضافة مركبة' : 'Sign in or register to add vehicle';
  const labelNoVehicleSub = isRtl ? 'تتبع الخدمات واستعرض التخصيص الشخصي' : 'Track services and view personalization';
  const labelModel = isRtl ? `موديل ${carYear}` : `${carYear} Model`;

  if (variant === 'vertical') {
    return (
      <TouchableOpacity 
        style={[
          styles.verticalCardContainer, 
          style
        ]}
        activeOpacity={isGuest ? 0.75 : 1}
        onPress={() => {
          if (isGuest && onOpenSignIn) {
            onOpenSignIn();
          }
        }}
      >
        {/* Clipped background layer for sage light green gradient so card shadow hovers unclipped */}
        <View style={styles.verticalCardInnerClip} pointerEvents="none">
          <LinearGradient
            colors={colors.white === '#FFFFFF'
              ? ['#EDF5EE', '#E1EDE2', '#CDE2CF']
              : ['#18261A', '#223625', '#2E4832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Header Row */}
        <View style={[
          styles.verticalHeaderRow, 
          isRtl && { flexDirection: 'row-reverse' }
        ]}>
          <View style={[styles.verticalHeaderPill, isRtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons 
              name="car-sport-outline" 
              size={12} 
              color={colors.bgBrand} 
              style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} 
            />
            <Text style={[styles.headerLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10 }]}>
              {labelActiveVehicle}
            </Text>
          </View>
        </View>

        {/* Image / Emblem Zone */}
        <View style={styles.verticalImageSection}>
          {isGuest ? (
            <Ionicons name="add-circle-outline" size={38} color="rgba(77, 110, 79, 0.45)" />
          ) : (
            <Image 
              source={carImageSource} 
              style={[
                styles.verticalCarImage, 
                isRtl && !hasCustomImage && { transform: [{ scaleX: -1 }] },
                !hasCustomImage && { opacity: 0.6 }
              ]} 
              resizeMode="contain" 
            />
          )}
        </View>

        {/* Details Section */}
        <View style={styles.verticalDetailsSection}>
          {isGuest ? (
            <>
              <Text style={[styles.verticalNoVehicleText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                {labelNoVehicle}
              </Text>
              <Text style={styles.verticalNoVehicleSubtext}>
                {labelNoVehicleSub}
              </Text>
            </>
          ) : (
            <>
              {/* Brand name in smaller text */}
              <Text style={[styles.verticalBrandName, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]} numberOfLines={1}>
                {carBrand}
              </Text>

              {/* Model as bigger text below it */}
              <Text style={styles.verticalModelName} numberOfLines={1} adjustsFontSizeToFit>
                {carModel}
              </Text>

              {/* Model year below model name */}
              <Text style={[styles.verticalModelYear, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                {labelModel}
              </Text>
              
              {/* Plate below them */}
              {plateNumber ? (
                <View style={styles.verticalPlateWrapper}>
                  <View style={styles.plateBadge}>
                    <View style={styles.plateBadgeHeader}>
                      <Text style={[styles.plateBadgeHeaderText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                        {isRtl ? 'مِصْر' : 'EGYPT'}
                      </Text>
                    </View>
                    {(() => {
                      const { numbers, letters } = splitPlate(plateNumber);
                      return (
                        <View style={styles.plateBadgeContent}>
                          <Text style={styles.plateBadgeNumbers}>{numbers}</Text>
                          {letters ? (
                            <>
                              <View style={styles.plateBadgeDivider} />
                              <Text style={styles.plateBadgeLetters}>{letters}</Text>
                            </>
                          ) : null}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* Footer actions if provided */}
        {hasFooter ? (
          <View style={[styles.cardFooterActionsRow, { marginTop: 10, width: '100%' }, isRtl && { flexDirection: 'row-reverse' }]}>
            {onChangePress ? (
              <TouchableOpacity 
                style={[styles.footerActionBtn, isRtl && { flexDirection: 'row-reverse' }]}
                activeOpacity={0.7}
                onPress={onChangePress}
              >
                <Ionicons name="swap-horizontal-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
                <Text style={styles.footerActionBtnText}>
                  {isRtl ? 'تغيير' : 'Change'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {onAddPress ? (
              <TouchableOpacity 
                style={[styles.footerActionBtn, isRtl && { flexDirection: 'row-reverse' }]}
                activeOpacity={0.7}
                onPress={onAddPress}
              >
                <Ionicons name="add-circle-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
                <Text style={styles.footerActionBtnText}>
                  {isRtl ? 'إضافة' : 'Add'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.cardContainer, 
        (isRtl && !showExtendedInfo) ? { height: hasFooter ? 145 : 125, marginTop: 0 } : { minHeight: hasFooter ? 145 : 125 }, 
        style
      ]}
      activeOpacity={isGuest ? 0.75 : 1}
      onPress={() => {
        if (isGuest && onOpenSignIn) {
          onOpenSignIn();
        }
      }}
    >
      <BlurView
        intensity={65}
        tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
        style={StyleSheet.absoluteFill}
      />

      {/* 3D Glossy Bevel Highlight Overlay */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'transparent',
        borderTopColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
        borderLeftColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
      }} pointerEvents="none" />

      {/* Header Row */}
      <View style={[
        styles.cardHeaderRow, 
        isRtl && { flexDirection: 'row-reverse' },
        { marginBottom: 8, paddingBottom: 0 }
      ]}>
        <View style={[styles.headerRowLabelContainer, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons 
            name="car-sport-outline" 
            size={16} 
            color={colors.bgBrand} 
            style={[styles.headerIcon, isRtl ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6 }]} 
          />
          <Text style={[styles.headerLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>{labelActiveVehicle}</Text>
        </View>
      </View>

      {/* Card Body Row */}
      <View style={[styles.cardBodyRow, isRtl && { flexDirection: 'row-reverse' }]}>
        {/* Text Zone (takes 2/3 of space) */}
        <View style={[styles.textSection, isRtl && { paddingLeft: 10, paddingRight: 0 }]}>
          {isGuest ? (
            <>
              <Text style={[styles.noVehicleText, isRtl && { textAlign: 'right' }]}>{labelNoVehicle}</Text>
              <Text style={[styles.noVehicleSubtext, isRtl && { textAlign: 'right' }]}>{labelNoVehicleSub}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.carName, isRtl && { textAlign: 'right' }]}>{carBrand} {carModel}</Text>
              <Text style={[styles.carModel, isRtl && { textAlign: 'right' }]}>{labelModel}</Text>
              
              {showExtendedInfo && (
                <View style={[styles.extendedInfoRow, isRtl && { flexDirection: 'row-reverse' }]}>
                  {/* Plate Badge */}
                  {plateNumber ? (
                    <View style={styles.plateBadge}>
                      <View style={styles.plateBadgeHeader}>
                        <Text style={[styles.plateBadgeHeaderText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                          {isRtl ? 'مِصْر' : 'EGYPT'}
                        </Text>
                      </View>
                      {(() => {
                        const { numbers, letters } = splitPlate(plateNumber);
                        return (
                          <View style={styles.plateBadgeContent}>
                            <Text style={styles.plateBadgeNumbers}>{numbers}</Text>
                            {letters ? (
                              <>
                                <View style={styles.plateBadgeDivider} />
                                <Text style={styles.plateBadgeLetters}>{letters}</Text>
                              </>
                            ) : null}
                          </View>
                        );
                      })()}
                    </View>
                  ) : null}
                </View>
              )}
            </>
          )}
        </View>

        {/* Vertical Divider Line */}
        <View style={styles.divider} />

        {/* Image Zone (takes 1/3 of space) */}
        <View style={styles.imageSection}>
          {isGuest ? (
            <Ionicons name="add-circle-outline" size={32} color="rgba(77, 110, 79, 0.45)" />
          ) : (
            <Image 
              source={carImageSource} 
              style={[
                styles.carImage, 
                isRtl && !hasCustomImage && { transform: [{ scaleX: -1 }] },
                hasCustomImage 
                  ? (isModelProfileImage ? { width: '100%', height: '100%', opacity: 1 } : { width: 85, height: 85, opacity: 1 }) 
                  : { width: '100%', height: '100%' }
              ]} 
              resizeMode="contain" 
            />
          )}
        </View>
      </View>

      {/* Bottom Actions Row inside the card */}
      {hasFooter ? (
        <View style={[styles.cardFooterActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
          {onChangePress ? (
            <TouchableOpacity 
              style={[styles.footerActionBtn, isRtl && { flexDirection: 'row-reverse' }]}
              activeOpacity={0.7}
              onPress={onChangePress}
            >
              <Ionicons name="swap-horizontal-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
              <Text style={styles.footerActionBtnText}>
                {isRtl ? 'تغيير السيارة' : 'Change Car'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {onAddPress ? (
            <TouchableOpacity 
              style={[styles.footerActionBtn, isRtl && { flexDirection: 'row-reverse' }]}
              activeOpacity={0.7}
              onPress={onAddPress}
            >
              <Ionicons name="add-circle-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
              <Text style={styles.footerActionBtnText}>
                {isRtl ? 'إضافة سيارة' : 'Add Car'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.35)' : 'rgba(24, 30, 24, 0.45)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    flexDirection: 'column',
    minHeight: 145,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 16 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  textSection: {
    flex: 2, // Takes 2/3 of space
    paddingRight: 10,
  },

  headerIcon: {
    marginRight: 6,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.bgBrand,
    letterSpacing: 0.8,
  },
  carName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 3,
  },
  carModel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  noVehicleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
    lineHeight: 20,
  },
  noVehicleSubtext: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  divider: {
    width: 1.5,
    height: '75%', // clean vertical separator within card bounds
    backgroundColor: colors.borderGreen,
    marginHorizontal: 12,
  },
  imageSection: {
    width: 110, // Locks the width of the image section to 1/3 of the screen width
    height: 90, // Locks the height safely within the card's inner bounds
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  extendedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },

  plateBadge: {
    backgroundColor: '#FFFFFF', // Hardcoded white to remain white in dark mode
    borderRadius: 3.5,
    borderWidth: 1.2,
    borderColor: '#222222',
    overflow: 'hidden',
    width: 74,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1.5,
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
    color: '#1E1E1E', // Hardcoded dark color to remain dark on white background
  },
  plateBadgeDivider: {
    width: 1,
    height: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginHorizontal: 3.5,
  },
  plateBadgeLetters: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E1E1E', // Hardcoded dark color to remain dark on white background
  },
  cardFooterActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  footerActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(77, 110, 79, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.18)',
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },

  // Vertical Variant Styles (Medium Balanced Brand Sage Light Green Shade - Hovering)
  verticalCardContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? '#E2ECE1' : '#1E2B20',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.22)' : 'rgba(93, 130, 96, 0.26)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 236,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.06 : 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  verticalCardInnerClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    overflow: 'hidden',
  },
  verticalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  verticalHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.08)' : 'rgba(93, 130, 96, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.10)' : 'rgba(255, 255, 255, 0.06)',
  },
  verticalImageSection: {
    width: '100%',
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 5,
  },
  verticalCarImage: {
    width: '88%',
    height: '100%',
  },
  verticalDetailsSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalBrandName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 1,
  },
  verticalModelName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  verticalModelYear: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  verticalPlateWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  verticalNoVehicleText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 17,
  },
  verticalNoVehicleSubtext: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  }
});
