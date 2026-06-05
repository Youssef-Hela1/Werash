import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { COLORS } from '../styles/theme';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen({ onNavigate }) {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      
      {/* Top Fade Gradient Overlay to smoothly fade content sliding up */}
      {renderGradientOverlay()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Garage Vehicle Section */}
        <ActiveVehicleCard />

        {/* 2x2 Services Grid Panel */}
        <QuickServicesGrid onNavigate={onNavigate} />

        {/* Specialist Carousel Section */}
        <SpecialistSpotlight onNavigate={onNavigate} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCreamy,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 120, // Space below persistent green header from HEAD
    paddingBottom: 106, // Snug spacing above fixed bottom navbar from HEAD
    paddingHorizontal: 20, // Horizontal padding from HEAD
  }
});
