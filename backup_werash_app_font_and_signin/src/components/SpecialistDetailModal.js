import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function SpecialistDetailModal({ specialist, onClose }) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);

  if (!specialist) return null;

  return (
    <View style={styles.overlayContainer}>
      <BlurView intensity={65} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        {/* Tapping backdrop closes the card */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1}
          onPress={onClose}
        />
      </BlurView>
      <View style={styles.overlayCardContainer}>
        <View style={styles.expandedCard}>
          {/* Close Button X */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Workshop Cover Image */}
          <Image source={specialist.image} style={styles.expandedCover} />

          {/* Experience Badge */}
          <View style={styles.expandedExpBadge}>
            <Text style={styles.expandedExpBadgeText}>{specialist.exp}</Text>
          </View>

          {/* Profile Avatar */}
          <Image source={specialist.avatar} style={styles.expandedAvatar} />

          {/* Card Content Area */}
          <View style={styles.expandedDetails}>
            {/* Top Info Area (Aligned right to clear avatar) */}
            <View style={styles.expandedTopDetails}>
              {/* Name */}
              <Text style={styles.expandedName} numberOfLines={1}>
                {specialist.name}
              </Text>

              {/* Specialty */}
              <Text style={styles.expandedSpecialty} numberOfLines={1}>
                {specialist.specialty}
              </Text>

              {/* Location Row */}
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={12} color={colors.textMuted} style={styles.locationIcon} />
                <Text style={styles.expandedLocation} numberOfLines={1}>
                  {specialist.location}
                </Text>
              </View>
            </View>

            {/* Biography Description */}
            <Text style={styles.expandedDescription} numberOfLines={3}>
              {specialist.description}
            </Text>

            {/* Bottom Section */}
            <View style={styles.expandedBottomContainer}>
              {/* Thin Divider Line */}
              <View style={styles.cardDivider} />

              {/* Rating Row */}
              <View style={styles.expandedStatsRow}>
                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={colors.gold} style={styles.starIcon} />
                  <Text style={styles.expandedRatingText}>
                    {specialist.rating}{' '}
                    <Text style={styles.reviewsText}>({specialist.reviews} reviews)</Text>
                  </Text>
                </View>
              </View>

              {/* Actions Row */}
              <View style={styles.expandedActionsRow}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonOutline}
                  onPress={() => console.log('Location pressed for ' + specialist.name)}
                >
                  <Ionicons name="location-outline" size={20} color={colors.bgBrand} />
                  <Text style={styles.actionButtonLabel}>Location</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonOutline}
                  onPress={() => console.log('Call pressed for ' + specialist.name)}
                >
                  <Ionicons name="call-outline" size={20} color={colors.bgBrand} />
                  <Text style={styles.actionButtonLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.expandedActionButtonSolid}
                  onPress={() => console.log('Message pressed for ' + specialist.name)}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonLabelSolid}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 3,
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
    zIndex: 1000,
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
});
