import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity,
  Animated, Dimensions, Easing, Switch, ScrollView,
  Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function SettingsScreen({ 
  visible, 
  onClose, 
  currentUser, 
  onLogOut,
  selectedLanguage: propSelectedLanguage,
  onSelectLanguage
}) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
 
  // Toggle switch states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [localLanguage, setLocalLanguage] = useState('English');
  const selectedLanguage = propSelectedLanguage || localLanguage;
  const setSelectedLanguage = onSelectLanguage || setLocalLanguage;
  
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

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

  const renderMenuItem = (icon, label, onPress, rightElement = null, isFlat = false, isLast = false) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.menuItem,
        isFlat && styles.flatMenuItem,
        isLast && { borderBottomWidth: 0 }
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={20} color={colors.bgBrand} style={styles.menuIcon} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      {rightElement ? rightElement : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
        <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill}>
          {/* Tapping backdrop closes the drawer */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        </BlurView>

        {/* Sliding settings drawer */}
        <Animated.View style={[
          styles.drawerContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>{selectedLanguage === 'Arabic' ? 'الإعدادات' : 'Settings'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Account Info Section */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color={colors.bgCreamy} />
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{currentUser ? currentUser.fullName : (selectedLanguage === 'Arabic' ? 'مطلب زائر' : 'Guest User')}</Text>
                <Text style={styles.profileEmail}>{currentUser ? currentUser.email : 'guest@werash.com'}</Text>
              </View>
            </View>

            {/* Account Settings group */}
            <Text style={styles.sectionHeader}>{selectedLanguage === 'Arabic' ? 'الحساب' : 'ACCOUNT'}</Text>
            <View style={styles.menuGroup}>
              {renderMenuItem('person-outline', selectedLanguage === 'Arabic' ? 'تعديل الحساب' : 'Edit Profile', () => console.log('Profile'))}
              {renderMenuItem(
                'globe-outline',
                selectedLanguage === 'Arabic' ? 'اللغة' : 'Language',
                () => {
                  setLanguageModalVisible(true);
                },
                <Text style={{ fontSize: 13, color: colors.textMuted, marginRight: 4, fontWeight: '600' }}>
                  {selectedLanguage === 'English' ? 'English' : 'العربية'}
                </Text>
              )}
              {renderMenuItem('shield-checkmark-outline', selectedLanguage === 'Arabic' ? 'الأمان والرمز السري' : 'Security & Pin', () => console.log('Security'), null, false, true)}
            </View>

            {/* Preferences settings group */}
            <Text style={styles.sectionHeader}>{selectedLanguage === 'Arabic' ? 'التفضيلات' : 'PREFERENCES'}</Text>
            <View style={styles.flatMenuGroup}>
              {renderMenuItem(
                'notifications-outline',
                selectedLanguage === 'Arabic' ? 'إشعارات الهاتف' : 'Push Notifications',
                null,
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#D5DED6', true: colors.bgBrand }}
                  thumbColor={colors.bgCreamy}
                />,
                true
              )}
              {renderMenuItem(
                'moon-outline',
                selectedLanguage === 'Arabic' ? 'الوضع الداكن' : 'Dark Mode',
                null,
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: '#D5DED6', true: colors.bgBrand }}
                  thumbColor={colors.bgCreamy}
                />,
                true
              )}
            </View>

            {/* Support settings group */}
            <Text style={styles.sectionHeader}>{selectedLanguage === 'Arabic' ? 'الدعم' : 'SUPPORT'}</Text>
            <View style={styles.menuGroup}>
              {renderMenuItem('help-circle-outline', selectedLanguage === 'Arabic' ? 'مركز المساعدة' : 'Help Center', () => console.log('Help'))}
              {renderMenuItem('document-text-outline', selectedLanguage === 'Arabic' ? 'شروط الخدمة' : 'Terms of Service', () => console.log('Terms'))}
              {renderMenuItem('information-circle-outline', selectedLanguage === 'Arabic' ? 'عن وِرَش' : 'About Werash', () => console.log('About'), null, false, true)}
            </View>

            {/* Log Out Button */}
            {currentUser && (
              <TouchableOpacity 
                style={styles.logoutButton} 
                activeOpacity={0.8} 
                onPress={() => {
                  Alert.alert(
                    selectedLanguage === 'Arabic' ? 'تسجيل الخروج' : 'Sign Out',
                    selectedLanguage === 'Arabic' ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟' : 'Are you sure you want to sign out of your account?',
                    [
                      { text: selectedLanguage === 'Arabic' ? 'إلغاء' : 'Cancel', style: 'cancel' },
                      { 
                        text: selectedLanguage === 'Arabic' ? 'خروج' : 'Sign Out', 
                        style: 'destructive', 
                        onPress: () => {
                          handleClose();
                          if (onLogOut) {
                            onLogOut();
                          }
                        } 
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.logoutText}>{selectedLanguage === 'Arabic' ? 'تسجيل الخروج' : 'Log Out'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>

        {/* Custom Language Selection Dialog Overlay */}
        {languageModalVisible && (
          <View style={styles.alertOverlay}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setLanguageModalVisible(false)} activeOpacity={1} />
            </BlurView>

            <View style={styles.alertCard}>
              {/* Top Close Button */}
              <TouchableOpacity 
                style={styles.alertCloseIcon} 
                onPress={() => setLanguageModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={colors.textDark} style={{ opacity: 0.7 }} />
              </TouchableOpacity>

              {/* Icon & Title Block */}
              <View style={styles.alertHeaderContainer}>
                <View style={styles.alertIconBadge}>
                  <Ionicons name="globe-outline" size={24} color={colors.bgBrand} />
                </View>
                <Text style={styles.alertTitle}>
                  {selectedLanguage === 'English' ? 'App Language' : 'لغة التطبيق'}
                </Text>
                <Text style={styles.alertDesc}>
                  {selectedLanguage === 'English' ? 'Choose your interface language' : 'اختر لغة واجهة التطبيق'}
                </Text>
              </View>
              
              <View style={styles.alertActions}>
                {/* English Option Row with Toggle */}
                <View style={styles.langToggleRow}>
                  <View style={styles.langToggleLeft}>
                    <Image 
                      source={require('../../assets/uk_flag.png')} 
                      style={styles.flagImageCompact} 
                      resizeMode="cover"
                    />
                    <Text style={styles.langToggleLabel}>English</Text>
                  </View>
                  <Switch
                    value={selectedLanguage === 'English'}
                    onValueChange={(val) => {
                      if (val) setSelectedLanguage('English');
                    }}
                    trackColor={{ false: '#D5DED6', true: colors.bgBrand }}
                    thumbColor={colors.bgCreamy}
                  />
                </View>

                {/* Arabic Option Row with Toggle */}
                <View style={styles.langToggleRow}>
                  <View style={styles.langToggleLeft}>
                    <Image 
                      source={require('../../assets/egypt_flag.png')} 
                      style={styles.flagImageCompact} 
                      resizeMode="cover"
                    />
                    <Text style={styles.langToggleLabelArabic}>العربية</Text>
                  </View>
                  <Switch
                    value={selectedLanguage === 'Arabic'}
                    onValueChange={(val) => {
                      if (val) setSelectedLanguage('Arabic');
                    }}
                    trackColor={{ false: '#D5DED6', true: colors.bgBrand }}
                    thumbColor={colors.bgCreamy}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.bgCreamy,
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
    borderBottomColor: colors.borderGreen,
  },
  drawerTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
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
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  menuGroup: {
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGreen,
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
    borderBottomColor: colors.borderGreen,
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
    color: colors.textDark,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentRed,
    borderRadius: 14,
    height: 48,
    marginTop: 12,
    shadowColor: colors.accentRed,
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
  alertOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 325,
    backgroundColor: colors.bgCreamy,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    padding: 24,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  alertCloseIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  alertActions: {
    width: '100%',
    gap: 12,
  },
  langToggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  langToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagImageCompact: {
    width: 30,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  langToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  langToggleLabelArabic: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
});
