import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function SpecialistSpotlight({ onNavigate }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const scrollViewRef = useRef(null);
  const [showArrow, setShowArrow] = useState(true);

  const specialists = [
    {
      id: 'kareem',
      name: 'Kareem El-Sayed',
      specialty: 'Engine & Tuning',
      rating: '4.9',
      exp: '12 Years Exp.',
      image: require('../../assets/expert_kareem.png'),
    },
    {
      id: 'elena',
      name: 'Elena Rostova',
      specialty: 'Diagnostics & ECU',
      rating: '4.9',
      exp: '9 Years Exp.',
      image: require('../../assets/expert_elena.png'),
    },
    {
      id: 'tariq',
      name: 'Tariq Mansour',
      specialty: 'Brakes & Suspension',
      rating: '4.9',
      exp: '8 Years Exp.',
      image: require('../../assets/expert_tariq.png'),
    }
  ];

  const handleScrollRight = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 220, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      {/* Spotlight Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionSub}>SPECIALIST SPOTLIGHT</Text>
          <Text style={styles.sectionMain}>CERTIFIED ADVISORS</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.browseAllWrapper}
          onPress={() => onNavigate && onNavigate('mechanics')}
        >
          <Text style={styles.browseAllText}>Browse All</Text>
          <Ionicons name="chevron-forward-outline" size={10} color={colors.textDark} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel Wrapper */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          snapToInterval={236}
          decelerationRate="fast"
          onScrollBeginDrag={() => setShowArrow(false)}
          onMomentumScrollEnd={(e) => {
            if (e.nativeEvent.contentOffset.x <= 0) setShowArrow(true);
          }}
        >
          {specialists.map((specialist) => (
            <TouchableOpacity 
              key={specialist.id} 
              style={styles.card} 
              activeOpacity={0.85} 
              onPress={() => onNavigate && onNavigate('mechanics', specialist.id)}
            >
              <View style={styles.topInfo}>
                {/* Advisor Avatar Portrait */}
                <Image source={specialist.image} style={styles.avatar} />
                
                {/* Advisor Details */}
                <View style={styles.details}>
                  <Text style={styles.name} numberOfLines={1}>{specialist.name}</Text>
                  <Text style={styles.specialty} numberOfLines={1}>{specialist.specialty}</Text>
                </View>
              </View>

              {/* Action and Info Row */}
              <View style={styles.bottomInfo}>
                <View style={styles.statsColumn}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.gold} style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>{specialist.rating}</Text>
                  </View>
                  <Text style={styles.expText}>{specialist.exp}</Text>
                </View>

                {/* Connect Action Trigger */}
                <View style={styles.connectButton}>
                  <Text style={styles.connectText}>VIEW</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Horizontal Navigation Control Arrow Overlay — hidden while swiping */}
        {showArrow && (
          <TouchableOpacity 
            style={styles.navArrow} 
            activeOpacity={0.9}
            onPress={handleScrollRight}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.textDark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.bgBrand,
    letterSpacing: 0.8,
  },
  sectionMain: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.bgBrand,
    marginTop: 1,
  },
  browseAllWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  browseAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDark,
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
  },
  scrollContainer: {
    paddingLeft: 20,
    paddingRight: 40,
  },
  card: {
    width: 220,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 14,
    padding: 12,
    marginRight: 16,
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    backgroundColor: colors.white,
  },
  details: {
    marginLeft: 8,
    flex: 1,
  },
  name: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  specialty: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    paddingTop: 6,
  },
  statsColumn: {
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  expText: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  connectText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.bgBrand,
  },
  navArrow: {
    position: 'absolute',
    right: 12,
    top: '30%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  }
});
