import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({ activeTab = 'home', onTabPress }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-sharp', activeIcon: 'home-sharp' },
    { id: 'garage', label: 'My Warsha', icon: 'car-outline', activeIcon: 'car-sharp' },
    { id: 'mechanics', label: 'Mechanics', icon: 'construct-outline', activeIcon: 'construct-sharp' },
    { id: 'community', label: 'Community', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles-sharp' },
    { id: 'tow', label: 'Get Help', icon: 'warning-outline', activeIcon: 'warning-sharp' },
  ];

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isTow = tab.id === 'tow';
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.navItem} 
              activeOpacity={0.7}
              onPress={() => onTabPress && onTabPress(tab.id)}
            >
              <Ionicons 
                name={isActive ? tab.activeIcon : tab.icon} 
                size={22} 
                color={isTow ? COLORS.accentRed : (isActive ? COLORS.bgBrand : COLORS.textMuted)} 
              />
              <Text style={[
                styles.navLabel, 
                isTow ? styles.towLabel : (isActive && styles.activeLabel)
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(77, 110, 79, 0.08)',
    paddingTop: 10,
    paddingBottom: 22, // Space for device home indicators
    paddingHorizontal: 10,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  activeLabel: {
    color: COLORS.bgBrand,
  },
  towLabel: {
    color: COLORS.accentRed,
    fontWeight: '700',
  },
});
