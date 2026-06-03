import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar() {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-sharp', activeIcon: 'home-sharp' },
    { id: 'garage', label: 'My Warsha', icon: 'car-outline', activeIcon: 'car-sharp' },
    { id: 'mechanics', label: 'Mechanics', icon: 'construct-outline', activeIcon: 'construct-sharp' },
    { id: 'community', label: 'Community', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles-sharp' },
    { id: 'tow', label: 'Tow', icon: 'warning-outline', activeIcon: 'warning-sharp' },
  ];

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          const isActive = tab.id === 'home';
          return (
            <TouchableOpacity key={tab.id} style={styles.navItem} activeOpacity={0.7}>
              <Ionicons 
                name={isActive ? tab.activeIcon : tab.icon} 
                size={22} 
                color={isActive ? COLORS.bgBrand : COLORS.textMuted} 
              />
              <Text style={[styles.navLabel, isActive && styles.activeLabel]}>
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
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  navContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1.5,
    borderColor: 'rgba(77, 110, 79, 0.06)',
    borderRadius: 36,
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
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
  }
});
