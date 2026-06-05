import React, { useRef } from 'react';
import { StyleSheet, View, StatusBar, Animated, PanResponder } from 'react-native';
import { COLORS } from '../styles/theme';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen({ onNavigate }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const maxDrag = 150; // Maximum displacement in pixels

  // Physics formula for rubber-band stretch (iOS style asymptotic curve)
  const getRubberBandValue = (dy) => {
    const sign = Math.sign(dy);
    const absVal = Math.abs(dy);
    return sign * (1 - (1 / ((absVal * 0.45 / maxDrag) + 1))) * maxDrag;
  };

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the region under the skidmark up to the resting gap (y = 0 to y = 60)
    lines.push(
      <View
        key="top-solid-block"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: COLORS.bgCreamy,
          zIndex: 3,
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 60 to y = 80 (smoothly fades cards before reaching solid block)
    const numLines = 20;
    const startY = 60;
    const endY = 80;
    const step = (endY - startY) / numLines; // 1.0px steps
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: COLORS.bgCreamy,
            opacity: opacity,
            zIndex: 3,
          }}
        />
      );
    }
    return lines;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture vertical drags greater than a small threshold
        // and ensure it is primarily vertical to avoid locking horizontal scrolling
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const rubberBandY = getRubberBandValue(gestureState.dy);
        translateY.setValue(rubberBandY);
      },
      onPanResponderRelease: () => {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6, // spring friction
          tension: 40, // spring tension
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      <View style={styles.mainLayout}>
        {/* Top Fade Gradient Overlay to smoothly fade content sliding up */}
        {renderGradientOverlay()}

        {/* Animated View to handle translations and bind gesture panHandlers */}
        <Animated.View 
          style={[styles.contentBlock, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          {/* Active Garage Vehicle Section */}
          <ActiveVehicleCard />

          {/* 2x2 Services Grid Panel */}
          <QuickServicesGrid onNavigate={onNavigate} />

          {/* Specialist Carousel Section */}
          <SpecialistSpotlight onNavigate={onNavigate} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCreamy,
  },
  mainLayout: {
    flex: 1,
    paddingBottom: 106, // Snug spacing above fixed bottom navbar from HEAD
  },
  contentBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 120, // Space below persistent green header from HEAD
    paddingHorizontal: 20, // Horizontal padding from HEAD
  }
});
