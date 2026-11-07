import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatsModal from '../components/ChatsModal';

const TABS = [
  { id: 'feed', label: 'Feed', labelAr: 'الرئيسية' },
  { id: 'profile', label: 'Profile', labelAr: 'الملف' },
  { id: 'souq', label: 'Souq', labelAr: 'سوق' },
];

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const isRtl = selectedLanguage === 'Arabic';

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }]}>
      {/* Top Header Row with Logo & Wordmark on Left and Search & Message on Right */}
      <View style={[styles.headerRow, isRtl && styles.headerRowRtl]}>
        <View style={[styles.logoContainer, isRtl && styles.logoContainerRtl]}>
          <Image
            source={require('../../assets/logo_green.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {isRtl ? (
            <Text style={styles.brandNameArabic}>
              وِرَش
            </Text>
          ) : (
            <Image
              source={require('../../assets/Werash_wordmark.png')}
              style={styles.wordmarkImage}
              resizeMode="contain"
            />
          )}
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => {
            // Search handler
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search-outline" size={28} color="#003514" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { marginLeft: 14 }]}
          activeOpacity={0.7}
          onPress={() => setChatsVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#003514" />
        </TouchableOpacity>
      </View>

      {/* Tabs Navigation: Feed | Profile | Souq */}
      <View style={[styles.tabsBar, isRtl && styles.tabsBarRtl]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                isRtl && styles.tabTextRtl,
              ]}>
                {isRtl ? tab.labelAr : tab.label}
              </Text>
              <View style={[
                styles.tabIndicator,
                isActive && styles.tabIndicatorActive,
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Post Creator Bar (Premium Card Style) */}
      <View style={styles.contentArea}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.postBarShadow}
          onPress={() => {
            // Open post creation modal/screen
          }}
        >
          <View style={[styles.postBarSurface, isRtl && styles.postBarSurfaceRtl]}>
            {/* User Avatar */}
            {currentUser && (currentUser.avatarUrl || currentUser.avatar) ? (
              <Image
                source={
                  typeof (currentUser.avatarUrl || currentUser.avatar) === 'string'
                    ? { uri: currentUser.avatarUrl || currentUser.avatar }
                    : (currentUser.avatarUrl || currentUser.avatar)
                }
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={18} color="#FFFFFF" />
              </View>
            )}

            {/* Vertical Divider */}
            <View style={styles.postDivider} />

            {/* Input Placeholder Text */}
            <Text style={[styles.postInputPlaceholder, isRtl && styles.postInputPlaceholderRtl]}>
              {isRtl ? 'شارك تحديثاً لسيارتك...' : 'Share a car update...'}
            </Text>

            {/* Plus Circular Button */}
            <View style={styles.postPlusButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Chats Drawer Modal */}
      <ChatsModal
        visible={chatsVisible}
        onClose={() => setChatsVisible(false)}
        selectedLanguage={selectedLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
  },
  headerRowRtl: {
    flexDirection: 'row-reverse',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  logoContainerRtl: {
    flexDirection: 'row-reverse',
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  wordmarkImage: {
    height: 28,
    width: 83,
    tintColor: '#003514',
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 38,
    letterSpacing: 0,
    color: '#003514',
    marginRight: 8,
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  tabsBarRtl: {
    flexDirection: 'row-reverse',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E9990',
    paddingBottom: 10,
  },
  tabTextActive: {
    color: '#003514',
    fontWeight: '800',
  },
  tabTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  tabIndicator: {
    width: '100%',
    height: 2.5,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  tabIndicatorActive: {
    backgroundColor: '#003514',
  },
  contentArea: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  postBarShadow: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#F2F4F5',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
      },
      android: {
        elevation: 2.8,
      },
    }),
  },
  postBarSurface: {
    width: '100%',
    backgroundColor: '#F2F4F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  postBarSurfaceRtl: {
    flexDirection: 'row-reverse',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#37633B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  postDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 12,
  },
  postInputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#8A959E',
    fontWeight: '500',
  },
  postInputPlaceholderRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
  },
  postPlusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#003514',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
