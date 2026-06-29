import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  Modal, ScrollView, Animated, Dimensions, Easing 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82; // Slightly wider for notifications detail text

export default function NotificationsModal({
  visible,
  onClose,
  notifications,
  setNotifications,
  selectedLanguage
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

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
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkSingleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper to choose notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return 'car-outline';
      case 'message':
        return 'chatbubble-ellipses-outline';
      case 'offer':
        return 'pricetag-outline';
      default:
        return 'notifications-outline';
    }
  };

  const isRTL = selectedLanguage === 'Arabic';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, isRTL && { flexDirection: 'row-reverse' }]}>
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
          {/* Drawer Header */}
          <View style={[styles.drawerHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.headerTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.drawerTitle}>
                {isRTL ? 'الإشعارات' : 'Notifications'}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.titleBadge}>
                  <Text style={styles.titleBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Row */}
          {notifications.length > 0 && unreadCount > 0 && (
            <View style={[styles.actionsRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, isRTL && { flexDirection: 'row-reverse' }]} 
                onPress={handleMarkAllRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.bgBrand} style={isRTL ? { marginLeft: 5 } : { marginRight: 5 }} />
                <Text style={styles.actionBtnText}>
                  {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scrollable list of notifications */}
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={32} color={colors.bgBrand} />
                </View>
                <Text style={styles.emptyTitle}>
                  {isRTL ? 'كل شيء واضح!' : 'All caught up!'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isRTL ? 'لا توجد إشعارات جديدة حالياً.' : 'No new notifications at the moment.'}
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const itemIcon = getNotificationIcon(item.type);
                const titleText = isRTL ? item.titleAr : item.title;
                const bodyText = isRTL ? item.bodyAr : item.body;
                const dateText = isRTL ? item.dateAr : item.date;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      !item.read && styles.unreadCard,
                      isRTL && { flexDirection: 'row-reverse' }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleMarkSingleRead(item.id)}
                  >
                    {/* Unread dot marker */}
                    {!item.read && (
                      <View style={[styles.unreadDot, isRTL ? { left: 8 } : { right: 8 }]} />
                    )}

                    {/* Icon container */}
                    <View style={[
                      styles.iconCircle,
                      !item.read ? styles.unreadIconCircle : styles.readIconCircle
                    ]}>
                      <Ionicons 
                        name={itemIcon} 
                        size={18} 
                        color={!item.read ? colors.bgBrand : colors.textMuted} 
                      />
                    </View>

                    {/* Text content details */}
                    <View style={[styles.cardDetails, isRTL ? { marginRight: 12, alignItems: 'flex-end' } : { marginLeft: 12, alignItems: 'flex-start' }]}>
                      <Text style={[styles.cardTitle, !item.read && styles.unreadTitleText]}>
                        {titleText}
                      </Text>
                      <Text style={[styles.cardBody, isRTL && { textAlign: 'right' }]} numberOfLines={3}>
                        {bodyText}
                      </Text>
                      
                      {/* Footer Row: Date & Delete button */}
                      <View style={[styles.cardFooter, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Text style={styles.cardDate}>{dateText}</Text>
                        <TouchableOpacity 
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteNotification(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={13} color={colors.accentRed} />
                          <Text style={styles.deleteBtnText}>
                            {isRTL ? 'حذف' : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
    marginTop: 2,
  },
  titleBadge: {
    backgroundColor: colors.accentRed,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 110, 79, 0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    position: 'relative',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1.5,
  },
  unreadCard: {
    borderColor: colors.bgBrand,
    backgroundColor: colors.bgBrandLight,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accentRed,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIconCircle: {
    backgroundColor: 'rgba(77, 110, 79, 0.15)',
  },
  readIconCircle: {
    backgroundColor: colors.bgBrandLight,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  unreadTitleText: {
    color: colors.textDark,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 12,
    color: colors.textDark,
    lineHeight: 17,
    opacity: 0.85,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 110, 79, 0.05)',
    paddingTop: 6,
  },
  cardDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.accentRed,
    marginLeft: 3,
    marginRight: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  }
});
