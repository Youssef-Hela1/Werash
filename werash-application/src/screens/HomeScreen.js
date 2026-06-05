import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { COLORS } from '../styles/theme';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
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
    paddingTop: 120, // Space below persistent green header
    paddingBottom: 106, // Snug spacing above fixed bottom navbar
    paddingHorizontal: 20,
  }
});
