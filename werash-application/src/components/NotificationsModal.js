import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  Modal, ScrollView, Animated, Dimensions, Easing,
  PanResponder, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { STORAGE_KEY_MECHANIC_SHARED } from '../screens/CertifiedMechanicPage';

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger drag if swiping rightwards (close direction)
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100 || gestureState.vx > 0.5) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

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

  const handlePayNotification = async (item) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingRequests = Array.isArray(parsed.requests) ? parsed.requests : [];

      const updatedRequests = existingRequests.map((r) =>
        r.id === item.requestId || r.id === 'req-customer-admin'
          ? { ...r, isPaid: true }
          : r
      );

      const prevNotifs = Array.isArray(parsed.customerNotifications)
        ? parsed.customerNotifications
        : [];
      const updatedNotifs = prevNotifs.map((n) =>
        n.id === item.id || (item.requestId && n.requestId === item.requestId)
          ? { ...n, read: true, status: 'paid' }
          : n
      );

      await AsyncStorage.setItem(
        STORAGE_KEY_MECHANIC_SHARED,
        JSON.stringify({
          ...parsed,
          requests: updatedRequests,
          customerNotifications: updatedNotifs,
        })
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read: true, status: 'paid' } : n
        )
      );

      const isAr = selectedLanguage === 'Arabic';
      const payAmt = item.totalWithFee || item.amount || 0;
      Alert.alert(
        isAr ? 'تم الدفع بنجاح' : 'Payment Successful',
        isAr
          ? `تم دفع مبلغ ${payAmt.toLocaleString()} ج.م بنجاح.`
          : `Your payment of ${payAmt.toLocaleString()} EGP has been completed successfully.`
      );
    } catch (e) {
      console.warn('Failed to pay from notification:', e);
    }
  };

  const handleDeclineNotification = (item) => {
    const isAr = selectedLanguage === 'Arabic';
    Alert.alert(
      isAr ? 'تأكيد الرفض' : 'Decline Request',
      isAr
        ? 'هل أنت متأكد من رغبتك في رفض طلب الدفع وإلغاء المعاملة؟'
        : 'Are you sure you want to decline this payment request?',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'رفض' : 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
              const parsed = raw ? JSON.parse(raw) : {};
              const existingRequests = Array.isArray(parsed.requests) ? parsed.requests : [];
              const targetReq = existingRequests.find(
                (r) => r.id === item.requestId || r.id === 'req-customer-admin'
              );
              const updatedRequests = existingRequests.filter(
                (r) => r.id !== item.requestId && r.id !== 'req-customer-admin'
              );

              const baseAmount = item.amount || 0;
              let updatedEarnings = Array.isArray(parsed.earningsHistory)
                ? [...parsed.earningsHistory]
                : undefined;
              let updatedCustomers = Array.isArray(parsed.customersHistory)
                ? [...parsed.customersHistory]
                : undefined;
              let nextTotalEarnings = parsed.totalEarnings;
              let nextCustomersCount = parsed.customersCount;

              if (updatedEarnings && updatedEarnings.length > 0 && baseAmount > 0) {
                const earnIdx = updatedEarnings.findIndex(
                  (e) =>
                    (targetReq && e.requestId === targetReq.id) ||
                    (e.date === 'Today' && Number(e.amount) === baseAmount)
                );
                if (earnIdx !== -1) {
                  updatedEarnings.splice(earnIdx, 1);
                  if (typeof nextTotalEarnings === 'number') {
                    nextTotalEarnings = Math.max(0, nextTotalEarnings - baseAmount);
                  }
                }
              }

              if (updatedCustomers && updatedCustomers.length > 0) {
                const custIdx = updatedCustomers.findIndex(
                  (c) =>
                    (targetReq && c.requestId === targetReq.id) ||
                    c.lastVisit === 'Today'
                );
                if (custIdx !== -1) {
                  updatedCustomers.splice(custIdx, 1);
                  if (typeof nextCustomersCount === 'number') {
                    nextCustomersCount = Math.max(0, nextCustomersCount - 1);
                  }
                }
              }

              const prevNotifs = Array.isArray(parsed.customerNotifications)
                ? parsed.customerNotifications
                : [];
              const updatedNotifs = prevNotifs.map((n) =>
                n.id === item.id || (item.requestId && n.requestId === item.requestId)
                  ? { ...n, read: true, status: 'declined' }
                  : n
              );

              await AsyncStorage.setItem(
                STORAGE_KEY_MECHANIC_SHARED,
                JSON.stringify({
                  ...parsed,
                  requests: updatedRequests,
                  ...(updatedEarnings ? { earningsHistory: updatedEarnings } : {}),
                  ...(updatedCustomers ? { customersHistory: updatedCustomers } : {}),
                  ...(typeof nextTotalEarnings === 'number'
                    ? { totalEarnings: nextTotalEarnings }
                    : {}),
                  ...(typeof nextCustomersCount === 'number'
                    ? { customersCount: nextCustomersCount }
                    : {}),
                  customerNotifications: updatedNotifs,
                })
              );

              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === item.id ? { ...n, read: true, status: 'declined' } : n
                )
              );

              Alert.alert(
                isAr ? 'تم رفض الطلب' : 'Request Declined',
                isAr
                  ? 'تم رفض طلب الدفع وإلغاء المعاملة بنجاح.'
                  : 'You have declined the request and the transaction has been cancelled.'
              );
            } catch (e) {
              console.warn('Failed to decline from notification:', e);
            }
          },
        },
      ]
    );
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
        <Animated.View 
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
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

                      {/* Mechanic Request: Pay or Decline Actions */}
                      {item.isReceipt && (
                        item.status === 'paid' ? (
                          <View style={[styles.receiptBadgeRow, isRTL && { flexDirection: 'row-reverse' }]}>
                            <View style={[styles.statusBadge, styles.statusBadgePaid]}>
                              <Ionicons name="checkmark-circle" size={13} color="#2A7336" style={{ marginRight: 4 }} />
                              <Text style={styles.statusBadgePaidText}>{isRTL ? 'تم الدفع بنجاح' : 'Paid'}</Text>
                            </View>
                          </View>
                        ) : item.status === 'declined' ? (
                          <View style={[styles.receiptBadgeRow, isRTL && { flexDirection: 'row-reverse' }]}>
                            <View style={[styles.statusBadge, styles.statusBadgeDeclined]}>
                              <Ionicons name="close-circle" size={13} color="#C0392B" style={{ marginRight: 4 }} />
                              <Text style={styles.statusBadgeDeclinedText}>{isRTL ? 'تم الرفض' : 'Declined'}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={[styles.notifActionsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                              style={styles.notifPayBtn}
                              onPress={() => handlePayNotification(item)}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="card-outline" size={13} color="#F7F5F0" style={{ marginRight: 4 }} />
                              <Text style={styles.notifPayBtnText}>
                                {isRTL ? 'دفع الآن' : 'Pay'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.notifDeclineBtn}
                              onPress={() => handleDeclineNotification(item)}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="close-circle-outline" size={13} color="#C0392B" style={{ marginRight: 4 }} />
                              <Text style={styles.notifDeclineBtnText}>
                                {isRTL ? 'رفض' : 'Decline'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      )}
                      
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
  },
  notifActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  notifPayBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#37633B',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifPayBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F7F5F0',
  },
  notifDeclineBtn: {
    flex: 1,
    height: 32,
    backgroundColor: 'rgba(220, 53, 69, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDeclineBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C0392B',
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgePaid: {
    backgroundColor: 'rgba(42, 115, 54, 0.12)',
  },
  statusBadgePaidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A7336',
  },
  statusBadgeDeclined: {
    backgroundColor: 'rgba(192, 57, 43, 0.12)',
  },
  statusBadgeDeclinedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C0392B',
  },
});
