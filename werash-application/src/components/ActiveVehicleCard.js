import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveVehicleCard() {
  return (
    <View style={styles.cardContainer}>
      {/* Left Text Zone (takes 2/3 of space) */}
      <View style={styles.textSection}>
        <View style={styles.headerRow}>
          <Ionicons name="car-sport-outline" size={16} color={COLORS.bgBrand} style={styles.headerIcon} />
          <Text style={styles.headerLabel}>ACTIVE VEHICLE</Text>
        </View>

        <Text style={styles.carName}>Hyundai Coupe</Text>
        <Text style={styles.carModel}>2005 Model</Text>
      </View>

      {/* Vertical Divider Line */}
      <View style={styles.divider} />

      {/* Right Image Zone (takes 1/3 of space) */}
      <View style={styles.imageSection}>
        <Image 
          source={require('../../assets/car_side_profile.png')} 
          style={styles.carImage} 
          resizeMode="contain" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(77, 110, 79, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(77, 110, 79, 0.08)',
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
    color: COLORS.bgBrand,
    letterSpacing: 0.8,
  },
  carName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 3,
  },
  carModel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  divider: {
    width: 1.5,
    height: '75%', // clean vertical separator within card bounds
    backgroundColor: 'rgba(77, 110, 79, 0.1)',
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
