import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useThemeStyles } from '../styles/ThemeContext';
import {
  openSpecialistLocation,
  callSpecialist,
  messageSpecialist,
} from '../data/specialistHelpers';

export const STORAGE_KEY_MECHANIC_SHARED = '@werash_mechanic_shared_state';

const CERTIFIED_REVIEWS = [
  {
    id: 'rev-1',
    customerName: 'Youssef Helal',
    customerNameAr: 'يوسف هلال',
    carModel: 'Hyundai Coupe • 2005',
    carModelAr: 'هيونداي كوبيه • ٢٠٠٥',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
    rating: 5,
    date: '2 days ago',
    dateAr: 'منذ يومين',
    comment: 'Best Hyundai specialist in Cairo! Diagnosed the engine issue in 10 minutes and fixed it with original parts.',
    commentAr: 'أفضل متخصص هيونداي في القاهرة! شخص مشكلة المحرك في ١٠ دقائق وأصلحها بقطع غيار أصلية.',
  },
  {
    id: 'rev-2',
    customerName: 'Mostafa Kamel',
    customerNameAr: 'مصطفى كامل',
    carModel: 'Hyundai Tucson • 2021',
    carModelAr: 'هيونداي توسان • ٢٠٢١',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop',
    rating: 5,
    date: '1 week ago',
    dateAr: 'منذ أسبوع',
    comment: 'Very honest workshop and fair prices. The car feels brand new after the full service.',
    commentAr: 'ورشة أمينة جداً وأسعارهم ممتازة. السيارة رجعت كأنها جديدة بعد الصيانة الكاملة.',
  },
  {
    id: 'rev-3',
    customerName: 'Sherif Hany',
    customerNameAr: 'شريف هاني',
    carModel: 'Kia Sportage • 2019',
    carModelAr: 'كيا سبورتاج • ٢٠١٩',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
    rating: 4,
    date: '2 weeks ago',
    dateAr: 'منذ أسبوعين',
    comment: 'Great workmanship on the suspension and brakes. Was a bit busy on Saturday but totally worth the wait.',
    commentAr: 'شغل ممتاز في العفشة والفرامل. كانت الورشة مزدحمة قليلاً يوم السبت لكن تستحق الانتظار.',
  },
  {
    id: 'rev-4',
    customerName: 'Amr Diab',
    customerNameAr: 'عمرو دياب',
    carModel: 'Hyundai Elantra • 2022',
    carModelAr: 'هيونداي إلنترا • ٢٠٢٢',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    rating: 5,
    date: '1 month ago',
    dateAr: 'منذ شهر',
    comment: 'Super clean workshop and punctual delivery. Highly recommend Eng. Hamdy!',
    commentAr: 'ورشة نظيفة جداً والتزام تام بموعد التسليم. أنصح بالتعامل مع م. حمدي بشدة!',
  },
];

