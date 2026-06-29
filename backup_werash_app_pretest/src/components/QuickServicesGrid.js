import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function QuickServicesGrid({ onNavigate }) {
  const services = [
    {
      id: 'warsha',
      title: 'My Warsha',
      subtitle: '0 Space Vehicles',
      icon: 'car-sport-outline',
      bgWatermark: 'car-outline',
    },
    {
      id: 'mechanics',
      title: 'Find Mechanics',
      subtitle: '6 Specialists Online',
      icon: 'construct-outline',
      bgWatermark: 'build-outline',
    },
    {
      id: 'community',
      title: 'Community Feed',
      subtitle: '3 Active Logs',
      icon: 'chatbubbles-outline',
      bgWatermark: 'people-outline',
    },
    {
      id: 'tow',
      title: 'Get Help',
      subtitle: 'Emergency Service',
      icon: 'warning-outline',
      bgWatermark: 'alert-circle-outline',
      color: COLORS.accentRed,
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>QUICK SERVICES</Text>
      
      <View style={styles.grid}>
        {services.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={styles.gridCard} 
            activeOpacity={0.7}
            onPress={() => {
              if (service.id === 'mechanics') {
                onNavigate && onNavigate('mechanics');
              } else if (service.id === 'warsha') {
                onNavigate && onNavigate('garage');
              } else if (service.id === 'community') {
                onNavigate && onNavigate('community');
              } else if (service.id === 'tow') {
                onNavigate && onNavigate('tow');
              }
            }}
          >
            {/* Top Row with Service Icon and Chevron */}
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name={service.icon} size={20} color={service.color || COLORS.bgBrand} />
              </View>
              <Ionicons name="chevron-forward-outline" size={14} color={service.color || COLORS.bgBrand} />
            </View>

            {/* Labels Section */}
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text style={styles.cardSubtitle}>{service.subtitle}</Text>

            {/* Background Watermark Icon for Premium Aesthetic */}
            <View style={styles.watermarkWrapper}>
              <Ionicons name={service.bgWatermark} size={48} color={service.color || COLORS.bgBrand} style={styles.watermarkIcon} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.bgBrand,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: 'rgba(77, 110, 79, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.08)',
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 6,
  },
  cardSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  watermarkWrapper: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    opacity: 0.06,
  },
  watermarkIcon: {
    transform: [{ rotate: '-15deg' }],
  }
});
