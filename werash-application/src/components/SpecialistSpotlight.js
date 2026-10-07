import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { BlurView } from 'expo-blur';
import ServiceBrandLogo from './ServiceBrandLogo';


const { width: screenWidth } = Dimensions.get('window');

// Sized larger with generous canvas and placed lower for visual balance
const CARD_WIDTH = 220;
const CARD_HEIGHT = 146;

export default function SpecialistSpotlight({ onNavigate, selectedLanguage, onSelectAd }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const scrollViewRef = useRef(null);
  const currentOffsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const isRtl = selectedLanguage === 'Arabic';
  const labelSpotlight = isRtl ? 'إعلانات وعروض ممولة' : 'SPONSORED ADS & OFFERS';
  
  const ads = [
    {
      id: 'ad-tuning', serviceBrand: 'mobil',
      sponsor: isRtl ? 'ميونخ للضبط والتعديل' : 'Munich Tuning Studio',
      title: isRtl ? 'خصم ١٥٪ على باقات التعديل' : '15% Off ECU Tuning',
      desc: isRtl ? 'قم بتحسين أداء المحرك واستجابة دواسة الوقود مع مهندسينا المعتمدين.' : 'Boost engine performance and throttle response with certified specialists.',
      coupon: 'TUNEMAX',
      image: require('../../assets/tuning_ad_banner.png'),
      website: 'https://munichtuning.com',
      badge: isRtl ? 'تعديل أداء' : 'Performance',
      color: colors.gold,
    },
    {
      id: 'ad-ceramic', serviceBrand: 'shell',
      sponsor: isRtl ? 'مركز أوتو سبا للعناية' : 'AutoSpa Detailing',
      title: isRtl ? 'تلميع داخلي مجاني بالكامل' : 'Free Interior Polish',
      desc: isRtl ? 'احصل على تلميع داخلي مجاني بالكامل لسيارتك عند طلب حماية النانو سيراميك الذهبية.' : 'Get a complimentary interior detailing with any gold ceramic coating pack.',
      coupon: 'CERAMICGOLD',
      image: require('../../assets/detailing_ad_banner.png'),
      website: 'https://autospa-detailing.com',
      badge: isRtl ? 'حماية طلاء' : 'Car Detailing',
      color: colors.accentRed || '#B54D4F',
    },
    {
      id: 'ad-parts', serviceBrand: 'bosch',
      sponsor: isRtl ? 'بارت فايندر لقطع الغيار' : 'PartFinder Egypt',
      title: isRtl ? 'وفر ٢٠$ على تيل الفرامل' : 'Save $20 on Brake Pads',
      desc: isRtl ? 'تيل فرامل أصلي من بريمبو وبوش وإي بي سي مع ضمان التركيب مجاناً لدى ورشنا المعتمدة.' : 'Original Brembo, Bosch, and EBC brake pad kits with free installation.',
      coupon: 'STOPPER20',
      image: require('../../assets/parts_ad_banner.png'),
      website: 'https://partfinder-egypt.com',
      badge: isRtl ? 'قطع غيار' : 'Spare Parts',
      color: '#4A6984',
    },
    {
      id: 'ad-turbo', serviceBrand: 'total',
      sponsor: isRtl ? 'توربو تك للأداء' : 'TurboTech Egypt',
      title: isRtl ? 'خصم ١٠٪ على صيانة التوربو' : '10% Off Turbo Services',
      desc: isRtl ? 'فحص وصيانة شواحن التوربو وتعديل أنظمة العادم بأحدث الأجهزة.' : 'Professional turbo repair and exhaust system modifications.',
      coupon: 'TURBOPRO',
      image: require('../../assets/tuning_ad_banner.png'),
      website: 'https://turbotech.com',
      badge: isRtl ? 'شواحن توربو' : 'Turbo Service',
      color: '#D97706',
    },
    {
      id: 'ad-wash', serviceBrand: 'castrol',
      sponsor: isRtl ? 'إيليت لغسيل السيارات' : 'Elite Car Care',
      title: isRtl ? 'باقة غسيل وتلميع VIP' : 'VIP Wash & Polish Package',
      desc: isRtl ? 'غسيل بخار كامل وتلميع بالنانو شمع مع تعقيم مقصورة القيادة.' : 'Full steam wash, nano wax polish, and cabin sanitization at your doorstep.',
      coupon: 'ELITEVIP',
      image: require('../../assets/detailing_ad_banner.png'),
      website: 'https://elitecarcare.com',
      badge: isRtl ? 'غسيل سيارات' : 'Car Wash',
      color: '#10B981',
    },
    {
      id: 'ad-brakes', serviceBrand: 'brembo',
      sponsor: isRtl ? 'بريك ماستر للفرامل' : 'BrakeMaster Egypt',
      title: isRtl ? 'فحص مجاني لنظام الفرامل' : 'Free Brake System Check',
      desc: isRtl ? 'اطمئن على سلامتك مع فحص مجاني للفرامل وتخفيض على تيل الطنابير.' : 'Ensure your safety with a free brake inspection and discounts on replacement rotors.',
      coupon: 'SAFESTOP',
      image: require('../../assets/parts_ad_banner.png'),
      website: 'https://brakemaster.com',
      badge: isRtl ? 'فرامل وعفشة' : 'Brakes',
      color: '#EF4444',
    },
    {
      id: 'ad-transmission', serviceBrand: 'mobil',
      sponsor: isRtl ? 'مركز الفتيس الاحترافي' : 'Gearbox Pro Clinic',
      title: isRtl ? 'ضمان سنة على توضيب الفتيس' : '1 Year Transmission Warranty',
      desc: isRtl ? 'صيانة وتوضيب نواقل الحركة الأوتوماتيكية وDSG بأيدي مهندسين مختصين.' : 'Specialized repair and rebuilds for automatic and DSG gearboxes.',
      coupon: 'GEARPRO',
      image: require('../../assets/modern_workshop_banner.png'),
      website: 'https://gearboxpro.com',
      badge: isRtl ? 'صيانة الفتيس' : 'Transmission',
      color: '#6366F1',
    },
    {
      id: 'ad-tires', serviceBrand: 'michelin',
      sponsor: isRtl ? 'تاير زون لمبيعات الإطارات' : 'TyreZone Egypt',
      title: isRtl ? 'اشترِ ٣ إطارات واحصل على الرابع مجاناً' : 'Buy 3 Tires, Get 1 Free',
      desc: isRtl ? 'احصل على خصم مميز مع ترصيص وضبط زوايا مجاني عند شراء طقم إطارات.' : 'Get free alignment and wheel balancing with any premium brand tire set purchase.',
      coupon: 'TYREFREE',
      image: require('../../assets/parts_ad_banner.png'),
      website: 'https://tyrezone.com',
      badge: isRtl ? 'إطارات وزوايا' : 'Tires',
      color: '#06B6D4',
    },
    {
      id: 'ad-battery', serviceBrand: 'varta',
      sponsor: isRtl ? 'فولت تشارج لكهرباء السيارات' : 'VoltCharge Electrical',
      title: isRtl ? 'خصم ٢٠٪ على بطاريات فارتا' : '20% Off Varta Batteries',
      desc: isRtl ? 'تغيير البطارية وتوصيلها حتى باب البيت مع فحص شامل لدينامو السيارة.' : 'Battery replacement delivered to your location with alternator diagnosis.',
      coupon: 'VOLT20',
      image: require('../../assets/modern_workshop_banner.png'),
      website: 'https://voltcharge.com',
      badge: isRtl ? 'كهرباء وبطاريات' : 'Battery Service',
      color: '#F59E0B',
    },
    {
      id: 'ad-carbon', serviceBrand: 'shell',
      sponsor: isRtl ? 'كاربو كلين لتنظيف المحرك' : 'CarbonClean Egypt',
      title: isRtl ? 'استعد قوة المحرك المفقودة' : 'Restore Your Engine Power',
      desc: isRtl ? 'جلسة تنظيف محرك بالهيدروجين لإزالة الكربون وتحسين استهلاك الوقود.' : 'Hydrogen engine cleaning session to remove carbon deposits and save fuel.',
      coupon: 'CLEANFUEL',
      image: require('../../assets/tuning_ad_banner.png'),
      website: 'https://carbonclean.com',
      badge: isRtl ? 'تنظيف كربون' : 'Carbon Cleaning',
      color: '#8B5CF6',
    }
  ];

  const ITEM_SIZE = CARD_WIDTH + 12;
  const totalSize = ads.length * ITEM_SIZE;
  const renderedAds = [...ads, ...ads, ...ads];

  // Initialize scroll offset on mount and drive slow auto-scrolling
  useEffect(() => {
    currentOffsetRef.current = totalSize;
    const initialTimer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: totalSize, animated: false });
    }, 100);

    const scrollSpeed = 0.6; // ~24px per second: serene, gentle, legible drift
    const intervalMs = 25;

    const interval = setInterval(() => {
      if (isInteractingRef.current) return;

      currentOffsetRef.current += scrollSpeed;

      // Wrap around seamless jump if past middle block
      if (currentOffsetRef.current >= 2 * totalSize) {
        currentOffsetRef.current -= totalSize;
      }

      scrollViewRef.current?.scrollTo({
        x: currentOffsetRef.current,
        animated: false,
      });
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [totalSize]);

  const handleScrollEnd = (event) => {
    // If the scroll is still decelerating (momentum scrolling is active), do not jump yet.
    // We will let onMomentumScrollEnd handle the jump once it stops.
    if (event.nativeEvent.decelerating) {
      return;
    }

    let x = event.nativeEvent.contentOffset.x;

    // Endless scroll jump logic
    if (x < totalSize - screenWidth) {
      // Jump forward to middle copy
      x += totalSize;
      currentOffsetRef.current = x;
      scrollViewRef.current?.scrollTo({ x, animated: false });
    } else if (x >= 2 * totalSize) {
      // Jump backward to middle copy
      x -= totalSize;
      currentOffsetRef.current = x;
      scrollViewRef.current?.scrollTo({ x, animated: false });
    } else {
      currentOffsetRef.current = x;
    }
  };

  return (
    <View style={[styles.container, isRtl && { marginTop: 16 }]}>
      {/* Spotlight Header Row */}
      <View style={[styles.headerRow, false]}>
        <View>
          <Text style={[styles.sectionMain, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 15.0 }, false]}>{labelSpotlight}</Text>
        </View>
      </View>

      {/* Horizontal Carousel Wrapper */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          contentOffset={{ x: totalSize, y: 0 }}
          scrollEventThrottle={16}
          onScroll={(e) => {
            if (isInteractingRef.current) {
              currentOffsetRef.current = e.nativeEvent.contentOffset.x;
            }
          }}
          onTouchStart={() => {
            isInteractingRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
          }}
          onScrollBeginDrag={() => {
            isInteractingRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
          }}
          onScrollEndDrag={(e) => {
            handleScrollEnd(e);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = setTimeout(() => {
              isInteractingRef.current = false;
            }, 2000);
          }}
          onMomentumScrollEnd={(e) => {
            handleScrollEnd(e);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = setTimeout(() => {
              isInteractingRef.current = false;
            }, 2000);
          }}
        >
          {renderedAds.map((ad, idx) => (
            <TouchableOpacity 
              key={`${ad.id}-${idx}`} 
              style={styles.card}
              activeOpacity={0.9}
              onPressIn={() => {
                isInteractingRef.current = true;
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
              }}
              onPressOut={() => {
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(() => {
                  isInteractingRef.current = false;
                }, 2000);
              }}
              onPress={() => onSelectAd && onSelectAd(ad)}
            >
              <BlurView
                intensity={65}
                tint={colors.white === '#FFFFFF' ? 'light' : 'dark'}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flex: 1, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}>
                {ad.serviceBrand ? (
                  <ServiceBrandLogo brand={ad.serviceBrand} />
                ) : (
                  <Image source={ad.image} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
                )}
              </View>
              <View style={styles.adFooter}>
                <Text style={styles.adFooterText} numberOfLines={1}>
                  {ad.sponsor}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 0,
    marginHorizontal: -20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  sectionMain: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.bgBrand,
    marginTop: 1,
    letterSpacing: 0.4,
  },
  browseAllWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  browseAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDark,
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
  },
  scrollContainer: {
    paddingLeft: 20,
    paddingRight: 40,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(226, 235, 224, 0.35)' : 'rgba(24, 30, 24, 0.45)',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  adImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  adFooter: {
    height: 30,
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(26, 29, 26, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  adFooterText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  navArrow: {
    position: 'absolute',
    right: 12,
    top: '32%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  }
});
