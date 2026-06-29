import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveVehicleCard({ currentUser, onOpenSignIn }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isGuest = !currentUser;
  const carBrand = currentUser && currentUser.carBrand ? currentUser.carBrand : '';
  const carModel = currentUser && currentUser.carModel ? currentUser.carModel : '';
  const carYear = currentUser && currentUser.carYear ? currentUser.carYear : '';

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      activeOpacity={isGuest ? 0.75 : 1}
      onPress={() => {
        if (isGuest && onOpenSignIn) {
          onOpenSignIn();
        }
      }}
    >
      {/* Left Text Zone (takes 2/3 of space) */}
      <View style={styles.textSection}>
        <View style={styles.headerRow}>
          <Ionicons name="car-sport-outline" size={16} color={colors.bgBrand} style={styles.headerIcon} />
          <Text style={styles.headerLabel}>ACTIVE VEHICLE</Text>
        </View>

        {isGuest ? (
          <>
            <Text style={styles.noVehicleText}>Sign in or register to add vehicle</Text>
            <Text style={styles.noVehicleSubtext}>Track services and view personalization</Text>
          </>
        ) : (
          <>
            <Text style={styles.carName}>{carBrand} {carModel}</Text>
            <Text style={styles.carModel}>{carYear} Model</Text>
          </>
        )}
      </View>

      {/* Vertical Divider Line */}
      <View style={styles.divider} />

      {/* Right Image Zone (takes 1/3 of space) */}
      <View style={styles.imageSection}>
        {isGuest ? (
          <Ionicons name="add-circle-outline" size={32} color="rgba(77, 110, 79, 0.45)" />
        ) : (
          <Image 
            source={require('../../assets/car_side_profile.png')} 
            style={styles.carImage} 
            resizeMode="contain" 
          />
        )}
      </View>
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
    padding: 18, // Restored original padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 125, // Restored original height
  },
  textSection: {
    flex: 2, // Takes 2/3 of space
    paddingRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  }
});
