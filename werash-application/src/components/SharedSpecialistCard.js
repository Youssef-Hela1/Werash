import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_LOGOS } from '../data/brandLogos';
import { SPECIALTY_ICONS } from '../data/specialistHelpers';

/**
 * Standard "No image" placeholder cover matching mechanic cards in MechanicsScreen
 */
const NoImagePlaceholderCover = memo(function NoImagePlaceholderCover({ isDarkMode, isRtl }) {
  return (
    <View
      style={[
        styles.coverContainer,
        styles.noImageCoverContainer,
        { backgroundColor: isDarkMode ? '#172019' : '#E8ECE9' },
      ]}
    >
      <View style={styles.noImagePlaceholder} pointerEvents="none">
        <View
          style={[
            styles.noImageIconBadge,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 53, 20, 0.04)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 53, 20, 0.06)',
            },
          ]}
        >
          <Ionicons
            name="image-outline"
            size={22}
            color={isDarkMode ? '#526956' : '#94A396'}
          />
        </View>
        <Text
          style={[
            styles.noImageText,
            { color: isDarkMode ? '#687E6D' : '#8A9E8D' },
            isRtl && styles.noImageTextRtl,
          ]}
        >
          {isRtl ? 'لا توجد صورة' : 'No image'}
        </Text>
      </View>
    </View>
  );
});

/**
 * Resolve supported car brand name and logo image
 */
const resolveBrandInfo = (specialist) => {
  if (!specialist) return { name: 'OVERALL', logo: null };
  const text = `${specialist.name || ''} ${specialist.specialty || ''} ${specialist.description || ''}`.toLowerCase();
  
  for (const b of Object.keys(BRAND_LOGOS)) {
    if (b.length > 2 && text.includes(b)) {
      return { name: b.toUpperCase(), logo: BRAND_LOGOS[b] };
    }
  }

  if (specialist.carOrigin && specialist.carOrigin !== 'Overall') {
    const origin = specialist.carOrigin.toLowerCase();
    if (BRAND_LOGOS[origin]) {
      return { name: specialist.carOrigin.toUpperCase(), logo: BRAND_LOGOS[origin] };
    }
    return { name: specialist.carOrigin.toUpperCase(), logo: null };
  }

  return { name: 'OVERALL', logo: null };
};

/**
 * Resolve service category label and icon
 */
const resolveCategoryInfo = (specialist, isRtl) => {
  const cat = specialist?.category || (Array.isArray(specialist?.categories) ? specialist.categories[0] : 'mechanical');
  const icon = SPECIALTY_ICONS[cat] || 'build-outline';
  const labels = {
    mechanical: { en: 'MECHANICAL', ar: 'ميكانيكا' },
    body: { en: 'BODY SHOP', ar: 'سمكرة ودهان' },
    suspension: { en: 'SUSPENSION', ar: 'عفشة' },
    electrician: { en: 'ELECTRICAL', ar: 'كهرباء' },
    parts: { en: 'PARTS', ar: 'قطع غيار' },
    overall: { en: 'OVERALL', ar: 'عام' },
  };
  const labelObj = labels[cat] || labels.mechanical;
  return {
    icon,
    label: isRtl ? labelObj.ar : labelObj.en,
  };
};

/**
 * SharedSpecialistCard
 * Reusable card rendered in post composer & in feed posts
 */
