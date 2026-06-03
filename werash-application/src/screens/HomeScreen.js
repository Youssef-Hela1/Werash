import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { COLORS } from '../styles/theme';
import Header from '../components/Header';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      <View style={styles.mainLayout}>
        {/* Top Header Card Block */}
        <Header />

        {/* Group content cards to align them snugly towards the bottom */}
        <View style={styles.contentBlock}>
          {/* Active Garage Vehicle Section */}
          <ActiveVehicleCard />

          {/* 2x2 Services Grid Panel */}
          <QuickServicesGrid />

          {/* Specialist Carousel Section */}
          <SpecialistSpotlight />
        </View>
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
    paddingBottom: 90, // Positioned snugly above the floating bottom navigation bar
  },
  contentBlock: {
    flex: 1,
    justifyContent: 'flex-end',
  }
});
