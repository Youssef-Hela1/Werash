import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_LOGOS } from '../data/brandLogos';
import { SPECIALTY_ICONS } from '../data/specialistHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    mechanical: { en: 'Mechanical', ar: 'ميكانيكا' },
    body: { en: 'Body Shop', ar: 'سمكرة ودهان' },
    suspension: { en: 'Suspension', ar: 'عفشة' },
    electrician: { en: 'Electrical', ar: 'كهرباء' },
    parts: { en: 'Parts', ar: 'قطع غيار' },
    overall: { en: 'Overall', ar: 'عام' },
  };
  const labelObj = labels[cat] || labels.mechanical;
  return {
    icon,
    label: isRtl ? labelObj.ar : labelObj.en,
  };
};

/**
 * Format clock time for message footer: e.g. "1:33 AM"
 */
const formatClockTime = (dateString, isRtl) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (_) {
    return '';
  }
};

const ChatMessageSpecialistCard = memo(function ChatMessageSpecialistCard({
  specialist,
  isUser = true,
  createdAt,
  fallbackTime,
  isRtl = false,
  isDarkMode = false,
  onPress,
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
  const specialistDesc = (isRtl ? (specialist.descriptionAr || specialist.description || specialist.specialtyAr) : (specialist.description || specialist.specialty)) || 'Auto mechanical workshop';
  const specialistLocation = (isRtl ? (specialist.locationAr || specialist.location) : specialist.location) || (isRtl ? 'جنوب القاهرة' : 'South Cairo');
  const ratingVal = specialist.rating || '5.0';
  const reviewsCount = specialist.reviews || '4';

  const clockTime = formatClockTime(createdAt, isRtl) || fallbackTime || '';

  return (
    <View
      style={[
        styles.cardContainer,
        isUser ? styles.userCardAlign : styles.contactCardAlign,
        {
          backgroundColor: isDarkMode ? '#172019' : '#FCFDFC',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#E2EBE3',
        },
      ]}
    >
      {/* Top Cover Image or "No image" Placeholder */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
      >
        {hasPhoto && photoSource ? (
          <View style={styles.coverContainer}>
            <Image source={photoSource} style={styles.coverImage} resizeMode="cover" />
          </View>
        ) : (
          <View
            style={[
              styles.coverContainer,
              styles.noImageCover,
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
                  size={19}
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
        )}
      </TouchableOpacity>

      {/* Card Body Content */}
      <View style={styles.cardBody}>
        {/* Upper Label: Wrench icon + SHARED SPECIALIST */}
        <View style={[styles.sharedBadgeRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons
            name="build"
            size={11}
            color={isDarkMode ? '#68B97C' : '#5E7A63'}
            style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
          />
          <Text style={[styles.sharedBadgeText, isRtl && styles.sharedBadgeTextRtl]}>
            {isRtl ? 'فني مشارك' : 'SHARED SPECIALIST'}
          </Text>
        </View>

        {/* Workshop Name */}
        <Text
          style={[
            styles.workshopName,
            { color: isDarkMode ? '#4ADE80' : '#0B2412' },
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
            { color: isDarkMode ? '#9CAAA0' : '#4F5D52' },
            isRtl && styles.workshopDescriptionRtl,
          ]}
          numberOfLines={2}
        >
          {specialistDesc}
        </Text>

        {/* Supported Brand & Service Category Pills */}
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
                style={[styles.brandLogoImg, isRtl ? { marginLeft: 4 } : { marginRight: 4 }]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="car-sport"
                size={11}
                color={isDarkMode ? '#CAD8CE' : '#2A3D2E'}
                style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
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
              size={11}
              color={isDarkMode ? '#CAD8CE' : '#2A3D2E'}
              style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
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
              name="location-outline"
              size={12.5}
              color={isDarkMode ? '#8E9C92' : '#6A7D6E'}
              style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }}
            />
            <Text
              style={[
                styles.metaText,
                { color: isDarkMode ? '#CAD8CE' : '#49594C' },
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
              size={11.5}
              color="#D4A373"
              style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }}
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
                {' '}({reviewsCount})
              </Text>
            </Text>
          </View>
        </View>

        {/* Full-Width Forest-Green "View Specialist" Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.viewButton,
            { backgroundColor: isDarkMode ? '#1E3A24' : '#003514' },
            isRtl && { flexDirection: 'row-reverse' },
          ]}
          onPress={onPress}
        >
          <Text style={[styles.viewButtonText, isRtl && styles.viewButtonTextRtl]}>
            {isRtl ? 'عرض الفني' : 'View specialist'}
          </Text>
          <Ionicons
            name={isRtl ? 'arrow-back' : 'arrow-forward'}
            size={15}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Subtle Horizontal Divider */}
        <View
          style={[
            styles.bottomDivider,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E6EDE8' },
          ]}
        />

        {/* Footer: Clock Time Only (checkmarks removed per user request) */}
        <View
          style={[
            styles.footerRow,
            isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
            isRtl && { flexDirection: 'row-reverse' },
          ]}
        >
          <Text
            style={[
              styles.footerTimeText,
              { color: isDarkMode ? '#8E9C92' : '#8A9E8D' },
              isRtl && styles.footerTimeTextRtl,
            ]}
          >
            {clockTime}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default ChatMessageSpecialistCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: Math.min(SCREEN_WIDTH * 0.74, 275),
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userCardAlign: {
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  contactCardAlign: {
    alignSelf: 'flex-start',
    marginLeft: 2,
  },
  coverContainer: {
    width: '100%',
    height: 94,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  noImageCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 3,
  },
  noImageIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  noImageTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 9.5,
  },
  cardBody: {
    padding: 11,
    paddingTop: 9,
  },
  sharedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#6A7D6E',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sharedBadgeTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 9.5,
  },
  workshopName: {
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 3,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  workshopNameRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  workshopDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  workshopDescriptionRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 9,
  },
  brandLogoImg: {
    width: 12,
    height: 12,
  },
  pillText: {
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  pillTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 9.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 10,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  metaTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
    fontSize: 10,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  ratingTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 10,
  },
  viewButton: {
    width: '100%',
    height: 35,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  viewButtonTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 12,
  },
  bottomDivider: {
    width: '100%',
    height: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTimeText: {
    fontSize: 9.5,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  footerTimeTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Regular',
    fontSize: 9.5,
  },
});
