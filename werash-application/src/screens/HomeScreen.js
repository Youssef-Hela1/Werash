import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

export default function HomeScreen({ 
  onNavigate, 
  currentUser, 
  onOpenSignIn, 
  selectedLanguage, 
  userVehicles = [], 
  activeVehicleId, 
  onSelectAd, 
  onSelectProfile,
  onScrollPositionChange 
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgCreamy} />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
});
