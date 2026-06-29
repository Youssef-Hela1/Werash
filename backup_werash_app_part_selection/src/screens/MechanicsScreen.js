import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const specialists = [
  {
    id: 'kareem',
    name: 'Kareem El-Sayed',
    specialty: 'ENGINE & TUNING',
    category: 'mechanical',
    rating: '5.0',
    reviews: '184',
    price: '$65/hr',
    location: 'Sheikh Zayed, Giza',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_kareem.png'),
    exp: '12 Years Exp.',
    description: 'Master Porsche & German Specialist. Former OEM certified master tech specializing in high-performance German engineering, ECU remapping, and track prep.',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    specialty: 'DIAGNOSTICS & ECU',
    category: 'electrician',
    rating: '4.9',
    reviews: '112',
    price: '$75/hr',
    location: 'Heliopolis, Cairo',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_elena.png'),
    exp: '9 Years Exp.',
    description: 'Diagnostics & ECU Tuning Guru. Expert in automotive electrical systems, ECU flashing, wiring harness repairs, and advanced diagnostics.',
  },
  {
    id: 'tariq',
    name: 'Tariq Mansour',
    specialty: 'BRAKES & SUSPENSION',
    category: 'suspension',
    rating: '4.8',
    reviews: '96',
    price: '$55/hr',
    location: 'Maadi, Cairo',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_tariq.png'),
    exp: '8 Years Exp.',
    description: 'Brake & Suspension Specialist. Certified technician focusing on performance suspension upgrades, brake system design, alignments, and track setup.',
  },
  {
    id: 'samir',
    name: 'Samir Soliman',
    specialty: 'TRANSMISSION & PARTS',
    category: 'parts',
    rating: '4.7',
    reviews: '84',
    price: '$50/hr',
    location: 'New Cairo, Cairo',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_samir.png'),
    exp: '10 Years Exp.',
    description: 'Transmission & Parts Expert. Master technician specializing in automatic/manual transmission rebuilds, differential upgrades, and custom parts sourcing.',
  },
  {
    id: 'sherif',
    name: 'Sherif Abdel-Meguid',
    specialty: 'BODY SHOPS & PAINT',
    category: 'body',
    rating: '4.9',
    reviews: '128',
    price: '$80/hr',
    location: '6th of October, Giza',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_sherif.png'),
    exp: '15 Years Exp.',
    description: 'Body Restoration & Custom Paint Master. Specializing in dent repair, carbon fiber panel fabrication, and custom high-end paint finishes.',
  },
  {
    id: 'michael',
    name: 'Michael Chang',
    specialty: 'GERMAN ENGINE SPECIALIST',
    category: 'mechanical',
    rating: '5.0',
    reviews: '142',
    price: '$90/hr',
    location: 'Zamalek, Cairo',
    image: require('../../assets/modern_workshop_banner.png'),
    avatar: require('../../assets/expert_michael.png'),
    exp: '14 Years Exp.',
    description: 'German Engine & Powertrain Expert. Certified master specialist for Audi, BMW, and Mercedes engine diagnostics, major rebuilds, and power optimization.',
  },
];

