import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const BUTTON_SIZE = 52;
const BUTTON_RADIUS = 26;
const BUTTON_CY = 24; // Geometric center Y of button relative to bar top (y = 0), seated comfortably inside the bar
const BUTTON_TOP = BUTTON_CY - BUTTON_RADIUS; // -2px (only crests 2px above the bar)
const GAP = 7; // Clean 7px wrap gap around button
const W_TOP = 44; // Flared top opening width (88px total top opening)

function HomeFloatingButton({ isActive, onPress, colors, styles, centerLeft }) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.06 : 1.0,
      tension: 70,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <TouchableOpacity
      style={[
        styles.floatingHomeButton,
        { left: centerLeft }
      ]}
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Home"
      hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View style={[
        styles.centerCircle,
        isActive ? styles.centerCircleActive : styles.centerCircleInactive,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Ionicons 
          name={isActive ? 'home-sharp' : 'home-outline'} 
          size={23} 
          color={isActive ? colors.white : colors.bgBrand} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function NavItem({ tab, isActive, onPress, colors, styles }) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.12 : 1.0,
      tension: 70,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <TouchableOpacity 
      style={styles.navItem} 
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
    >
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }], 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Ionicons 
          name={isActive ? tab.activeIcon : tab.icon} 
          size={tab.size || 23} 
          color={isActive ? colors.bgBrand : colors.textMuted} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNavBar({ activeTab = 'home', onTabPress }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { width } = useWindowDimensions();
  const [barHeight, setBarHeight] = useState(80);

  const tabs = [
    { id: 'garage', label: 'My Warsha', icon: 'car-outline', activeIcon: 'car-sharp', size: 24 },
    { id: 'mechanics', label: 'Mechanics', icon: 'construct-outline', activeIcon: 'construct-sharp', size: 23 },
    { id: 'home', label: 'Home', isCenter: true },
    { id: 'community', label: 'Community', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles-sharp', size: 23 },
    { id: 'more', label: 'More', icon: 'ellipsis-vertical', activeIcon: 'ellipsis-vertical', size: 23 },
  ];

  // Sculpted cutout wrapping snugly around the button at its exact current position
  const { fillPath, borderPath } = useMemo(() => {
    const center = width / 2;
    const yc = BUTTON_CY; // 24: Current button vertical center
    const rb = BUTTON_RADIUS; // 26
    const R = rb + GAP; // 33: Cutout radius
    const w_top = W_TOP; // 44: Flared top opening width

    const leftTop = center - w_top; // 151
    const rightTop = center + w_top; // 239

    const leftEqX = center - R; // 162
    const rightEqX = center + R; // 228

    // Upper left flare: horizontal tangent at (leftTop, 0) -> vertical tangent at (leftEqX, yc)
    const cp1_x = leftTop + (w_top - R) * 0.55;
    const cp1_y = 0;
    const cp2_x = leftEqX;
    const cp2_y = yc * 0.45;

    // Upper right flare: vertical tangent at (rightEqX, yc) -> horizontal tangent at (rightTop, 0)
    const cp3_x = rightEqX;
    const cp3_y = yc * 0.45;
    const cp4_x = rightTop - (w_top - R) * 0.55;
    const cp4_y = 0;

    const fill = [
      `M 0 0`,
      `L ${leftTop.toFixed(2)} 0`,
      `C ${cp1_x.toFixed(2)} ${cp1_y.toFixed(2)}, ${cp2_x.toFixed(2)} ${cp2_y.toFixed(2)}, ${leftEqX.toFixed(2)} ${yc.toFixed(2)}`,
      `A ${R} ${R} 0 0 0 ${rightEqX.toFixed(2)} ${yc.toFixed(2)}`,
      `C ${cp3_x.toFixed(2)} ${cp3_y.toFixed(2)}, ${cp4_x.toFixed(2)} ${cp4_y.toFixed(2)}, ${rightTop.toFixed(2)} 0`,
      `L ${width.toFixed(2)} 0`,
      `L ${width.toFixed(2)} ${barHeight.toFixed(2)}`,
      `L 0 ${barHeight.toFixed(2)}`,
      `Z`
    ].join(' ');

    const border = [
      `M 0 0`,
      `L ${leftTop.toFixed(2)} 0`,
      `C ${cp1_x.toFixed(2)} ${cp1_y.toFixed(2)}, ${cp2_x.toFixed(2)} ${cp2_y.toFixed(2)}, ${leftEqX.toFixed(2)} ${yc.toFixed(2)}`,
      `A ${R} ${R} 0 0 0 ${rightEqX.toFixed(2)} ${yc.toFixed(2)}`,
      `C ${cp3_x.toFixed(2)} ${cp3_y.toFixed(2)}, ${cp4_x.toFixed(2)} ${cp4_y.toFixed(2)}, ${rightTop.toFixed(2)} 0`,
      `L ${width.toFixed(2)} 0`
    ].join(' ');

    return { fillPath: fill, borderPath: border };
  }, [width, barHeight]);

  return (
    <View style={styles.navWrapper} pointerEvents="box-none">
      {/* 1. Concentric Dipped SVG Background Bar */}
      <View style={styles.svgBackground} pointerEvents="none">
        <Svg width={width} height={barHeight} viewBox={`0 0 ${width} ${barHeight}`}>
          <Path d={fillPath} fill={colors.white} />
          <Path d={borderPath} stroke={colors.borderGreen} strokeWidth={1.2} fill="none" />
        </Svg>
      </View>

      {/* 2. Floating Center Home Button: Exactly Centered & Guaranteed Concentric with Cutout */}
      <HomeFloatingButton
        isActive={activeTab === 'home'}
        onPress={() => onTabPress && onTabPress('home')}
        colors={colors}
        styles={styles}
        centerLeft={width / 2 - BUTTON_RADIUS}
      />

      {/* 3. Interactive Tabs Row (with center placeholder spacer for Home) */}
      <View 
        style={styles.navContainer}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - barHeight) > 1) {
            setBarHeight(h);
          }
        }}
      >
        {tabs.map((tab) => {
          if (tab.isCenter) {
            return <View key={tab.id} style={styles.centerSpacer} pointerEvents="none" />;
          }
          const isActive = tab.id === activeTab;
          return (
            <NavItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabPress && onTabPress(tab.id)}
              colors={colors}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'visible',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  navContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'transparent',
    paddingTop: 10,
    paddingBottom: 24, // Restored higher navbar padding for comfort & safe area
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'visible',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 44,
  },
  centerSpacer: {
    flex: 1,
    height: 44,
  },
  // Floating Home Button Container - Exactly positioned to match SVG cutout center
  floatingHomeButton: {
    position: 'absolute',
    top: BUTTON_TOP, // -2px: places geometric center at y = 24
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Luxury Concentric Circular Home Button
  centerCircle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleActive: {
    backgroundColor: colors.bgBrand, // Signature Reseda Sage Green
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 6,
  },
  centerCircleInactive: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
