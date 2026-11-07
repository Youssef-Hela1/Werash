import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
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
      {/* Top Header Row with Community Title & Right-Aligned Icons */}
      <View style={[styles.headerRow, isRtl && styles.headerRowRtl]}>
        <Text style={[styles.screenTitle, isRtl && styles.screenTitleRtl]}>
          {isRtl ? 'المجتمع' : 'Community'}
        </Text>
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
  screenTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#003514',
    letterSpacing: -0.6,
  },
  screenTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
    letterSpacing: 0,
    fontSize: 30,
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
});
