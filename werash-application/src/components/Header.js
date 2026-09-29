import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SignInScreen from '../screens/SignInScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsModal from './NotificationsModal';
import ChatsModal from './ChatsModal';

const { width: screenWidth } = Dimensions.get('window');

export default function Header({ 
  currentTab,
  currentUser, 
  onSetCurrentUser, 
  signInVisible, 
  onSetSignInVisible,
  selectedLanguage: propSelectedLanguage,
  onSelectLanguage,
  settingsVisible: propSettingsVisible,
  onSetSettingsVisible,
  onEditProfile
}) {
  const [localSettingsVisible, setLocalSettingsVisible] = useState(false);
  const settingsVisible = propSettingsVisible !== undefined ? propSettingsVisible : localSettingsVisible;
  const setSettingsVisible = onSetSettingsVisible || setLocalSettingsVisible;
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      type: 'maintenance',
      title: 'Service Due Alert',
      titleAr: 'تنبيه موعد الصيانة',
      body: 'Your Hyundai Coupe is due for Engine Oil replacement in 350 km.',
      bodyAr: 'سيارتك هيونداي كوبيه مستحقة لتغيير زيت المحرك خلال 350 كم.',
      date: '2 hours ago',
      dateAr: 'منذ ساعتين',
      read: false
    },
    {
      id: 'n2',
      type: 'message',
      title: 'New Message',
      titleAr: 'رسالة جديدة',
      body: 'Samir Fahmy sent you a message: "Is the price negotiable for the BBS LM rims?"',
      bodyAr: 'سمير فهمي أرسل لك رسالة: "هل السعر قابل للتفاوض لجنوط BBS LM؟"',
      date: '1 day ago',
      dateAr: 'منذ يوم',
      read: false
    },
    {
      id: 'n3',
      type: 'offer',
      title: 'Exclusive Offer',
      titleAr: 'عرض حصري',
      body: 'Specialist Elena offered a 15% discount on computerized diagnostics today.',
      bodyAr: 'الأخصائية إيلينا قدمت خصماً بقيمة 15% على الفحص بالكمبيوتر اليوم.',
      date: '2 days ago',
      dateAr: 'منذ يومين',
      read: false
    }
  ]);

  const [chatsVisible, setChatsVisible] = useState(false);

  const [localLanguage, setLocalLanguage] = useState('English');
  const selectedLanguage = propSelectedLanguage || localLanguage;
  const setSelectedLanguage = onSelectLanguage || setLocalLanguage;
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRTL = selectedLanguage === 'Arabic';
  const unreadCount = notifications.filter(n => !n.read).length;

  const isHome = currentTab === 'home';

  const getFirstName = () => {
    if (!currentUser || !currentUser.fullName) return '';
    return currentUser.fullName.trim().split(/\s+/)[0];
  };

  if (currentTab === 'mechanics') {
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
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
          onEditProfile={onEditProfile}
        />
        <NotificationsModal 
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
          notifications={notifications}
          setNotifications={setNotifications}
          selectedLanguage={selectedLanguage}
        />
        <ChatsModal 
          visible={chatsVisible}
          onClose={() => setChatsVisible(false)}
          selectedLanguage={selectedLanguage}
        />
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={[styles.headerContainer, isHome && styles.headerContainerHome]}>
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
        onEditProfile={onEditProfile}
      />
      <NotificationsModal 
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        selectedLanguage={selectedLanguage}
      />
      <ChatsModal 
        visible={chatsVisible}
        onClose={() => setChatsVisible(false)}
        selectedLanguage={selectedLanguage}
      />
      
      {/* Top Solid Green Block (Hidden on Home) */}
      {!isHome && (
        <View 
          pointerEvents="none"
          style={[styles.topSolidBlock, { backgroundColor: '#37633B' }]} 
        />
      )}

      {/* Absolute Background Image (Hidden on Home) */}
      {!isHome && (
        <Image 
          pointerEvents="none"
          source={require('../../assets/skid_mark.png')} 
          style={styles.backgroundImage} 
          resizeMode="cover" 
        />
      )}

      {/* Top Corner Tire Track Blob with Integrated Continuous Overscroll Skidmarks (Home Only) */}
      {isHome && (
        <Image 
          pointerEvents="none"
          source={require('../../assets/top_right_tire_blob.png')} 
          style={[
            styles.cornerTireBlob,
            isRTL ? styles.cornerTireBlobRtl : styles.cornerTireBlobLtr
          ]} 
          resizeMode="cover" 
        />
      )}

      <View style={[styles.topRow, isHome && styles.topRowHome, isRTL && { flexDirection: 'row-reverse' }]}>
        {/* Logo, Text, and Greeting on Home */}
        <View style={[styles.brandWrapper, isRTL && styles.brandWrapperRtl]}>
          <View style={[styles.logoContainer, isRTL && styles.logoContainerRtl]}>
            <Image 
              source={isHome ? require('../../assets/logo_green.png') : require('../../assets/logo.png')} 
              style={[
                styles.logoImage, 
                isHome && styles.logoImageHome,
                isRTL && styles.logoImageRtl
              ]} 
              resizeMode="contain" 
            />
            <Text style={[
              selectedLanguage === 'Arabic' ? styles.brandNameArabic : styles.brandName,
              isHome && (selectedLanguage === 'Arabic' ? styles.brandNameArabicHome : styles.brandNameHome),
              isHome && { color: colors.bgBrand }
            ]}>
              {selectedLanguage === 'Arabic' ? 'وِرَش' : 'WERASH'}
            </Text>
          </View>

          {isHome && (
            <>
              <Text style={[
                styles.greetingText,
                selectedLanguage === 'Arabic' && styles.greetingTextArabic
              ]}>
                {selectedLanguage === 'Arabic' 
                  ? (getFirstName() ? `أهلاً ${getFirstName()}` : 'أهلاً بك')
                  : (getFirstName() ? `Hello ${getFirstName()}` : 'Hello Guest')}
              </Text>
              <Text style={[
                styles.taglineText,
                selectedLanguage === 'Arabic' && styles.taglineTextArabic
              ]}>
                {selectedLanguage === 'Arabic' 
                  ? 'عناية سيارتك تبدأ من هنا...' 
                  : "Your car's care starts here..."}
              </Text>
            </>
          )}
        </View>

        {/* Notifications Button on Home (Top Right inside Green Area) */}
        {isHome && (
          <TouchableOpacity 
            style={[styles.notificationButtonHome, isRTL && styles.notificationButtonHomeRtl]} 
            activeOpacity={0.8}
            onPress={() => setNotificationsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textCream} />
            {unreadCount > 0 && (
              <View style={[styles.badgeContainer, isRTL ? { left: -4 } : { right: -4 }, { top: -4 }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {!isHome && (
          <View style={styles.buttonContainer}>
            {/* Sign In / Sign Out Button */}
            <TouchableOpacity 
              style={styles.signInButton} 
              activeOpacity={0.8} 
              onPress={() => {
                if (currentUser) {
                  setNotificationsVisible(true);
                } else {
                  onSetSignInVisible(true);
                }
              }}
            >
              <Ionicons name="person-outline" size={16} color={colors.textCream} style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
              <Text style={styles.signInText}>{currentUser ? getFirstName().toUpperCase() : (selectedLanguage === 'Arabic' ? "تسجيل الدخول" : "SIGN IN")}</Text>
              {/* Notification Badge Count */}
              {currentUser && unreadCount > 0 && (
                <View style={[styles.badgeContainer, isRTL ? { left: -6 } : { right: -6 }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Messages Button */}
            <TouchableOpacity 
              style={[styles.messagesButton, { position: 'relative' }]} 
              activeOpacity={0.8}
              onPress={() => setChatsVisible(true)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textCream} />
              {currentUser && unreadCount > 0 && (
                <View style={[styles.badgeContainer, isRTL ? { left: -6 } : { right: -6 }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
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
        )}
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
  headerContainerHome: {
    paddingBottom: 4,
    overflow: 'visible',
  },
  topSolidBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: 60, // Covers status bar and blends with skid mark starting at top: 50
    zIndex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 50, // Shifted narrower skid mark graphic higher
    left: 0,
    width: screenWidth, // Force exact full device width
    height: 140, // Flatter/narrower height
    zIndex: 1, // Places the background image behind the header text/buttons but in front of screen content
  },
  cornerTireBlob: {
    position: 'absolute',
    top: -400,
    width: 225,
    height: 595,
    zIndex: 1,
  },
  cornerTireBlobLtr: {
    right: 0,
  },
  cornerTireBlobRtl: {
    left: 0,
    transform: [{ scaleX: -1 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    zIndex: 2,
  },
  topRowHome: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  notificationButtonHome: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(253, 251, 247, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(253, 251, 247, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginRight: 4,
    zIndex: 10,
    position: 'relative',
  },
  notificationButtonHomeRtl: {
    marginRight: 0,
    marginLeft: 4,
  },
  brandWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  brandWrapperRtl: {
    alignItems: 'flex-end',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainerRtl: {
    flexDirection: 'row-reverse',
  },
  logoImage: {
    width: 38,
    height: 38,
    marginRight: 8,
  },
  logoImageHome: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  logoImageRtl: {
    marginRight: 0,
    marginLeft: 12,
  },
  greetingText: {
    fontFamily: 'OriginalBurger',
    fontSize: 32,
    fontWeight: '600',
    color: colors.bgBrand,
    marginTop: 18,
    letterSpacing: 0.5,
  },
  greetingTextArabic: {
    fontFamily: 'ZafranArabic-Regular',
    fontSize: 29,
    fontWeight: '600',
    color: colors.bgBrand,
    marginTop: 14,
    textAlign: 'right',
  },
  taglineText: {
    fontSize: 13,
    color: 'rgba(77, 110, 79, 0.75)',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  taglineTextArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 13,
    color: 'rgba(77, 110, 79, 0.75)',
    marginTop: 2,
    textAlign: 'right',
  },
  brandName: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 42,
    color: colors.textCream,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  brandNameHome: {
    fontSize: 64,
    marginTop: 2,
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 74,
    color: colors.textCream,
    letterSpacing: 0,
    marginTop: -4,
  },
  brandNameArabicHome: {
    fontSize: 104,
    marginTop: -6,
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
    position: 'relative',
  },
  signInText: {
    color: colors.textCream,
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    backgroundColor: colors.accentRed,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
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
  },
  messagesButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 251, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 251, 247, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  }
});