export default function MechanicsScreen({ initialExpandedCardId, onClearInitialExpanded, onSelectSpecialist }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (initialExpandedCardId) {
      const found = specialists.find((spec) => spec.id === initialExpandedCardId);
      if (found) {
        onSelectSpecialist && onSelectSpecialist(found);
      }
      onClearInitialExpanded && onClearInitialExpanded();
    }
  }, [initialExpandedCardId]);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const categories = [
    { id: 'overall', label: 'OVERALL' },
    { id: 'mechanical', label: 'MECHANICAL' },
    { id: 'body', label: 'BODY SHOPS' },
    { id: 'suspension', label: 'SUSPENSION' },
    { id: 'electrician', label: 'ELECTRICIAN' },
    { id: 'parts', label: 'PARTS' },
  ];

  const filteredSpecialists = specialists.filter((spec) => {
    const matchesCategory =
      selectedCategory === 'overall' || spec.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      spec.name.toLowerCase().includes(query) ||
      spec.specialty.toLowerCase().includes(query) ||
      spec.location.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 65)
    lines.push(
      <View
        key="top-solid-block"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 55, // Shifted up
          backgroundColor: colors.bgCreamy,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 55 to y = 65
    const numLines = 20;
    const startY = 55; // Shifted up
    const endY = 65; // Shifted up
    const step = (endY - startY) / numLines; // 0.5px steps
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: colors.bgCreamy,
            opacity: opacity,
            zIndex: 3, // Above cards (zIndex: 1) but below absolute headers
            pointerEvents: 'none',
          }}
        />
      );
    }
    return lines;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />
      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Top Fade Gradient Overlay */}
          {renderGradientOverlay()}

          {/* Collapsible Header Group */}
          <Animated.View style={[
            styles.collapsibleHeader,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }]
            }
          ]}>

            {/* Premium Search Bar */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={colors.bgBrand} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search specialists, brands, or symptoms..."
                placeholderTextColor="#ADADAD"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Categories Pill Selector Row */}
            <View style={styles.categoriesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[
                        styles.categoryPill,
                        isSelected ? styles.categoryPillSelected : styles.categoryPillUnselected
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected ? styles.categoryTextSelected : styles.categoryTextUnselected
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Specialists Card List */}
          {filteredSpecialists.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="rgba(77, 110, 79, 0.18)" style={{ marginBottom: 12 }} />
              <Text style={styles.noResultsText}>No experts found matching your search.</Text>
            </View>
          ) : (
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
            >
              <View style={styles.gridContainer}>
                {filteredSpecialists.map((specialist) => {
                  return (
                    <TouchableOpacity
                      key={specialist.id}
                      activeOpacity={0.85}
                      onPress={() => onSelectSpecialist && onSelectSpecialist(specialist)}
                      style={styles.card}
                    >
                      {/* Workshop Cover Image */}
                      <Image source={specialist.image} style={styles.cardCover} />

                      {/* Card Content Area */}
                      <View style={styles.cardDetails}>
                        {/* Top Info Area */}
                        <View>
                          {/* Name */}
                          <Text style={styles.cardName} numberOfLines={2}>{specialist.name}</Text>

                          {/* Specialty */}
                          <Text style={styles.cardSpecialty} numberOfLines={1}>{specialist.specialty}</Text>

                          {/* Location Row */}
                          <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={styles.locationIcon} />
                            <Text style={styles.cardLocation} numberOfLines={1}>{specialist.location}</Text>
                          </View>
                        </View>

                        {/* Bottom Info Area */}
                        <View>
                          {/* Thin Divider Line */}
                          <View style={styles.cardDivider} />

                          {/* Rating Row */}
                          <View style={styles.statsRow}>
                            {/* Rating */}
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={12} color={colors.gold} style={styles.starIcon} />
                              <Text style={styles.ratingText}>
                                {specialist.rating}{' '}
                                <Text style={styles.reviewsText}>({specialist.reviews})</Text>
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.ScrollView>
          )}

          {/* Expanded Specialist Overlay is rendered at root level in App.js */}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
  },
  subtitleText: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    paddingVertical: 0,
  },
  categoriesContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillSelected: {
    backgroundColor: colors.bgBrand,
  },
  categoryPillUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  categoryTextSelected: {
    color: colors.bgCreamy,
  },
  categoryTextUnselected: {
    color: colors.bgBrand,
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 65, // Shifted up to fit the shorter green header
    left: 0,
    right: 0,
    zIndex: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  cardsScroll: {
    paddingTop: 180, // Shifted up to fit the shorter green header
    paddingBottom: 110, // snug above bottom navigation bar
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.2%', // leaves 3.6% gap space in between
    height: 240,    // fixed height to make all boxes identical
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCover: {
    width: '100%',
    height: 100,
  },
  cardDetails: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  cardSpecialty: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.bgBrand,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 2,
  },
  cardLocation: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 3,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  reviewsText: {
    fontWeight: '400',
    color: colors.textMuted,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  overlayCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 45, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedCover: {
    width: '100%',
    height: 160,
  },
  expandedExpBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 45, 31, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 8,
  },
  expandedExpBadgeText: {
    color: colors.bgCreamy,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expandedAvatar: {
    position: 'absolute',
    top: 125,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.white,
    zIndex: 9,
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  expandedTopDetails: {
    paddingLeft: 96,
    minHeight: 65,
    justifyContent: 'center',
  },
  expandedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  expandedSpecialty: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.bgBrand,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  expandedLocation: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  expandedDescription: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    marginTop: 18,
    marginBottom: 10,
  },
  expandedBottomContainer: {
    marginTop: 8,
  },
  expandedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  expandedRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  expandedActionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    backgroundColor: 'transparent',
    gap: 6,
  },
  expandedActionButtonSolid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    gap: 6,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 312,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
