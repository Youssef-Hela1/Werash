import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useThemeStyles } from '../styles/ThemeContext';
import { STORAGE_KEY_MECHANIC_SHARED } from './CertifiedMechanicPage';

const INITIAL_REQUESTS = [];

const INITIAL_REVIEWS = [
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

const INITIAL_EARNINGS = [
  {
    id: 'pay-1',
    customerName: 'Youssef Helal',
    customerNameAr: 'يوسف هلال',
    carModel: 'Hyundai Coupe • 2005',
    carModelAr: 'هيونداي كوبيه • ٢٠٠٥',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
    amount: 3200,
    date: 'Oct 19, 2026',
    dateAr: '١٩ أكتوبر ٢٠٢٦',
  },
  {
    id: 'pay-2',
    customerName: 'Mostafa Kamel',
    customerNameAr: 'مصطفى كامل',
    carModel: 'Hyundai Tucson • 2021',
    carModelAr: 'هيونداي توسان • ٢٠٢١',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop',
    amount: 5800,
    date: 'Oct 14, 2026',
    dateAr: '١٤ أكتوبر ٢٠٢٦',
  },
  {
    id: 'pay-3',
    customerName: 'Sherif Hany',
    customerNameAr: 'شريف هاني',
    carModel: 'Kia Sportage • 2019',
    carModelAr: 'كيا سبورتاج • ٢٠١٩',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
    amount: 4500,
    date: 'Oct 08, 2026',
    dateAr: '٨ أكتوبر ٢٠٢٦',
  },
  {
    id: 'pay-4',
    customerName: 'Tarek Nabil',
    customerNameAr: 'طارق نبيل',
    carModel: 'Mercedes-Benz G63 • 2022',
    carModelAr: 'مرسيدس G63 • ٢٠٢٢',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    amount: 12000,
    date: 'Sep 29, 2026',
    dateAr: '٢٩ سبتمبر ٢٠٢٦',
  },
  {
    id: 'pay-5',
    customerName: 'Karim Adel',
    customerNameAr: 'كريم عادل',
    carModel: 'Fiat Tipo • 2020',
    carModelAr: 'فيات تيبو • ٢٠٢٠',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
    amount: 9000,
    date: 'Sep 18, 2026',
    dateAr: '١٨ سبتمبر ٢٠٢٦',
  },
];

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    customerName: 'Youssef Helal',
    customerNameAr: 'يوسف هلال',
    carModel: 'Hyundai Coupe • 2005',
    carModelAr: 'هيونداي كوبيه • ٢٠٠٥',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
    visits: 3,
    lastVisit: 'Oct 19, 2026',
    lastVisitAr: '١٩ أكتوبر ٢٠٢٦',
  },
  {
    id: 'cust-2',
    customerName: 'Mostafa Kamel',
    customerNameAr: 'مصطفى كامل',
    carModel: 'Hyundai Tucson • 2021',
    carModelAr: 'هيونداي توسان • ٢٠٢١',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop',
    visits: 2,
    lastVisit: 'Oct 14, 2026',
    lastVisitAr: '١٤ أكتوبر ٢٠٢٦',
  },
  {
    id: 'cust-3',
    customerName: 'Sherif Hany',
    customerNameAr: 'شريف هاني',
    carModel: 'Kia Sportage • 2019',
    carModelAr: 'كيا سبورتاج • ٢٠١٩',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
    visits: 1,
    lastVisit: 'Oct 08, 2026',
    lastVisitAr: '٨ أكتوبر ٢٠٢٦',
  },
  {
    id: 'cust-4',
    customerName: 'Tarek Nabil',
    customerNameAr: 'طارق نبيل',
    carModel: 'Mercedes-Benz G63 • 2022',
    carModelAr: 'مرسيدس G63 • ٢٠٢٢',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    visits: 4,
    lastVisit: 'Sep 29, 2026',
    lastVisitAr: '٢٩ سبتمبر ٢٠٢٦',
  },
  {
    id: 'cust-5',
    customerName: 'Karim Adel',
    customerNameAr: 'كريم عادل',
    carModel: 'Fiat Tipo • 2020',
    carModelAr: 'فيات تيبو • ٢٠٢٠',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
    visits: 2,
    lastVisit: 'Sep 18, 2026',
    lastVisitAr: '١٨ سبتمبر ٢٠٢٦',
  },
  {
    id: 'cust-6',
    customerName: 'Amr Diab',
    customerNameAr: 'عمرو دياب',
    carModel: 'Hyundai Elantra • 2022',
    carModelAr: 'هيونداي إلنترا • ٢٠٢٢',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    visits: 1,
    lastVisit: 'Sep 05, 2026',
    lastVisitAr: '٥ سبتمبر ٢٠٢٦',
  },
];

