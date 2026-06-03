import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import SignInScreen from '../screens/SignInScreen';

const { width: screenWidth } = Dimensions.get('window');

export default function Header() {
  const [signInVisible, setSignInVisible] = useState(false);

  return (
    <View style={styles.headerContainer}>
      <SignInScreen visible={signInVisible} onClose={() => setSignInVisible(false)} />
      {/* Absolute Background Image */}
      <Image 
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
          <Text style={styles.brandName}>WERASH</Text>
        </View>

        {/* Buttons Row */}
        <View style={styles.buttonContainer}>
          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInButton} activeOpacity={0.8} onPress={() => setSignInVisible(true)}>
            <Ionicons name="person-outline" size={16} color={COLORS.textCream} style={{ marginRight: 6 }} />
            <Text style={styles.signInText}>SIGN IN</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={18} color={COLORS.textCream} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 305, // Extend the green background further down the page
    zIndex: -1, // Places the background image behind the header text/buttons
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    color: COLORS.textCream,
    letterSpacing: 0.5,
    marginTop: 2,
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
    color: COLORS.textCream,
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
