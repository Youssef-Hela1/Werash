import { Linking, Alert } from 'react-native';
import { BRAND_LOGOS } from './brandLogos';

const BANNER_IMAGES = {
  mechanical: require('../../assets/modern_workshop_banner.png'),
  body: require('../../assets/detailing_ad_banner.png'),
  suspension: require('../../assets/tuning_ad_banner.png'),
  electrician: require('../../assets/modern_workshop_banner.png'),
  parts: require('../../assets/parts_ad_banner.png'),
  default: require('../../assets/modern_workshop_banner.png'),
};

const AVATAR_IMAGES = [
  require('../../assets/expert_kareem.png'),
  require('../../assets/expert_elena.png'),
  require('../../assets/expert_tariq.png'),
  require('../../assets/expert_samir.png'),
  require('../../assets/expert_sherif.png'),
  require('../../assets/expert_michael.png'),
  require('../../assets/expert_sarah.png'),
];

export const getSpecialistCover = (spec) => {
  if (spec?.image) return spec.image;
  const cat = spec?.category || (Array.isArray(spec?.categories) ? spec.categories[0] : null);
  return BANNER_IMAGES[cat] || BANNER_IMAGES.default;
};

export const getSpecialistAvatar = (spec) => {
  if (spec?.avatar) return spec.avatar;
  let hash = 0;
  const key = String(spec?.id || spec?.name || '0');
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_IMAGES.length;
  return AVATAR_IMAGES[idx];
};

export const getSpecialistExp = (spec, isRtl) => {
  if (isRtl && spec?.expAr) return spec.expAr;
  if (!isRtl && spec?.exp) return spec.exp;
  const rev = parseInt(spec?.reviews, 10) || 0;
  const rating = parseFloat(spec?.rating) || 0;
  if (rating >= 4.8 && rev >= 20) return isRtl ? 'الأعلى تقييماً' : 'Top Rated';
  if (rev >= 30) return isRtl ? 'ورشة مميزة' : 'Featured Workshop';
  if (rev >= 10) return isRtl ? 'خبرة موثوقة' : 'Trusted Choice';
  return isRtl ? 'ورشة معتمدة' : 'Verified Workshop';
};

export const openSpecialistLocation = async (spec) => {
  if (!spec) return;
  const url = spec.url;
  if (url) {
    try {
      await Linking.openURL(url);
      return;
    } catch (err) {
      console.warn('Could not open map url:', err);
    }
  }
  const search = encodeURIComponent(`${spec.name || ''} ${spec.location || ''}`);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${search}`).catch((err) => {
    console.warn('Could not search maps:', err);
  });
};

export const callSpecialist = (spec, isRtl) => {
  if (!spec?.phone) {
    Alert.alert(
      isRtl ? 'رقم الهاتف غير متوفر' : 'Phone Unavailable',
      isRtl ? 'لم يتم توفير رقم هاتف لهذه الورشة.' : 'No phone number provided for this workshop.'
    );
    return;
  }
  const cleanPhone = spec.phone.replace(/[^0-9+]/g, '');
  Linking.openURL(`tel:${cleanPhone}`).catch(() => {
    Alert.alert(
      isRtl ? 'تعذر إجراء المكالمة' : 'Call Failed',
      isRtl ? 'لا يمكن فتح تطبيق الهاتف على هذا الجهاز.' : 'Could not open the dialer on this device.'
    );
  });
};

export const messageSpecialist = (spec, isRtl) => {
  if (!spec?.phone) {
    Alert.alert(
      isRtl ? 'رقم الهاتف غير متوفر' : 'Phone Unavailable',
      isRtl ? 'لم يتم توفير رقم هاتف للتواصل عبر واتساب.' : 'No contact phone provided for messaging.'
    );
    return;
  }
  let digits = spec.phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('201') && digits.length === 12) {
    // already 201...
  } else if (digits.startsWith('02') || digits.startsWith('03')) {
    // Landline -> dial directly
    Linking.openURL(`tel:${digits}`);
    return;
  } else if (!digits.startsWith('20') && digits.length === 10 && digits.startsWith('1')) {
    digits = '20' + digits;
  }

  const shopName = (isRtl ? spec.nameAr : spec.name) || spec.name;
  const msg = encodeURIComponent(
    isRtl
      ? `مرحباً، لقد وجدت ورشتكم "${shopName}" عبر تطبيق وِرَش وأود الاستفسار عن الصيانة.`
      : `Hello, I found your workshop "${shopName}" on the Werash app and would like to inquire about service.`
  );

  const whatsappUrl = `https://wa.me/${digits}?text=${msg}`;
  Linking.openURL(whatsappUrl).catch(() => {
    Linking.openURL(`tel:${spec.phone.replace(/[^0-9+]/g, '')}`);
  });
};


export const getMechanicBrandLogo = (spec, activeVehicle) => {
  if (activeVehicle && activeVehicle.brand) {
    const brand = activeVehicle.brand.toLowerCase();
    if (BRAND_LOGOS[brand]) return BRAND_LOGOS[brand];
  }
  return null;
};
