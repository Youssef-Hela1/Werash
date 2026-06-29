import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SignInScreen from '../screens/SignInScreen';
import SettingsScreen from '../screens/SettingsScreen';

const { width: screenWidth } = Dimensions.get('window');

export default function Header({ 
  currentUser, 
  onSetCurrentUser, 
  signInVisible, 
  onSetSignInVisible,
  selectedLanguage: propSelectedLanguage,
  onSelectLanguage
}) {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [localLanguage, setLocalLanguage] = useState('English');
  const selectedLanguage = propSelectedLanguage || localLanguage;
  const setSelectedLanguage = onSelectLanguage || setLocalLanguage;
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const getFirstName = () => {
    if (!currentUser || !currentUser.fullName) return '';
    return currentUser.fullName.trim().split(/\s+/)[0];
  };

  return (
    <View pointerEvents="box-none" style={styles.headerContainer}>
      <SignInScreen 
        visible={signInVisible} 
        onClose={() => onSetSignInVisible(false)} 
        onSignInSuccess={onSetCurrentUser}
      />
      <SettingsScreen 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
        currentUser={currentUser}
        onLogOut={() => onSetCurrentUser(null)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />
      {/* Absolute Background Image */}
      <Image 
        pointerEvents="none"
        source={require('../../assets/skid_mark.png')} 
        style={styles.backgroundImage} 
        resizeMode="cover" 
      />

      <View style={styles.topRow}>
        {/* Logo Image and Text */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={selectedLanguage === 'Arabic' ? styles.brandNameArabic : styles.brandName}>
            {selectedLanguage === 'Arabic' ? 'وِرَش' : 'WERASH'}
          </Text>
        </View>

        {/* Buttons Row */}
        <View style={styles.buttonContainer}>
          {/* Sign In / Sign Out Button */}
          <TouchableOpacity 
            style={styles.signInButton} 
            activeOpacity={0.8} 
            onPress={() => {
              if (currentUser) {
                Alert.alert(
                  selectedLanguage === 'Arabic' ? 'تسجيل الخروج' : 'Sign Out',
                  selectedLanguage === 'Arabic' ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟' : 'Are you sure you want to sign out of your account?',
                  [
                    { text: selectedLanguage === 'Arabic' ? 'إلغاء' : 'Cancel', style: 'cancel' },
                    { text: selectedLanguage === 'Arabic' ? 'خروج' : 'Sign Out', style: 'destructive', onPress: () => onSetCurrentUser(null) }
                  ]
                );
              } else {
                onSetSignInVisible(true);
              }
            }}
          >
            <Ionicons name="person-outline" size={16} color={colors.textCream} style={{ marginRight: 6 }} />
            <Text style={styles.signInText}>{currentUser ? getFirstName().toUpperCase() : (selectedLanguage === 'Arabic' ? "تسجيل الدخول" : "SIGN IN")}</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            style={styles.settingsButton} 
            activeOpacity={0.8}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textCream} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  headerContainer: {
    paddingTop: 54,
    paddingBottom: 16, // Fixed small padding to lock the container layout size
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth, // Force exact full device width
    height: 275, // Adjusted background height for page balance
    zIndex: 1, // Places the background image behind the header text/buttons but in front of screen content
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
    marginRight: 8,
  },
  brandName: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 42,
    color: colors.textCream,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 74,
    color: colors.textCream,
    letterSpacing: 0,
    marginTop: -4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 251, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 251, 247, 0.35)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
  },
  signInText: {
    color: colors.textCream,
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 251, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 251, 247, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
