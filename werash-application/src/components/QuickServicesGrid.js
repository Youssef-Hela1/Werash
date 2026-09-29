import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Helper to render text with system font for digits and Alkhalil font for words
const renderTextWithSystemNumbers = (text, isRtl, baseStyle, rtlFontSize) => {
  if (!text) return null;
  if (!isRtl) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  const regex = /([0-9\u0660-\u0669]+)/g;
  const parts = text.split(regex);
  return (
    <Text style={[baseStyle, { textAlign: 'right' }]}>
      {parts.map((part, index) => {
        const isDigit = /^[0-9\u0660-\u0669]+$/.test(part);
        return (
          <Text 
            key={index} 
            style={isDigit ? { fontSize: rtlFontSize } : { fontFamily: 'AlkhalilArabic-Bold', fontSize: rtlFontSize }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

export default function QuickServicesGrid({ onNavigate, selectedLanguage }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const isRtl = selectedLanguage === 'Arabic';
  const sectionTitle = isRtl ? 'الخدمات السريعة' : 'QUICK SERVICES';

  const services = [
    {
      id: 'warsha',
      title: isRtl ? 'ورشـتي' : 'My Warsha',
      subtitle: isRtl ? '٠ مركبات مضافة' : '0 Space Vehicles',
      icon: 'car-sport-outline',
      bgWatermark: 'car-outline',
    },
    {
      id: 'mechanics',
      title: isRtl ? 'البحث عن ميكانيكي' : 'Find Mechanics',
      subtitle: isRtl ? '٦ أخصائيين متصلين' : '6 Specialists Online',
      icon: 'construct-outline',
      bgWatermark: 'build-outline',
    },
    {
      id: 'community',
      title: isRtl ? 'مشاركة المجتمع' : 'Community Feed',
      subtitle: isRtl ? '٣ سجلات نشطة' : '3 Active Logs',
      icon: 'chatbubbles-outline',
      bgWatermark: 'people-outline',
    },
    {
      id: 'profile',
      title: isRtl ? 'الملف الشخصي' : 'My Profile',
      subtitle: isRtl ? 'إعدادات الحساب' : 'Account Settings',
      icon: 'person-circle-outline',
      bgWatermark: 'person-outline',
    }
  ];

  return (
    <View style={[styles.container, isRtl && { marginTop: 0 }]}>
      <Text style={[styles.sectionHeader, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 15.0 }, isRtl && { textAlign: 'right' }]}>{sectionTitle}</Text>
      
      <View style={[styles.grid, isRtl && { flexDirection: 'row-reverse' }]}>
        {services.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={[styles.gridCard, isRtl && { height: 115 }]} 
            activeOpacity={0.7}
            onPress={() => {
              if (service.id === 'mechanics') {
                onNavigate && onNavigate('mechanics');
              } else if (service.id === 'warsha') {
                onNavigate && onNavigate('garage');
              } else if (service.id === 'community') {
                onNavigate && onNavigate('community');
              } else if (service.id === 'profile') {
                onNavigate && onNavigate('profile');
              }
            }}
          >
            <BlurView
              intensity={65}
              tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
              style={StyleSheet.absoluteFill}
            />

            {/* Bottom Row with Service Icon and Chevron */}
            <View style={[styles.cardHeader, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={styles.iconWrapper}>
                <Ionicons name={service.icon} size={20} color={service.color || colors.bgBrand} />
              </View>
              <Ionicons 
                name={isRtl ? "chevron-back-outline" : "chevron-forward-outline"} 
                size={14} 
                color={service.color || colors.bgBrand} 
              />
            </View>

            {/* Labels Section */}
            <View style={{ marginTop: 2 }}>
              <Text style={[styles.cardTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }, isRtl && { textAlign: 'right' }]}>{service.title}</Text>
              {renderTextWithSystemNumbers(service.subtitle, isRtl, styles.cardSubtitle, 11.0)}
            </View>

            {/* Background Watermark Icon for Premium Aesthetic */}
            <View style={[styles.watermarkWrapper, isRtl ? { right: 'auto', left: -8 } : { right: -8 }]}>
              <Ionicons name={service.bgWatermark} size={48} color={service.color || colors.bgBrand} style={styles.watermarkIcon} />
            </View>

            {/* 3D Glossy Bevel Highlight Overlay */}
            <View style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: 'transparent',
              borderTopColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
              borderLeftColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
            }} pointerEvents="none" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.bgBrand,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.35)' : 'rgba(24, 30, 24, 0.45)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 16 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.borderGreen, // slightly darker border bg
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 6,
  },
  cardSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  watermarkWrapper: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    opacity: 0.06,
  },
  watermarkIcon: {
    transform: [{ rotate: '-15deg' }],
  }
});
