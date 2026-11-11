import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

function NavItem({ tab, isActive, onPress, colors, isDarkMode, styles, badgeCount = 0 }) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.12 : 1.0,
      tension: 70,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  const activeColor = isDarkMode ? colors.activeHighlight : (colors.forestGreen || '#003514');
  const inactiveColor = colors.inactiveNav || '#8E8E93';

  return (
    <TouchableOpacity 
      style={styles.navItem} 
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
    >
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }], 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <Ionicons 
          name={isActive ? tab.activeIcon : tab.icon} 
          size={tab.size || 23} 
          color={isActive ? activeColor : inactiveColor} 
        />
        {badgeCount > 0 && (
          <View style={styles.badgeContainer}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNavBar({ 
  activeTab = 'home', 
  onTabPress, 
  unreadNotificationsCount = 0,
  hidden = false,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const translateYAnim = useRef(new Animated.Value(hidden ? 130 : 0)).current;

  useEffect(() => {
    Animated.timing(translateYAnim, {
      toValue: hidden ? 130 : 0,
      duration: hidden ? 220 : 200,
      useNativeDriver: true,
    }).start();
  }, [hidden]);

  const tabs = [
    { id: 'garage', label: 'My Warsha', icon: 'car-outline', activeIcon: 'car', size: 23 },
    { id: 'mechanics', label: 'Mechanics', icon: 'construct-outline', activeIcon: 'construct', size: 21 },
    { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', size: 22 },
    { id: 'community', label: 'Community', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', size: 22 },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', activeIcon: 'notifications', size: 22 },
  ];

  // Balanced bottom padding: positioned slightly further up with comfortable clearance
  const bottomPadding = insets.bottom > 0 ? Math.max(Math.round(insets.bottom * 0.65), 10) : 10;

  return (
    <Animated.View 
      style={[
        styles.navWrapper,
        { transform: [{ translateY: translateYAnim }] }
      ]} 
      pointerEvents={hidden ? 'none' : 'box-none'}
    >
      <View style={[styles.navBar, { paddingBottom: bottomPadding }]}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <NavItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabPress && onTabPress(tab.id)}
              colors={colors}
              isDarkMode={isDarkMode}
              styles={styles}
              badgeCount={tab.id === 'notifications' ? unreadNotificationsCount : 0}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDarkMode ? (colors.cardBorder || '#35423A') : 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: isDarkMode ? 0.25 : 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  navItem: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: colors.cardBg,
  },
});
