import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../styles/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY_READ_IDS = '@werash_notifications_read_ids';

export default function NotificationsScreen({
  currentUser,
  selectedLanguage,
  notifications = [],
  setNotifications,
  onBack,
  onNavigate,
}) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const isRTL = selectedLanguage === 'Arabic';

  // Filter state: 'all' | 'unread'
  const [activeFilter, setActiveFilter] = useState('all');

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Persist read notification IDs locally
  const persistReadState = useCallback(async (updatedNotifications) => {
    try {
      const readIds = updatedNotifications.filter((n) => n.read).map((n) => n.id);
      const storageKey = currentUser?.id 
        ? `${STORAGE_KEY_READ_IDS}_${currentUser.id}` 
        : `${STORAGE_KEY_READ_IDS}_guest`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(readIds));
    } catch (e) {
      console.warn('[Notifications] Persist read error:', e);
    }
  }, [currentUser?.id]);

  // Mark single notification as read with subtle transition
  const handleMarkAsRead = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      persistReadState(next);
      return next;
    });
  }, [setNotifications, persistReadState]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      persistReadState(next);
      return next;
    });
  }, [unreadCount, setNotifications, persistReadState]);

  // Handle card tap
  const handleCardPress = (item) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    // Action navigation if applicable
    if (onNavigate && item.targetTab) {
      onNavigate(item.targetTab);
    }
  };

  // Filter notifications
  const displayedNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, activeFilter]);

  // Group by section: 'Today' vs 'Earlier'
  const todayList = useMemo(() => {
    return displayedNotifications.filter((n) => (n.section || 'today') === 'today');
  }, [displayedNotifications]);

  const earlierList = useMemo(() => {
    return displayedNotifications.filter((n) => (n.section || 'earlier') === 'earlier');
  }, [displayedNotifications]);

  // Render icon based on type
  const renderNotificationIcon = (type, isRead) => {
    const iconColor = isRead ? '#6B7280' : '#003514';
    const iconSize = 22;

    switch (type) {
      case 'message':
        return <Ionicons name="chatbubble-outline" size={iconSize} color={iconColor} />;
      case 'reply':
        return <Ionicons name="chatbubbles-outline" size={iconSize} color={iconColor} />;
      case 'service':
      case 'maintenance':
        return <MaterialCommunityIcons name="oil-level" size={iconSize} color={iconColor} />;
      case 'welcome':
        return <MaterialCommunityIcons name="car-outline" size={iconSize} color={iconColor} />;
      case 'profile':
        return <MaterialCommunityIcons name="account-check-outline" size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />;
    }
  };

  // Render individual notification card
  const renderNotificationCard = (item) => {
    const isRead = Boolean(item.read);
    const title = isRTL ? (item.titleAr || item.title) : (item.title || item.titleAr);
    const body = isRTL ? (item.bodyAr || item.body) : (item.body || item.bodyAr);
    const date = isRTL ? (item.dateAr || item.date) : (item.date || item.dateAr);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        onPress={() => handleCardPress(item)}
        style={[
          styles.card,
          isRead ? styles.cardRead : styles.cardUnread,
          isRTL && styles.cardRtl,
        ]}
      >
        {/* Narrow forest-green accent line on the edge following rounded corners (Unread only) */}
        {!isRead && (
          <View style={[styles.unreadAccentLine, isRTL ? styles.unreadAccentLineRtl : styles.unreadAccentLineLtr]} />
        )}

        {/* Small solid green unread dot in the upper corner (Unread only) */}
        {!isRead && (
          <View style={[styles.unreadDot, isRTL ? styles.unreadDotRtl : styles.unreadDotLtr]} />
        )}

        {/* Left Icon Tile */}
        <View style={[
          styles.iconTile,
          isRead ? styles.iconTileRead : styles.iconTileUnread,
        ]}>
          {renderNotificationIcon(item.type, isRead)}
        </View>

        {/* Content details */}
        <View style={[styles.cardContent, isRTL && styles.cardContentRtl]}>
          <Text
            style={[
              styles.cardTitle,
              isRead ? styles.cardTitleRead : styles.cardTitleUnread,
              isRTL && styles.textRtl,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.cardBody,
              isRead ? styles.cardBodyRead : styles.cardBodyUnread,
              isRTL && styles.textRtl,
            ]}
            numberOfLines={2}
          >
            {body}
          </Text>

          <Text
            style={[
              styles.cardDate,
              isRead ? styles.cardDateRead : styles.cardDateUnread,
              isRTL && styles.textRtl,
            ]}
          >
            {date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top || (Platform.OS === 'ios' ? 44 : 20) }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerRow, isRTL && styles.headerRowRtl]}>
        <TouchableOpacity
          style={[styles.headerTitleBtn, isRTL && styles.headerTitleBtnRtl]}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={25}
            color="#003514"
          />
          <Text style={[styles.headerTitleText, isRTL && styles.headerTitleTextRtl]}>
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </Text>
        </TouchableOpacity>

        {/* Mark all as read button */}
        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.markAllReadText, unreadCount === 0 && styles.markAllReadDisabled]}>
            {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills: All / Unread */}
      <View style={[styles.filterRow, isRTL && styles.filterRowRtl]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveFilter('all');
          }}
          style={[
            styles.filterPill,
            activeFilter === 'all' ? styles.filterPillActive : styles.filterPillInactive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
            ]}
          >
            {isRTL ? 'الكل' : 'All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveFilter('unread');
          }}
          style={[
            styles.filterPill,
            activeFilter === 'unread' ? styles.filterPillActive : styles.filterPillInactive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'unread' ? styles.filterPillTextActive : styles.filterPillTextInactive,
            ]}
          >
            {isRTL ? 'غير مقروءة' : 'Unread'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {displayedNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={32} color="#003514" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'unread'
                ? (isRTL ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
                : (isRTL ? 'لا توجد إشعارات' : 'No notifications')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isRTL ? 'لقد اطلعت على جميع الإشعارات!' : "You're all caught up!"}
            </Text>
          </View>
        ) : (
          <>
            {/* Today Section */}
            {todayList.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, isRTL && styles.textRtl]}>
                  {isRTL ? 'اليوم' : 'Today'}
                </Text>
                {todayList.map(renderNotificationCard)}
              </View>
            )}

            {/* Earlier Section */}
            {earlierList.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, isRTL && styles.textRtl]}>
                  {isRTL ? 'في وقت سابق' : 'Earlier'}
                </Text>
                {earlierList.map(renderNotificationCard)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerRowRtl: {
    flexDirection: 'row-reverse',
  },
  headerTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleBtnRtl: {
    flexDirection: 'row-reverse',
  },
  headerTitleText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#003514',
    marginLeft: 6,
    letterSpacing: -0.3,
  },
  headerTitleTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginLeft: 0,
    marginRight: 6,
  },
  markAllReadText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    fontWeight: '500',
    color: '#6B7280',
  },
  markAllReadDisabled: {
    opacity: 0.45,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  filterRowRtl: {
    flexDirection: 'row-reverse',
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#003514',
  },
  filterPillInactive: {
    backgroundColor: '#ECEEF0',
  },
  filterPillText: {
    fontSize: 13.5,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#4B5563',
    fontFamily: 'PlusJakartaSans-Medium',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#4B5563',
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  textRtl: {
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },

  /* ── Notification Card Base Dimensions ── */
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 90,
  },
  cardRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 14,
    paddingRight: 18,
  },

  /* ── Unread Card State ── */
  cardUnread: {
    backgroundColor: '#E4EFE4', // Pale sage-green
    borderWidth: 0,
  },
  unreadAccentLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4.5,
    backgroundColor: '#003514', // Narrow forest-green accent
  },
  unreadAccentLineLtr: {
    left: 0,
  },
  unreadAccentLineRtl: {
    right: 0,
  },
  unreadDot: {
    position: 'absolute',
    top: 15,
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    backgroundColor: '#003514', // Small solid green unread dot
  },
  unreadDotLtr: {
    right: 15,
  },
  unreadDotRtl: {
    left: 15,
  },

  /* ── Read Card State ── */
  cardRead: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Thin light-grey border
  },

  /* ── Icon Tile ── */
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconTileUnread: {
    backgroundColor: '#D1E6D1', // Pale-green tile
  },
  iconTileRead: {
    backgroundColor: '#F3F4F6', // Light-grey tile
  },

  /* ── Content Text ── */
  cardContent: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 16,
  },
  cardContentRtl: {
    marginLeft: 0,
    marginRight: 14,
    paddingRight: 0,
    paddingLeft: 16,
  },
  cardTitle: {
    fontSize: 15.5,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardTitleUnread: {
    color: '#003514', // Bold dark-green title
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  cardTitleRead: {
    color: '#4B5563', // Grey title with lighter font weight
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  cardBody: {
    fontSize: 13.5,
    lineHeight: 18.5,
    marginBottom: 6,
  },
  cardBodyUnread: {
    color: '#1A202C', // Stronger dark body text
    fontFamily: 'PlusJakartaSans-Medium',
    fontWeight: '500',
  },
  cardBodyRead: {
    color: '#6B7280', // Regular dark-grey body text
    fontFamily: 'PlusJakartaSans-Regular',
    fontWeight: '400',
  },
  cardDate: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  cardDateUnread: {
    color: '#6B7280',
  },
  cardDateRead: {
    color: '#9CA3AF',
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E4EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#003514',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});
