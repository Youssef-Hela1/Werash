import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity,
  Animated, Dimensions, Easing, Switch, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function SettingsScreen({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  // Toggle switch states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(DRAWER_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const renderMenuItem = (icon, label, onPress, rightElement = null, isFlat = false) => (
    <TouchableOpacity
      key={label}
      style={[styles.menuItem, isFlat && styles.flatMenuItem]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={20} color={COLORS.bgBrand} style={styles.menuIcon} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      {rightElement ? rightElement : (
        <Ionicons name="chevron-forward" size={16} color="rgba(77, 110, 79, 0.45)" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop blur covering background */}
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          {/* Tapping backdrop closes the drawer */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        </BlurView>

        {/* Sliding settings drawer */}
        <Animated.View style={[
          styles.drawerContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Account Info Section */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color={COLORS.bgCreamy} />
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>Guest User</Text>
                <Text style={styles.profileEmail}>guest@werash.com</Text>
              </View>
            </View>

            {/* Account Settings group */}
            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            <View style={styles.menuGroup}>
              {renderMenuItem('person-outline', 'Edit Profile', () => console.log('Profile'))}
              {renderMenuItem('globe-outline', 'Language', () => console.log('Language'))}
              {renderMenuItem('shield-checkmark-outline', 'Security & Pin', () => console.log('Security'))}
            </View>

            {/* Preferences settings group */}
            <Text style={styles.sectionHeader}>PREFERENCES</Text>
            <View style={styles.flatMenuGroup}>
              {renderMenuItem(
                'notifications-outline',
                'Push Notifications',
                null,
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#D5DED6', true: COLORS.bgBrand }}
                  thumbColor={COLORS.bgCreamy}
                />,
                true
              )}
              {renderMenuItem(
                'moon-outline',
                'Dark Mode',
                null,
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: '#D5DED6', true: COLORS.bgBrand }}
                  thumbColor={COLORS.bgCreamy}
                />,
                true
              )}
            </View>

            {/* Support settings group */}
            <Text style={styles.sectionHeader}>SUPPORT</Text>
            <View style={styles.menuGroup}>
              {renderMenuItem('help-circle-outline', 'Help Center', () => console.log('Help'))}
              {renderMenuItem('document-text-outline', 'Terms of Service', () => console.log('Terms'))}
              {renderMenuItem('information-circle-outline', 'About Werash', () => console.log('About'))}
            </View>

            {/* Log Out Button */}
            <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleClose}>
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FAF8F4',
    paddingTop: 54,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(77, 110, 79, 0.08)',
  },
  drawerTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: COLORS.bgBrand,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.04)',
  },
  flatMenuGroup: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  flatMenuItem: {
    borderBottomWidth: 0,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 110, 79, 0.04)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentRed,
    borderRadius: 14,
    height: 48,
    marginTop: 12,
    shadowColor: COLORS.accentRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
