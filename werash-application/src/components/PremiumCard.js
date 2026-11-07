import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export function PremiumCard({ children, style, surfaceStyle }) {
  return (
    <View style={[styles.shadow, style]}>
      <View style={[styles.surface, surfaceStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#FAFBFB',
    overflow: 'visible',

    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  surface: {
    width: '100%',
    aspectRatio: 1.96,
    backgroundColor: '#FAFBFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    padding: 20,
  },
});

export default PremiumCard;
