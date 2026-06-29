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
  currentUser, 
  onSetCurrentUser, 
  signInVisible, 
  onSetSignInVisible,
  selectedLanguage: propSelectedLanguage,
  onSelectLanguage
}) {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      type: 'maintenance',
      title: 'Service Due Alert',
      titleAr: 'تنبيه موعد الصيانة',
      body: 'Your Porsche 911 Carrera is due for Engine Oil replacement in 350 km.',
      bodyAr: 'سيارتك بورش 911 كاريرا مستحقة لتغيير زيت المحرك خلال 350 كم.',
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
            style={styles.messagesButton} 
            activeOpacity={0.8}
            onPress={() => setChatsVisible(true)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textCream} />
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
