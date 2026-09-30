import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ActiveVehicleCard from '../components/ActiveVehicleCard';
import { CAR_BRANDS_AND_MODELS } from '../data/carModels';
import { BRAND_LOGOS } from '../data/brandLogos';

export const CAR_BRAND_LIST = [
  { nameEn: 'Acura', nameAr: 'أكورا' },
  { nameEn: 'Alfa Romeo', nameAr: 'ألفا روميو' },
  { nameEn: 'Audi', nameAr: 'أودي' },
  { nameEn: 'Baic', nameAr: 'بايك' },
  { nameEn: 'BMW', nameAr: 'بي إم دبليو' },
  { nameEn: 'BYD', nameAr: 'بي واي دي' },
  { nameEn: 'Cadillac', nameAr: 'كاديلاك' },
  { nameEn: 'Changan', nameAr: 'شانجان' },
  { nameEn: 'Chery', nameAr: 'شيري' },
  { nameEn: 'Chevrolet', nameAr: 'شيفروليه' },
  { nameEn: 'Citroen', nameAr: 'سيتروين' },
  { nameEn: 'Cupra', nameAr: 'كوبرا' },
  { nameEn: 'Daewoo', nameAr: 'دايو' },
  { nameEn: 'Daihatsu', nameAr: 'ديهاتسو' },
  { nameEn: 'Datsun', nameAr: 'داتسون' },
  { nameEn: 'Dayun', nameAr: 'دايون' },
  { nameEn: 'Dodge', nameAr: 'دودج' },
  { nameEn: 'Dongfeng', nameAr: 'دونغفينغ' },
  { nameEn: 'DS', nameAr: 'دي إس' },
  { nameEn: 'Fiat', nameAr: 'فيات' },
  { nameEn: 'Ford', nameAr: 'فورد' },
  { nameEn: 'Forthing', nameAr: 'فورثينج' },
  { nameEn: 'GAC', nameAr: 'جاك' },
  { nameEn: 'Geely', nameAr: 'جيلي' },
  { nameEn: 'GMC', nameAr: 'جي إم سي' },
  { nameEn: 'Haval', nameAr: 'هافال' },
  { nameEn: 'Honda', nameAr: 'هوندا' },
  { nameEn: 'Hummer', nameAr: 'همر' },
  { nameEn: 'Hyundai', nameAr: 'هيونداي' },
  { nameEn: 'Infiniti', nameAr: 'إنفينيتي' },
  { nameEn: 'Isuzu', nameAr: 'إيسوزو' },
  { nameEn: 'Jac', nameAr: 'جاك' },
  { nameEn: 'Jaguar', nameAr: 'جاغوار' },
  { nameEn: 'Jeep', nameAr: 'جيب' },
  { nameEn: 'Jetour', nameAr: 'جيتور' },
  { nameEn: 'Kia', nameAr: 'كيا' },
  { nameEn: 'Lada', nameAr: 'لادا' },
  { nameEn: 'Land Rover', nameAr: 'لاند روفر' },
  { nameEn: 'Maserati', nameAr: 'مازيراتي' },
  { nameEn: 'Mazda', nameAr: 'مازدا' },
  { nameEn: 'Mercedes-Benz', nameAr: 'مرسيدس' },
  { nameEn: 'MG', nameAr: 'إم جي' },
  { nameEn: 'Mini Cooper', nameAr: 'ميني كوبر' },
  { nameEn: 'Mitsubishi', nameAr: 'ميتسوبيشي' },
  { nameEn: 'Nissan', nameAr: 'نيسان' },
  { nameEn: 'Opel', nameAr: 'أوبل' },
  { nameEn: 'Peugeot', nameAr: 'بيجو' },
  { nameEn: 'Porsche', nameAr: 'بورشه' },
  { nameEn: 'Proton', nameAr: 'بروتون' },
  { nameEn: 'Renault', nameAr: 'رينو' },
  { nameEn: 'Seat', nameAr: 'سيات' },
  { nameEn: 'Skoda', nameAr: 'سكودا' },
  { nameEn: 'Subaru', nameAr: 'سوبارو' },
  { nameEn: 'Suzuki', nameAr: 'سوزوكي' },
  { nameEn: 'Tata', nameAr: 'تاتا' },
  { nameEn: 'Tesla', nameAr: 'تسلا' },
  { nameEn: 'Toyota', nameAr: 'تويوتا' },
  { nameEn: 'Volkswagen', nameAr: 'فولكس فاجن' },
  { nameEn: 'Volvo', nameAr: 'فولفو' }
];

export const getBrandModels = (brandName) => {
  if (!brandName) return [];
  const clean = String(brandName).trim().toLowerCase();
  
  if (CAR_BRANDS_AND_MODELS[clean] && Array.isArray(CAR_BRANDS_AND_MODELS[clean])) {
    return CAR_BRANDS_AND_MODELS[clean];
  }
  const withHyphen = clean.replace(/\s+/g, '-');
  if (CAR_BRANDS_AND_MODELS[withHyphen] && Array.isArray(CAR_BRANDS_AND_MODELS[withHyphen])) {
    return CAR_BRANDS_AND_MODELS[withHyphen];
  }
  const withSpace = clean.replace(/-/g, ' ');
  if (CAR_BRANDS_AND_MODELS[withSpace] && Array.isArray(CAR_BRANDS_AND_MODELS[withSpace])) {
    return CAR_BRANDS_AND_MODELS[withSpace];
  }
  if (clean === 'mercedes' || clean.includes('mercedes')) {
    return CAR_BRANDS_AND_MODELS['mercedes-benz'] || [];
  }
  if (clean === 'mini' || clean.includes('mini')) {
    return CAR_BRANDS_AND_MODELS['mini cooper'] || [];
  }
  if (clean.includes('rover')) {
    return CAR_BRANDS_AND_MODELS['land rover'] || [];
  }
  if (clean.includes('alfa')) {
    return CAR_BRANDS_AND_MODELS['alfa romeo'] || [];
  }
  const found = CAR_BRAND_LIST.find(b => 
    b.nameEn.toLowerCase() === clean || 
    b.nameAr === brandName ||
    clean.includes(b.nameEn.toLowerCase())
  );
  if (found) {
    const k = found.nameEn.toLowerCase();
    if (CAR_BRANDS_AND_MODELS[k]) return CAR_BRANDS_AND_MODELS[k];
    if (CAR_BRANDS_AND_MODELS[k.replace(/\s+/g, '-')]) return CAR_BRANDS_AND_MODELS[k.replace(/\s+/g, '-')];
  }
  return [];
};

export const getModelThumbnail = (brandName, modelItem) => {
  if (!modelItem) return null;
  if (Array.isArray(modelItem.images) && modelItem.images.length > 0 && modelItem.images[0].image) {
    return modelItem.images[0].image;
  }
  if (modelItem.image) {
    return modelItem.image;
  }
  const cleanBrand = String(brandName || '').trim().toLowerCase();
  return BRAND_LOGOS[cleanBrand] || BRAND_LOGOS[cleanBrand.replace(/\s+/g, '-')] || null;
};