const SharedSpecialistCard = memo(function SharedSpecialistCard({
  specialist,
  isRtl,
  isDarkMode,
  onPress,
  showRemoveBtn = false,
  onRemove,
}) {
  if (!specialist) return null;

  const brandInfo = resolveBrandInfo(specialist);
  const categoryInfo = resolveCategoryInfo(specialist, isRtl);

  const hasPhoto = Boolean(
    specialist.image ||
    specialist.photoUrl ||
    (typeof specialist.coverPhoto === 'string' && specialist.coverPhoto.startsWith('http'))
  );

  const photoSource = specialist.image
    ? (typeof specialist.image === 'string' ? { uri: specialist.image } : specialist.image)
    : specialist.photoUrl
    ? { uri: specialist.photoUrl }
    : specialist.coverPhoto
    ? { uri: specialist.coverPhoto }
    : null;

  const specialistName = (isRtl ? (specialist.nameAr || specialist.name) : specialist.name) || 'Specialist';
  const specialistDesc = (isRtl ? (specialist.descriptionAr || specialist.description || specialist.specialtyAr) : (specialist.description || specialist.specialty)) || 'Auto workshop & maintenance';
  const specialistLocation = (isRtl ? (specialist.locationAr || specialist.location) : specialist.location) || (isRtl ? 'القاهرة' : 'Cairo');
  const ratingVal = specialist.rating || '5.0';
  const reviewsCount = specialist.reviews || '0';

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDarkMode ? '#172019' : '#FCFDFC',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.09)' : '#E2EBE3',
        },
      ]}
    >
      {/* Remove Button for Composer preview */}
      {showRemoveBtn && onRemove && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.removeButton, isRtl && { right: undefined, left: 10 }]}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Remove attached mechanic"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Top Cover Image or "No image" Placeholder */}
      {hasPhoto && photoSource ? (
        <View style={styles.coverContainer}>
          <Image source={photoSource} style={styles.coverImage} resizeMode="cover" />
        </View>
      ) : (
        <NoImagePlaceholderCover isDarkMode={isDarkMode} isRtl={isRtl} />
      )}

      {/* Card Body Content (Non-clickable container; only "View specialist" button triggers navigation) */}
      <View style={styles.cardBody}>
        {/* Shared Specialist Upper Label */}
        <View style={[styles.sharedBadgeRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons
            name="build"
            size={12}
            color={isDarkMode ? '#68B97C' : '#47704C'}
            style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
          />
          <Text style={[styles.sharedBadgeText, isRtl && styles.sharedBadgeTextRtl]}>
            {isRtl ? 'فني مشارك' : 'SHARED SPECIALIST'}
          </Text>
        </View>

        {/* Workshop Name */}
        <Text
          style={[
            styles.workshopName,
            { color: isDarkMode ? '#4ADE80' : '#003514' },
            isRtl && styles.workshopNameRtl,
          ]}
          numberOfLines={2}
        >
          {specialistName}
        </Text>

        {/* Workshop Description */}
        <Text
          style={[
            styles.workshopDescription,
            { color: isDarkMode ? '#9CAAA0' : '#4B554D' },
            isRtl && styles.workshopDescriptionRtl,
          ]}
          numberOfLines={2}
        >
          {specialistDesc}
        </Text>

        {/* Compact Supported Brand and Category Pills */}
        <View style={[styles.pillsRow, isRtl && { flexDirection: 'row-reverse' }]}>
          {/* Brand Pill */}
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: isDarkMode ? '#223226' : '#EBF0EC' },
              isRtl && { flexDirection: 'row-reverse' },
            ]}
          >
            {brandInfo.logo ? (
              <Image
                source={brandInfo.logo}
                style={[styles.brandLogoImg, isRtl ? { marginLeft: 5 } : { marginRight: 5 }]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="car-sport"
                size={12}
                color={isDarkMode ? '#CAD8CE' : '#2A3D2E'}
                style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
              />
            )}
            <Text
              style={[
                styles.pillText,
                { color: isDarkMode ? '#D4E2D7' : '#1C2E20' },
                isRtl && styles.pillTextRtl,
              ]}
            >
              {brandInfo.name}
            </Text>
          </View>

          {/* Service Category Pill */}
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: isDarkMode ? '#223226' : '#EBF0EC' },
              isRtl && { flexDirection: 'row-reverse' },
            ]}
          >
            <Ionicons
              name={categoryInfo.icon}
              size={12}
              color={isDarkMode ? '#CAD8CE' : '#2A3D2E'}
              style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
            />
            <Text
              style={[
                styles.pillText,
                { color: isDarkMode ? '#D4E2D7' : '#1C2E20' },
                isRtl && styles.pillTextRtl,
              ]}
            >
              {categoryInfo.label}
            </Text>
          </View>
        </View>

        {/* Location & Rating Row */}
        <View style={[styles.metaRow, isRtl && { flexDirection: 'row-reverse' }]}>
          {/* Location */}
          <View style={[styles.metaItem, isRtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons
              name="location-sharp"
              size={13}
              color={isDarkMode ? '#8E9C92' : '#7F9484'}
              style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
            />
            <Text
              style={[
                styles.metaText,
                { color: isDarkMode ? '#CAD8CE' : '#5E6E62' },
                isRtl && styles.metaTextRtl,
              ]}
              numberOfLines={1}
            >
              {specialistLocation}
            </Text>
          </View>

          {/* Subtle Vertical Divider */}
          <View
            style={[
              styles.metaDivider,
              { backgroundColor: isDarkMode ? '#2F4033' : '#D1DDD3' },
            ]}
          />

          {/* Rating */}
          <View style={[styles.metaItem, isRtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons
              name="star"
              size={13}
              color="#D4A373"
              style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
            />
            <Text
              style={[
                styles.ratingText,
                { color: isDarkMode ? '#CAD8CE' : '#2D3E30' },
                isRtl && styles.ratingTextRtl,
              ]}
            >
              {ratingVal}
              <Text style={{ fontWeight: '400', color: isDarkMode ? '#8E9C92' : '#6E7E72' }}>
                {' '}({reviewsCount} {isRtl ? 'تقييم' : 'reviews'})
              </Text>
            </Text>
          </View>
        </View>

        {/* Full-Width Forest-Green "View Specialist" Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.viewButton,
            { backgroundColor: isDarkMode ? '#1E3A24' : '#1F4D2B' },
            isRtl && { flexDirection: 'row-reverse' },
          ]}
          onPress={onPress}
        >
          <Text style={[styles.viewButtonText, isRtl && styles.viewButtonTextRtl]}>
            {isRtl ? 'عرض الفني' : 'View specialist'}
          </Text>
          <Ionicons
            name={isRtl ? 'arrow-back' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default SharedSpecialistCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  coverContainer: {
    width: '100%',
    height: 124,
    overflow: 'hidden',
  },
  noImageCoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  noImageIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  noImageTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardBody: {
    padding: 16,
    paddingTop: 14,
  },
  sharedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#6A7D6E',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sharedBadgeTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 11,
  },
  workshopName: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  workshopNameRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  workshopDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  workshopDescriptionRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  brandLogoImg: {
    width: 14,
    height: 14,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  pillTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  metaTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  metaDivider: {
    width: 1,
    height: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  ratingTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  viewButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  viewButtonTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
