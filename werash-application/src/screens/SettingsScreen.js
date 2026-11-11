import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity,
  Animated, Dimensions, Easing, Switch, ScrollView,
  Alert, Image, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  onSelectLanguage,
  onSelectProfile
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
    }).start(() => {
      if (onClose) onClose();
    });
  };

  const isRtl = selectedLanguage === 'Arabic';

  const renderMenuItem = (icon, label, onPress, rightElement = null, isLast = false) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.menuItem,
        isLast && { borderBottomWidth: 0 },
        isRtl && styles.menuItemRtl
      ]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuItemLeft, isRtl && styles.menuItemLeftRtl]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={colors.activeHighlight} 
          style={[styles.menuIcon, isRtl && styles.menuIconRtl]} 
        />
        <Text style={[styles.menuLabel, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 14 }]}>
          {label}
        </Text>
      </View>
      {rightElement || null}
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);

  return (
    <View style={[styles.screenContainer, { paddingTop: topInset + 10 }]}>
      <View style={styles.scrollContent}>
        {/* Page Title & Close Button Header */}
        <View style={[styles.titleContainer, isRtl && styles.titleContainerRtl]}>
          <Text style={[styles.pageTitle, isRtl && styles.pageTitleArabic]}>
            {isRtl ? 'الإعدادات' : 'Settings'}
          </Text>
          {onClose && (
            <TouchableOpacity 
              style={styles.closeButton} 
              activeOpacity={0.7} 
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Account Info Profile Card */}
        <TouchableOpacity 
          style={styles.cardShadow}
          activeOpacity={0.85}
          onPress={() => {
            if (onSelectProfile) onSelectProfile();
          }}
        >
          <View style={[styles.profileCardSurface, isRtl && styles.profileCardSurfaceRtl]}>
            {currentUser && (currentUser.avatarUrl || currentUser.avatar) ? (
              <Image
                source={
                  typeof (currentUser.avatarUrl || currentUser.avatar) === 'string'
                    ? { uri: currentUser.avatarUrl || currentUser.avatar }
                    : (currentUser.avatarUrl || currentUser.avatar)
                }
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.profileDetails, isRtl && styles.profileDetailsRtl]}>
              <Text style={[styles.profileName, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                {currentUser ? currentUser.fullName : (isRtl ? 'حساب زائر' : 'Guest User')}
              </Text>
              <Text style={styles.profileEmail}>
                {currentUser ? currentUser.email : 'guest@werash.com'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Account Settings / Language Card */}
        <Text style={[styles.sectionHeader, isRtl && styles.sectionHeaderRtl]}>
          {isRtl ? 'الحساب' : 'ACCOUNT'}
        </Text>
        <View style={styles.cardShadow}>
          <View style={styles.cardSurface}>
            {renderMenuItem(
              'globe-outline',
              isRtl ? 'اللغة' : 'Language',
              () => setLanguageModalVisible(true),
              <Text style={[styles.langValueText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                {selectedLanguage === 'English' ? 'English' : 'العربية'}
              </Text>,
              true
            )}
          </View>
        </View>

        {/* Preferences Card: Push Notifications & Dark Mode */}
        <Text style={[styles.sectionHeader, isRtl && styles.sectionHeaderRtl]}>
          {isRtl ? 'التفضيلات' : 'PREFERENCES'}
        </Text>
        <View style={styles.cardShadow}>
          <View style={styles.cardSurface}>
            {renderMenuItem(
              'notifications-outline',
              isRtl ? 'إشعارات الهاتف' : 'Push Notifications',
              null,
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.forestGreen }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.cardBorder}
              />,
              false
            )}
            {renderMenuItem(
              'moon-outline',
              isRtl ? 'الوضع الداكن' : 'Dark Mode',
              null,
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.cardBorder, true: colors.forestGreen }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.cardBorder}
              />,
              true
            )}
          </View>
        </View>

        {/* Support Card: Help Center, Terms, About Werash */}
        <Text style={[styles.sectionHeader, isRtl && styles.sectionHeaderRtl]}>
          {isRtl ? 'الدعم' : 'SUPPORT'}
        </Text>
        <View style={styles.cardShadow}>
          <View style={styles.cardSurface}>
            {renderMenuItem(
              'help-circle-outline', 
              isRtl ? 'مركز المساعدة' : 'Help Center', 
              () => console.log('Help'),
              null,
              false
            )}
            {renderMenuItem(
              'document-text-outline', 
              isRtl ? 'شروط الخدمة' : 'Terms of Service', 
              () => console.log('Terms'),
              null,
              false
            )}
            {renderMenuItem(
              'information-circle-outline', 
              isRtl ? 'عن وِرَش' : 'About Werash', 
              () => console.log('About'), 
              null, 
              true
            )}
          </View>
        </View>

        {/* Log Out Button */}
        {currentUser && (
          <TouchableOpacity 
            style={styles.logoutButton} 
            activeOpacity={0.85} 
            onPress={() => {
              Alert.alert(
                isRtl ? 'تسجيل الخروج' : 'Sign Out',
                isRtl ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟' : 'Are you sure you want to sign out of your account?',
                [
                  { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
                  { 
                    text: isRtl ? 'خروج' : 'Sign Out', 
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
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text style={[styles.logoutText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
              {isRtl ? 'تسجيل الخروج' : 'Log Out'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

        {/* Custom Language Selection Dialog Overlay */}
        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setLanguageModalVisible(false)}
        >
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
                <Text style={[styles.alertTitle, selectedLanguage === 'Arabic' && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {selectedLanguage === 'English' ? 'App Language' : 'لغة التطبيق'}
                </Text>
                <Text style={[styles.alertDesc, selectedLanguage === 'Arabic' && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {selectedLanguage === 'English' ? 'Choose your interface language' : 'اختر لغة واجهة التطبيق'}
                </Text>
              </View>
              
              <View style={styles.alertActions}>
                {/* English Option Button */}
                <TouchableOpacity
                  style={[
                    styles.langToggleRow,
                    selectedLanguage === 'English' && styles.langToggleRowActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLanguage('English');
                    setLanguageModalVisible(false);
                  }}
                >
                  <View style={styles.langToggleLeft}>
                    <Image 
                      source={require('../../assets/uk_flag.png')} 
                      style={styles.flagImageCompact} 
                      resizeMode="cover"
                    />
                    <Text
                      style={[
                        styles.langToggleLabel,
                        selectedLanguage === 'English' && styles.langToggleLabelActive,
                      ]}
                    >
                      English
                    </Text>
                  </View>
                  {selectedLanguage === 'English' ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.bgBrand} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={colors.borderGreen} />
                  )}
                </TouchableOpacity>

                {/* Arabic Option Button */}
                <TouchableOpacity
                  style={[
                    styles.langToggleRow,
                    selectedLanguage === 'Arabic' && styles.langToggleRowActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLanguage('Arabic');
                    setLanguageModalVisible(false);
                  }}
                >
                  <View style={styles.langToggleLeft}>
                    <Image 
                      source={require('../../assets/egypt_flag.png')} 
                      style={styles.flagImageCompact} 
                      resizeMode="cover"
                    />
                    <Text
                      style={[
                        styles.langToggleLabelArabic,
                        { fontFamily: 'IBMPlexSansArabic-Bold' },
                        selectedLanguage === 'Arabic' && styles.langToggleLabelActive,
                      ]}
                    >
                      العربية
                    </Text>
                  </View>
                  {selectedLanguage === 'Arabic' ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.bgBrand} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={colors.borderGreen} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flex: 1,
  },
  titleContainer: {
    marginBottom: 16,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainerRtl: {
    flexDirection: 'row-reverse',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.4,
  },
  pageTitleArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 28,
    letterSpacing: 0,
    textAlign: 'right',
  },
  cardShadow: {
    width: '100%',
    borderRadius: 17,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSurface: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  profileCardSurface: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileCardSurfaceRtl: {
    flexDirection: 'row-reverse',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  profileDetailsRtl: {
    marginLeft: 0,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.secondaryText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeaderRtl: {
    marginLeft: 0,
    marginRight: 4,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  menuItemRtl: {
    flexDirection: 'row-reverse',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemLeftRtl: {
    flexDirection: 'row-reverse',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuIconRtl: {
    marginRight: 0,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.1,
  },
  langValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langValueBadgeRtl: {
    flexDirection: 'row-reverse',
  },
  langValueText: {
    fontSize: 13,
    color: colors.activeHighlight,
    fontWeight: '700',
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
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 325,
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: colors.secondaryText,
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
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  langToggleRowActive: {
    backgroundColor: 'rgba(48, 87, 52, 0.25)',
    borderColor: colors.forestGreen,
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
    borderColor: colors.cardBorder,
  },
  langToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  langToggleLabelArabic: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  langToggleLabelActive: {
    color: colors.activeHighlight,
    fontWeight: '800',
  },
});