// Helper to render text with system font for digits and Alkhalil font for words
const renderTextWithSystemNumbers = (text, isRtl, baseStyle, rtlFontSize) => {
  if (!text) return null;
  if (!isRtl) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  const regex = /([0-9\u0660-\u0669]+)/g;
  const parts = text.split(regex);
  return (
    <Text style={[baseStyle, { textAlign: 'right' }]}>
      {parts.map((part, index) => {
        const isDigit = /^[0-9\u0660-\u0669]+$/.test(part);
        return (
          <Text 
            key={index} 
            style={isDigit ? { fontSize: rtlFontSize } : { fontFamily: 'AlkhalilArabic-Bold', fontSize: rtlFontSize }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

// Helper to split numbers (left) and letters (right) on license plates
const splitPlate = (plateStr) => {
  if (!plateStr) return { numbers: '', letters: '' };
  
  // Match digits (0-9 and Arabic numerals ٠-٩)
  const digitRegex = /[0-9\u0660-\u0669]/g;
  const digits = plateStr.match(digitRegex) || [];
  
  // Replace digits to extract letters only, normalizing spacing
  const lettersOnly = plateStr.replace(digitRegex, '').trim().replace(/\s+/g, ' ');
  
  return {
    numbers: digits.join(''),
    letters: lettersOnly
  };
};

const hasArabicCharacters = (text) => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text || '');
};

const getFormattedDate = () => {
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  const d = new Date();
  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();
  
  const dateEn = `${monthsEn[monthIdx]} ${day}, ${year}`;
  
  const toArabicNums = (str) => {
    const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, w => arabicNums[+w]);
  };
  const dateAr = `${toArabicNums(day.toString())} ${monthsAr[monthIdx]} ${toArabicNums(year.toString())}`;
  
  return { dateEn, dateAr };
};

const TRANSLATIONS = {
  English: {
    title: 'My Warsha',
    subtitle: 'Manage, toggle, and register your vehicles in your custom virtual Warsha space.',
    guestTitle: 'Sign In to View My Warsha',
    guestText: 'Please log in or create an account to view, register, and select active vehicles in My Warsha.',
    signInBtn: 'Sign In / Register',
    myVehicles: 'My Vehicles',
    addCarBtn: '+ Add Car',
    addNewCarHeader: 'Add New Vehicle',
    brandLabel: 'Car Brand',
    modelLabel: 'Model',
    yearLabel: 'Year',
    plateLabel: 'Plate Number',
    ccLabel: 'Engine CC (e.g. 2000 CC)',
    saveBtn: 'Save Vehicle',
    cancelBtn: 'Cancel',
    activeBadge: 'Active',
    setActiveBtn: 'Set Active',
    currentActive: 'Current Active',
    removeBtn: 'Remove',
    warshaEmptyTitle: 'Warsha Empty',
    warshaEmptyText: 'Add a vehicle to view logs and diagnostics.',
    noVehicleTitle: 'No Vehicle Selected',
    noVehicleText: 'Please select a vehicle from the list or register a new one to view details.',
    odometer: 'Current Odometer',
    lastOil: 'Last Oil Change',
    nextOil: 'Next Oil Change Due',
    inKm: (val) => `In ${val} km`,
    diagnosticsHeader: 'Diagnostic Report & Vehicle Stats',
    batteryState: 'Battery State',
    brakeFluid: 'Brake Fluid Level',
    tirePressure: 'Tire Pressure',
    coolantTemp: 'Engine Coolant Temp',
    nextInspection: 'Next Inspection',
    maintenanceInsurance: 'Maintenance Insurance',
    activeCover: 'Active Cover',
    excellent: '14.2V (Excellent)',
    optimal: '96% (Optimal)',
    tiresValue: '32 PSI Front / 34 PSI Rear',
    stable: '92°C (Stable)',
    inspectionDate: 'October 24, 2026',
    activityLogsHeader: 'Recent Warsha Activity Logs',
    logOilTitle: 'Routine Oil & Filter Change Service',
    logOilDesc: 'Completed at Werash Central Shop • Certified mechanic log attached',
    logTireTitle: 'Tire Rotation & Balance Alignment Check',
    logTireDesc: 'Full alignment service performed to solve high speed steering wheel jitter',
    confirmRemoveTitle: 'Remove Vehicle',
    confirmRemoveMsg: (brand, model) => `Are you sure you want to remove your ${brand} ${model} from My Warsha?`,
    confirmRemoveYes: 'Remove',
    confirmRemoveNo: 'Cancel',
    serviceStatusTab: 'Service Status',
    logBookTab: 'Notes',
  },
  Arabic: {
    title: 'وِرَش الخاص بي',
    subtitle: 'قم بإدارة وتفعيل وتسجيل مركباتك في مساحة وِرَش الافتراضية الخاصة بك.',
    guestTitle: 'سجل الدخول لعرض وِرَش الخاص بك',
    guestText: 'يرجى تسجيل الدخول أو إنشاء حساب لعرض وتسجيل واختيار المركبات النشطة في وِرَش.',
    signInBtn: 'تسجيل الدخول / التسجيل',
    myVehicles: 'مركباتي',
    addCarBtn: '+ إضافة سيارة',
    addNewCarHeader: 'إضافة مركبة جديدة',
    brandLabel: 'ماركة السيارة',
    modelLabel: 'الموديل',
    yearLabel: 'السنة',
    plateLabel: 'رقم اللوحة',
    ccLabel: 'سعة المحرك (مثال: ٢٠٠٠ سي سي)',
    saveBtn: 'حفظ المركبة',
    cancelBtn: 'إلغاء',
    activeBadge: 'نشط',
    setActiveBtn: 'تفعيل كنشط',
    currentActive: 'نشط حالياً',
    removeBtn: 'حذف',
    warshaEmptyTitle: 'وِرَش فارغ',
    warshaEmptyText: 'أضف مركبة لعرض السجلات والتشخيصات.',
    noVehicleTitle: 'لم يتم اختيار مركبة',
    noVehicleText: 'يرجى اختيار مركبة من القائمة أو تسجيل مركبة جديدة لعرض التفاصيل.',
    odometer: 'عداد المسافات الحالي',
    lastOil: 'آخر تغيير للزيت',
    nextOil: 'تغيير الزيت القادم',
    inKm: (val) => `خلال ${val} كم`,
    diagnosticsHeader: 'تقرير التشخيص وإحصائيات المركبة',
    batteryState: 'حالة البطارية',
    brakeFluid: 'مستوى سائل الفرامل',
    tirePressure: 'ضغط الإطارات',
    coolantTemp: 'درجة حرارة مبرد المحرك',
    nextInspection: 'الفحص القادم',
    maintenanceInsurance: 'تأمين الصيانة',
    activeCover: 'تغطية نشطة',
    excellent: '١٤.٢ فولت (ممتاز)',
    optimal: '٩٦٪ (مثالي)',
    tiresValue: '٣٢ رطل/بوصة² أمامي / ٣٤ رطل/بوصة² خلفي',
    stable: '٩٢°م (مستقر)',
    inspectionDate: '٢٤ أكتوبر ٢٠٢٦',
    activityLogsHeader: 'سجلات نشاط وِرَش الأخيرة',
    logOilTitle: 'خدمة تغيير الزيت والفلاتر الدورية',
    logOilDesc: 'تمت في مركز وِرَش المركزي • سجل الفني المعتمد مرفق',
    logTireTitle: 'فحص محاذاة وتدوين الإطارات',
    logTireDesc: 'تم إجراء خدمة محاذاة كاملة لحل اهتزاز عجلة القيادة على السرعات العالية',
    confirmRemoveTitle: 'حذف المركبة',
    confirmRemoveMsg: (brand, model) => `هل أنت متأكد أنك تريد حذف سيارتك ${brand} ${model} من وِرَش الخاص بك؟`,
    confirmRemoveYes: 'حذف',
    confirmRemoveNo: 'إلغاء',
    serviceStatusTab: 'حالة الصيانة',
    logBookTab: 'ملاحظاتي',
  }
};

const SERVICE_ITEMS_METADATA = [
  {
    key: 'engineOil',
    icon: 'water-outline',
    labelEn: 'Engine Oil',
    labelAr: 'زيت المحرك',
    category: 'fluids',
    defaultLifespan: 10000,
  },
  {
    key: 'oilFilter',
    icon: 'funnel-outline',
    labelEn: 'Oil Filter',
    labelAr: 'فلتر الزيت',
    category: 'filters',
    defaultLifespan: 10000,
  },
  {
    key: 'airFilter',
    icon: 'leaf-outline',
    labelEn: 'Air Filter',
    labelAr: 'فلتر الهواء',
    category: 'filters',
    defaultLifespan: 20000,
  },
  {
    key: 'cabinAirFilter',
    icon: 'filter-outline',
    labelEn: 'Cabin Air Filter (A/C Filter)',
    labelAr: 'فلتر التكييف',
    category: 'filters',
    defaultLifespan: 20000,
  },
  {
    key: 'sparkPlugs',
    icon: 'flash-outline',
    labelEn: 'Spark Plugs',
    labelAr: 'البوجيهات',
    category: 'filters',
    defaultLifespan: 40000,
  },
  {
    key: 'transmissionFluid',
    icon: 'cog-outline',
    labelEn: 'Transmission Fluid',
    labelAr: 'زيت الفتيس',
    category: 'fluids',
    defaultLifespan: 60000,
  },
  {
    key: 'coolant',
    icon: 'thermometer-outline',
    labelEn: 'Coolant',
    labelAr: 'سائل التبريد',
    category: 'fluids',
    defaultLifespan: 40000,
  },
  {
    key: 'brakeFluid',
    icon: 'disc-outline',
    labelEn: 'Brake Fluid',
    labelAr: 'زيت الفرامل',
    category: 'fluids',
    defaultLifespan: 30000,
  },
  {
    key: 'brakePads',
    icon: 'ellipse-outline',
    labelEn: 'Brake Pads',
    labelAr: 'تيل الفرامل',
    category: 'parts',
    defaultLifespan: 30000,
  },
  {
    key: 'tires',
    icon: 'disc-outline',
    labelEn: 'Tires',
    labelAr: 'الكاوتش',
    category: 'parts',
    defaultLifespan: 50000,
  },
];

export default function GarageScreen({
  currentUser,
  onOpenSignIn,
  selectedLanguage,
  userVehicles = [],
  setUserVehicles,
  activeVehicleId,
  setActiveVehicleId,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';
  const { width: screenWidth } = Dimensions.get('window');
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  const getVehicleServiceData = (car) => {
    if (!car) return { odoNum: 0, odoStr: '0 km', servicesList: [] };
    
    const isArabic = selectedLanguage === 'Arabic';
    const odoNum = car.odometer !== undefined && !isNaN(parseInt(car.odometer)) ? parseInt(car.odometer) : 284000;
    
    const odoStr = isArabic 
      ? `${odoNum.toLocaleString('ar-EG')} كم` 
      : `${odoNum.toLocaleString('en-US')} km`;

    const servicesList = SERVICE_ITEMS_METADATA.filter(item => {
      if (item.condition === 'isManual') return car.isManual;
      if (item.condition === 'is4WD') return car.is4WD;
      if (item.condition === 'hasHydraulicPS') return car.hasHydraulicPS;
      if (item.condition === 'hasTimingBelt') return car.hasTimingBelt;
      return true;
    }).map(item => {
      const serviceData = car.services?.[item.key] || {};
      const lastService = serviceData.lastService ?? (item.key === 'engineOil' ? (car.lastOil ?? 10000) : 10000);
      const lifespan = serviceData.lifespan ?? (item.key === 'engineOil' ? (car.oilLife ?? 10000) : item.defaultLifespan);
      
      const nextServiceAt = lastService + lifespan;
      const remaining = nextServiceAt - odoNum;
      const driven = Math.max(0, odoNum - lastService);
      const progress = lifespan > 0 ? Math.min(1, driven / lifespan) : 0;
      
      const lastServiceStr = isArabic 
        ? `${lastService.toLocaleString('ar-EG')} كم` 
        : `${lastService.toLocaleString('en-US')} km`;
        
      const lifespanStr = isArabic 
        ? `${lifespan.toLocaleString('ar-EG')} كم` 
        : `${lifespan.toLocaleString('en-US')} km`;
        
      const nextServiceAtStr = isArabic
        ? `${nextServiceAt.toLocaleString('ar-EG')} كم`
        : `${nextServiceAt.toLocaleString('en-US')} km`;
        
      let remainingStr = '';
      let statusColor = colors.bgBrand; // Green default
      
      if (remaining > 0) {
        remainingStr = isArabic 
          ? `خلال ${remaining.toLocaleString('ar-EG')} كم` 
          : `In ${remaining.toLocaleString('en-US')} km`;
        // Check warning threshold (30%)
        if (remaining / lifespan <= 0.3) {
          statusColor = '#E2B13C'; // Warning Yellow
        }
      } else {
        const overdue = Math.abs(remaining);
        remainingStr = isArabic 
          ? `تجاوز الموعد! (${overdue.toLocaleString('ar-EG')} كم)` 
          : `Overdue! (${overdue.toLocaleString('en-US')} km)`;
        statusColor = colors.accentRed || '#B54D4F'; // Red
      }
      
      return {
        key: item.key,
        icon: item.icon,
        label: isArabic ? item.labelAr : item.labelEn,
        category: item.category,
        lastService,
        lifespan,
        nextServiceAt,
        remaining,
        progress,
        lastServiceStr,
        lifespanStr,
        nextServiceAtStr,
        remainingStr,
        statusColor
      };
    });

    // Sort services by remaining distance ascending (most overdue and soonest due first)
    servicesList.sort((a, b) => a.remaining - b.remaining);

    return {
      odoNum,
      odoStr,
      servicesList
    };
  };

  const scrollViewRef = useRef(null);

  // Add vehicle form fields state
  const [showAddForm, setShowAddForm] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateNumbers, setPlateNumbers] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [cc, setCc] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [isManualCar, setIsManualCar] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  const handleWizardBack = () => {
    if (wizardStep === 2) {
      setBrand('');
      setModel('');
      setBrandSearchQuery('');
    } else if (wizardStep === 3) {
      setModel('');
      setYear('');
      setModelSearchQuery('');
    } else if (wizardStep === 4) {
      setYear('');
    }
    setWizardStep(wizardStep - 1);
  };

  // Edit service status card state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempOdometer, setTempOdometer] = useState('');
  const [tempServices, setTempServices] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [selectedEditCategory, setSelectedEditCategory] = useState('overall');

  const [isSwitchingVehicle, setIsSwitchingVehicle] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [cardMode, setCardMode] = useState('services');
  const [notePages, setNotePages] = useState(['']);
  const [currentPage, setCurrentPage] = useState(0);
  const [noteDates, setNoteDates] = useState(Array(50).fill(null));
  const [noteImages, setNoteImages] = useState(Array.from({ length: 50 }, () => [])); // 2D array of image URIs per page
  const [isNotesSaved, setIsNotesSaved] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // New state variables for text wrapping and editing behavior
  const [isEditing, setIsEditing] = useState(false);
  const [textTop, setTextTop] = useState('');
  const [textBottom, setTextBottom] = useState('');
  const [remainingText, setRemainingText] = useState('');
  const [paperWidth, setPaperWidth] = useState(0);
  const notebookInputRef = useRef(null);

  const activeVehicle = userVehicles.find(v => v.id === activeVehicleId);

  // Sync note text + date + images whenever active vehicle changes or language is toggled
  React.useEffect(() => {
    if (activeVehicle) {
      let notesText = activeVehicle.notes || '';
      
      const combinedDefaultOld = 'Welcome to Werash Notes! 📝\nمرحباً بك في ملاحظات وِرَش!\n\n• Use the arrows (◀/▶) above to flip pages.\n• استخدم الأسهم (◀/▶) في الأعلى للتنقل.\n\n• Tap the Date Chip to set a log date.\n• اضغط على شريحة التاريخ لتحديد يوم.[PAGE]• Add photos (🖼️) to attach sticky notes.\n• أضف صوراً (🖼️) لتظهر كملصقات على الورقة.\n\n• Text auto-wraps around the sticky notes!\n• يلتف النص تلقائياً حول الملصقات اللاصقة!\n\n• Typing past the last line auto-creates Page 3!\n• الكتابة بعد آخر سطر تنشئ صفحة ٣ تلقائياً!';
      
      const defaultEnOld = 'Welcome to Werash Notes! 📝\n\n• Use the arrows (◀/▶) above to flip pages.\n• Tap the Date Chip to set a log date.[PAGE]• Add photos (🖼️) to attach sticky notes.\n\n• Text auto-wraps around the sticky notes!\n\n• Typing past the last line auto-creates Page 3!';
      
      const defaultArOld = 'مرحباً بك في ملاحظات وِرَش! 📝\n\n• استخدم الأسهم (◀/▶) في الأعلى للتنقل.\n• اضغط على شريحة التاريخ لتحديد يوم.[PAGE]• أضف صوراً (🖼️) لتظهر كملصقات على الورقة.\n\n• يلتف النص تلقائياً حول الملصقات اللاصقة!\n\n• الكتابة بعد آخر سطر تنشئ صفحة ٣ تلقائياً!';

      const combinedDefaultNew = 'Welcome to Werash Notes! 📝\nمرحباً بك في ملاحظات وِرَش!\n\n• Use the arrows (◀/▶) above to flip pages.\n• استخدم الأسهم (◀/▶) في الأعلى للتنقل.\n\n• Tap the Date Chip to set a log date.\n• اضغط على شريحة التاريخ لتحديد يوم.\n• Add photos (🖼️) to attach sticky notes.\n• أضف صوراً (🖼️) لتظهر كملصقات على الورقة.\n• Text auto-wraps around the sticky notes!\n• يلتف النص تلقائياً حول الملصقات اللاصقة!';
      
      const defaultEnNew = 'Welcome to Werash Notes! 📝\n\n• Use the arrows (◀/▶) above to flip pages.\n• Tap the Date Chip to set a log date.\n• Add photos (🖼️) to attach sticky notes.\n• Text auto-wraps around the sticky notes!';
      
      const defaultArNew = 'مرحباً بك في ملاحظات وِرَش! 📝\n\n• استخدم الأسهم (◀/▶) في الأعلى للتنقل.\n• اضغط على شريحة التاريخ لتحديد يوم.\n• أضف صوراً (🖼️) لتظهر كملصقات على الورقة.\n• يلتف النص تلقائياً حول الملصقات اللاصقة!';
      
      if (notesText === combinedDefaultOld || notesText === defaultEnOld || notesText === defaultArOld ||
          notesText === combinedDefaultNew || notesText === defaultEnNew || notesText === defaultArNew) {
        notesText = selectedLanguage === 'Arabic' ? defaultArNew : defaultEnNew;
      }
      
      const pages = notesText.split('[PAGE]');
      const filledPages = [...pages];
      while (filledPages.length < 50) {
        filledPages.push('');
      }
      setNotePages(filledPages.slice(0, 50));
      setCurrentPage(0);
      
      const dates = activeVehicle.noteDate ? activeVehicle.noteDate.split('[PAGE]') : [];
      const filledDates = [...dates];
      while (filledDates.length < 50) {
        filledDates.push(null);
      }
      const parsedDates = filledDates.slice(0, 50).map(d => (d === '' || d === 'null' || !d) ? null : d);
      setNoteDates(parsedDates);
      
      let initialImages = activeVehicle.noteImages;
      if (initialImages && Array.isArray(initialImages)) {
        if (initialImages.length > 0 && typeof initialImages[0] === 'string') {
          const newImages = Array.from({ length: 50 }, () => []);
          newImages[0] = [...initialImages];
          setNoteImages(newImages);
        } else {
          const newImages = Array.from({ length: 50 }, () => []);
          initialImages.forEach((imgArr, idx) => {
            if (idx < 50 && Array.isArray(imgArr)) {
              newImages[idx] = [...imgArr];
            }
          });
          setNoteImages(newImages);
        }
      } else {
        setNoteImages(Array.from({ length: 50 }, () => []));
      }
      
      setIsNotesSaved(true);
      setIsEditing(false);
      setTextTop('');
      setTextBottom('');
      setRemainingText('');
    } else {
      setNotePages(Array(50).fill(''));
      setCurrentPage(0);
      setNoteDates(Array(50).fill(null));
      setNoteImages(Array.from({ length: 50 }, () => []));
      setIsEditing(false);
      setTextTop('');
      setTextBottom('');
      setRemainingText('');
    }
  }, [activeVehicleId, selectedLanguage]);

  // Reset text layout buffers on page turn to prevent flicker
  React.useEffect(() => {
    setTextTop('');
    setTextBottom('');
    setRemainingText('');
  }, [currentPage]);

  const getCharIndexAtLine = (fullText, layoutLines, lineCount) => {
    if (!layoutLines || layoutLines.length <= lineCount) {
      return fullText.length;
    }
    
    let currentIdx = 0;
    for (let i = 0; i < lineCount; i++) {
      if (!layoutLines[i]) break;
      const lineText = layoutLines[i].text;
      const foundIdx = fullText.indexOf(lineText, currentIdx);
      if (foundIdx !== -1) {
        currentIdx = foundIdx + lineText.length;
      } else {
        currentIdx += lineText.length;
      }
    }
    
    while (currentIdx < fullText.length && (fullText[currentIdx] === '\n' || fullText[currentIdx] === '\r')) {
      currentIdx++;
    }
    
    return currentIdx;
  };

  const handleChangeText = (val) => {
    const newlines = val.split('\n');
    if (newlines.length > 13) {
      const top = newlines.slice(0, 13).join('\n');
      const updated = [...notePages];
      updated[currentPage] = top;
      setNotePages(updated);
      setIsNotesSaved(false);
      return;
    }

    const updated = [...notePages];
    updated[currentPage] = val;
    setNotePages(updated);
    setIsNotesSaved(false);
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace' && currentPage > 0 && notePages[currentPage] === '') {
      setCurrentPage(currentPage - 1);
      setTimeout(() => {
        notebookInputRef.current?.focus();
      }, 50);
    }
  };

  const splitTextAtLines = (fullText, layoutLines, maxLines) => {
    if (!layoutLines || layoutLines.length <= maxLines) {
      return [fullText, ''];
    }
    
    let currentIdx = 0;
    for (let i = 0; i < maxLines; i++) {
      if (!layoutLines[i]) break;
      const lineText = layoutLines[i].text;
      const foundIdx = fullText.indexOf(lineText, currentIdx);
      if (foundIdx !== -1) {
        currentIdx = foundIdx + lineText.length;
      } else {
        currentIdx += lineText.length;
      }
    }
    
    while (currentIdx < fullText.length && (fullText[currentIdx] === '\n' || fullText[currentIdx] === '\r')) {
      currentIdx++;
    }
    
    const top = fullText.slice(0, currentIdx);
    const bottom = fullText.slice(currentIdx);
    return [top, bottom];
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      notebookInputRef.current?.focus();
    }, 50);
  };

  const renderStickyStack = (extraStyle = {}) => {
    const pageImages = noteImages[currentPage] || [];
    if (pageImages.length === 0) return null;
    
    const sliceCount = Math.min(pageImages.length, 3);
    const cards = [];
    for (let i = sliceCount - 1; i >= 0; i--) {
      cards.push({ uri: pageImages[i], originalIdx: i });
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.notebookStickyStackRelative,
          isRtl 
            ? { alignSelf: 'flex-start', marginLeft: 14 } 
            : { alignSelf: 'flex-end', marginRight: 14 },
          extraStyle
        ]}
        onPress={() => setIsImageModalOpen(true)}
        activeOpacity={0.9}
      >
        {cards.map(({ uri, originalIdx }) => {
          let rotateDeg = '-2deg';
          let translateX = 0;
          let translateY = 0;
          let zIndex = 3 - originalIdx;
          
          if (originalIdx === 0) {
            rotateDeg = '-2deg';
            translateX = 0;
            translateY = 0;
          } else if (originalIdx === 1) {
            rotateDeg = '4deg';
            translateX = 3;
            translateY = 4;
          } else if (originalIdx === 2) {
            rotateDeg = '-6deg';
            translateX = -3;
            translateY = 8;
          }
          
          const stickyColors = ['#FFF9C4', '#FFE0B2', '#E0F7FA', '#FCE4EC', '#F1F8E9'];
          const bgColor = stickyColors[originalIdx % stickyColors.length];
          
          return (
            <View
              key={originalIdx}
              style={[
                styles.stickyStackCard,
                {
                  backgroundColor: bgColor,
                  zIndex,
                  transform: [
                    { rotate: rotateDeg },
                    { translateX },
                    { translateY }
                  ]
                }
              ]}
            >
              {originalIdx === 0 && (
                <View style={[styles.stickyPanelTape, { backgroundColor: bgColor + 'B3', width: 22, height: 9, marginBottom: -5 }]} />
              )}
              <Image
                source={{ uri }}
                style={styles.stickyStackImage}
                resizeMode="cover"
              />
            </View>
          );
        })}
        {pageImages.length > 3 && (
          <View style={styles.stickyStackBadge}>
            <Text style={styles.stickyStackBadgeText}>
              +{pageImages.length - 3}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleStartEditStatus = () => {
    if (activeVehicle) {
      setTempOdometer(activeVehicle.odometer ? activeVehicle.odometer.toLocaleString('en-US') : '');
      setSelectedPartKey(null);
      setIsEditingStatus(true);
      setIsSwitchingVehicle(false);
      setShowAddForm(false);
    }
  };

  const handleSaveNotes = () => {
    if (!activeVehicle) return;
    const joined = notePages.join('[PAGE]');
    const joinedDates = noteDates.map(d => d === null ? '' : d).join('[PAGE]');
    setUserVehicles(prev =>
      prev.map(v => v.id === activeVehicle.id
        ? { ...v, notes: joined, noteDate: joinedDates, noteImages: noteImages }
        : v)
    );
    setIsNotesSaved(true);
    notebookInputRef.current?.blur();
  };

  const handleAddImage = async () => {
    const pageImages = noteImages[currentPage] || [];
    if (pageImages.length >= 4) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'الحد الأقصى للصور' : 'Photo Limit Reached',
        selectedLanguage === 'Arabic'
          ? 'يمكنك إضافة ٤ صور كحد أقصى لكل صفحة.'
          : 'You can add a maximum of 4 photos per page.',
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'إذن مطلوب' : 'Permission needed',
        selectedLanguage === 'Arabic'
          ? 'يرجى السماح بالوصول إلى الصور'
          : 'Please allow access to your photo library.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setNoteImages(prev => {
        const updated = prev.map((imgArr, pageIdx) => {
          if (pageIdx === currentPage) {
            return [...(imgArr || []), result.assets[0].uri];
          }
          return imgArr;
        });
        return updated;
      });
      setIsNotesSaved(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setNoteImages(prev => {
      const updated = prev.map((imgArr, pageIdx) => {
        if (pageIdx === currentPage && Array.isArray(imgArr)) {
          return imgArr.filter((_, i) => i !== idx);
        }
        return imgArr;
      });
      return updated;
    });
    setIsNotesSaved(false);
  };

  const handleSelectPartForEdit = (itemKey) => {
    if (activeVehicle) {
      const carService = activeVehicle.services?.[itemKey] || {};
      const lastService = carService.lastService ?? (itemKey === 'engineOil' ? (activeVehicle.lastOil ?? 10000) : 10000);
      
      const meta = SERVICE_ITEMS_METADATA.find(m => m.key === itemKey);
      const defaultLife = meta ? meta.defaultLifespan : 10000;
      const lifespan = carService.lifespan ?? (itemKey === 'engineOil' ? (activeVehicle.oilLife ?? defaultLife) : defaultLife);

      setTempServices({
        [itemKey]: {
          lastService: lastService ? lastService.toLocaleString('en-US') : '',
          lifespan: lifespan ? lifespan.toLocaleString('en-US') : ''
        }
      });
      setSelectedPartKey(itemKey);
    }
  };

  const handleUpdatePartStatus = (itemKey) => {
    if (!tempOdometer.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' 
          ? 'يرجى إدخال عداد المسافات الحالي لتحديث البيانات.' 
          : 'Please enter the current odometer to update details.'
      );
      return;
    }

    const odoVal = parseInt(tempOdometer.replace(/[^0-9]/g, '')) || 0;
    const itemTemp = tempServices[itemKey] || {};
    const lastServiceVal = parseInt((itemTemp.lastService || '').replace(/[^0-9]/g, '')) || 0;
    const lifespanVal = parseInt((itemTemp.lifespan || '').replace(/[^0-9]/g, '')) || 0;

    const meta = SERVICE_ITEMS_METADATA.find(m => m.key === itemKey) || { labelEn: itemKey, labelAr: itemKey };
    const dateObj = getFormattedDate();
    const newLog = {
      id: `log-edit-part-${Date.now()}`,
      titleEn: `${meta.labelEn} Service`,
      titleAr: `خدمة ${meta.labelAr}`,
      descEn: `Completed service interval reset at ${odoVal.toLocaleString('en-US')} km • Lifespan: ${lifespanVal.toLocaleString('en-US')} km`,
      descAr: `تمت إعادة ضبط فترة الخدمة عند ${odoVal.toLocaleString('ar-EG')} كم • العمر الافتراضي: ${lifespanVal.toLocaleString('ar-EG')} كم`,
      dateEn: dateObj.dateEn,
      dateAr: dateObj.dateAr,
      odometer: odoVal,
      costEn: 'Self Logged',
      costAr: 'مُسجل ذاتياً'
    };

    const updatedVehicles = userVehicles.map(car => {
      if (car.id === activeVehicleId) {
        const currentServices = car.services || {};
        const currentLogs = car.logs || [];
        const newServices = {
          ...currentServices,
          [itemKey]: {
            lastService: lastServiceVal,
            lifespan: lifespanVal
          }
        };
        return {
          ...car,
          odometer: odoVal,
          services: newServices,
          logs: [newLog, ...currentLogs],
          // Maintain flat fields for backward compatibility
          lastOil: itemKey === 'engineOil' ? lastServiceVal : car.lastOil,
          oilLife: itemKey === 'engineOil' ? lifespanVal : car.oilLife
        };
      }
      return car;
    });

    setUserVehicles(updatedVehicles);
    setSelectedPartKey(null); // Return to list

    Alert.alert(
      selectedLanguage === 'Arabic' ? 'نجاح' : 'Success',
      selectedLanguage === 'Arabic' ? 'تم تحديث بيانات الصيانة بنجاح!' : 'Service details updated successfully!'
    );
  };

  const getLiveCalculation = (key, defaultLifespan) => {
    const odoVal = parseInt(tempOdometer.replace(/[^0-9]/g, '')) || 0;
    const itemTemp = tempServices[key] || {};
    const lastVal = parseInt((itemTemp.lastService || '').replace(/[^0-9]/g, '')) || 0;
    const lifeVal = parseInt((itemTemp.lifespan || '').replace(/[^0-9]/g, '')) || 0;
    
    const nextVal = lastVal + lifeVal;
    const remaining = nextVal - odoVal;
    const isArabic = selectedLanguage === 'Arabic';
    
    let text = '';
    let color = colors.textMuted;
    
    if (remaining > 0) {
      text = isArabic 
        ? `التغيير القادم: عند ${nextVal.toLocaleString('ar-EG')} كم`
        : `Next due: At ${nextVal.toLocaleString('en-US')} km`;
      if (remaining / lifeVal <= 0.3) {
        color = '#E2B13C'; // yellow/orange warning
      } else {
        color = colors.bgBrand; // green
      }
    } else {
      text = isArabic 
        ? `متجاوز الموعد! عند ${nextVal.toLocaleString('ar-EG')} كم`
        : `Overdue! At ${nextVal.toLocaleString('en-US')} km`;
      color = colors.accentRed || '#B54D4F';
    }
    
    return { text, color };
  };

  const handleUpdateStatus = () => {
    if (!tempOdometer.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' 
          ? 'يرجى إدخال عداد المسافات الحالي لتحديث البيانات.' 
          : 'Please enter the current odometer to update details.'
      );
      return;
    }

    const odoVal = parseInt(tempOdometer.replace(/[^0-9]/g, '')) || 0;
    
    const updatedServices = {};
    SERVICE_ITEMS_METADATA.forEach(item => {
      const itemTemp = tempServices[item.key] || {};
      const lastService = parseInt((itemTemp.lastService || '').replace(/[^0-9]/g, '')) || 0;
      const lifespan = parseInt((itemTemp.lifespan || '').replace(/[^0-9]/g, '')) || 0;
      updatedServices[item.key] = {
        lastService,
        lifespan
      };
    });

    const dateObj = getFormattedDate();
    const newLog = {
      id: `log-bulk-edit-${Date.now()}`,
      titleEn: `Bulk Service & Mileage Update`,
      titleAr: `تحديث جماعي لحالة الصيانة والمسافات`,
      descEn: `Odometer updated to ${odoVal.toLocaleString('en-US')} km. Multiple service intervals recalculated.`,
      descAr: `تم تحديث عداد المسافات إلى ${odoVal.toLocaleString('ar-EG')} كم. تم إعادة حساب فترات الصيانة المتعددة.`,
      dateEn: dateObj.dateEn,
      dateAr: dateObj.dateAr,
      odometer: odoVal,
      costEn: 'Self Logged',
      costAr: 'مُسجل ذاتياً'
    };

    const updatedVehicles = userVehicles.map(car => {
      if (car.id === activeVehicleId) {
        const currentLogs = car.logs || [];
        return {
          ...car,
          odometer: odoVal,
          services: updatedServices,
          logs: [newLog, ...currentLogs],
          // Maintain flat fields for compatibility
          lastOil: updatedServices.engineOil?.lastService ?? car.lastOil,
          oilLife: updatedServices.engineOil?.lifespan ?? car.oilLife
        };
      }
      return car;
    });

    setUserVehicles(updatedVehicles);
    setIsEditingStatus(false);

    Alert.alert(
      selectedLanguage === 'Arabic' ? 'نجاح' : 'Success',
      selectedLanguage === 'Arabic' ? 'تم تحديث سجلات الصيانة بنجاح!' : 'Service status records updated successfully!'
    );
  };

  const handleSaveCar = () => {
    if (!brand.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' ? 'يرجى تحديد ماركة السيارة.' : 'Please select a car brand.'
      );
      return;
    }
    if (!model.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' ? 'يرجى إدخال موديل السيارة.' : 'Please enter a car model.'
      );
      return;
    }
    if (!year.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' ? 'يرجى إدخال سنة الصنع.' : 'Please enter the manufacturing year.'
      );
      return;
    }


    // Generate default services mapping
    const defaultCarServices = {};
    SERVICE_ITEMS_METADATA.forEach(item => {
      defaultCarServices[item.key] = {
        lastService: 10000,
        lifespan: item.defaultLifespan
      };
    });

    const odoVal = 15000;
    const dateObj = getFormattedDate();
    const initialLog = {
      id: `log-initial-${Date.now()}`,
      titleEn: `Vehicle Registered in Warsha`,
      titleAr: `تم تسجيل المركبة في وِرَش`,
      descEn: `Initial setup of vehicle log book at ${odoVal.toLocaleString('en-US')} km.`,
      descAr: `الإعداد الأولي لدفتر صيانة المركبة عند عداد ${odoVal.toLocaleString('ar-EG')} كم.`,
      dateEn: dateObj.dateEn,
      dateAr: dateObj.dateAr,
      odometer: odoVal,
      costEn: 'Setup',
      costAr: 'إعداد'
    };

    const newCar = {
      id: Date.now().toString(),
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim() || new Date().getFullYear().toString(),
      plateNumber: plateNumber.trim(),
      plateNumberArabic: plateNumber.trim(),
      cc: cc.trim() || '1600 CC',
      odometer: odoVal,
      isManual: isManualCar,
      is4WD: false,
      hasHydraulicPS: false,
      hasTimingBelt: false,
      services: defaultCarServices,
      logs: [initialLog], // Initial log entry
      lastOil: 10000,
      oilLife: 10000,
    };

    const updated = [...userVehicles, newCar];
    setUserVehicles(updated);
    setActiveVehicleId(newCar.id);
    setShowAddForm(false);
    setWizardStep(1);
    
    // Clear inputs
    setBrand('');
    setModel('');
    setYear('');
    setPlateNumber('');
    setPlateNumbers('');
    setPlateLetters('');
    setCc('');
    setIsManualCar(false);

    Alert.alert(
      selectedLanguage === 'Arabic' ? 'نجاح' : 'Success',
      selectedLanguage === 'Arabic' ? 'تمت إضافة المركبة بنجاح!' : 'Vehicle added successfully!'
    );
  };

  const handleRemoveCar = (carId, carBrand, carModel) => {
    Alert.alert(
      t.confirmRemoveTitle,
      t.confirmRemoveMsg(carBrand, carModel),
      [
        { text: t.confirmRemoveNo, style: 'cancel' },
        { 
          text: t.confirmRemoveYes, 
          style: 'destructive',
          onPress: () => {
            const filtered = userVehicles.filter(v => v.id !== carId);
            setUserVehicles(filtered);
            if (activeVehicleId === carId) {
              setActiveVehicleId(filtered.length > 0 ? filtered[0].id : null);
            }
          }
        }
      ]
    );
  };

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 10)
    lines.push(
      <View
        key="top-solid-block"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          backgroundColor: colors.bgCreamy,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 10 to y = 20
    const numLines = 20;
    const startY = 10;
    const endY = 20;
    const step = (endY - startY) / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: colors.bgCreamy,
            opacity: opacity,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      );
    }
    return lines;
  };

  

  // GUEST STATE RENDER
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIllustration}>
            <Ionicons name="car-sport-outline" size={76} color={colors.bgBrand} style={{ opacity: 0.15 }} />
          </View>
          <Text style={styles.guestTitle}>{t.guestTitle}</Text>
          <Text style={styles.guestText}>{t.guestText}</Text>
          <TouchableOpacity 
            style={styles.guestButton} 
            activeOpacity={0.8}
            onPress={onOpenSignIn}
          >
            <Text style={styles.guestButtonText}>{t.signInBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderPartSelectionPage = () => {
    if (!activeVehicle) return null;
    const isArabic = selectedLanguage === 'Arabic';
    
    const filteredMetadata = SERVICE_ITEMS_METADATA.filter(item => {
      if (item.condition === 'isManual' && !activeVehicle?.isManual) return false;
      if (item.condition === 'is4WD' && !activeVehicle?.is4WD) return false;
      if (item.condition === 'hasHydraulicPS' && !activeVehicle?.hasHydraulicPS) return false;
      if (item.condition === 'hasTimingBelt' && !activeVehicle?.hasTimingBelt) return false;
      return true;
    });

    const data = getVehicleServiceData(activeVehicle);

    return (
      <View style={{ width: '100%' }}>
        <Text style={[styles.formHeader, isRtl && { textAlign: 'right' }]}>
          {isArabic ? 'اختر الجزء لتعديله' : 'Select Part to Edit'}
        </Text>

        {/* Current Odometer display & Edit card */}
        <View style={[styles.odoInfoCard, isRtl && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.odoInfoCardText, isRtl && { alignItems: 'flex-end' }]}>
            <Text style={styles.odoInfoCardLabel}>{isArabic ? 'عداد المسافات الحالي' : 'Current Odometer'}</Text>
            <Text style={styles.odoInfoCardValue}>{data.odoStr}</Text>
          </View>
          <View style={[styles.compactOdoInputWrapper, isRtl && { flexDirection: 'row-reverse' }]}>
            <TextInput
              style={[styles.compactOdoInput, isRtl && { textAlign: 'right' }]}
              value={tempOdometer}
              onChangeText={(val) => {
                const cleaned = val.replace(/[^0-9]/g, '');
                const formatted = cleaned ? parseInt(cleaned).toLocaleString('en-US') : '';
                setTempOdometer(formatted);
                const updated = userVehicles.map(car => car.id === activeVehicleId ? { ...car, odometer: parseInt(cleaned) || 0 } : car);
                setUserVehicles(updated);
              }}
              keyboardType="number-pad"
              placeholder="12,450"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.compactOdoUnit}>{isArabic ? 'كم' : 'KM'}</Text>
          </View>
        </View>

        {/* Scrollable list of part cards */}
        <ScrollView 
          style={styles.modalFieldsScrollView}
          contentContainerStyle={{ paddingRight: 8 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {filteredMetadata.map(item => {
            const carService = activeVehicle?.services?.[item.key] || {};
            const lastService = carService.lastService ?? (item.key === 'engineOil' ? (activeVehicle?.lastOil ?? 10000) : 10000);
            const lifespan = carService.lifespan ?? (item.key === 'engineOil' ? (activeVehicle?.oilLife ?? 10000) : item.defaultLifespan);
            const nextServiceAt = lastService + lifespan;
            const remaining = nextServiceAt - (activeVehicle?.odometer || 0);
            
            let statusColor = colors.bgBrand;
            if (remaining > 0) {
              if (remaining / lifespan <= 0.3) statusColor = '#E2B13C';
            } else {
              statusColor = colors.accentRed || '#B54D4F';
            }

            const nextServiceAtStr = isArabic
              ? `${nextServiceAt.toLocaleString('ar-EG')} كم`
              : `${nextServiceAt.toLocaleString('en-US')} km`;

            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.partSelectCard, isRtl && { flexDirection: 'row-reverse' }]}
                activeOpacity={0.8}
                onPress={() => handleSelectPartForEdit(item.key)}
              >
                <View style={[styles.partSelectCardLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.partSelectIconContainer, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons name={item.icon} size={16} color={statusColor} />
                  </View>
                  <View style={[styles.partSelectTextContainer, isRtl ? { marginRight: 10, marginLeft: 0 } : { marginLeft: 10 }]}>
                    <Text style={[styles.partSelectLabel, isRtl && { textAlign: 'right' }]}>
                      {isArabic ? item.labelAr : item.labelEn}
                    </Text>
                    <Text style={[styles.partSelectDueAt, isRtl && { textAlign: 'right' }]}>
                      {isArabic ? 'موعد الصيانة: ' : 'Due: '}{nextServiceAtStr}
                    </Text>
                  </View>
                </View>
                <View style={[styles.partSelectCardRight, isRtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.partStatusDot, { backgroundColor: statusColor }]} />
                  <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.formActions, { marginTop: 10 }]}>
          <TouchableOpacity 
            style={[styles.cancelBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={() => setIsEditingStatus(false)}
          >
            <Text style={styles.cancelBtnText}>{isArabic ? 'إغلاق' : 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPartEditPage = () => {
    if (!activeVehicle) return null;
    const isArabic = selectedLanguage === 'Arabic';
    const item = SERVICE_ITEMS_METADATA.find(m => m.key === selectedPartKey);
    if (!item) return null;

    const live = getLiveCalculation(item.key, item.defaultLifespan);
    const lastFocusKey = `lastService-${item.key}`;
    const lifeFocusKey = `lifespan-${item.key}`;

    return (
      <View style={{ width: '100%' }}>
        <View style={[styles.editPageHeader, isRtl && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity 
            style={[styles.editPageBackButton, isRtl && { flexDirection: 'row-reverse' }]}
            onPress={() => setSelectedPartKey(null)}
            activeOpacity={0.7}
          >
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.bgBrand} />
            <Text style={styles.editPageBackButtonText}>{isArabic ? 'رجوع' : 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.editPageTitle}>
            {isArabic ? 'تعديل الجزء' : 'Edit Part'}
          </Text>
        </View>

        <Text style={[styles.editPagePartName, isRtl && { textAlign: 'right' }]}>
          {isArabic ? item.labelAr : item.labelEn}
        </Text>

        <ScrollView style={styles.modalFieldsScrollView} showsVerticalScrollIndicator={false}>


          {/* Last Changed input */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
              {isArabic ? 'آخر صيانة (قراءة العداد)' : 'Last Service (Odometer)'}
            </Text>
            <View style={[
              styles.premiumInputWrapper,
              focusedInput === lastFocusKey && styles.inputFocusedStyle,
              isRtl && { flexDirection: 'row-reverse' }
            ]}>
              <Ionicons name="refresh-circle-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
              <TextInput 
                style={[styles.premiumInput, isRtl && { textAlign: 'right' }]}
                value={tempServices[item.key]?.lastService || ''}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  const formatted = cleaned ? parseInt(cleaned).toLocaleString('en-US') : '';
                  setTempServices(prev => ({
                    ...prev,
                    [item.key]: {
                      ...prev[item.key],
                      lastService: formatted
                    }
                  }));
                }}
                keyboardType="number-pad"
                placeholder="e.g. 10,000"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setFocusedInput(lastFocusKey)}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={[
                styles.inputUnitBadge, 
                isRtl 
                  ? { borderRightWidth: 1.5, borderRightColor: colors.borderGreen } 
                  : { borderLeftWidth: 1.5, borderLeftColor: colors.borderGreen }
              ]}>
                <Text style={styles.inputUnitText}>{isArabic ? 'كم' : 'KM'}</Text>
              </View>
            </View>
          </View>

          {/* Expected Lifespan input */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
              {isArabic ? 'المسافة المتوقعة (العمر الافتراضي)' : 'Expected Lifespan Distance'}
            </Text>
            <View style={[
              styles.premiumInputWrapper,
              focusedInput === lifeFocusKey && styles.inputFocusedStyle,
              isRtl && { flexDirection: 'row-reverse' }
            ]}>
              <Ionicons name="hourglass-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
              <TextInput 
                style={[styles.premiumInput, isRtl && { textAlign: 'right' }]}
                value={tempServices[item.key]?.lifespan || ''}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  const formatted = cleaned ? parseInt(cleaned).toLocaleString('en-US') : '';
                  setTempServices(prev => ({
                    ...prev,
                    [item.key]: {
                      ...prev[item.key],
                      lifespan: formatted
                    }
                  }));
                }}
                keyboardType="number-pad"
                placeholder="e.g. 10,000"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setFocusedInput(lifeFocusKey)}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={[
                styles.inputUnitBadge, 
                isRtl 
                  ? { borderRightWidth: 1.5, borderRightColor: colors.borderGreen } 
                  : { borderLeftWidth: 1.5, borderLeftColor: colors.borderGreen }
              ]}>
                <Text style={styles.inputUnitText}>{isArabic ? 'كم' : 'KM'}</Text>
              </View>
            </View>
          </View>

          {/* Live Preview badge */}
          <View style={{ marginTop: 15, padding: 12, borderRadius: 12, backgroundColor: live.color + '10', borderWidth: 1, borderColor: live.color + '30' }}>
            <Text style={[{ fontSize: 11.5, fontWeight: '700', color: live.color }, isRtl && { textAlign: 'right' }]}>
              {live.text}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.formActions, isRtl && { flexDirection: 'row-reverse' }, { marginTop: 15 }]}>
          <TouchableOpacity 
            style={[styles.submitBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={() => handleUpdatePartStatus(item.key)}
          >
            <Text style={styles.submitBtnText}>
              {isArabic ? 'حفظ التعديلات' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cancelBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={() => setSelectedPartKey(null)}
          >
            <Text style={styles.cancelBtnText}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Edit Service Status Modal (Centered Blur Card Overlay)
  const renderEditStatusModal = () => {
    return (
      <Modal
        visible={isEditingStatus}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditingStatus(false)}
      >
        <View style={styles.overlayContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1}
              onPress={() => setIsEditingStatus(false)}
            />
          </BlurView>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.overlayCardContainer}
          >
            <View style={styles.formContainerModal}>
              {selectedPartKey === null ? renderPartSelectionPage() : renderPartEditPage()}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Edit Notes Modal (Ruled Note Sheet Pop-up above Keyboard)
  const renderEditNotesModal = () => {
    return (
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          handleSaveNotes();
          setIsEditing(false);
        }}
      >
        <View style={styles.editModalAvoidingView}>
          <TouchableOpacity
            style={styles.modalBlurOverlay}
            activeOpacity={1}
            onPress={() => {
              handleSaveNotes();
              setIsEditing(false);
            }}
          >
            <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={isKeyboardVisible ? styles.editKeyboardAvoidingView : styles.editModalAvoidingView}
          >
            <View style={[
              styles.editModalSheetContainer,
              { marginBottom: isKeyboardVisible ? (Platform.OS === 'ios' ? 20 : 12) : 0 }
            ]}>
              {/* Modal Ruled Paper Sheet */}
              <View 
                style={[styles.notebookPaper, styles.editModalRuledPaper]}
                onLayout={(e) => setPaperWidth(e.nativeEvent.layout.width)}
              >
                 {/* Header row inside the paper sheet */}
                <View style={[
                  styles.editModalHeaderRow, 
                  isRtl && { flexDirection: 'row-reverse' },
                  { borderBottomWidth: 0, borderBottomColor: 'transparent' }
                ]}>
                  <Text style={styles.editModalTitle}>
                    {selectedLanguage === 'Arabic' 
                      ? `تعديل صفحة ${currentPage + 1}` 
                      : `Edit Page ${currentPage + 1}`}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.editModalDoneBtn}
                    onPress={() => {
                      handleSaveNotes();
                      setIsEditing(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={colors.bgBrand} style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                    <Text style={styles.editModalDoneText}>
                      {selectedLanguage === 'Arabic' ? 'حفظ' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Ruled lines background */}
                <View style={[styles.notebookLinesArea, { top: 48 }]}>
                  {Array.from({ length: 13 }, (_, i) => (
                    <View key={i} style={[styles.notebookRuledLine, { height: 26 }]} />
                  ))}
                </View>

                <TextInput
                  ref={notebookInputRef}
                  style={[
                    styles.notebookTextInputRelative,
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 48,
                      height: 350,
                      maxHeight: 350,
                      overflow: 'hidden',
                      paddingTop: Platform.OS === 'android' ? 0 : 2,
                      paddingBottom: 0,
                      minHeight: undefined,
                      lineHeight: 26,
                    },
                    hasArabicCharacters(notePages[currentPage]) 
                      ? { 
                          textAlign: 'right', 
                          writingDirection: 'rtl', 
                          fontFamily: 'ArefRuqaa-Regular', 
                          fontSize: 14.5,
                          paddingLeft: 14,
                          paddingRight: 14
                        } 
                      : { 
                          fontFamily: 'Caveat-Regular', 
                          fontSize: 16,
                          paddingRight: 14,
                          paddingLeft: 14
                        }
                  ]}
                  multiline
                  value={notePages[currentPage]}
                  onChangeText={handleChangeText}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedLanguage === 'Arabic' ? 'اكتب ملاحظاتك هنا...' : 'Start writing your notes here...'}
                  placeholderTextColor={colors.textMuted + '60'}
                  textAlignVertical="top"
                  scrollEnabled={false}
                  cursorColor={colors.bgBrand}
                  selectionColor={colors.bgBrand + '40'}
                  underlineColorAndroid="transparent"
                  autoFocus
                />

                {/* Hidden Text for Edit Modal layout split */}
                {paperWidth > 0 && (
                  <Text
                    style={[
                      hasArabicCharacters(notePages[currentPage]) 
                        ? { fontFamily: 'ArefRuqaa-Regular', fontSize: 14.5 } 
                        : { fontFamily: 'Caveat-Regular', fontSize: 16 },
                      { 
                        lineHeight: 26, 
                        position: 'absolute', 
                        opacity: 0, 
                        left: -9999, 
                        width: paperWidth - 28 
                      }
                    ]}
                    onTextLayout={(e) => {
                      const layoutLines = e.nativeEvent.lines;
                      if (layoutLines.length > 13) {
                        const splitIdx = getCharIndexAtLine(notePages[currentPage] || '', layoutLines, 13);
                        const top = (notePages[currentPage] || '').slice(0, splitIdx);
                        
                        const updated = [...notePages];
                        updated[currentPage] = top;
                        setNotePages(updated);
                        setIsNotesSaved(false);
                      }
                    }}
                  >
                    {notePages[currentPage] || ' '}
                  </Text>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // MEMBER STATE RENDER
  return (
    <View style={styles.container}>
      {renderGradientOverlay()}

      {/* ── Custom Calendar Modal ───────────────────────────────── */}
      <Modal
        visible={isCalendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <TouchableOpacity
          style={styles.calModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsCalendarOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.calModalCard}>
              {/* Month navigation header */}
              {(() => {
                const yr   = calendarViewDate.getFullYear();
                const mo   = calendarViewDate.getMonth();
                const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
                const monthLabel = selectedLanguage === 'Arabic' ? `${monthsAr[mo]} ${yr}` : `${monthsEn[mo]} ${yr}`;

                // Build calendar grid
                const firstDay = new Date(yr, mo, 1).getDay(); // 0=Sun
                const daysInMonth = new Date(yr, mo + 1, 0).getDate();
                const today = new Date();
                const selDate = noteDates[currentPage] ? new Date(noteDates[currentPage]) : null;

                const prevMonth = () => setCalendarViewDate(new Date(yr, mo - 1, 1));
                const nextMonth = () => setCalendarViewDate(new Date(yr, mo + 1, 1));

                const dayHeaders = selectedLanguage === 'Arabic'
                  ? ['أح','إث','ث','أر','خ','ج','س']
                  : ['Su','Mo','Tu','We','Th','Fr','Sa'];

                // Flatten grid cells: leading blanks + day numbers
                const cells = [];
                for (let b = 0; b < firstDay; b++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                // Pad to full rows
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <>
                    {/* Header */}
                    <View style={[styles.calHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity style={styles.calNavBtn} onPress={isRtl ? nextMonth : prevMonth} activeOpacity={0.7}>
                        <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={18} color={colors.bgBrand} />
                      </TouchableOpacity>
                      <Text style={styles.calMonthLabel}>{monthLabel}</Text>
                      <TouchableOpacity style={styles.calNavBtn} onPress={isRtl ? prevMonth : nextMonth} activeOpacity={0.7}>
                        <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={18} color={colors.bgBrand} />
                      </TouchableOpacity>
                    </View>

                    {/* Day-of-week headers */}
                    <View style={[styles.calDayHeaders, isRtl && { flexDirection: 'row-reverse' }]}>
                      {dayHeaders.map((d, i) => (
                        <Text key={i} style={styles.calDayHeader}>{d}</Text>
                      ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.calGrid}>
                      {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
                        <View key={rowIdx} style={[styles.calRow, isRtl && { flexDirection: 'row-reverse' }]}>
                          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                            if (!day) return <View key={colIdx} style={styles.calCell} />;
                            const thisDate = new Date(yr, mo, day);
                            const isToday  = today.getDate() === day && today.getMonth() === mo && today.getFullYear() === yr;
                            const isSel    = selDate && selDate.getDate() === day && selDate.getMonth() === mo && selDate.getFullYear() === yr;
                            return (
                              <TouchableOpacity
                                key={colIdx}
                                style={[styles.calCell, isSel && styles.calCellSelected, isToday && !isSel && styles.calCellToday]}
                                onPress={() => {
                                  const updated = [...noteDates];
                                  updated[currentPage] = thisDate.toISOString();
                                  setNoteDates(updated);
                                  setIsNotesSaved(false);
                                  setIsCalendarOpen(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.calCellText, isSel && styles.calCellTextSelected, isToday && !isSel && styles.calCellTextToday]}>
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>

                    {/* Clear date button */}
                    {noteDates[currentPage] && (
                      <TouchableOpacity
                        style={styles.calClearBtn}
                        onPress={() => {
                          const updated = [...noteDates];
                          updated[currentPage] = null;
                          setNoteDates(updated);
                          setIsNotesSaved(false);
                          setIsCalendarOpen(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={colors.textMuted} style={{ marginRight: 5 }} />
                        <Text style={styles.calClearBtnText}>
                          {selectedLanguage === 'Arabic' ? 'مسح التاريخ' : 'Clear date'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Scrollable Photo Gallery Lightbox Modal ───────────────── */}
      <Modal
        visible={isImageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImageModalOpen(false)}
      >
        <View style={styles.galleryModalContainer}>
          {/* Modal Header */}
          <View style={[styles.galleryModalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.galleryModalTitleText}>
              {selectedLanguage === 'Arabic' ? 'الصور المرفقة' : 'Attached Photos'}
            </Text>
            <TouchableOpacity 
              style={styles.galleryHeaderCloseBtn} 
              onPress={() => setIsImageModalOpen(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Scrollable Carousel - occupying full screen width for smooth swipe */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={220} // width (200) + gap (20)
            snapToAlignment="center"
            style={styles.galleryScroll}
            contentContainerStyle={[
              styles.galleryScrollContent,
              { paddingHorizontal: (screenWidth - 200) / 2 },
              isRtl && { flexDirection: 'row-reverse' }
            ]}
          >
            {(noteImages[currentPage] || []).map((uri, index) => {
              const stickyColors = ['#FFF9C4', '#FFE0B2', '#E0F7FA', '#FCE4EC', '#F1F8E9'];
              const bgColor = stickyColors[index % stickyColors.length];
              
              return (
                <View key={index} style={[styles.galleryPolaroidCard, { backgroundColor: bgColor }]}>
                  {/* Polaroid tape strip */}
                  <View style={[styles.galleryTapeStrip, { backgroundColor: bgColor + 'CC' }]} />
                  
                  <View style={styles.galleryImageContainer}>
                    <Image
                      source={{ uri }}
                      style={styles.galleryPolaroidImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  {/* Delete button overlay - elegant round trash icon */}
                  <TouchableOpacity
                    style={styles.galleryPolaroidDeleteBtn}
                    onPress={() => {
                      handleRemoveImage(index);
                      if ((noteImages[currentPage] || []).length <= 1) {
                        setIsImageModalOpen(false);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {/* Dashed Add card at the end of carousel */}
            {((noteImages[currentPage] || []).length < 4) && (
              <TouchableOpacity
                style={styles.galleryPolaroidAddBtn}
                onPress={handleAddImage}
                activeOpacity={0.75}
              >
                <View style={styles.galleryAddIconCircle}>
                  <Ionicons name="camera" size={24} color={colors.bgBrand} />
                </View>
                <Text style={styles.galleryPolaroidAddText}>
                  {selectedLanguage === 'Arabic' ? 'إضافة صورة' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Swipe indicator label */}
          <Text style={styles.gallerySwipeIndicator}>
            {selectedLanguage === 'Arabic' 
              ? 'اسحب لليمين أو اليسار لعرض المزيد • اضغط بالخارج للإغلاق' 
              : 'Swipe left or right to view more • Tap outside to close'}
          </Text>
        </View>
      </Modal>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />

        {/* Active Vehicle Card (extended details) */}
        <ActiveVehicleCard 
          currentUser={currentUser} 
          onOpenSignIn={onOpenSignIn} 
          selectedLanguage={selectedLanguage} 
          activeVehicle={activeVehicle}
          showExtendedInfo={true}
          style={{ marginHorizontal: 0, marginTop: 0 }}
          onChangePress={() => {
            setIsSwitchingVehicle(prev => !prev);
            setShowAddForm(false);
          }}
          onAddPress={() => {
            setWizardStep(1);
            setBrand('');
            setModel('');
            setYear('');
            setPlateNumber('');
            setPlateNumbers('');
            setPlateLetters('');
            setCc('');
            setIsManualCar(false);
            setBrandSearchQuery('');
            setModelSearchQuery('');
            setShowAddForm(true);
            setIsSwitchingVehicle(false);
          }}
        />

        {/* Service & Mileage Status Card */}
        {activeVehicle && (
          (() => {
            const data = getVehicleServiceData(activeVehicle);
            return (
              <View style={styles.statusCard}>
                <BlurView
                  intensity={65}
                  tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
                  style={StyleSheet.absoluteFill}
                />
                {/* Header */}
                <View style={[styles.statusCardHeader, isRtl && { flexDirection: 'row-reverse' }, { justifyContent: 'space-between', alignItems: 'center' }]}>
                  {/* Left Side: Title */}
                  <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons 
                      name={cardMode === 'services' ? "speedometer-outline" : "book-outline"} 
                      size={20} 
                      color={colors.bgBrand} 
                      style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} 
                    />
                    <Text style={[styles.statusCardTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 15.0, lineHeight: 19 }]}>
                      {cardMode === 'services' 
                        ? (selectedLanguage === 'Arabic' ? "إحصائيات وحالة\nالصيانة" : "Service & Mileage\nStatus")
                        : (selectedLanguage === 'Arabic' ? "ملاحظاتي" : "My Notes")}
                    </Text>
                  </View>
                  
                  {/* Right Side: Mode Toggle */}
                  <View style={[styles.headerModeToggleContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[styles.headerModeToggleButton, cardMode === 'services' && styles.headerModeToggleButtonActive]}
                      onPress={() => setCardMode('services')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={cardMode === 'services' ? "list" : "list-outline"} 
                        size={20} 
                        color={cardMode === 'services' ? colors.bgBrand : colors.textMuted} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.headerModeToggleButton, cardMode === 'logbook' && styles.headerModeToggleButtonActive]}
                      onPress={() => setCardMode('logbook')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={cardMode === 'logbook' ? "journal" : "journal-outline"} 
                        size={20} 
                        color={cardMode === 'logbook' ? colors.bgBrand : colors.textMuted} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Service Status Mode */}
                {cardMode === 'services' && (
                  <View>
                    {/* Main Readout: Odometer & Edit Button */}
                    <View style={[styles.mainReadoutContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                      <View style={[isRtl && { alignItems: 'flex-end' }]}>
                        <Text style={[styles.readoutLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5, lineHeight: 15 }, isRtl && { textAlign: 'right' }]}>{t.odometer}</Text>
                        {renderTextWithSystemNumbers(data.odoStr, isRtl, styles.readoutValue, 20.0)}
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.statusEditButton, isRtl && { flexDirection: 'row-reverse' }]} 
                        onPress={handleStartEditStatus}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={15} color={colors.bgBrand} style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }} />
                        <Text style={[styles.statusEditButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0, lineHeight: 17 }]}>{selectedLanguage === 'Arabic' ? 'تعديل' : 'Edit'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Divider Line */}
                    <View style={styles.statusDivider} />

                    {/* Service Items List */}
                    <View style={styles.serviceListContainer}>
                      {data.servicesList.slice(0, isCardExpanded ? undefined : 3).map((item, index) => {
                        return (
                          <View key={item.key} style={styles.serviceItemCard}>
                            {/* Title & Icon Header */}
                            <View style={[styles.serviceCardHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                              <View style={[styles.serviceCardIconWrap, { backgroundColor: item.statusColor + '12' }]}>
                                <Ionicons name={item.icon} size={15} color={item.statusColor} />
                              </View>
                              <Text style={[styles.serviceCardTitleText, isRtl ? { marginRight: 10, marginLeft: 0 } : { marginLeft: 10 }, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.2, lineHeight: 18 }]}>
                                {item.label}
                              </Text>
                            </View>

                            {/* Inline Progress Bar */}
                            <View style={styles.serviceCardProgressContainer}>
                              <View style={styles.serviceCardProgressBarBg}>
                                <View style={[styles.serviceCardProgressBarFill, { width: `${item.progress * 100}%`, backgroundColor: item.statusColor }]} />
                              </View>
                            </View>

                            {/* Bottom Stats Grid (Boxes) */}
                            <View style={[styles.serviceCardStatsGrid, isRtl && { flexDirection: 'row-reverse' }]}>
                              {/* Last Service Box */}
                              <View style={[styles.serviceStatBox, styles.serviceStatBoxLeft, isRtl && { alignItems: 'flex-end' }]}>
                                <Text style={[styles.serviceStatBoxLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.0, lineHeight: 13 }, isRtl && { textAlign: 'right' }]}>
                                  {isRtl ? 'آخر صيانة' : 'LAST SERVICE'}
                                </Text>
                                {renderTextWithSystemNumbers(item.lastServiceStr, isRtl, styles.serviceStatBoxValue, 13.0)}
                              </View>

                              {/* Limit Due Box */}
                              <View style={[
                                styles.serviceStatBox, 
                                styles.serviceStatBoxRight, 
                                { backgroundColor: item.statusColor + '08', borderColor: item.statusColor + '18' },
                                isRtl ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }
                              ]}>
                                <Text style={[styles.serviceStatBoxLabel, { color: item.statusColor }, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.0, lineHeight: 13 }, isRtl && { textAlign: 'left' }]}>
                                  {isRtl ? 'مستحق عند' : 'DUE AT'}
                                </Text>
                                {renderTextWithSystemNumbers(
                                  item.remaining <= 0 
                                    ? (isRtl ? 'متجاوز! ' + item.nextServiceAtStr : 'Overdue! ' + item.nextServiceAtStr) 
                                    : item.nextServiceAtStr,
                                  isRtl,
                                  [styles.serviceStatBoxValue, { color: item.statusColor }, isRtl && { textAlign: 'left' }],
                                  13.0
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Notes Mode - Notebook Style */}
                {cardMode === 'logbook' && (
                  <View style={styles.notebookContainer}>
                    {/* Notebook header row */}
                    <View style={[styles.notebookHeaderRow, isRtl && { flexDirection: 'row-reverse' }, { alignItems: 'center' }]}>
                      {/* Pagination Bar (under My Notes title on the left) */}
                      <View style={{
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                        <TouchableOpacity
                          onPress={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          style={{
                            padding: 6,
                            borderRadius: 8,
                            backgroundColor: currentPage === 0 ? colors.borderGreen + '20' : colors.bgBrandLight,
                          }}
                        >
                          <Ionicons 
                            name={isRtl ? "chevron-forward" : "chevron-back"} 
                            size={16} 
                            color={currentPage === 0 ? colors.textMuted : colors.bgBrand} 
                          />
                        </TouchableOpacity>

                        <Text style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.textDark,
                          minWidth: 80,
                          textAlign: 'center',
                        }}>
                          {selectedLanguage === 'Arabic' 
                            ? `صفحة ${currentPage + 1} من ${notePages.length}` 
                            : `Page ${currentPage + 1} of ${notePages.length}`}
                        </Text>

                        <TouchableOpacity
                          onPress={() => setCurrentPage(prev => Math.min(notePages.length - 1, prev + 1))}
                          disabled={currentPage === notePages.length - 1}
                          style={{
                            padding: 6,
                            borderRadius: 8,
                            backgroundColor: currentPage === notePages.length - 1 ? colors.borderGreen + '20' : colors.bgBrandLight,
                          }}
                        >
                          <Ionicons 
                            name={isRtl ? "chevron-back" : "chevron-forward"} 
                            size={16} 
                            color={currentPage === notePages.length - 1 ? colors.textMuted : colors.bgBrand} 
                          />
                        </TouchableOpacity>

                        {/* Manual Add Page button removed */}
                      </View>

                    </View>

                    {/* The notebook paper */}
                    <View 
                      style={styles.notebookPaper}
                      onLayout={(e) => setPaperWidth(e.nativeEvent.layout.width)}
                    >
                      {/* Ruled lines background */}
                      <View style={styles.notebookLinesArea}>
                        {Array.from({ length: 13 }, (_, i) => (
                          <View key={i} style={styles.notebookRuledLine} />
                        ))}
                      </View>

                      {/* Controls inside paper sheet: Date chip & Photo button next to each other */}
                      <View style={[
                        styles.notebookPaperHeaderControls,
                        isRtl ? { left: 12, flexDirection: 'row-reverse' } : { right: 12, flexDirection: 'row' }
                      ]}>
                        {/* Photo button */}
                        <TouchableOpacity
                          style={styles.notebookPhotoBtn}
                          onPress={handleAddImage}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="image-outline" size={15} color={colors.bgBrand} />
                        </TouchableOpacity>

                        {/* Date chip */}
                        <TouchableOpacity
                          style={[
                            styles.notebookDateChip,
                            noteDates[currentPage] && styles.notebookDateChipFilled
                          ]}
                          onPress={() => {
                            if (noteDates[currentPage]) setCalendarViewDate(new Date(noteDates[currentPage]));
                            setIsCalendarOpen(true);
                          }}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={noteDates[currentPage] ? "calendar" : "calendar-outline"}
                            size={12}
                            color={noteDates[currentPage] ? colors.white : colors.bgBrand}
                            style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
                          />
                          <Text style={[styles.notebookDateChipText, noteDates[currentPage] && styles.notebookDateChipTextFilled]}>
                            {noteDates[currentPage]
                              ? (() => {
                                  const d = new Date(noteDates[currentPage]);
                                  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                  const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
                                  return selectedLanguage === 'Arabic'
                                    ? `${d.getDate()} ${monthsAr[d.getMonth()]} ${d.getFullYear()}`
                                    : `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                                })()
                              : (selectedLanguage === 'Arabic' ? 'أضف تاريخ' : 'Add date')
                            }
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView 
                        style={styles.notebookScroll} 
                        contentContainerStyle={styles.notebookScrollContent}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                      >
                        {/* Hidden Text 1 for Page narrow layout split */}
                        {paperWidth > 0 && !isEditing && (noteImages[currentPage] || []).length > 0 && (
                          <Text
                            style={[
                              hasArabicCharacters(notePages[currentPage]) 
                                ? { fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                              { 
                                lineHeight: 32,
                                position: 'absolute', 
                                opacity: 0, 
                                left: -9999, 
                                width: paperWidth - 110 - 28 - 24 
                              }
                            ]}
                            onTextLayout={(e) => {
                              const layoutLines = e.nativeEvent.lines;
                              const splitIdx1 = getCharIndexAtLine(notePages[currentPage] || '', layoutLines, 4);
                              const top = (notePages[currentPage] || '').slice(0, splitIdx1);
                              const remaining = (notePages[currentPage] || '').slice(splitIdx1);
                              setTextTop(top);
                              setRemainingText(remaining);
                            }}
                          >
                            {notePages[currentPage] || ' '}
                          </Text>
                        )}

                        {/* Hidden Text 2 for Page remaining full-width layout split */}
                        {paperWidth > 0 && !isEditing && (noteImages[currentPage] || []).length > 0 && remainingText.length > 0 && (
                          <Text
                            style={[
                              hasArabicCharacters(remainingText) 
                                ? { fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                              { 
                                lineHeight: 32,
                                position: 'absolute', 
                                opacity: 0, 
                                left: -9999, 
                                width: paperWidth - 28 
                              }
                            ]}
                            onTextLayout={(e) => {
                              const layoutLines = e.nativeEvent.lines;
                              if (layoutLines.length > 9) {
                                const splitIdx = getCharIndexAtLine(remainingText, layoutLines, 9);
                                const bottom = remainingText.slice(0, splitIdx);
                                const overflow = remainingText.slice(splitIdx);
                                
                                if (overflow.length > 0) {
                                  setTextBottom(bottom);
                                  const updated = [...notePages];
                                  updated[currentPage] = textTop + bottom;
                                  if (currentPage === notePages.length - 1) {
                                    updated.push(overflow);
                                  } else {
                                    updated[currentPage + 1] = overflow + (updated[currentPage + 1] || '');
                                  }
                                  setNotePages(updated);
                                  if (isEditing) {
                                    setCurrentPage(currentPage + 1);
                                    setIsNotesSaved(false);
                                  }
                                } else {
                                  setTextBottom(remainingText);
                                }
                              } else {
                                setTextBottom(remainingText);
                              }
                            }}
                          >
                            {remainingText}
                          </Text>
                        )}

                        {/* Hidden Text 3 for Page without images layout split */}
                        {paperWidth > 0 && !isEditing && (noteImages[currentPage] || []).length === 0 && (
                          <Text
                            style={[
                              hasArabicCharacters(notePages[currentPage]) 
                                ? { fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                              { 
                                lineHeight: 32,
                                position: 'absolute', 
                                opacity: 0, 
                                left: -9999, 
                                width: paperWidth - 28 
                              }
                            ]}
                            onTextLayout={(e) => {
                              const layoutLines = e.nativeEvent.lines;
                              if (layoutLines.length > 13) {
                                const splitIdx = getCharIndexAtLine(notePages[currentPage] || '', layoutLines, 13);
                                const top = (notePages[currentPage] || '').slice(0, splitIdx);
                                const overflow = (notePages[currentPage] || '').slice(splitIdx);
                                
                                if (overflow.length > 0) {
                                  const updated = [...notePages];
                                  updated[currentPage] = top;
                                  if (currentPage === notePages.length - 1) {
                                    updated.push(overflow);
                                  } else {
                                    updated[currentPage + 1] = overflow + (updated[currentPage + 1] || '');
                                  }
                                  setNotePages(updated);
                                  if (isEditing) {
                                    setCurrentPage(currentPage + 1);
                                    setIsNotesSaved(false);
                                  }
                                }
                              }
                            }}
                          >
                            {notePages[currentPage] || ' '}
                          </Text>
                        )}

                        <TouchableOpacity
                          style={{ flex: 1, minHeight: 380 }}
                          onPress={handleStartEditing}
                          activeOpacity={0.95}
                        >
                          {(noteImages[currentPage] || []).length > 0 && (textTop || textBottom) ? (
                            <View style={{ flex: 1 }}>
                              {/* Top section: text and sticky note stack side-by-side */}
                              <View style={{ 
                                flexDirection: isRtl ? 'row-reverse' : 'row', 
                                paddingTop: 52,
                                paddingLeft: 14,
                                paddingRight: 14,
                              }}>
                                <Text
                                  style={[
                                    hasArabicCharacters(textTop) 
                                      ? { textAlign: 'right', writingDirection: 'rtl', fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                      : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                                    { 
                                      lineHeight: 32, 
                                      color: colors.textDark,
                                      width: paperWidth > 0 ? paperWidth - 110 - 28 - 24 : '60%', 
                                    }
                                  ]}
                                >
                                  {textTop || ' '}
                                </Text>
                                
                                {/* Inline Sticky Note Stack in Read Mode */}
                                {renderStickyStack({
                                  marginTop: 0,
                                  marginBottom: 0,
                                  alignSelf: 'flex-start',
                                  marginRight: isRtl ? 0 : 24,
                                  marginLeft: isRtl ? 24 : 0,
                                })}
                              </View>
                              
                              {/* Bottom section: remaining text full-width */}
                              {textBottom ? (
                                <Text
                                  style={[
                                    hasArabicCharacters(textBottom) 
                                      ? { textAlign: 'right', writingDirection: 'rtl', fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                      : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                                    { 
                                      lineHeight: 32, 
                                      color: colors.textDark,
                                      paddingLeft: 14,
                                      paddingRight: 14,
                                      marginTop: 0,
                                    }
                                  ]}
                                >
                                  {textBottom}
                                </Text>
                              ) : null}
                            </View>
                          ) : (
                            // No images, or layout not calculated yet: render full-width
                            <Text
                              style={[
                                hasArabicCharacters(notePages[currentPage]) 
                                  ? { textAlign: 'right', writingDirection: 'rtl', fontFamily: 'ArefRuqaa-Regular', fontSize: 16.5 } 
                                  : { fontFamily: 'Caveat-Regular', fontSize: 19 },
                                { 
                                  lineHeight: 32, 
                                  color: colors.textDark,
                                  paddingLeft: 14,
                                  paddingRight: 14,
                                  paddingTop: 52,
                                }
                              ]}
                            >
                              {notePages[currentPage] || (selectedLanguage === 'Arabic' ? 'اكتب ملاحظاتك هنا...' : 'Start writing your notes here...')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </ScrollView>
                    </View>

                    {/* Character count */}
                    <Text style={[styles.notebookCharCount, isRtl && { textAlign: 'left' }]}>
                      {notePages[currentPage]?.length || 0} {selectedLanguage === 'Arabic' ? 'حرف' : 'chars'}
                    </Text>
                  </View>
                )}

                {/* Expand/Collapse Button (services mode only) */}
                {cardMode === 'services' && data.servicesList.length > 3 && (
                  <TouchableOpacity 
                    style={[styles.expandCollapseButton, isRtl && { flexDirection: 'row-reverse' }]}
                    onPress={() => setIsCardExpanded(prev => !prev)}
                    activeOpacity={0.75}
                  >
                    {renderTextWithSystemNumbers(
                      isCardExpanded 
                        ? (selectedLanguage === 'Arabic' ? 'عرض أقل' : 'Show Less') 
                        : (selectedLanguage === 'Arabic' 
                            ? `عرض المزيد (+${data.servicesList.length - 3})` 
                            : `Show More (+${data.servicesList.length - 3})`),
                      isRtl,
                      styles.expandCollapseButtonText,
                      11.2
                    )}
                    <Ionicons 
                      name={isCardExpanded ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color={colors.bgBrand} 
                      style={isRtl ? { marginRight: 6 } : { marginLeft: 6 }} 
                    />
                  </TouchableOpacity>
                )}
                {/* 3D Glossy Bevel Highlight Overlay */}
                <View style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: 'transparent',
                  borderTopColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                  borderLeftColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                }} pointerEvents="none" />
              </View>
            );
          })()
        )}

        {/* Add New Car Fullscreen Wizard Modal */}
        <Modal
          visible={showAddForm}
          animationType="slide"
          onRequestClose={() => {
            setShowAddForm(false);
            setWizardStep(1);
          }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.wizardModalContainer, { backgroundColor: colors.bgCreamy }]}
          >
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.bgCreamy} />
            
            {/* Wizard Header */}
            <View style={[styles.wizardHeader, isRtl && { flexDirection: 'row-reverse' }]}>
              {wizardStep > 1 ? (
                <TouchableOpacity 
                  style={styles.wizardBackButton}
                  activeOpacity={0.7}
                  onPress={handleWizardBack}
                >
                  <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={colors.textDark} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
              <Text style={styles.wizardHeaderTitle}>{t.addNewCarHeader}</Text>
              <TouchableOpacity 
                style={styles.wizardCloseButton}
                activeOpacity={0.7}
                onPress={() => {
                  setShowAddForm(false);
                  setWizardStep(1);
                  setBrand('');
                  setModel('');
                  setYear('');
                  setPlateNumber('');
                  setPlateNumbers('');
                  setPlateLetters('');
                  setCc('');
                  setIsManualCar(false);
                }}
              >
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Stepper Progress Bar */}
            <View style={styles.stepperContainer}>
              <View style={[styles.stepperLabels, isRtl && { flexDirection: 'row-reverse' }]}>
                {[1, 2, 3, 4].map((step) => {
                  const isActive = wizardStep === step;
                  const isDone = wizardStep > step;
                  return (
                    <View key={step} style={styles.stepperDotContainer}>
                      <View style={[
                        styles.stepperDot,
                        isActive && styles.stepperDotActive,
                        isDone && styles.stepperDotDone
                      ]}>
                        {isDone ? (
                          <Ionicons name="checkmark" size={10} color={colors.white} />
                        ) : (
                          <Text style={[
                            styles.stepperDotText,
                            isActive && styles.stepperDotTextActive
                          ]}>
                            {step}
                          </Text>
                        )}
                      </View>
                      <Text style={[
                        styles.stepperLabelText,
                        isActive && styles.stepperLabelTextActive
                      ]}>
                        {step === 1 ? (selectedLanguage === 'Arabic' ? 'الماركة' : 'Brand') :
                         step === 2 ? (selectedLanguage === 'Arabic' ? 'الموديل' : 'Model') :
                         step === 3 ? (selectedLanguage === 'Arabic' ? 'السنة' : 'Year') :
                                      (selectedLanguage === 'Arabic' ? 'التفاصيل' : 'Details')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Wizard Body Container */}
            <View style={styles.wizardBodyContainer}>
              {/* STEP 1: SELECT BRAND */}
              {wizardStep === 1 && (() => {
                const filteredBrands = CAR_BRAND_LIST.filter(b =>
                  b.nameEn.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                  b.nameAr.toLowerCase().includes(brandSearchQuery.toLowerCase())
                );

                return (
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.brandScrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={[styles.wizardPrompt, isRtl && { textAlign: 'right' }]}>
                      {selectedLanguage === 'Arabic' ? 'اختر ماركة السيارة' : 'Select Car Brand'}
                    </Text>

                    {/* Brand Search Bar at the Top */}
                    <View style={styles.searchBarWrapper}>
                      <Ionicons name="search" size={18} color={colors.textMuted} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                      <TextInput 
                        style={[styles.wizardSearchInput, isRtl && { textAlign: 'right' }]}
                        placeholder={selectedLanguage === 'Arabic' ? 'ابحث عن ماركة...' : 'Search brand...'}
                        placeholderTextColor={colors.textMuted}
                        value={brandSearchQuery}
                        onChangeText={setBrandSearchQuery}
                      />
                      {brandSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setBrandSearchQuery('')} style={{ padding: 4 }}>
                          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Brands Selection Grid */}
                    <View style={[styles.brandGrid, isRtl && { flexDirection: 'row-reverse' }]}>
                      {filteredBrands.map((item) => {
                        const brandName = selectedLanguage === 'Arabic' ? item.nameAr : item.nameEn;
                        const isBrandSelected = brand.toLowerCase() === item.nameEn.toLowerCase();
                        const logoSource = BRAND_LOGOS[item.nameEn.toLowerCase()];
                        
                        const brandKey = item.nameEn.toLowerCase();
                        let logoSize = 56;
                        const paddedLogos = [
                          'acura', 'changan', 'dongfeng', 'fiat', 'ds', 
                          'hyundai', 'honda', 'lada', 'mg', 'porsche', 
                          'proton', 'volkswagen'
                        ];
                        if (paddedLogos.includes(brandKey)) {
                          logoSize = 68;
                        }
                        
                        return (
                          <TouchableOpacity
                            key={item.nameEn}
                            style={[
                              styles.brandCard,
                              isBrandSelected && styles.brandCardSelected
                            ]}
                            activeOpacity={0.85}
                            onPress={() => {
                              setBrand(item.nameEn);
                              setBrandSearchQuery('');
                              setModel('');
                              setModelSearchQuery('');
                              setWizardStep(2);
                            }}
                          >
                            <View style={[
                              styles.brandEmblemBadge,
                              isBrandSelected && styles.brandEmblemBadgeSelected
                            ]}>
                              {logoSource ? (
                                <Image 
                                  source={logoSource} 
                                  style={[styles.brandLogoImage, { width: logoSize, height: logoSize }]} 
                                  resizeMode="contain" 
                                />
                              ) : (
                                <Text style={[
                                  styles.brandEmblemLetter,
                                  isBrandSelected && styles.brandEmblemLetterSelected
                                ]}>
                                  {item.nameEn.charAt(0)}
                                </Text>
                              )}
                            </View>

                            <Text style={[
                              styles.brandCardText,
                              isBrandSelected && styles.brandCardTextSelected
                            ]}>
                              {brandName}
                            </Text>

                            {isBrandSelected && (
                              <View style={styles.brandSelectionIndicator}>
                                <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {filteredBrands.length === 0 && (
                      <Text style={styles.emptySearchText}>
                        {selectedLanguage === 'Arabic' ? 'لا توجد ماركات مطابقة للبحث.' : 'No matching brands found.'}
                      </Text>
                    )}
                  </ScrollView>
                );
              })()}

              {/* STEP 2: SELECT MODEL */}
              {wizardStep === 2 && (() => {
                const brandModels = getBrandModels(brand);
                const filteredModels = brandModels.filter(m => 
                  m.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
                );
                const brandEmblem = BRAND_LOGOS[brand.toLowerCase()] || BRAND_LOGOS[brand.toLowerCase().replace(/\s+/g, '-')];
                
                return (
                  <View style={styles.stepContainer}>
                    {/* Selected Brand Context Card */}
                    <View style={[styles.selectedBrandBanner, isRtl && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.selectedBrandBannerLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                        {brandEmblem ? (
                          <Image source={brandEmblem} style={styles.selectedBrandBannerLogo} resizeMode="contain" />
                        ) : null}
                        <View style={isRtl ? { marginRight: 8 } : { marginLeft: 8 }}>
                          <Text style={[styles.selectedBrandBannerTitle, isRtl && { textAlign: 'right' }]}>{brand}</Text>
                          <Text style={[styles.selectedBrandBannerSubtitle, isRtl && { textAlign: 'right' }]}>
                            {brandModels.length > 0 
                              ? (selectedLanguage === 'Arabic' ? `${brandModels.length} موديل متاح` : `${brandModels.length} models available`)
                              : (selectedLanguage === 'Arabic' ? 'موديل مخصص' : 'Custom model')}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.changeBrandBtn} 
                        activeOpacity={0.7}
                        onPress={() => {
                          setWizardStep(1);
                          setModel('');
                          setModelSearchQuery('');
                        }}
                      >
                        <Text style={styles.changeBrandBtnText}>
                          {selectedLanguage === 'Arabic' ? 'تغيير' : 'Change'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.wizardPrompt, isRtl && { textAlign: 'right' }]}>
                      {selectedLanguage === 'Arabic' 
                        ? `اختر موديل سيارتك الـ ${brand}` 
                        : `Select the model of your ${brand}`}
                    </Text>

                    {/* Search Input */}
                    <View style={styles.searchBarWrapper}>
                      <Ionicons name="search" size={18} color={colors.textMuted} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                      <TextInput 
                        style={[styles.wizardSearchInput, isRtl && { textAlign: 'right' }]}
                        placeholder={selectedLanguage === 'Arabic' ? 'ابحث عن الموديل أو اكتب مخصصاً...' : 'Search model or type custom...'}
                        placeholderTextColor={colors.textMuted}
                        value={modelSearchQuery}
                        onChangeText={setModelSearchQuery}
                      />
                      {modelSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setModelSearchQuery('')} style={{ padding: 4 }}>
                          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Native Model List (No nested ScrollView - full flex: 1) */}
                    <ScrollView 
                      style={styles.modelListNativeScroll} 
                      contentContainerStyle={styles.modelListNativeScrollContent}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {/* Custom Option based on Search Query */}
                      {modelSearchQuery.trim().length > 0 && !brandModels.some(m => m.name.toLowerCase() === modelSearchQuery.toLowerCase()) && (
                        <TouchableOpacity
                          style={[styles.customModelOptionCard, isRtl && { flexDirection: 'row-reverse' }]}
                          onPress={() => {
                            setModel(modelSearchQuery.trim());
                            setModelSearchQuery('');
                            setWizardStep(3);
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                          <Text style={styles.customModelOptionText}>
                            {selectedLanguage === 'Arabic' 
                              ? `استخدم الموديل المخصص: "${modelSearchQuery}"` 
                              : `Use custom model: "${modelSearchQuery}"`}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {filteredModels.map((item) => {
                        const isSelected = model.toLowerCase() === item.name.toLowerCase();
                        const modelThumb = getModelThumbnail(brand, item);
                        
                        return (
                          <TouchableOpacity
                            key={item.name}
                            style={[
                              styles.modelListItem,
                              isRtl && { flexDirection: 'row-reverse' },
                              isSelected && styles.modelListItemSelected
                            ]}
                            activeOpacity={0.75}
                            onPress={() => {
                              setModel(item.name);
                              setModelSearchQuery('');
                              setWizardStep(3);
                            }}
                          >
                            {/* Model Thumbnail Preview */}
                            <View style={[styles.modelListItemThumbnail, isSelected && styles.modelListItemThumbnailSelected]}>
                              {modelThumb ? (
                                <Image source={modelThumb} style={styles.modelListItemImage} resizeMode="contain" />
                              ) : (
                                <Ionicons name="car-outline" size={22} color={isSelected ? colors.white : colors.bgBrand} />
                              )}
                            </View>

                            <View style={[styles.modelListItemTextContainer, isRtl && { alignItems: 'flex-end' }]}>
                              <Text style={[
                                styles.modelListItemText,
                                isSelected && styles.modelListItemTextSelected
                              ]}>
                                {item.name}
                              </Text>
                              <Text style={[
                                styles.modelListItemSubtext,
                                isSelected && styles.modelListItemSubtextSelected
                              ]}>
                                {selectedLanguage === 'Arabic' 
                                  ? `سنوات الإنتاج: ${item.startYear} - ${item.endYear}` 
                                  : `Years: ${item.startYear} - ${item.endYear}`}
                              </Text>
                            </View>
                            
                            <View style={[styles.modelListCheckmarkCircle, isSelected && styles.modelListCheckmarkCircleActive]}>
                              {isSelected ? (
                                <Ionicons name="checkmark" size={12} color={colors.white} />
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {filteredModels.length === 0 && modelSearchQuery.trim().length === 0 && (
                        brandModels.length > 0 ? (
                          <Text style={styles.emptySearchText}>
                            {selectedLanguage === 'Arabic' ? 'لا توجد نتائج مطابقة.' : 'No matching results found.'}
                          </Text>
                        ) : (
                          <View style={{ marginTop: 10 }}>
                            <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
                              {selectedLanguage === 'Arabic' ? 'اكتب موديل السيارة مخصصاً:' : 'Type custom model name:'}
                            </Text>
                            <View style={[styles.customInputRow, isRtl && { flexDirection: 'row-reverse' }]}>
                              <TextInput 
                                style={[styles.wizardInput, { flex: 1 }, isRtl && { textAlign: 'right' }]}
                                placeholder={selectedLanguage === 'Arabic' ? 'مثال: كوبيه' : 'e.g. Coupe'}
                                placeholderTextColor={colors.textMuted}
                                value={model}
                                onChangeText={setModel}
                              />
                            </View>
                          </View>
                        )
                      )}
                    </ScrollView>
                  </View>
                );
              })()}

              {/* STEP 3: SELECT YEAR */}
              {wizardStep === 3 && (() => {
                const brandModels = getBrandModels(brand);
                const matchedModelObj = brandModels.find(m => m.name.toLowerCase() === model.toLowerCase());
                const brandEmblem = BRAND_LOGOS[brand.toLowerCase()] || BRAND_LOGOS[brand.toLowerCase().replace(/\s+/g, '-')];
                
                let startY = 1980;
                let endY = new Date().getFullYear();
                if (matchedModelObj) {
                  startY = matchedModelObj.startYear || 1980;
                  endY = matchedModelObj.endYear || new Date().getFullYear();
                }
                
                const yearsList = [];
                for (let y = endY; y >= startY; y--) {
                  yearsList.push(y.toString());
                }

                return (
                  <View style={styles.stepContainer}>
                    {/* Selected Model Context Card */}
                    <View style={[styles.selectedBrandBanner, isRtl && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.selectedBrandBannerLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                        {brandEmblem ? (
                          <Image source={brandEmblem} style={styles.selectedBrandBannerLogo} resizeMode="contain" />
                        ) : null}
                        <View style={isRtl ? { marginRight: 8 } : { marginLeft: 8 }}>
                          <Text style={[styles.selectedBrandBannerTitle, isRtl && { textAlign: 'right' }]}>{brand} {model}</Text>
                          <Text style={[styles.selectedBrandBannerSubtitle, isRtl && { textAlign: 'right' }]}>
                            {selectedLanguage === 'Arabic' ? `${startY} - ${endY}` : `Production: ${startY} - ${endY}`}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.changeBrandBtn} 
                        activeOpacity={0.7}
                        onPress={() => {
                          setWizardStep(2);
                          setYear('');
                        }}
                      >
                        <Text style={styles.changeBrandBtnText}>
                          {selectedLanguage === 'Arabic' ? 'تغيير' : 'Change'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.wizardPrompt, isRtl && { textAlign: 'right' }]}>
                      {selectedLanguage === 'Arabic' 
                        ? `اختر سنة صنع سيارتك الـ ${brand} ${model}` 
                        : `Select the year of your ${brand} ${model}`}
                    </Text>

                    {/* Native Year Grid */}
                    <ScrollView 
                      style={styles.yearScrollNative}
                      contentContainerStyle={styles.yearGridContent}
                      showsVerticalScrollIndicator={true}
                    >
                      <View style={[styles.yearGrid, isRtl && { flexDirection: 'row-reverse' }]}>
                        {yearsList.map((yrItem) => {
                          const isSelected = year === yrItem;
                          return (
                            <TouchableOpacity
                              key={yrItem}
                              style={[
                                styles.yearCard,
                                isSelected && styles.yearCardSelected
                              ]}
                              activeOpacity={0.8}
                              onPress={() => {
                                setYear(yrItem);
                                setWizardStep(4);
                              }}
                            >
                              {renderTextWithSystemNumbers(
                                yrItem,
                                isRtl,
                                isSelected ? styles.yearCardTextSelected : styles.yearCardText,
                                13
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                );
              })()}

              {/* STEP 4: DETAILS (TRANSMISSION & PLATE) */}
              {wizardStep === 4 && (
                <ScrollView 
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.detailsScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Selected Car Summary */}
                  <View style={[styles.selectedBrandBanner, isRtl && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.selectedBrandBannerLeft, isRtl && { flexDirection: 'row-reverse' }]}>
                      <View style={isRtl ? { marginRight: 4 } : { marginLeft: 4 }}>
                        <Text style={[styles.selectedBrandBannerTitle, isRtl && { textAlign: 'right' }]}>{brand} {model}</Text>
                        <Text style={[styles.selectedBrandBannerSubtitle, isRtl && { textAlign: 'right' }]}>
                          {selectedLanguage === 'Arabic' ? `موديل ${year}` : `${year} Model`}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.changeBrandBtn} 
                      activeOpacity={0.7}
                      onPress={() => setWizardStep(3)}
                    >
                      <Text style={styles.changeBrandBtnText}>
                        {selectedLanguage === 'Arabic' ? 'تعديل' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.wizardPrompt, isRtl && { textAlign: 'right' }]}>
                    {selectedLanguage === 'Arabic' ? 'اختر ناقل الحركة ورقم اللوحة' : 'Transmission & Plate Number'}
                  </Text>

                  {/* Transmission Selection Cards */}
                  <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
                    {selectedLanguage === 'Arabic' ? 'ناقل الحركة:' : 'Transmission:'}
                  </Text>
                  <View style={[styles.transmissionRow, isRtl && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[
                        styles.transmissionCard,
                        !isManualCar && styles.transmissionCardSelected
                      ]}
                      onPress={() => setIsManualCar(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name="cog" 
                        size={24} 
                        color={!isManualCar ? colors.bgCreamy : colors.bgBrand} 
                      />
                      <Text style={[
                        styles.transmissionCardText,
                        !isManualCar && styles.transmissionCardTextSelected
                      ]}>
                        {selectedLanguage === 'Arabic' ? 'أوتوماتيك' : 'Automatic'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.transmissionCard,
                        isManualCar && styles.transmissionCardSelected
                      ]}
                      onPress={() => setIsManualCar(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name="speedometer-outline" 
                        size={24} 
                        color={isManualCar ? colors.bgCreamy : colors.bgBrand} 
                      />
                      <Text style={[
                        styles.transmissionCardText,
                        isManualCar && styles.transmissionCardTextSelected
                      ]}>
                        {selectedLanguage === 'Arabic' ? 'مانيوال / عادي' : 'Manual'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formGroup, { marginTop: 15 }]}>
                    <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
                      {selectedLanguage === 'Arabic' ? 'رقم لوحة السيارة (اختياري):' : 'Plate Number (Optional):'}
                    </Text>
                    <View style={styles.plateInputContainer}>
                      <View style={styles.metalPlate}>
                        <View style={[styles.plateScrew, { left: 10 }]} />
                        <View style={[styles.plateScrew, { right: 10 }]} />

                        <View style={[styles.plateHeaderBand, isRtl && { flexDirection: 'row-reverse' }]}>
                          <Text style={styles.plateHeaderCountryEn}>EGYPT</Text>
                          <Text style={styles.plateHeaderCountryAr}>مِصْر</Text>
                        </View>

                        <View style={[styles.plateInputsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                          <TextInput 
                            style={styles.wizardPlateInputHalf}
                            placeholder={selectedLanguage === 'Arabic' ? '١٢٣٤' : '1234'}
                            placeholderTextColor="rgba(30, 41, 59, 0.2)"
                            value={plateNumbers}
                            onChangeText={(val) => {
                              const cleanVal = val.replace(/[^0-9\u0660-\u0669]/g, '');
                              setPlateNumbers(cleanVal);
                              setPlateNumber(cleanVal + ' ' + plateLetters);
                            }}
                            keyboardType="numeric"
                            maxLength={4}
                          />
                          <View style={styles.plateInputDivider} />
                          <TextInput 
                            style={styles.wizardPlateInputHalf}
                            placeholder={selectedLanguage === 'Arabic' ? 'أ ب ج' : 'A B C'}
                            placeholderTextColor="rgba(30, 41, 59, 0.2)"
                            value={plateLetters}
                            onChangeText={(val) => {
                              setPlateLetters(val);
                              setPlateNumber(plateNumbers + ' ' + val);
                            }}
                            autoCapitalize="characters"
                            maxLength={4}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.formGroup, { marginTop: 5 }]}>
                    <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
                      {selectedLanguage === 'Arabic' ? 'سعة المحرك (اختياري):' : 'Engine CC (Optional):'}
                    </Text>
                    <TextInput 
                      style={[styles.wizardInput, isRtl && { textAlign: 'right' }]}
                      placeholder="e.g. 1600 CC"
                      placeholderTextColor={colors.textMuted}
                      value={cc}
                      onChangeText={setCc}
                    />
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Sticky Grounded Premium Navigation Footer */}
            {wizardStep > 1 && (
              <View style={[styles.wizardFooter, isRtl && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  style={styles.wizardFooterBackBtn}
                  activeOpacity={0.8}
                  onPress={handleWizardBack}
                >
                  <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={16} color={colors.bgBrand} style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                  <Text style={styles.wizardFooterBackBtnText}>
                    {selectedLanguage === 'Arabic' ? 'السابق' : 'Back'}
                  </Text>
                </TouchableOpacity>

                {wizardStep === 2 && model.trim() ? (
                  <TouchableOpacity 
                    style={styles.wizardFooterNextBtn}
                    activeOpacity={0.8}
                    onPress={() => setWizardStep(3)}
                  >
                    <Text style={styles.wizardFooterNextBtnText}>
                      {selectedLanguage === 'Arabic' ? 'التالي' : 'Next'}
                    </Text>
                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={colors.white} style={isRtl ? { marginRight: 4 } : { marginLeft: 4 }} />
                  </TouchableOpacity>
                ) : wizardStep === 3 && year.trim() ? (
                  <TouchableOpacity 
                    style={styles.wizardFooterNextBtn}
                    activeOpacity={0.8}
                    onPress={() => setWizardStep(4)}
                  >
                    <Text style={styles.wizardFooterNextBtnText}>
                      {selectedLanguage === 'Arabic' ? 'التالي' : 'Next'}
                    </Text>
                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={colors.white} style={isRtl ? { marginRight: 4 } : { marginLeft: 4 }} />
                  </TouchableOpacity>
                ) : wizardStep === 4 ? (
                  <TouchableOpacity 
                    style={styles.wizardFooterSaveBtn}
                    activeOpacity={0.8}
                    onPress={handleSaveCar}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
                    <Text style={styles.wizardFooterSaveBtnText}>
                      {t.saveBtn}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>

      {/* Switch Vehicle Modal */}
      <Modal
        visible={isSwitchingVehicle}
        animationType="slide"
        onRequestClose={() => setIsSwitchingVehicle(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.bgCreamy }]}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.bgCreamy} />
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.modalTitle}>
              {selectedLanguage === 'Arabic' ? 'اختر المركبة النشطة' : 'Select Active Vehicle'}
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsSwitchingVehicle(false)}
            >
              <Ionicons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Vehicle List */}
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {userVehicles.map(car => {
              const isActive = car.id === activeVehicleId;
              const { numbers, letters } = splitPlate(car.plateNumberArabic || car.plateNumber);
              
              return (
                <TouchableOpacity 
                  key={car.id}
                  style={[
                    styles.vehicleSelectCard, 
                    isActive && styles.activeSelectCard
                  ]}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!isActive) {
                      setActiveVehicleId(car.id);
                      setIsSwitchingVehicle(false);
                      Alert.alert(
                        selectedLanguage === 'Arabic' ? 'تم التغيير' : 'Vehicle Switched',
                        selectedLanguage === 'Arabic' 
                          ? `المركبة النشطة الآن هي ${car.brand} ${car.model}`
                          : `Active vehicle is now ${car.brand} ${car.model}`
                      );
                    }
                  }}
                >
                  <BlurView
                    intensity={30}
                    tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={{ padding: 16, width: '100%' }}>
                    <View style={[styles.cardHeaderRow, isRtl && { flexDirection: 'row-reverse' }, { justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 }]}>
                      <View>
                        <Text style={styles.cardCarBrand}>{car.brand} {car.model}</Text>
                        <Text style={styles.cardCarYear}>
                          {selectedLanguage === 'Arabic' ? `موديل ${car.year}` : `${car.year} Model`}
                        </Text>
                      </View>
                      {isActive ? (
                        <View style={[styles.activeIndicatorBadge, isRtl && { flexDirection: 'row-reverse' }]}>
                          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                          <Text style={styles.activeIndicatorBadgeText}>
                            {selectedLanguage === 'Arabic' ? 'نشط' : 'Active'}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.deleteIconButton}
                          onPress={() => handleRemoveCar(car.id, car.brand, car.model)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#B54D4F" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={[styles.cardFooterRow, isRtl && { flexDirection: 'row-reverse' }]}>
                      {(numbers || letters) ? (
                        <View style={styles.selectCardPlateBadge}>
                          <View style={styles.selectCardPlateHeader} />
                          <View style={styles.selectCardPlateContent}>
                            <Text style={styles.selectCardPlateNumbers}>{numbers}</Text>
                            {letters ? (
                              <>
                                <View style={styles.selectCardPlateDivider} />
                                <Text style={styles.selectCardPlateLetters}>{letters}</Text>
                              </>
                            ) : null}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* 3D Glossy Bevel Highlight Overlay */}
                  <View style={{
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: 'transparent',
                    borderTopColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                    borderLeftColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                  }} pointerEvents="none" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>



      {renderEditNotesModal()}
      {renderEditStatusModal()}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  modalBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editModalAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  editKeyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  editModalSheetContainer: {
    width: '88%',
    maxWidth: 350,
    alignSelf: 'center',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  editModalRuledPaper: {
    height: 398, // exactly fits 13 ruled lines (338px at 26px spacing) + header row (48px) + 12px bottom padding
    backgroundColor: colors.bgCardNested,
    borderColor: colors.borderGreen,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  editModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: colors.borderGreen + '40',
    backgroundColor: colors.bgCardNested,
    zIndex: 10,
  },
  editModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  editModalDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editModalDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 110, // snug above floating bottom navbar
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  guestIllustration: {
    width: 120,
    height: 120,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  guestTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 22,
    color: colors.bgBrand,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  guestText: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 15,
  },
  guestButton: {
    backgroundColor: colors.bgBrand,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 25,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bannerContainer: {
    marginVertical: 14,
    paddingHorizontal: 2,
  },
  bannerTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 26,
    color: colors.bgBrand,
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(26, 29, 26, 0.65)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(93, 130, 96, 0.25)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
  },
  formHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.bgBrand,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textDark,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: colors.bgBrand,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 110, 79, 0.08)',
  },
  modalTitle: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 18,
    color: colors.bgBrand,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  vehicleSelectCard: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.95)' : 'rgba(24, 30, 24, 0.96)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  activeSelectCard: {
    borderColor: colors.bgBrand,
    borderWidth: 1.5,
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(240, 245, 240, 0.95)' : 'rgba(34, 42, 34, 0.95)',
  },
  cardCarBrand: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 2,
  },
  cardCarYear: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeIndicatorBadge: {
    backgroundColor: colors.bgBrand,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicatorBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteIconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(181, 77, 79, 0.08)',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 110, 79, 0.08)',
    paddingTop: 10,
  },
  selectCardPlateBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  selectCardPlateHeader: {
    backgroundColor: '#005CA9',
    height: 7,
    width: '100%',
  },
  selectCardPlateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectCardPlateNumbers: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  selectCardPlateDivider: {
    width: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 4,
  },
  selectCardPlateLetters: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  statusEditButton: {
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEditButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.bgBrand,
  },
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  overlayCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  formContainerModal: {
    width: '100%',
    maxHeight: '95%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  premiumInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 14,
    paddingLeft: 12,
    height: 46,
    overflow: 'hidden',
  },
  premiumInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.textDark,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  inputUnitBadge: {
    backgroundColor: colors.bgBrandLight,
    height: '100%',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputUnitText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: colors.bgBrand,
  },
  splitSubValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.35)' : 'rgba(24, 30, 24, 0.45)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.bgBrand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  mainReadoutContainer: {
    marginBottom: 14,
  },
  readoutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  readoutValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  progressContainer: {
    marginBottom: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.borderGreen,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.bgBrand,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statusDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    opacity: 0.6,
    marginBottom: 16,
  },
  statusSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSplitCol: {
    flex: 1,
  },
  verticalSplitDivider: {
    width: 1,
    height: 35,
    backgroundColor: colors.borderGreen,
    opacity: 0.6,
    marginHorizontal: 16,
  },
  splitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  splitValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textDark,
  },


  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  odoInfoCard: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(26, 29, 26, 0.4)',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(93, 130, 96, 0.2)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  odoInfoCardText: {
    flex: 1,
  },
  odoInfoCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  odoInfoCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  compactOdoInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 10,
    width: 120,
    height: 36,
    overflow: 'hidden',
    paddingLeft: 8,
  },
  compactOdoInput: {
    flex: 1,
    height: '100%',
    fontSize: 12,
    color: colors.textDark,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  compactOdoUnit: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.bgBrand,
    backgroundColor: 'rgba(77, 110, 79, 0.05)',
    height: '100%',
    paddingHorizontal: 6,
    textAlignVertical: 'center',
    lineHeight: 36,
  },
  partSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(77, 110, 79, 0.02)',
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  partSelectCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partSelectIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partSelectTextContainer: {
    flex: 1,
  },
  partSelectLabel: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 2,
  },
  partSelectDueAt: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  partSelectCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 110, 79, 0.06)',
    paddingBottom: 12,
    marginBottom: 14,
  },
  editPageBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPageBackButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.bgBrand,
  },
  editPageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editPagePartName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.bgBrand,
    marginBottom: 16,
  },
  serviceListContainer: {
    marginTop: 10,
  },
  serviceItemCard: {
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(60, 90, 62, 0.07)' : 'rgba(20, 32, 20, 0.55)',
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(60, 90, 62, 0.15)' : 'rgba(93, 130, 96, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.02 : 0.1,
    shadowRadius: 6,
    elevation: 1,
  },
  expandCollapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(77, 110, 79, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  expandCollapseButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  serviceCardProgressContainer: {
    marginBottom: 10,
  },
  serviceCardProgressBarBg: {
    height: 5,
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  serviceCardProgressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  serviceCardStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceStatBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(77, 110, 79, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.06)',
  },
  serviceStatBoxLeft: {},
  serviceStatBoxRight: {},
  serviceStatBoxLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  serviceStatBoxValue: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  modalTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(77, 110, 79, 0.05)',
    borderRadius: 12,
    padding: 3,
    marginVertical: 14,
    gap: 2,
  },
  modalTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTabButtonText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  modalTabButtonTextActive: {
    color: colors.bgBrand,
  },
  modalFieldsScrollView: {
    maxHeight: 240,
    marginBottom: 10,
  },
  modalFieldGroup: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 110, 79, 0.06)',
  },
  modalFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalFieldLabel: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  compactInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  compactInputSubLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  compactInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 110, 79, 0.02)',
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 10,
    height: 38,
    overflow: 'hidden',
    paddingLeft: 10,
  },
  compactInputText: {
    flex: 1,
    height: '100%',
    fontSize: 12.5,
    color: colors.textDark,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  compactInputUnit: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.bgBrand,
    backgroundColor: 'rgba(77, 110, 79, 0.05)',
    height: '100%',
    paddingHorizontal: 8,
    textAlignVertical: 'center',
    lineHeight: 38,
  },
  livePreviewText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  inputFocusedStyle: {
    borderColor: colors.bgBrand,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerModeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCardNested,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  headerModeToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerModeToggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  // ── Notebook / Notes Styles ──────────────────────────────────────
  notebookContainer: {
    marginTop: 10,
  },
  notebookHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notebookSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  notebookSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.bgBrand + '30',
    paddingHorizontal: 12,
  },
  notebookSaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  notebookSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notebookSavedText: {
    fontSize: 10,
    color: colors.bgBrand,
    fontWeight: '600',
  },
  // The notebook paper itself — sage green card with ruled lines
  notebookPaper: {
    backgroundColor: colors.bgCardNested,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    overflow: 'visible',
    height: 500,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // Empty kept for backwards compat (unused)
  notebookMarginLine: {},
  notebookSpiralCol: {},
  notebookSpiralDot: {},
  // The ruled horizontal lines layer — full width
  notebookLinesArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 52,          // start after date chip
    bottom: 0,
    flexDirection: 'column',
    zIndex: 0,
  },
  notebookRuledLine: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
    opacity: 0.9,
  },
  // The actual text input layered on top of the lines
  notebookTextInput: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 52,           // aligns with first ruled line
    bottom: 12,
    fontSize: 13.5,
    lineHeight: 32,    // must match notebookRuledLine height exactly
    color: colors.textDark,
    zIndex: 3,
    padding: 0,
    fontWeight: '400',
  },
  notebookCharCount: {
    fontSize: 9.5,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
    paddingRight: 2,
  },
  notebookPaperHeaderControls: {
    position: 'absolute',
    top: 10,
    zIndex: 4,
    alignItems: 'center',
    gap: 8,
  },
  // Date chip inside notebook paper
  notebookDateChip: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.bgBrand + '30',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  notebookDateChipFilled: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  notebookDateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bgBrand,
  },
  notebookDateChipTextFilled: {
    color: colors.white,
  },

  // ── Calendar Modal Styles ────────────────────────────────────────
  calModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calModalCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  calDayHeaders: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.bgBrand,
    letterSpacing: 0.3,
  },
  calGrid: {
    marginBottom: 4,
  },
  calRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  calCell: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  calCellSelected: {
    backgroundColor: colors.bgBrand,
  },
  calCellToday: {
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
  },
  calCellText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDark,
  },
  calCellTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  calCellTextToday: {
    color: colors.bgBrand,
    fontWeight: '700',
  },
  calClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
  },
  calClearBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // ── Sticky Note Images ───────────────────────────────────────────
  notebookPhotoBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.bgBrand + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebookScroll: {
    flex: 1,
  },
  notebookScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  notebookTextInputRelative: {
    fontSize: 13.5,
    lineHeight: 32,
    color: colors.textDark,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 52,
    minHeight: 180,
  },
  notebookStickyStackRelative: {
    width: 110,
    height: 130,
    zIndex: 5,
    marginTop: 14,
    marginBottom: 14,
  },
  stickyStackCard: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100,
    height: 115,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 1.5, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 4,
    padding: 4,
    paddingBottom: 6,
  },
  stickyStackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  stickyStackBadge: {
    position: 'absolute',
    bottom: 12,
    right: 6,
    backgroundColor: colors.bgBrand,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
    zIndex: 10,
  },
  stickyStackBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '700',
  },
  stickyPanelTape: {
    height: 8,
    width: 20,
    alignSelf: 'center',
    borderRadius: 1,
    marginBottom: -4,
    zIndex: 1,
    opacity: 0.7,
  },
  galleryModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryScroll: {
    width: '100%',
    height: 270,
    flexGrow: 0,
  },
  galleryModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'absolute',
    top: 50,
    zIndex: 10,
  },
  galleryModalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  galleryHeaderCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryScrollContent: {
    alignItems: 'center',
    gap: 20,
    zIndex: 5,
  },
  galleryPolaroidCard: {
    width: 200,
    height: 250,
    borderRadius: 8,
    padding: 8,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 6,
  },
  galleryTapeStrip: {
    height: 12,
    width: 35,
    alignSelf: 'center',
    borderRadius: 1,
    marginBottom: -6,
    zIndex: 8,
    opacity: 0.65,
  },
  galleryImageContainer: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  galleryPolaroidImage: {
    width: '100%',
    height: '100%',
  },
  galleryPolaroidDeleteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  galleryPolaroidAddBtn: {
    width: 200,
    height: 250,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 6,
  },
  galleryAddIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  galleryPolaroidAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  gallerySwipeIndicator: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    position: 'absolute',
    bottom: 50,
    width: '100%',
    zIndex: 10,
  },
  wizardModalContainer: {
    flex: 1,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 15,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
    backgroundColor: colors.white,
  },
  wizardBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  stepperContainer: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  stepperTrack: {
    height: 6,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.bgBrand,
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperStepText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepperStepActive: {
    color: colors.bgBrand,
    fontWeight: '800',
  },
  wizardScrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  wizardStepView: {
    flex: 1,
  },
  wizardPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 18,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen + '40',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  brandCardSelected: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  brandEmblemBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgCreamy,
    borderWidth: 1,
    borderColor: colors.borderGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandEmblemBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  brandEmblemLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.bgBrand,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  brandEmblemLetterSelected: {
    color: colors.bgCreamy,
  },
  brandSelectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  brandCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  brandCardTextSelected: {
    color: colors.bgCreamy,
  },
  wizardDivider: {
    height: 1.2,
    backgroundColor: colors.borderGreen,
    marginVertical: 18,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wizardInput: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: colors.textDark,
  },
  wizardNextPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  wizardBackBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardBackBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  wizardNextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardNextBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  transmissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  transmissionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  transmissionCardSelected: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  transmissionCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  transmissionCardTextSelected: {
    color: colors.bgCreamy,
  },
  wizardSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  wizardBodyContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  brandScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 35,
  },
  selectedBrandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: colors.borderGreen + '40',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedBrandBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedBrandBannerLogo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  selectedBrandBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  selectedBrandBannerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  changeBrandBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.bgBrand + '25',
  },
  changeBrandBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  modelListNativeScroll: {
    flex: 1,
    marginTop: 8,
  },
  modelListNativeScrollContent: {
    paddingBottom: 35,
  },
  modelListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 7,
    borderWidth: 1.2,
    borderColor: colors.borderGreen + '35',
    backgroundColor: colors.white,
  },
  modelListItemSelected: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  modelListItemThumbnail: {
    width: 52,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrandLight,
    overflow: 'hidden',
  },
  modelListItemThumbnailSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modelListItemImage: {
    width: '90%',
    height: '90%',
  },
  modelListItemTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  modelListItemText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
  },
  modelListItemTextSelected: {
    color: colors.bgCreamy,
    fontWeight: '700',
  },
  modelListItemSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  modelListItemSubtextSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modelListCheckmarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgCreamy,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelListCheckmarkCircleActive: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.white,
  },
  customModelOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.bgBrand + '30',
    borderRadius: 12,
    marginBottom: 10,
  },
  customModelOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  emptySearchText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 20,
  },
  yearScrollNative: {
    flex: 1,
    marginTop: 10,
  },
  yearGridContent: {
    paddingBottom: 35,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  detailsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  yearCard: {
    width: '22%',
    marginHorizontal: '1.5%',
    backgroundColor: colors.bgCreamy,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  yearCardSelected: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  yearCardText: {
    fontSize: 13.5,
    color: colors.textDark,
    fontWeight: '600',
  },
  yearCardTextSelected: {
    color: colors.bgCreamy,
    fontWeight: '700',
  },
  stepperDotContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepperDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgCreamy,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepperDotActive: {
    backgroundColor: colors.bgCreamy,
    borderColor: colors.bgBrand,
    borderWidth: 2,
  },
  stepperDotDone: {
    backgroundColor: colors.bgBrand,
    borderColor: colors.bgBrand,
  },
  stepperDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepperDotTextActive: {
    color: colors.bgBrand,
  },
  stepperLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepperLabelTextActive: {
    color: colors.bgBrand,
    fontWeight: '700',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
  },
  wizardSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    height: '100%',
  },
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    backgroundColor: colors.white,
    borderTopWidth: 1.2,
    borderTopColor: colors.borderGreen,
  },
  wizardFooterBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  wizardFooterCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  wizardFooterBackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  wizardFooterCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  wizardFooterNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  wizardFooterSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  wizardFooterNextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  wizardFooterSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  plateInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  metalPlate: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#1E293B',
    borderRadius: 10,
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  plateHeaderBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: '#0077C2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  plateHeaderCountryEn: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  plateHeaderCountryAr: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  plateScrew: {
    position: 'absolute',
    top: '42%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7F8C8D',
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  wizardPlateInput: {
    width: '80%',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  plateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    height: 50,
    marginTop: 18,
  },
  wizardPlateInputHalf: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  plateInputDivider: {
    width: 2,
    height: '60%',
    backgroundColor: 'rgba(30, 41, 59, 0.15)',
    marginHorizontal: 15,
  },
  brandLogoImage: {
    alignSelf: 'center',
  },
});
