import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
  onAddPress
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  
  // Guest state exists if there is no logged-in user AND no explicit active vehicle passed
  const isGuest = !currentUser && !activeVehicle;
  
  // Use activeVehicle if provided, fallback to currentUser details
  const vehicle = activeVehicle || (currentUser ? {
    brand: currentUser.carBrand,
    model: currentUser.carModel,
    year: currentUser.carYear,
    plateNumber: currentUser.plateNumber || '9865 QYR',
    plateNumberArabic: currentUser.plateNumberArabic || '٩٨٦٥ ق ي ر',
    cc: currentUser.cc || '3000 CC'
  } : null);

  const carBrand = vehicle ? vehicle.brand : '';
  const carModel = vehicle ? vehicle.model : '';
  const carYear = vehicle ? vehicle.year : '';
  const plateNumber = vehicle ? (vehicle.plateNumberArabic || vehicle.plateNumber) : '';

  const isRtl = selectedLanguage === 'Arabic';
  const labelActiveVehicle = isRtl ? 'المركبة النشطة' : 'ACTIVE VEHICLE';
  const labelNoVehicle = isRtl ? 'سجل دخولك أو أنشئ حساباً لإضافة مركبة' : 'Sign in or register to add vehicle';
  const labelNoVehicleSub = isRtl ? 'تتبع الخدمات واستعرض التخصيص الشخصي' : 'Track services and view personalization';
  const labelModel = isRtl ? `موديل ${carYear}` : `${carYear} Model`;

  return (
    <TouchableOpacity 
      style={[styles.cardContainer, style]}
      activeOpacity={isGuest ? 0.75 : 1}
      onPress={() => {
        if (isGuest && onOpenSignIn) {
          onOpenSignIn();
        }
      }}
    >
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
          <Text style={styles.headerLabel}>{labelActiveVehicle}</Text>
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
                      <View style={styles.plateBadgeHeader} />
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
              source={require('../../assets/car_side_profile.png')} 
              style={[styles.carImage, isRtl && { transform: [{ scaleX: -1 }] }]} 
              resizeMode="contain" 
            />
          )}
        </View>
      </View>

      {/* Bottom Actions Row inside the card */}
      {!isGuest && (onChangePress || onAddPress) ? (
        <View style={[styles.cardFooterActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
          {onChangePress ? (
            <TouchableOpacity 
              style={[styles.footerActionBtn, isRtl && { flexDirection: 'row-reverse' }]}
              activeOpacity={0.7}
              onPress={onChangePress}
            >
              <Ionicons name="swap-horizontal-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
              <Text style={styles.footerActionBtnText}>
                {isRtl ? 'تغيير المركبة' : 'Change Vehicle'}
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
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    flexDirection: 'column',
    minHeight: 145,
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
    width: 100, // Locks the width of the image section to 1/3 of the screen width
    height: 75, // Locks the height safely within the card's inner bounds
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
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: '#222222',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  plateBadgeHeader: {
    backgroundColor: '#005CA9',
    height: 9,
    width: '100%',
  },
  plateBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  plateBadgeNumbers: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1E1E', // Hardcoded dark color to remain dark on white background
  },
  plateBadgeDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginHorizontal: 5,
  },
  plateBadgeLetters: {
    fontSize: 11,
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
  }
});