export default function MechanicAppScreen({
  currentUser,
  onUpdateUser,
  onLogOut,
  selectedLanguage = 'English',
  onSelectLanguage,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isAr = selectedLanguage === 'Arabic';

  // Navigation between Main Profile/Dashboard, Requests, Reviews, Earnings, and Customers Pages
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'requests' | 'reviews' | 'earnings' | 'customers'
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [earningsHistory, setEarningsHistory] = useState(INITIAL_EARNINGS);
  const [customersHistory, setCustomersHistory] = useState(INITIAL_CUSTOMERS);
  const [customersCount, setCustomersCount] = useState(currentUser?.customersCount ?? 48);
  const [totalEarnings, setTotalEarnings] = useState(currentUser?.totalEarnings ?? 34500);

  // Editable Banner & Avatar states
  const [customBannerUri, setCustomBannerUri] = useState(currentUser?.workshopBanner || null);
  const [customAvatarUri, setCustomAvatarUri] = useState(currentUser?.avatar || null);

  // Settings Modal & Preferences state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Request Money Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    const loadSharedState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.requests)) {
            const fakeIds = new Set(['req-1', 'req-2', 'req-3', 'req-4']);
            const realRequests = parsed.requests.filter((r) => !fakeIds.has(r.id));
            setRequests(realRequests);
          }
          if (Array.isArray(parsed.earningsHistory)) {
            setEarningsHistory(parsed.earningsHistory);
          }
          if (Array.isArray(parsed.customersHistory)) {
            setCustomersHistory(parsed.customersHistory);
          }
          if (typeof parsed.customersCount === 'number') {
            setCustomersCount(parsed.customersCount);
          }
          if (typeof parsed.totalEarnings === 'number') {
            setTotalEarnings(parsed.totalEarnings);
          }
        }
      } catch (e) {
        console.warn('Error loading mechanic shared state:', e);
      }
    };
    loadSharedState();
  }, [activePage]);

  const handlePickImage = async (target) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isAr ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
        isAr
          ? 'نحتاج إلى إذن للوصول إلى معرض الصور الخاص بك لتحديث الصورة.'
          : 'We need permission to access your gallery to update the image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: target === 'banner' ? [16, 9] : [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const pickedUri = result.assets[0].uri;
      if (target === 'banner') {
        setCustomBannerUri(pickedUri);
        if (onUpdateUser && currentUser) {
          onUpdateUser({ ...currentUser, workshopBanner: pickedUri });
        }
      } else {
        setCustomAvatarUri(pickedUri);
        if (onUpdateUser && currentUser) {
          onUpdateUser({ ...currentUser, avatar: pickedUri });
        }
      }
    }
  };

  const mechanicName = isAr
    ? (currentUser?.fullNameAr || 'م. حمدي السيد')
    : (currentUser?.fullName || 'Eng. Hamdy El-Sayed');

  const workshopName = isAr
    ? (currentUser?.workshopNameAr || 'ورشة حمدي هيونداي المعتمدة')
    : (currentUser?.workshopName || 'Hamdy Hyundai Workshop');

  const ratingValue = currentUser?.rating || '4.8';
  const reviewsCount = currentUser?.reviewsCount || 64;

  const handleOpenRequestMoney = (reqItem) => {
    setSelectedRequest(reqItem);
    setAmountInput(reqItem.requestedAmount ? String(reqItem.requestedAmount) : '');
  };

  const handleConfirmRequestMoney = async () => {
    const numericAmount = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert(
        isAr ? 'تنبيه' : 'Invalid Amount',
        isAr ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount in EGP.'
      );
      return;
    }

    const updatedRequests = requests.map((r) =>
      r.id === selectedRequest.id ? { ...r, requestedAmount: numericAmount } : r
    );
    const updatedEarnings = [
      {
        id: `pay-${Date.now()}`,
        customerName: selectedRequest.customerName,
        customerNameAr: selectedRequest.customerNameAr,
        carModel: selectedRequest.carModel,
        carModelAr: selectedRequest.carModelAr,
        avatar: selectedRequest.avatar,
        amount: numericAmount,
        date: 'Today',
        dateAr: 'اليوم',
      },
      ...earningsHistory,
    ];
    const updatedCustomers = [
      {
        id: `cust-${Date.now()}`,
        customerName: selectedRequest.customerName,
        customerNameAr: selectedRequest.customerNameAr,
        carModel: selectedRequest.carModel,
        carModelAr: selectedRequest.carModelAr,
        avatar: selectedRequest.avatar,
        visits: 1,
        lastVisit: 'Today',
        lastVisitAr: 'اليوم',
      },
      ...customersHistory,
    ];
    const nextTotalEarnings = totalEarnings + numericAmount;
    const nextCustomersCount = customersCount + 1;

    setRequests(updatedRequests);
    setEarningsHistory(updatedEarnings);
    setCustomersHistory(updatedCustomers);
    setTotalEarnings(nextTotalEarnings);
    setCustomersCount(nextCustomersCount);
    setSelectedRequest(null);
    setAmountInput('');

    try {
      const existingRaw = await AsyncStorage.getItem(STORAGE_KEY_MECHANIC_SHARED);
      const existingParsed = existingRaw ? JSON.parse(existingRaw) : {};
      const prevNotifs = Array.isArray(existingParsed.customerNotifications)
        ? existingParsed.customerNotifications
        : [];
      const totalWithFee = Number((numericAmount * 1.025).toFixed(2));
      const newNotif = {
        id: `notif-receipt-${Date.now()}`,
        type: 'offer',
        title: 'Receipt Ready — Request Accepted',
        titleAr: 'تم قبول الطلب — الإيصال جاهز',
        body: `Eng. Hamdy El-Sayed accepted your request and issued a receipt for ${totalWithFee.toLocaleString()} EGP (incl. 2.5% service fee).`,
        bodyAr: `قبل م. حمدي السيد طلبك وأصدر إيصالاً بقيمة ${totalWithFee.toLocaleString()} ج.م (شامل ٢.٥٪ رسوم الخدمة).`,
        date: 'Just now',
        dateAr: 'الآن',
        read: false,
      };

      await AsyncStorage.setItem(
        STORAGE_KEY_MECHANIC_SHARED,
        JSON.stringify({
          ...existingParsed,
          requests: updatedRequests,
          earningsHistory: updatedEarnings,
          customersHistory: updatedCustomers,
          totalEarnings: nextTotalEarnings,
          customersCount: nextCustomersCount,
          customerNotifications: [newNotif, ...prevNotifs],
        })
      );
    } catch (e) {
      console.warn('Error saving mechanic shared state:', e);
    }

    Alert.alert(
      isAr ? 'تم إرسال الطلب' : 'Payment Requested',
      isAr
        ? `تم إرسال طلب دفع بقيمة ${numericAmount.toLocaleString()} ج.م إلى ${selectedRequest.customerNameAr}.`
        : `Payment request of ${numericAmount.toLocaleString()} EGP sent to ${selectedRequest.customerName}.`
    );
  };

  // ==================== PAGE 5: CUSTOMERS PAGE ====================
  if (activePage === 'customers') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#37633B" />

        {/* Simple Top Bar for Customers Page */}
        <View style={[styles.requestsHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActivePage('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#F7F5F0" />
          </TouchableOpacity>

          <Text style={[styles.requestsHeaderTitle, isAr && styles.arabicBoldText]}>
            {isAr ? 'عملاء الورشة عبر التطبيق' : 'Customers via App'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        >
          {customersHistory.map((item) => (
            <View key={item.id} style={styles.earningCard}>
              <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />

              <View style={styles.reviewUserInfo}>
                <Text style={[styles.customerNameText, isAr && styles.arabicBoldText]}>
                  {isAr ? item.customerNameAr : item.customerName}
                </Text>
                <Text style={[styles.reviewCarText, isAr && styles.arabicRegularText]}>
                  {isAr ? item.carModelAr : item.carModel}
                </Text>
              </View>

              <View style={styles.earningRightMeta}>
                <View style={styles.visitsBadge}>
                  <Text style={[styles.visitsBadgeText, isAr && styles.arabicBoldText]}>
                    {isAr
                      ? `${item.visits} ${item.visits > 1 ? 'زيارات' : 'زيارة'}`
                      : `${item.visits} ${item.visits > 1 ? 'Visits' : 'Visit'}`}
                  </Text>
                </View>
                <Text style={[styles.earningDateText, isAr && styles.arabicRegularText]}>
                  {isAr ? item.lastVisitAr : item.lastVisit}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==================== PAGE 4: EARNINGS PAGE ====================
  if (activePage === 'earnings') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#37633B" />

        {/* Simple Top Bar for Earnings Page */}
        <View style={[styles.requestsHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActivePage('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#F7F5F0" />
          </TouchableOpacity>

          <Text style={[styles.requestsHeaderTitle, isAr && styles.arabicBoldText]}>
            {isAr ? 'سجل الأرباح والمدفوعات' : 'Earnings History'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        >
          {earningsHistory.map((item) => (
            <View key={item.id} style={styles.earningCard}>
              <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />

              <View style={styles.reviewUserInfo}>
                <Text style={[styles.customerNameText, isAr && styles.arabicBoldText]}>
                  {isAr ? item.customerNameAr : item.customerName}
                </Text>
                <Text style={[styles.reviewCarText, isAr && styles.arabicRegularText]}>
                  {isAr ? item.carModelAr : item.carModel}
                </Text>
              </View>

              <View style={styles.earningRightMeta}>
                <Text style={styles.earningAmountText}>
                  +{item.amount.toLocaleString()}{' '}
                  <Text style={[styles.earningCurrencyText, isAr && styles.arabicBoldText]}>
                    {isAr ? 'ج.م' : 'EGP'}
                  </Text>
                </Text>
                <Text style={[styles.earningDateText, isAr && styles.arabicRegularText]}>
                  {isAr ? item.dateAr : item.date}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==================== PAGE 3: REVIEWS PAGE ====================
  if (activePage === 'reviews') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#37633B" />

        {/* Simple Top Bar for Reviews Page */}
        <View style={[styles.requestsHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActivePage('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#F7F5F0" />
          </TouchableOpacity>

          <Text style={[styles.requestsHeaderTitle, isAr && styles.arabicBoldText]}>
            {isAr ? 'تقييمات وتعليقات العملاء' : 'Customer Reviews'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        >
          {INITIAL_REVIEWS.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              {/* Top Row: Customer Avatar, Name & Car Model, and Stars */}
              <View style={styles.reviewHeaderRow}>
                <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} />

                <View style={styles.reviewUserInfo}>
                  <Text style={[styles.customerNameText, isAr && styles.arabicBoldText]}>
                    {isAr ? rev.customerNameAr : rev.customerName}
                  </Text>
                  <Text style={[styles.reviewCarText, isAr && styles.arabicRegularText]}>
                    {isAr ? rev.carModelAr : rev.carModel}
                  </Text>
                </View>

                <View style={styles.reviewRightMeta}>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rev.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#D4A373"
                      />
                    ))}
                  </View>
                  <Text style={[styles.reviewDateText, isAr && styles.arabicRegularText]}>
                    {isAr ? rev.dateAr : rev.date}
                  </Text>
                </View>
              </View>

              {/* Review Comment Body */}
              <Text style={[styles.reviewCommentText, isAr && styles.arabicRegularText]}>
                {isAr ? rev.commentAr : rev.comment}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==================== PAGE 2: REQUESTS PAGE ====================
  if (activePage === 'requests') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#37633B" />

        {/* Simple Top Bar for Requests Page */}
        <View style={[styles.requestsHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActivePage('dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#F7F5F0"
            />
          </TouchableOpacity>

          <Text style={[styles.requestsHeaderTitle, isAr && styles.arabicBoldText]}>
            {isAr ? 'طلبات العملاء' : 'Customer Requests'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        >
          {requests.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12, opacity: 0.6 }} />
              <Text style={[{ fontSize: 15, fontFamily: 'PlusJakartaSans-Bold', color: colors.textMuted }, isAr && styles.arabicBoldText]}>
                {isAr ? 'لا توجد طلبات حالياً' : 'No customer requests yet'}
              </Text>
            </View>
          ) : (
            requests.map((item) => (
            <View key={item.id} style={styles.customerCard}>
              {/* Top Row: User image on left, Name & Car Model on right */}
              <View style={styles.customerCardTopRow}>
                <Image source={{ uri: item.avatar }} style={styles.customerAvatar} />

                <View style={styles.customerInfoCol}>
                  <Text style={[styles.customerNameText, isAr && styles.arabicBoldText]}>
                    {isAr ? item.customerNameAr : item.customerName}
                  </Text>
                  <View style={styles.carBadgeRow}>
                    <Ionicons name="car-sport-outline" size={15} color={colors.bgBrand} />
                    <Text style={[styles.customerCarText, isAr && styles.arabicRegularText]}>
                      {isAr ? item.carModelAr : item.carModel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Button: Request Money */}
              <TouchableOpacity
                style={[
                  styles.requestMoneyButton,
                  item.requestedAmount && styles.requestMoneyButtonDone,
                ]}
                onPress={() => handleOpenRequestMoney(item)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={item.requestedAmount ? 'checkmark-circle' : 'cash-outline'}
                  size={18}
                  color="#F7F5F0"
                />
                <Text style={[styles.requestMoneyButtonText, isAr && styles.arabicBoldText]}>
                  {item.requestedAmount
                    ? isAr
                      ? `تم طلب ${item.requestedAmount.toLocaleString()} ج.م`
                      : `Requested ${item.requestedAmount.toLocaleString()} EGP`
                    : isAr
                    ? 'طلب دفعة مالية'
                    : 'Request Money'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
          )}
        </ScrollView>

        {/* Simple Modal to Enter Amount when tapping "Request Money" */}
        <Modal
          visible={!!selectedRequest}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, isAr && styles.arabicBoldText]}>
                {isAr ? 'طلب دفعة مالية' : 'Request Money'}
              </Text>
              {selectedRequest && (
                <Text style={[styles.modalSubtitle, isAr && styles.arabicRegularText]}>
                  {isAr
                    ? `${selectedRequest.customerNameAr} • ${selectedRequest.carModelAr}`
                    : `${selectedRequest.customerName} • ${selectedRequest.carModel}`}
                </Text>
              )}

              <TextInput
                style={styles.amountInput}
                placeholder={isAr ? 'أدخل المبلغ (ج.م)' : 'Enter amount (EGP)'}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedRequest(null)}
                >
                  <Text style={[styles.modalCancelText, isAr && styles.arabicBoldText]}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmRequestMoney}
                >
                  <Text style={[styles.modalConfirmText, isAr && styles.arabicBoldText]}>
                    {isAr ? 'إرسال' : 'Send Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==================== PAGE 1: MECHANIC MAIN PAGE ====================
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 1. Workshop Banner Image at the very top & full screen width */}
        <TouchableOpacity
          style={styles.bannerContainer}
          activeOpacity={0.9}
          onPress={() => handlePickImage('banner')}
        >
          <Image
            source={
              customBannerUri || currentUser?.workshopBanner
                ? { uri: customBannerUri || currentUser?.workshopBanner }
                : require('../../assets/Banner wallpaper.png')
            }
            style={styles.bannerWorkshopImage}
            resizeMode="cover"
          />
          <View style={styles.bannerSubtleOverlay} />

          {/* Edit Banner Icon Badge */}
          <View style={styles.bannerEditBadge}>
            <Ionicons name="pencil" size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* 2. Profile Picture overlapping the bottom of the Banner */}
        <View style={styles.profileHeaderSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={() => handlePickImage('avatar')}
          >
            <Image
              source={
                customAvatarUri || currentUser?.avatar
                  ? { uri: customAvatarUri || currentUser?.avatar }
                  : require('../../assets/Mechanic profile picture.png')
              }
              style={styles.mechanicAvatar}
            />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 3. Mechanic's Name & Workshop Name */}
          <Text style={[styles.mechanicName, isAr && styles.arabicBoldText]}>
            {mechanicName}
          </Text>
          <Text style={[styles.workshopName, isAr && styles.arabicRegularText]}>
            {workshopName}
          </Text>
        </View>

        {/* 4. Simple Dashboard Data: Customers & Earnings */}
        <View style={styles.dashboardSection}>
          <View style={styles.statsRow}>
            {/* Customers Card (Clickable to open Customers Page) */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => setActivePage('customers')}
            >
              <View style={styles.statIconCircle}>
                <Ionicons name="people" size={20} color="#37633B" />
              </View>
              <Text style={styles.statValue}>{customersCount}</Text>
              <Text style={[styles.statLabel, isAr && styles.arabicRegularText]}>
                {isAr ? 'عملاء عبر التطبيق' : 'Customers via App'}
              </Text>
            </TouchableOpacity>

            {/* Earnings Card (Clickable to open Earnings History Page) */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => setActivePage('earnings')}
            >
              <View style={styles.statIconCircle}>
                <Ionicons name="wallet" size={20} color="#37633B" />
              </View>
              <Text style={styles.statValue}>
                {totalEarnings.toLocaleString()}{' '}
                <Text style={[styles.currencyUnit, isAr && styles.arabicBoldText]}>
                  {isAr ? 'ج.م' : 'EGP'}
                </Text>
              </Text>
              <Text style={[styles.statLabel, isAr && styles.arabicRegularText]}>
                {isAr ? 'الأرباح من التطبيق' : 'Earned from App'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Compact Ratings Summary Below (Clickable to open Reviews Page) */}
          <TouchableOpacity
            style={styles.ratingSummaryCard}
            activeOpacity={0.8}
            onPress={() => setActivePage('reviews')}
          >
            <View style={styles.ratingLeftCol}>
              <Text style={[styles.ratingCardTitle, isAr && styles.arabicBoldText]}>
                {isAr ? 'تقييمات الورشة' : 'Ratings Received'}
              </Text>
              <Text style={[styles.ratingCountSubtext, isAr && styles.arabicRegularText]}>
                {isAr
                  ? `بناءً على ${reviewsCount} تقييم من العملاء`
                  : `Based on ${reviewsCount} customer reviews`}
              </Text>
            </View>

            <View style={styles.ratingRightBadge}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= 4 ? 'star' : 'star-half'}
                    size={15}
                    color="#D4A373"
                  />
                ))}
              </View>
              <Text style={styles.ratingNumberText}>{ratingValue}</Text>
            </View>
          </TouchableOpacity>

          {/* 6. View Requests Button */}
          <TouchableOpacity
            style={styles.viewRequestsButton}
            onPress={() => setActivePage('requests')}
            activeOpacity={0.85}
          >
            <View style={styles.viewRequestsBtnLeft}>
              <Ionicons name="reader-outline" size={20} color="#F7F5F0" />
              <Text style={[styles.viewRequestsButtonText, isAr && styles.arabicBoldText]}>
                {isAr ? 'عرض الطلبات' : 'View Requests'}
              </Text>
            </View>

            <View style={styles.requestsCountBadge}>
              <Text style={styles.requestsCountBadgeText}>{requests.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom-Right Floating Settings Button */}
      <TouchableOpacity
        style={[
          styles.settingsFab,
          { bottom: Math.max(insets.bottom, 20) + 6 },
        ]}
        onPress={() => setSettingsVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="settings-outline" size={24} color="#F7F5F0" />
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.settingsModalCard}
            onPress={() => {}}
          >
            <View style={styles.settingsModalHeader}>
              <Text style={[styles.settingsModalTitle, isAr && styles.arabicBoldText]}>
                {isAr ? 'الإعدادات' : 'Settings'}
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={styles.settingsCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Option 1: Change Language */}
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.75}
              onPress={() =>
                onSelectLanguage &&
                onSelectLanguage(selectedLanguage === 'Arabic' ? 'English' : 'Arabic')
              }
            >
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconBox}>
                  <Ionicons name="globe-outline" size={19} color={colors.bgBrand} />
                </View>
                <Text style={[styles.settingsRowLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'اللغة' : 'Language'}
                </Text>
              </View>
              <View style={styles.languagePill}>
                <Text style={[styles.languagePillText, isAr && styles.arabicBoldText]}>
                  {selectedLanguage === 'Arabic' ? 'العربية' : 'English'}
                </Text>
                <Ionicons name="swap-horizontal" size={14} color={colors.bgBrand} />
              </View>
            </TouchableOpacity>

            {/* Option 2: Dark Mode */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconBox}>
                  <Ionicons name="moon-outline" size={19} color={colors.bgBrand} />
                </View>
                <Text style={[styles.settingsRowLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'الوضع الداكن' : 'Dark Mode'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#D5DED6', true: '#37633B' }}
                thumbColor="#FDFBF7"
              />
            </View>

            {/* Option 3: Notifications */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconBox}>
                  <Ionicons name="notifications-outline" size={19} color={colors.bgBrand} />
                </View>
                <Text style={[styles.settingsRowLabel, isAr && styles.arabicBoldText]}>
                  {isAr ? 'الإشعارات' : 'Notifications'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D5DED6', true: '#37633B' }}
                thumbColor="#FDFBF7"
              />
            </View>

            {/* Option 4: Log Out */}
            <TouchableOpacity
              style={styles.logoutRowBtn}
              activeOpacity={0.8}
              onPress={() => {
                setSettingsVisible(false);
                if (onLogOut) onLogOut();
              }}
            >
              <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
              <Text style={[styles.logoutRowBtnText, isAr && styles.arabicBoldText]}>
                {isAr ? 'تسجيل الخروج' : 'Log Out'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgCreamy,
    },
    scrollContent: {
      paddingBottom: 95,
    },
    rowReverse: {
      flexDirection: 'row-reverse',
    },
    alignEnd: {
      alignItems: 'flex-end',
    },
    arabicBoldText: {
      fontFamily: 'AlkhalilArabic-Bold',
    },
    arabicRegularText: {
      fontFamily: 'AlkhalilArabic-Bold',
    },

    // Workshop Image Banner (Smaller & pushed all the way to the top)
    bannerContainer: {
      width: '100%',
      height: 155,
      backgroundColor: '#2A3B2C',
      position: 'relative',
      overflow: 'visible',
      zIndex: 5,
    },
    bannerWorkshopImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    bannerSubtleOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    bannerEditBadge: {
      position: 'absolute',
      bottom: -14,
      right: 16,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#37633B',
      borderWidth: 2,
      borderColor: colors.bgCreamy,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 3,
      zIndex: 6,
    },

    // Profile Picture & Titles
    profileHeaderSection: {
      alignItems: 'center',
      marginTop: -54,
      paddingHorizontal: 20,
      zIndex: 6,
    },
    avatarWrapper: {
      width: 108,
      height: 108,
      borderRadius: 54,
      borderWidth: 4,
      borderColor: colors.bgCreamy,
      backgroundColor: colors.white,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      position: 'relative',
    },
    mechanicAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#37633B',
      borderWidth: 2,
      borderColor: colors.bgCreamy,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 3,
    },
    mechanicName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textDark,
      marginTop: 10,
      textAlign: 'center',
    },
    workshopName: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: 3,
      fontWeight: '500',
      textAlign: 'center',
    },

    // Dashboard Section
    dashboardSection: {
      paddingHorizontal: 20,
      marginTop: 22,
      gap: 14,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 2,
    },
    statIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.bgBrandLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textDark,
    },
    currencyUnit: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
      fontWeight: '500',
    },

    // Compact Ratings Summary
    ratingSummaryCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 2,
    },
    ratingLeftCol: {
      flex: 1,
    },
    ratingCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textDark,
    },
    ratingCountSubtext: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    ratingRightBadge: {
      alignItems: 'center',
      backgroundColor: colors.bgBrandLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 2,
      marginBottom: 2,
    },
    ratingNumberText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textDark,
    },

    // View Requests Button
    viewRequestsButton: {
      backgroundColor: '#37633B',
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      shadowColor: '#37633B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    viewRequestsBtnLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    viewRequestsButtonText: {
      color: '#F7F5F0',
      fontSize: 16,
      fontWeight: '700',
    },
    requestsCountBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    requestsCountBadgeText: {
      color: '#F7F5F0',
      fontSize: 13,
      fontWeight: '700',
    },

    // ==================== REQUESTS PAGE STYLES ====================
    requestsHeader: {
      backgroundColor: '#37633B',
      paddingBottom: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsHeaderTitle: {
      color: '#F7F5F0',
      fontSize: 18,
      fontWeight: '700',
    },
    headerSpacer: {
      width: 38,
    },
    requestsListContent: {
      padding: 18,
      gap: 14,
      paddingBottom: 40,
    },
    customerCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    customerCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 14,
    },
    customerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.bgBrandLight,
    },
    customerInfoCol: {
      flex: 1,
    },
    customerNameText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textDark,
    },
    carBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    customerCarText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
    requestMoneyButton: {
      backgroundColor: '#37633B',
      borderRadius: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    requestMoneyButtonDone: {
      backgroundColor: '#5D8260',
    },
    requestMoneyButtonText: {
      color: '#F7F5F0',
      fontSize: 14,
      fontWeight: '700',
    },

    // Request Money Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      backgroundColor: colors.bgCreamy,
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.borderGreen,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textDark,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    amountInput: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textDark,
      marginBottom: 18,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      alignItems: 'center',
    },
    modalCancelText: {
      color: colors.textDark,
      fontWeight: '600',
      fontSize: 14,
    },
    modalConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#37633B',
      alignItems: 'center',
    },
    modalConfirmText: {
      color: '#F7F5F0',
      fontWeight: '700',
      fontSize: 14,
    },

    // Bottom-Right Floating Settings Button & Modal
    settingsFab: {
      position: 'absolute',
      right: 20,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#37633B',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 10,
    },
    settingsModalCard: {
      width: '100%',
      backgroundColor: colors.bgCreamy,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    settingsModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    settingsModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textDark,
    },
    settingsCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    settingsRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingsIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.bgBrandLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsRowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textDark,
    },
    languagePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bgBrandLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    languagePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.bgBrand,
    },
    logoutRowBtn: {
      marginTop: 6,
      backgroundColor: colors.accentRed,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    logoutRowBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // ==================== REVIEWS PAGE STYLES ====================
    reviewCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    reviewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    reviewAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgBrandLight,
    },
    reviewUserInfo: {
      flex: 1,
    },
    reviewCarText: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontWeight: '500',
    },
    reviewRightMeta: {
      alignItems: 'flex-end',
    },
    reviewStarsRow: {
      flexDirection: 'row',
      gap: 2,
    },
    reviewDateText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
    reviewCommentText: {
      fontSize: 14,
      color: colors.textDark,
      lineHeight: 20,
    },

    // ==================== EARNINGS PAGE STYLES ====================
    earningCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.borderGreen,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    earningRightMeta: {
      alignItems: 'flex-end',
    },
    earningAmountText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#37633B',
    },
    earningCurrencyText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#37633B',
    },
    earningDateText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontWeight: '500',
    },

    // ==================== CUSTOMERS PAGE STYLES ====================
    visitsBadge: {
      backgroundColor: colors.bgBrandLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    visitsBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#37633B',
    },
  });