export default function CertifiedMechanicPage({ specialist, onClose, selectedLanguage, currentUser, activeVehicle }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isAr = selectedLanguage === 'Arabic';
  const [customerRequest, setCustomerRequest] = useState(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const customerEmail = currentUser?.email || 'customer@werash.com';

  useEffect(() => {
    const loadSharedRequest = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
        if (raw) {
          const parsed = JSON.parse(raw);
          const found = (parsed.requests || []).find(
            (r) => r.customerEmail === customerEmail || r.id === 'req-customer-admin'
          );
          if (found) {
            setCustomerRequest(found);
          }
        }
      } catch (e) {
        console.warn('Error loading mechanic shared state:', e);
      }
    };
    loadSharedRequest();
  }, [customerEmail]);

  if (!specialist) return null;

  const hasReceipt = Boolean(customerRequest && customerRequest.requestedAmount > 0);
  const baseAmount = hasReceipt ? Number(customerRequest.requestedAmount) : 0;
  const serviceFee = Number((baseAmount * 0.025).toFixed(2));
  const totalAmount = Number((baseAmount + serviceFee).toFixed(2));

  const handleSendRequest = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingRequests = Array.isArray(parsed.requests) ? parsed.requests : [];

      const carLabelEn = activeVehicle
        ? `${activeVehicle.brand} ${activeVehicle.model} • ${activeVehicle.year}`
        : 'Hyundai Coupe • 2005';
      const carLabelAr =
        activeVehicle &&
        `${activeVehicle.brand}`.toLowerCase() === 'hyundai' &&
        `${activeVehicle.model}`.toLowerCase() === 'coupe'
          ? 'هيونداي كوبيه • ٢٠٠٥'
          : carLabelEn;

      const newReq = {
        id: 'req-customer-admin',
        customerEmail,
        customerName: currentUser?.fullName || 'Youssef Helal',
        customerNameAr: currentUser?.fullNameAr || 'يوسف هلال',
        carModel: carLabelEn,
        carModelAr: carLabelAr,
        avatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
        requestedAmount: null,
        isPaid: false,
      };

      const filtered = existingRequests.filter(
        (r) => r.id !== 'req-customer-admin' && r.customerEmail !== customerEmail
      );
      const updatedRequests = [newReq, ...filtered];

      await AsyncStorage.setItem(
        STORAGE_KEY_MECHANIC_SHARED,
        JSON.stringify({
          ...parsed,
          requests: updatedRequests,
        })
      );

      setCustomerRequest(newReq);
      Alert.alert(
        isAr ? 'تم إرسال الطلب' : 'Request Sent',
        isAr
          ? 'تم إرسال طلبك بنجاح إلى م. حمدي السيد.'
          : 'Your request has been sent to Eng. Hamdy El-Sayed.'
      );
    } catch (e) {
      console.warn('Failed to send request:', e);
    }
  };

  const handlePayNow = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingRequests = Array.isArray(parsed.requests) ? parsed.requests : [];
      const updatedRequests = existingRequests.map((r) =>
        r.id === 'req-customer-admin' || r.customerEmail === customerEmail
          ? { ...r, isPaid: true }
          : r
      );
      const prevNotifs = Array.isArray(parsed.customerNotifications)
        ? parsed.customerNotifications
        : [];
      const updatedNotifs = prevNotifs.map((n) =>
        n.isReceipt || String(n.id || '').startsWith('notif-receipt-')
          ? { ...n, read: true, status: 'paid' }
          : n
      );

      const carLabelEn = activeVehicle
        ? `${activeVehicle.brand} ${activeVehicle.model} • ${activeVehicle.year}`
        : 'Hyundai Coupe • 2005';
      const carLabelAr =
        activeVehicle &&
        `${activeVehicle.brand}`.toLowerCase() === 'hyundai' &&
        `${activeVehicle.model}`.toLowerCase() === 'coupe'
          ? 'هيونداي كوبيه • ٢٠٠٥'
          : carLabelEn;

      const newPaidReceipt = {
        id: customerRequest?.id || 'req-customer-admin',
        receiptNumber: '#WR-2027-084',
        workshopName: isAr
          ? specialist.nameAr || 'ورشة حمدي هيونداي المعتمدة'
          : specialist.name || 'Hamdy Hyundai Workshop',
        mechanicName: isAr
          ? specialist.mechanicNameAr || 'م. حمدي السيد'
          : specialist.mechanicName || 'Eng. Hamdy El-Sayed',
        customerName: isAr
          ? customerRequest?.customerNameAr || currentUser?.fullNameAr || 'يوسف هلال'
          : customerRequest?.customerName || currentUser?.fullName || 'Youssef Helal',
        carModel: isAr ? carLabelAr : carLabelEn,
        serviceNameEn: customerRequest?.titleEn || customerRequest?.serviceName || 'Scheduled Maintenance & Diagnostic Inspection',
        serviceNameAr: customerRequest?.titleAr || customerRequest?.serviceNameAr || 'صيانة دورية وفحص شامل للمحرك',
        dateEn: 'Oct 24, 2027',
        dateAr: '٢٤ أكتوبر ٢٠٢٧',
        baseAmount: baseAmount,
        serviceFee: serviceFee,
        totalAmount: totalAmount,
        year: 2027,
        month: 10,
        isPaid: true,
        isDeclined: false,
        isLive: true,
      };

      const prevSaved = Array.isArray(parsed.savedReceipts) ? parsed.savedReceipts : [];
      const updatedSavedReceipts = [
        newPaidReceipt,
        ...prevSaved.filter((r) => r.id !== newPaidReceipt.id),
      ];

      await AsyncStorage.setItem(
        STORAGE_KEY_MECHANIC_SHARED,
        JSON.stringify({
          ...parsed,
          requests: updatedRequests,
          customerNotifications: updatedNotifs,
          savedReceipts: updatedSavedReceipts,
        })
      );

      setCustomerRequest((prev) => (prev ? { ...prev, isPaid: true } : prev));
      setReceiptVisible(false);
      Alert.alert(
        isAr ? 'تم الدفع بنجاح' : 'Payment Successful',
        isAr
          ? `تم دفع مبلغ ${totalAmount.toLocaleString()} ج.م بنجاح.`
          : `Your payment of ${totalAmount.toLocaleString()} EGP has been completed successfully.`
      );
    } catch (e) {
      console.warn('Failed to complete payment:', e);
    }
  };

  const handleDeclineReceipt = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingRequests = Array.isArray(parsed.requests) ? parsed.requests : [];
      const targetReq = existingRequests.find(
        (r) => r.id === 'req-customer-admin' || r.customerEmail === customerEmail
      );
      const updatedRequests = existingRequests.filter(
        (r) => r.id !== 'req-customer-admin' && r.customerEmail !== customerEmail
      );

      let updatedEarnings = Array.isArray(parsed.earningsHistory) ? [...parsed.earningsHistory] : undefined;
      let updatedCustomers = Array.isArray(parsed.customersHistory) ? [...parsed.customersHistory] : undefined;
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
          (c) => (targetReq && c.requestId === targetReq.id) || c.lastVisit === 'Today'
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
        n.isReceipt || String(n.id || '').startsWith('notif-receipt-')
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
          ...(typeof nextTotalEarnings === 'number' ? { totalEarnings: nextTotalEarnings } : {}),
          ...(typeof nextCustomersCount === 'number' ? { customersCount: nextCustomersCount } : {}),
          customerNotifications: updatedNotifs,
        })
      );

      setCustomerRequest(null);
      setReceiptVisible(false);
      Alert.alert(
        isAr ? 'تم رفض الإيصال' : 'Receipt Declined',
        isAr
          ? 'تم رفض الإيصال بنجاح وإلغاء الطلب.'
          : 'You have declined the receipt and the request has been cancelled.'
      );
    } catch (e) {
      console.warn('Failed to decline receipt:', e);
    }
  };

  const confirmDeclineReceipt = () => {
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
          onPress: handleDeclineReceipt,
        },
      ]
    );
  };

  const mechanicName = isAr
    ? specialist.mechanicNameAr || 'م. حمدي السيد'
    : specialist.mechanicName || 'Eng. Hamdy El-Sayed';

  const workshopName = isAr
    ? specialist.nameAr || 'ورشة حمدي هيونداي المعتمدة'
    : specialist.name || 'Hamdy Hyundai Workshop';

  const specialtyText = isAr
    ? specialist.specialtyAr || 'متخصص هيونداي معتمد'
    : specialist.specialty || 'Certified Hyundai Specialist';

  const locationText = isAr
    ? specialist.locationAr || specialist.location
    : specialist.location;

  const scrollY = useRef(new Animated.Value(0)).current;

  // Anchors the top content (banner, avatar, name) at y = 0 when pulling down/bouncing at the top,
  // so the top content does NOT bounce down.
  // When scrolling down into the page (scrollY > 0), translateY is 0,
  // allowing the banner and name to scroll up naturally with the page.
  const topTranslateY = scrollY.interpolate({
    inputRange: [-350, 0],
    outputRange: [-350, 0],
    extrapolate: 'clamp',
  });

  // Floating back button that smoothly appears when user scrolls far down
  const floatingBackOpacity = scrollY.interpolate({
    inputRange: [150, 190],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Persistent floating back button that fades in when user scrolls down past the banner */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.persistentBackWrapper,
          {
            top: Math.max(insets.top, 14) + 6,
            left: isAr ? undefined : 16,
            right: isAr ? 16 : undefined,
            opacity: floatingBackOpacity,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name={isAr ? "arrow-forward" : "arrow-back"} size={22} color="#F7F5F0" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.bouncyScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* ── TOP CONTENT: Moves up on scroll down, clamped on pull-down bounce ── */}
        <Animated.View
          style={[
            styles.topContentContainer,
            { transform: [{ translateY: topTranslateY }] }
          ]}
        >
          {/* Workshop Banner */}
          <View style={[styles.bannerContainer, { height: 145 + Math.max(insets.top, 20) }]}>
            <Image
              source={require('../../assets/Banner wallpaper.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />

            {/* Back Button on Banner */}
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  top: Math.max(insets.top, 14) + 6,
                  left: isAr ? undefined : 16,
                  right: isAr ? 16 : undefined,
                }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name={isAr ? "arrow-forward" : "arrow-back"} size={22} color="#F7F5F0" />
            </TouchableOpacity>
          </View>

          {/* Overlapping Profile Picture & Mechanic Details */}
          <View style={styles.profileHeaderSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={require('../../assets/Mechanic profile picture.png')}
                style={styles.mechanicAvatar}
              />
            </View>

            <Text style={[styles.mechanicName, isAr && styles.arabicBoldText]}>
              {mechanicName}
            </Text>
            <Text style={[styles.workshopName, isAr && styles.arabicBoldText]}>
              {workshopName}
            </Text>
            <Text style={[styles.specialtyBadge, isAr && styles.arabicBoldText]}>
              {specialtyText}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={colors.textMuted} />
              <Text style={[styles.locationText, isAr && styles.arabicBoldText]}>
                {locationText}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── BOUNCY BODY CONTENT (Actions, Requests, Working Hours, Services, Reviews) ── */}
        {/* 3. Contact & Location Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.8}
            onPress={() => openSpecialistLocation(specialist)}
          >
            <Ionicons name="location-outline" size={22} color="#37633B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.8}
            onPress={() => callSpecialist(specialist, isAr)}
          >
            <Ionicons name="call-outline" size={22} color="#37633B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSolid}
            activeOpacity={0.85}
            onPress={() => messageSpecialist(specialist, isAr)}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#F7F5F0" />
          </TouchableOpacity>
        </View>

        {/* Send a Request / View Receipt Button */}
        <View style={styles.sendRequestSection}>
          {hasReceipt && !customerRequest?.isPaid ? (
            <TouchableOpacity
              style={styles.sendRequestButton}
              activeOpacity={0.85}
              onPress={() => setReceiptVisible(true)}
            >
              <Ionicons name="receipt-outline" size={19} color="#F7F5F0" />
              <Text style={[styles.sendRequestButtonText, isAr && styles.arabicBoldText]}>
                {isAr ? 'عرض الإيصال' : 'View Receipt'}
              </Text>
            </TouchableOpacity>
          ) : customerRequest && !customerRequest?.isPaid ? (
            <TouchableOpacity
              style={[styles.sendRequestButton, styles.sendRequestButtonSent]}
              activeOpacity={0.85}
              onPress={() => {
                Alert.alert(
                  isAr ? 'طلبك قيد المراجعة' : 'Request Pending',
                  isAr
                    ? 'تم إرسال طلبك إلى م. حمدي بنجاح وفي انتظار تحديد التكلفة.'
                    : 'Your request has been sent to Eng. Hamdy and is awaiting an estimate.'
                );
              }}
            >
              <Ionicons name="checkmark-circle" size={19} color="#F7F5F0" />
              <Text style={[styles.sendRequestButtonText, isAr && styles.arabicBoldText]}>
                {isAr ? 'تم إرسال الطلب' : 'Request Sent'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.sendRequestButton}
              activeOpacity={0.85}
              onPress={handleSendRequest}
            >
              <Ionicons name="paper-plane-outline" size={19} color="#F7F5F0" />
              <Text style={[styles.sendRequestButtonText, isAr && styles.arabicBoldText]}>
                {isAr ? 'إرسال طلب' : 'Send a Request'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Ratings & Reviews Section */}
        <View style={styles.bodySection}>
          {/* Overall Rating Card */}
          <View style={styles.ratingSummaryCard}>
            <View style={styles.ratingLeftRow}>
              <View style={styles.ratingIconCircle}>
                <Ionicons name="star" size={20} color="#E6A817" />
              </View>
              <View>
                <Text style={[styles.ratingTitle, isAr && styles.arabicBoldText]}>
                  {isAr ? 'تقييم الورشة' : 'Workshop Rating'}
                </Text>
                <View style={styles.starsInlineRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={13}
                      color="#E6A817"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={[styles.reviewsCountText, isAr && styles.arabicBoldText]}>
                    {isAr ? `(${specialist.reviews || '64'} تقييم)` : `(${specialist.reviews || '64'} reviews)`}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.ratingScoreBig}>{specialist.rating || '4.8'}</Text>
          </View>

          {/* Customer Reviews List */}
          <Text style={[styles.sectionHeaderTitle, isAr && styles.arabicBoldText]}>
            {isAr ? 'آراء وتقييمات العملاء' : 'Customer Reviews'}
          </Text>

          {CERTIFIED_REVIEWS.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <Image source={{ uri: rev.avatar }} style={styles.reviewerAvatar} />
                <View style={styles.reviewerInfoCol}>
                  <View style={styles.reviewerNameRow}>
                    <Text style={[styles.reviewerName, isAr && styles.arabicBoldText]}>
                      {isAr ? rev.customerNameAr : rev.customerName}
                    </Text>
                    <Text style={[styles.reviewDate, isAr && styles.arabicBoldText]}>
                      {isAr ? rev.dateAr : rev.date}
                    </Text>
                  </View>
                  <Text style={[styles.reviewerCar, isAr && styles.arabicBoldText]}>
                    {isAr ? rev.carModelAr : rev.carModel}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= rev.rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#E6A817"
                    style={{ marginRight: 3 }}
                  />
                ))}
              </View>

              <Text style={[styles.reviewComment, isAr && styles.arabicBoldText]}>
                {isAr ? rev.commentAr : rev.comment}
              </Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* ==================== WERASH RECEIPT MODAL ==================== */}
      <Modal
        visible={receiptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptVisible(false)}
      >
        <View style={styles.receiptBackdrop}>
          <View style={styles.receiptPaper}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.receiptCloseBtn}
              onPress={() => setReceiptVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#555" />
            </TouchableOpacity>

            {/* Top Header: Werash Logo & Arabic Brand Name (Always in Arabic even when app is in English) */}
            <View style={styles.receiptBrandHeader}>
              <Image
                source={require('../../assets/logo_green.png')}
                style={styles.receiptLogo}
                resizeMode="contain"
              />
              <Text style={styles.receiptArabicBrand}>وِرَش</Text>
            </View>

            <Text style={[styles.receiptTitleLabel, isAr && styles.arabicBoldText]}>
              {isAr ? 'إيصال خدمة رسمي' : 'OFFICIAL SERVICE RECEIPT'}
            </Text>
            <Text style={styles.receiptNumberText}>#WR-2026-084</Text>

            {/* Perforated Cutout Notches & Dashed Line */}
            <View style={styles.perforationWrapper}>
              <View style={styles.notchLeft} />
              <View style={styles.dashedDivider} />
              <View style={styles.notchRight} />
            </View>

            {/* Receipt Details Info */}
            <View style={styles.receiptInfoSection}>
              <View style={styles.receiptMetaRow}>
                <Text style={[styles.receiptMetaLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'الورشة' : 'Workshop'}
                </Text>
                <Text style={[styles.receiptMetaValue, isAr && styles.arabicBoldText]}>
                  {workshopName}
                </Text>
              </View>

              <View style={styles.receiptMetaRow}>
                <Text style={[styles.receiptMetaLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'الميكانيكي' : 'Mechanic'}
                </Text>
                <Text style={[styles.receiptMetaValue, isAr && styles.arabicBoldText]}>
                  {mechanicName}
                </Text>
              </View>

              <View style={styles.receiptMetaRow}>
                <Text style={[styles.receiptMetaLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'العميل' : 'Customer'}
                </Text>
                <Text style={[styles.receiptMetaValue, isAr && styles.arabicBoldText]}>
                  {isAr
                    ? customerRequest?.customerNameAr || 'يوسف هلال'
                    : customerRequest?.customerName || 'Youssef Helal'}
                </Text>
              </View>

              <View style={styles.receiptMetaRow}>
                <Text style={[styles.receiptMetaLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'السيارة' : 'Vehicle'}
                </Text>
                <Text style={[styles.receiptMetaValue, isAr && styles.arabicBoldText]}>
                  {isAr
                    ? customerRequest?.carModelAr || 'هيونداي كوبيه • ٢٠٠٥'
                    : customerRequest?.carModel || 'Hyundai Coupe • 2005'}
                </Text>
              </View>
            </View>

            <View style={styles.dashedDividerInner} />

            {/* Itemized Charges Breakdown */}
            <View style={styles.receiptChargesSection}>
              <View style={styles.receiptChargeRow}>
                <Text style={[styles.receiptChargeLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'المبلغ المطلوب من الميكانيكي' : 'Mechanic Requested Amount'}
                </Text>
                <Text style={[styles.receiptChargeAmount, isAr && styles.arabicBoldText]}>
                  {baseAmount.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                </Text>
              </View>

              <View style={styles.receiptChargeRow}>
                <Text style={[styles.receiptChargeLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'رسوم الخدمة (٢.٥٪)' : 'Service Fee (2.5%)'}
                </Text>
                <Text style={[styles.receiptChargeAmount, isAr && styles.arabicBoldText]}>
                  +{serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  {isAr ? 'ج.م' : 'EGP'}
                </Text>
              </View>
            </View>

            <View style={styles.dashedDividerInner} />

            {/* Total Row */}
            <View style={styles.receiptTotalRow}>
              <Text style={[styles.receiptTotalLabel, isAr && styles.arabicBoldText]}>
                {isAr ? 'الإجمالي المستحق' : 'TOTAL DUE'}
              </Text>
              <Text style={[styles.receiptTotalValue, isAr && styles.arabicBoldText]}>
                {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                {isAr ? 'ج.م' : 'EGP'}
              </Text>
            </View>

            {/* Bottom Pay or Decline Button */}
            {customerRequest?.isPaid ? (
              <View style={[styles.payNowButton, styles.payNowButtonPaid]}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#F7F5F0"
                />
                <Text style={[styles.payNowButtonText, isAr && styles.arabicBoldText]}>
                  {isAr ? 'تم الدفع بنجاح' : 'Payment Completed'}
                </Text>
              </View>
            ) : (
              <View style={[styles.receiptButtonsRow, isAr && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={styles.receiptPayBtn}
                  activeOpacity={0.85}
                  onPress={handlePayNow}
                >
                  <Ionicons name="card-outline" size={19} color="#F7F5F0" />
                  <Text style={[styles.payNowButtonText, isAr && styles.arabicBoldText]}>
                    {isAr ? 'ادفع الآن' : 'Pay Now'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.receiptDeclineBtn}
                  activeOpacity={0.85}
                  onPress={confirmDeclineReceipt}
                >
                  <Ionicons name="close-circle-outline" size={19} color="#C0392B" />
                  <Text style={[styles.receiptDeclineBtnText, isAr && styles.arabicBoldText]}>
                    {isAr ? 'رفض الطلب' : 'Decline'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bgCreamy,
      zIndex: 1100,
    },
    persistentBackWrapper: {
      position: 'absolute',
      zIndex: 110,
    },
    topContentContainer: {
      backgroundColor: colors.bgCreamy,
      zIndex: 2,
    },
    bouncyScroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 0,
      paddingBottom: 64,
    },
    bannerContainer: {
      width: '100%',
      height: 180,
      backgroundColor: '#243C27',
      position: 'relative',
      overflow: 'hidden',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(20, 35, 22, 0.22)',
    },
    backButton: {
      position: 'absolute',
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(25, 42, 27, 0.72)',
      borderWidth: 1,
      borderColor: 'rgba(247, 245, 240, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    certifiedBadge: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(55, 99, 59, 0.92)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(247, 245, 240, 0.4)',
      gap: 5,
      zIndex: 100,
    },
    certifiedBadgeText: {
      color: '#F7F5F0',
      fontSize: 10.5,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      letterSpacing: 0.4,
    },
    profileHeaderSection: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: -52,
      paddingBottom: 10,
    },
    avatarWrapper: {
      width: 108,
      height: 108,
      borderRadius: 54,
      backgroundColor: colors.bgCreamy,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
      marginBottom: 10,
    },
    mechanicAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
      backgroundColor: '#37633B',
    },
    mechanicName: {
      fontSize: 21,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: colors.textDark,
      textAlign: 'center',
      marginBottom: 2,
    },
    workshopName: {
      fontSize: 14.5,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#37633B',
      textAlign: 'center',
      marginBottom: 4,
    },
    specialtyBadge: {
      fontSize: 11.5,
      fontFamily: 'PlusJakartaSans-Bold',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: 12.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: colors.textMuted,
    },
    actionsSection: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 12,
    },
    actionBtnOutline: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: '#37633B',
      backgroundColor: colors.white,
      gap: 6,
    },
    actionBtnOutlineText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#37633B',
    },
    actionBtnSolid: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      borderRadius: 14,
      backgroundColor: '#37633B',
      gap: 6,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 4,
    },
    actionBtnSolidText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#F7F5F0',
    },
    sendRequestSection: {
      paddingHorizontal: 20,
      marginBottom: 22,
    },
    paidActionsRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    sendNewRequestBtn: {
      flex: 1.5,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 4,
    },
    sendNewRequestBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#F7F5F0',
      letterSpacing: 0.2,
    },
    viewPaidReceiptBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(55, 99, 59, 0.08)',
      borderWidth: 1.5,
      borderColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    viewPaidReceiptBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#37633B',
      letterSpacing: 0.2,
    },
    paidReceiptActionButton: {
      width: '100%',
      height: 48,
      borderRadius: 16,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    paidReceiptActionButtonText: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#F7F5F0',
      letterSpacing: 0.3,
    },
    sendRequestButton: {
      width: '100%',
      height: 48,
      borderRadius: 16,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    sendRequestButtonSent: {
      backgroundColor: '#2A4E2E',
    },
    sendRequestButtonText: {
      fontSize: 14.5,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#F7F5F0',
      letterSpacing: 0.3,
    },
    bodySection: {
      paddingHorizontal: 20,
    },
    ratingSummaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1.2,
      borderColor: colors.borderGreen,
      marginBottom: 20,
      shadowColor: '#1E2D1F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    ratingLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    ratingIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(230, 168, 23, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingTitle: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      color: colors.textDark,
      marginBottom: 3,
    },
    starsInlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewsCountText: {
      fontSize: 11.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: colors.textMuted,
      marginLeft: 5,
    },
    ratingScoreBig: {
      fontSize: 26,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: colors.textDark,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: colors.textDark,
      marginBottom: 12,
    },
    reviewCard: {
      backgroundColor: colors.white,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#1E2D1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    reviewTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    reviewerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginRight: 12,
      backgroundColor: colors.borderGreen,
    },
    reviewerInfoCol: {
      flex: 1,
    },
    reviewerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    reviewerName: {
      fontSize: 14.5,
      fontFamily: 'PlusJakartaSans-Bold',
      color: colors.textDark,
    },
    reviewDate: {
      fontSize: 11.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: colors.textMuted,
    },
    reviewerCar: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: '#37633B',
    },
    reviewStarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    reviewComment: {
      fontSize: 13.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: colors.textDark,
      lineHeight: 20,
    },
    arabicBoldText: {
      fontFamily: 'AlkhalilArabic-Bold',
    },
    receiptBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 24, 16, 0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    receiptPaper: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: '#FCFBF8',
      borderRadius: 22,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 22,
      borderWidth: 1,
      borderColor: 'rgba(55, 99, 59, 0.18)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 14,
      overflow: 'hidden',
      position: 'relative',
    },
    receiptCloseBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    receiptBrandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 4,
    },
    receiptLogo: {
      width: 44,
      height: 44,
    },
    receiptArabicBrand: {
      fontFamily: 'ZafranArabic-Bold',
      fontSize: 64,
      color: '#37633B',
      marginTop: -6,
    },
    receiptTitleLabel: {
      textAlign: 'center',
      fontSize: 11,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#37633B',
      letterSpacing: 1.4,
      marginBottom: 3,
    },
    receiptNumberText: {
      textAlign: 'center',
      fontSize: 11.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: '#7A867B',
      marginBottom: 14,
    },
    perforationWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: -22,
      marginBottom: 16,
    },
    notchLeft: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(15, 24, 16, 0.72)',
      marginLeft: -9,
    },
    notchRight: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(15, 24, 16, 0.72)',
      marginRight: -9,
    },
    dashedDivider: {
      flex: 1,
      height: 1,
      borderWidth: 1,
      borderColor: 'rgba(55, 99, 59, 0.25)',
      borderStyle: 'dashed',
      marginHorizontal: 6,
    },
    dashedDividerInner: {
      width: '100%',
      height: 1,
      borderWidth: 1,
      borderColor: 'rgba(55, 99, 59, 0.22)',
      borderStyle: 'dashed',
      marginVertical: 14,
    },
    receiptInfoSection: {
      gap: 9,
    },
    receiptMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    receiptMetaLabel: {
      fontSize: 12.5,
      fontFamily: 'PlusJakartaSans-Medium',
      color: '#6C786D',
    },
    receiptMetaValue: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#1E2D1F',
    },
    receiptChargesSection: {
      gap: 10,
    },
    receiptChargeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    receiptChargeLabel: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: '#3A473B',
    },
    receiptChargeAmount: {
      fontSize: 13.5,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#1E2D1F',
    },
    receiptTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      backgroundColor: 'rgba(55, 99, 59, 0.08)',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    receiptTotalLabel: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#37633B',
      letterSpacing: 0.5,
    },
    receiptTotalValue: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#37633B',
    },
    payNowButton: {
      width: '100%',
      height: 48,
      borderRadius: 14,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    payNowButtonPaid: {
      backgroundColor: '#2A4E2E',
    },
    payNowButtonText: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#F7F5F0',
      letterSpacing: 0.3,
    },
    receiptButtonsRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    receiptPayBtn: {
      flex: 1.2,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    receiptDeclineBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(220, 53, 69, 0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(220, 53, 69, 0.35)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    receiptDeclineBtnText: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#C0392B',
      letterSpacing: 0.3,
    },
    paymentSummaryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: 'rgba(55, 99, 59, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    paymentSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    paymentSummaryTitle: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#37633B',
    },
    paymentSummarySubtitle: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-Regular',
      color: colors.textMuted,
      marginTop: 2,
    },
    paymentSummaryTotal: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#37633B',
    },
    viewReceiptLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      marginBottom: 10,
    },
    viewReceiptLinkText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#37633B',
      textDecorationLine: 'underline',
    },
    paymentActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    primaryPayBtn: {
      flex: 1.2,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#37633B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    primaryPayBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#F7F5F0',
    },
    secondaryDeclineBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(220, 53, 69, 0.08)',
      borderWidth: 1.2,
      borderColor: 'rgba(220, 53, 69, 0.35)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryDeclineBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#C0392B',
    },
    statusBadgeInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    statusBadgeInlinePaid: {
      backgroundColor: 'rgba(42, 115, 54, 0.1)',
    },
    statusBadgeInlinePaidText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#2A7336',
    },
    viewReceiptOutlineBtn: {
      height: 42,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#37633B',
      backgroundColor: 'rgba(55, 99, 59, 0.05)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
    },
    viewReceiptOutlineBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#37633B',
    },
  });
