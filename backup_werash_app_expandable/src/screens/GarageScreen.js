import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal 
} from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ActiveVehicleCard from '../components/ActiveVehicleCard';

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
  }
};

const SERVICE_ITEMS_METADATA = [
  {
    key: 'engineOil',
    icon: 'water-outline',
    labelEn: 'Engine Oil & Oil Filter',
    labelAr: 'زيت وفلتر المحرك',
    category: 'fluids',
    defaultLifespan: 10000,
  },
  {
    key: 'transmissionFluid',
    icon: 'cog-outline',
    labelEn: 'Transmission Fluid',
    labelAr: 'زيت ناقل الحركة',
    category: 'fluids',
    defaultLifespan: 60000,
  },
  {
    key: 'coolant',
    icon: 'thermometer-outline',
    labelEn: 'Coolant (Antifreeze)',
    labelAr: 'سائل التبريد (مضاد التجمد)',
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
    key: 'powerSteeringFluid',
    icon: 'help-buoy-outline',
    labelEn: 'Power Steering Fluid',
    labelAr: 'زيت باور التوجيه',
    category: 'fluids',
    condition: 'hasHydraulicPS',
    defaultLifespan: 50000,
  },
  {
    key: 'differentialOil',
    icon: 'git-commit-outline',
    labelEn: 'Differential Oil',
    labelAr: 'زيت الدفرنس',
    category: 'fluids',
    defaultLifespan: 60000,
  },
  {
    key: 'transferCaseFluid',
    icon: 'git-compare-outline',
    labelEn: 'Transfer Case Fluid',
    labelAr: 'سائل علبة التروس (الدبل)',
    category: 'fluids',
    condition: 'is4WD',
    defaultLifespan: 60000,
  },
  {
    key: 'clutchFluid',
    icon: 'footsteps-outline',
    labelEn: 'Clutch Fluid',
    labelAr: 'سائل الدبرياج',
    category: 'fluids',
    condition: 'isManual',
    defaultLifespan: 30000,
  },
  {
    key: 'windshield',
    icon: 'eye-outline',
    labelEn: 'Windshield Fluid & Wipers',
    labelAr: 'مساحات وسائل الزجاج',
    category: 'fluids',
    defaultLifespan: 15000,
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
    labelEn: 'Cabin Air Filter',
    labelAr: 'فلتر هواء المقصورة',
    category: 'filters',
    defaultLifespan: 20000,
  },
  {
    key: 'sparkPlugs',
    icon: 'flash-outline',
    labelEn: 'Spark Plugs',
    labelAr: 'شمعات الاحتراق (البوجيهات)',
    category: 'filters',
    defaultLifespan: 40000,
  },
  {
    key: 'fuelFilter',
    icon: 'funnel-outline',
    labelEn: 'Fuel Filter',
    labelAr: 'فلتر الوقود',
    category: 'filters',
    defaultLifespan: 40000,
  },
  {
    key: 'driveBelt',
    icon: 'infinite-outline',
    labelEn: 'Drive / Serpentine Belt',
    labelAr: 'سير المجموعة',
    category: 'parts',
    defaultLifespan: 60000,
  },
  {
    key: 'timingBelt',
    icon: 'time-outline',
    labelEn: 'Timing Belt',
    labelAr: 'سير الكاتينة',
    category: 'parts',
    condition: 'hasTimingBelt',
    defaultLifespan: 60000,
  },
  {
    key: 'brakes',
    icon: 'ellipse-outline',
    labelEn: 'Brake Pads & Rotors',
    labelAr: 'تيل وأقراص الفرامل',
    category: 'parts',
    defaultLifespan: 30000,
  },
  {
    key: 'tires',
    icon: 'disc-outline',
    labelEn: 'Tires',
    labelAr: 'الإطارات',
    category: 'parts',
    defaultLifespan: 50000,
  },
  {
    key: 'battery',
    icon: 'battery-charging-outline',
    labelEn: 'Battery',
    labelAr: 'البطارية',
    category: 'parts',
    defaultLifespan: 60000,
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
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  const getVehicleServiceData = (car) => {
    if (!car) return { odoNum: 0, odoStr: '0 km', servicesList: [] };
    
    const isArabic = selectedLanguage === 'Arabic';
    const odoNum = car.odometer !== undefined && !isNaN(parseInt(car.odometer)) ? parseInt(car.odometer) : 12450;
    
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
        ? `عند ${nextServiceAt.toLocaleString('ar-EG')} كم`
        : `At ${nextServiceAt.toLocaleString('en-US')} km`;
        
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
  const [cc, setCc] = useState('');

  // Edit service status card state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempOdometer, setTempOdometer] = useState('');
  const [tempServices, setTempServices] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [selectedEditCategory, setSelectedEditCategory] = useState('overall');

  // Switch vehicle state
  const [isSwitchingVehicle, setIsSwitchingVehicle] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const activeVehicle = userVehicles.find(v => v.id === activeVehicleId);

  const handleStartEditStatus = () => {
    if (activeVehicle) {
      setTempOdometer(activeVehicle.odometer.toString());
      setSelectedPartKey(null);
      setEditSearchQuery('');
      setSelectedEditCategory('overall');
      setIsEditingStatus(true);
      setIsSwitchingVehicle(false);
      setShowAddForm(false);
    }
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
          lastService: lastService.toString(),
          lifespan: lifespan.toString()
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

    const updatedVehicles = userVehicles.map(car => {
      if (car.id === activeVehicleId) {
        const currentServices = car.services || {};
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

    const updatedVehicles = userVehicles.map(car => {
      if (car.id === activeVehicleId) {
        return {
          ...car,
          odometer: odoVal,
          services: updatedServices,
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
    if (!brand.trim() || !model.trim() || !year.trim()) {
      Alert.alert(
        selectedLanguage === 'Arabic' ? 'تنبيه' : 'Validation Error',
        selectedLanguage === 'Arabic' 
          ? 'يرجى ملء حقول الماركة والموديل وسنة الصنع.' 
          : 'Please fill in Brand, Model, and Year fields.'
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

    const newCar = {
      id: Date.now().toString(),
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim(),
      plateNumber: plateNumber.trim() || 'NEW-CAR',
      plateNumberArabic: plateNumber.trim() || 'سيارة جديدة',
      cc: cc.trim() || '1600 CC',
      odometer: 15000,
      isManual: false,
      is4WD: false,
      hasHydraulicPS: false,
      hasTimingBelt: false,
      services: defaultCarServices,
      lastOil: 10000,
      oilLife: 10000,
    };

    const updated = [...userVehicles, newCar];
    setUserVehicles(updated);
    setActiveVehicleId(newCar.id);
    setShowAddForm(false);
    
    // Clear inputs
    setBrand('');
    setModel('');
    setYear('');
    setPlateNumber('');
    setCc('');

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
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 55)
    lines.push(
      <View
        key="top-solid-block"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 55,
          backgroundColor: colors.bgCreamy,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 55 to y = 65
    const numLines = 20;
    const startY = 55;
    const endY = 65;
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
      
      if (selectedEditCategory !== 'overall' && item.category !== selectedEditCategory) return false;
      
      const label = isArabic ? item.labelAr : item.labelEn;
      const query = editSearchQuery.toLowerCase().trim();
      return !query || label.toLowerCase().includes(query);
    });

    const categoriesList = [
      { id: 'overall', labelEn: 'ALL', labelAr: 'الكل' },
      { id: 'fluids', labelEn: 'FLUIDS', labelAr: 'السوائل' },
      { id: 'filters', labelEn: 'FILTERS & PLUGS', labelAr: 'الفلاتر' },
      { id: 'parts', labelEn: 'BELTS & PARTS', labelAr: 'القطع' }
    ];

    const data = getVehicleServiceData(activeVehicle);

    return (
      <View style={{ flex: 1 }}>
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
                setTempOdometer(cleaned);
                const updated = userVehicles.map(car => car.id === activeVehicleId ? { ...car, odometer: parseInt(cleaned) || 0 } : car);
                setUserVehicles(updated);
              }}
              keyboardType="number-pad"
              placeholder="12450"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.compactOdoUnit}>{isArabic ? 'كم' : 'KM'}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchRow, isRtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="search-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, isRtl && { textAlign: 'right' }]}
            placeholder={isArabic ? 'ابحث عن الأجزاء...' : 'Search parts...'}
            placeholderTextColor="#ADADAD"
            value={editSearchQuery}
            onChangeText={setEditSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Category Pills */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoriesScroll, isRtl && { flexDirection: 'row-reverse' }]}
          >
            {categoriesList.map(cat => {
              const isSelected = selectedEditCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedEditCategory(cat.id)}
                  style={[
                    styles.categoryPill,
                    isSelected ? styles.categoryPillSelected : styles.categoryPillUnselected
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected ? styles.categoryTextSelected : styles.categoryTextUnselected
                    ]}
                  >
                    {isArabic ? cat.labelAr : cat.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scrollable list of part cards */}
        <ScrollView 
          style={styles.modalFieldsScrollView}
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
              ? `عند ${nextServiceAt.toLocaleString('ar-EG')} كم`
              : `At ${nextServiceAt.toLocaleString('en-US')} km`;

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
      <View style={{ flex: 1 }}>
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
          {/* Current Odometer input */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>
              {isArabic ? 'عداد المسافات الحالي للمركبة' : 'Vehicle Current Odometer'}
            </Text>
            <View style={[
              styles.premiumInputWrapper,
              focusedInput === 'odo' && styles.inputFocusedStyle,
              isRtl && { flexDirection: 'row-reverse' }
            ]}>
              <Ionicons name="speedometer-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
              <TextInput 
                style={[styles.premiumInput, isRtl && { textAlign: 'right' }]}
                value={tempOdometer}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setTempOdometer(cleaned);
                  const updated = userVehicles.map(car => car.id === activeVehicleId ? { ...car, odometer: parseInt(cleaned) || 0 } : car);
                  setUserVehicles(updated);
                }}
                keyboardType="number-pad"
                placeholder="e.g. 12450"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setFocusedInput('odo')}
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
                  setTempServices(prev => ({
                    ...prev,
                    [item.key]: {
                      ...prev[item.key],
                      lastService: cleaned
                    }
                  }));
                }}
                keyboardType="number-pad"
                placeholder="e.g. 10000"
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
                  setTempServices(prev => ({
                    ...prev,
                    [item.key]: {
                      ...prev[item.key],
                      lifespan: cleaned
                    }
                  }));
                }}
                keyboardType="number-pad"
                placeholder="e.g. 10000"
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
          <BlurView intensity={65} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1}
              onPress={() => setIsEditingStatus(false)}
            />
          </BlurView>
          
          <View style={styles.overlayCardContainer}>
            <View style={styles.formContainerModal}>
              {selectedPartKey === null ? renderPartSelectionPage() : renderPartEditPage()}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // MEMBER STATE RENDER
  return (
    <View style={styles.container}>
      {renderGradientOverlay()}
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
            setShowAddForm(prev => !prev);
            setIsSwitchingVehicle(false);
          }}
        />

        {/* Service & Mileage Status Card */}
        {activeVehicle && (
          (() => {
            const data = getVehicleServiceData(activeVehicle);
            return (
              <View style={styles.statusCard}>
                {/* Header */}
                <View style={[styles.statusCardHeader, isRtl && { flexDirection: 'row-reverse' }, { justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="speedometer-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                    <Text style={styles.statusCardTitle}>
                      {selectedLanguage === 'Arabic' ? 'إحصائيات وحالة الصيانة' : 'Service & Mileage Status'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.statusEditButton, isRtl && { flexDirection: 'row-reverse' }]} 
                    onPress={handleStartEditStatus}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={13} color={colors.bgBrand} style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }} />
                    <Text style={styles.statusEditButtonText}>{selectedLanguage === 'Arabic' ? 'تعديل' : 'Edit'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Main Readout: Odometer */}
                <View style={[styles.mainReadoutContainer, isRtl && { alignItems: 'flex-end' }]}>
                  <Text style={styles.readoutLabel}>{t.odometer}</Text>
                  <Text style={styles.readoutValue}>{data.odoStr}</Text>
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
                          <Text style={[styles.serviceCardTitleText, isRtl ? { marginRight: 10, marginLeft: 0 } : { marginLeft: 10 }]}>
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
                            <Text style={[styles.serviceStatBoxLabel, isRtl && { textAlign: 'right' }]}>
                              {isRtl ? 'آخر صيانة' : 'LAST SERVICE'}
                            </Text>
                            <Text style={styles.serviceStatBoxValue}>{item.lastServiceStr}</Text>
                          </View>

                          {/* Limit Due Box */}
                          <View style={[
                            styles.serviceStatBox, 
                            styles.serviceStatBoxRight, 
                            { backgroundColor: item.statusColor + '08', borderColor: item.statusColor + '18' },
                            isRtl ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }
                          ]}>
                            <Text style={[styles.serviceStatBoxLabel, { color: item.statusColor }, isRtl && { textAlign: 'left' }]}>
                              {isRtl ? 'الحد الأقصى' : 'LIMIT DUE'}
                            </Text>
                            <Text style={[styles.serviceStatBoxValue, { color: item.statusColor }, isRtl && { textAlign: 'left' }]}>
                              {item.remaining <= 0 ? (isRtl ? 'متجاوز! ' : 'Overdue! ') : ''}{item.nextServiceAtStr}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {data.servicesList.length > 3 && (
                    <TouchableOpacity 
                      style={[styles.expandCollapseButton, isRtl && { flexDirection: 'row-reverse' }]}
                      onPress={() => setIsCardExpanded(prev => !prev)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.expandCollapseButtonText}>
                        {isCardExpanded 
                          ? (selectedLanguage === 'Arabic' ? 'عرض أقل' : 'Show Less') 
                          : (selectedLanguage === 'Arabic' 
                              ? `عرض المزيد (+${data.servicesList.length - 3})` 
                              : `Show More (+${data.servicesList.length - 3})`)
                        }
                      </Text>
                      <Ionicons 
                        name={isCardExpanded ? "chevron-up" : "chevron-down"} 
                        size={14} 
                        color={colors.bgBrand} 
                        style={isRtl ? { marginRight: 6 } : { marginLeft: 6 }} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })()
        )}

        {/* Add New Car Collapsible Form (below actions row) */}
        {showAddForm && (
          <View style={[styles.formContainer, { marginTop: 10, marginBottom: 5 }]}>
            <Text style={[styles.formHeader, isRtl && { textAlign: 'right' }]}>{t.addNewCarHeader}</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>{t.brandLabel}</Text>
              <TextInput 
                style={[styles.input, isRtl && { textAlign: 'right' }]}
                placeholder={selectedLanguage === 'Arabic' ? 'مثال: بورشه' : 'e.g. Porsche'}
                placeholderTextColor={colors.textMuted}
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>{t.modelLabel}</Text>
              <TextInput 
                style={[styles.input, isRtl && { textAlign: 'right' }]}
                placeholder={selectedLanguage === 'Arabic' ? 'مثال: ٩١١ كاريرا' : 'e.g. 911 Carrera'}
                placeholderTextColor={colors.textMuted}
                value={model}
                onChangeText={setModel}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>{t.yearLabel}</Text>
              <TextInput 
                style={[styles.input, isRtl && { textAlign: 'right' }]}
                placeholder="e.g. 2024"
                placeholderTextColor={colors.textMuted}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>{t.plateLabel}</Text>
              <TextInput 
                style={[styles.input, isRtl && { textAlign: 'right' }]}
                placeholder={selectedLanguage === 'Arabic' ? 'مثال: ١٢٣٤ أ ب ج' : 'e.g. 9865 QYR'}
                placeholderTextColor={colors.textMuted}
                value={plateNumber}
                onChangeText={setPlateNumber}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRtl && { textAlign: 'right' }]}>{t.ccLabel}</Text>
              <TextInput 
                style={[styles.input, isRtl && { textAlign: 'right' }]}
                placeholder={selectedLanguage === 'Arabic' ? 'مثال: ٣٠٠٠ سي سي' : 'e.g. 3000 CC'}
                placeholderTextColor={colors.textMuted}
                value={cc}
                onChangeText={setCc}
              />
            </View>

            <View style={[styles.formActions, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={handleSaveCar}
              >
                <Text style={styles.submitBtnText}>{t.saveBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelBtnText}>{t.cancelBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>



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
  scrollContent: {
    paddingTop: 64,
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
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
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
    fontFamily: 'ZafranArabic-Bold',
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
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1.5,
  },
  activeSelectCard: {
    borderColor: colors.bgBrand,
    borderWidth: 2,
    backgroundColor: 'rgba(77, 110, 79, 0.03)',
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
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEditButtonText: {
    fontSize: 10,
    fontWeight: '800',
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
  },
  formContainerModal: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 24,
    padding: 20,
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
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.bgBrand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 32,
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
    backgroundColor: 'rgba(77, 110, 79, 0.04)',
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    backgroundColor: colors.bgCardNested,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
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
    fontSize: 11,
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
    maxHeight: 280,
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
});
