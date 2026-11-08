import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../styles/ThemeContext';

export function PremiumCard({ children, style, surfaceStyle }) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.shadow,
      {
        backgroundColor: colors.cardBg,
        shadowColor: '#000000',
        shadowOpacity: isDarkMode ? 0.22 : 0.13,
      },
      style
    ]}>
      <View style={[
        styles.surface,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
        surfaceStyle
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#202824',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },

  surface: {
    width: '100%',
    aspectRatio: 1.96,
    backgroundColor: '#202824',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#35423A',
    overflow: 'hidden',
    padding: 20,
  },
});

export default PremiumCard;
