import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { COLORS } from '../styles/theme';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import QuickServicesGrid from '../components/QuickServicesGrid';
import SpecialistSpotlight from '../components/SpecialistSpotlight';

export default function HomeScreen({ onNavigate }) {
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
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
