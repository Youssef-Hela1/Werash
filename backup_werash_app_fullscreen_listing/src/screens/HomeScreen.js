import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, Animated, PanResponder } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen({ onNavigate, currentUser, onOpenSignIn, selectedLanguage, userVehicles = [], activeVehicleId }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const translateY = useRef(new Animated.Value(0)).current;
  const maxDrag = 150; // Maximum displacement in pixels

  // Physics formula for rubber-band stretch (iOS style asymptotic curve)
  const getRubberBandValue = (dy) => {
    const sign = Math.sign(dy);
    const absVal = Math.abs(dy);
    return sign * (1 - (1 / ((absVal * 0.45 / maxDrag) + 1))) * maxDrag;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Capture vertical drags primarily
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const rubberBandY = getRubberBandValue(gestureState.dy);
        translateY.setValue(rubberBandY);
      },
      onPanResponderRelease: () => {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
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
  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the region under the skidmark up to the resting gap (y = 0 to y = 40)
    lines.push(
      <View
        key="top-solid-block"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40, // Shifted up to fit the shorter header background
          backgroundColor: colors.bgCreamy,
          zIndex: 3,
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 40 to y = 60 (smoothly fades cards before reaching solid block)
    const numLines = 20;
    const startY = 40; // Shifted up
    const endY = 60; // Shifted up
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
            backgroundColor: colors.bgCreamy,
            opacity: opacity,
            zIndex: 3,
          }}
        />
      );
    }
    return lines;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />
      
      {/* Top Fade Gradient Overlay to smoothly fade content sliding up */}
      {renderGradientOverlay()}

      <Animated.View
        style={[styles.animatedContainer, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Garage Vehicle Section */}
          <ActiveVehicleCard 
            currentUser={currentUser} 
            onOpenSignIn={onOpenSignIn} 
            selectedLanguage={selectedLanguage} 
            activeVehicle={userVehicles.find(v => v.id === activeVehicleId)}
          />

          {/* 2x2 Services Grid Panel */}
          <QuickServicesGrid onNavigate={onNavigate} selectedLanguage={selectedLanguage} />

          {/* Specialist Carousel Section */}
          <SpecialistSpotlight onNavigate={onNavigate} selectedLanguage={selectedLanguage} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 45, // Adjusted to fit the shorter 275px green header
    paddingBottom: 151, // Snug spacing above fixed bottom navbar from HEAD
  }
});
