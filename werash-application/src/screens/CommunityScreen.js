import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  TextInput,
  Keyboard,
  BackHandler,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
  PanResponder,
  StatusBar,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatsModal from '../components/ChatsModal';
import OtherUserProfileModal from '../components/OtherUserProfileModal';
import ImageViewerModal from '../components/ImageViewerModal';
import ChatImageGrid from '../components/ChatImageGrid';
import ImageCropModal from '../components/ImageCropModal';
import SharedSpecialistCard from '../components/SharedSpecialistCard';
import { ALL_MECHANICS } from '../data/mechanicsData';
import { toByteArray } from 'base64-js';
import { supabase } from '../services/supabase';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const TABS = [
  { id: 'feed', label: 'Feed', labelAr: 'الرئيسية' },
  { id: 'profile', label: 'Profile', labelAr: 'الملف' },
  { id: 'souq', label: 'Souq', labelAr: 'سوق' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FEED_GRID_WIDTH = Math.round(SCREEN_WIDTH - 40);
const DEFAULT_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.58);
const EXPANDED_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.94);

// Unicode-aware character truncation without splitting emojis or combining graphemes
export const truncatePostText = (str, limit = 120) => {
  if (!str) return { isLong: false, truncated: '', full: '' };
  let chars = [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      chars = Array.from(segmenter.segment(str), s => s.segment);
    } catch (_) {
      chars = Array.from(str);
    }
  } else {
    chars = Array.from(str);
  }
  const isLong = chars.length > limit;
  const truncated = isLong ? chars.slice(0, limit).join('').trimEnd() + '...' : str;
  return { isLong, truncated, full: str };
};

// Detect paragraph direction using the first strong directional character (Unicode BiDi rule)
export const getParagraphDirection = (text, fallbackIsRtl = false) => {
  if (!text) return fallbackIsRtl ? 'rtl' : 'ltr';
  const rtlRegex = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFC]/;
  const ltrRegex = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

  for (const ch of text) {
    if (rtlRegex.test(ch)) return 'rtl';
    if (ltrRegex.test(ch)) return 'ltr';
  }
  return fallbackIsRtl ? 'rtl' : 'ltr';
};

const REPORT_REASONS = [
  { id: 'offensive', en: 'Inappropriate or offensive content', ar: 'محتوى غير لائق أو مسيء' },
  { id: 'spam', en: 'Spam, scam, or misleading information', ar: 'احتيال أو رسائل غير مرغوب فيها' },
  { id: 'harassment', en: 'Harassment or hate speech', ar: 'مضايقة أو خطاب كراهية' },
  { id: 'false_info', en: 'False car/parts description or pricing', ar: 'وصف أو سعر غير صحيح لسيارة/قطع غيار' },
  { id: 'other', en: 'Other community guideline violation', ar: 'مخالفة أخرى لإرشادات المجتمع' },
];

const formatTimeAgo = (dateString, isRtl) => {
  if (!dateString) return isRtl ? 'الآن' : 'Just now';
  const parsed = new Date(dateString);
  const timeMs = parsed.getTime();
  if (isNaN(timeMs)) return isRtl ? 'الآن' : 'Just now';
  const diffMs = Date.now() - timeMs;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return isRtl ? 'الآن' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isRtl ? `منذ ${diffMin} د` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isRtl ? `منذ ${diffHr} س` : `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return isRtl ? 'أمس' : 'Yesterday';
  if (diffDay < 7) return isRtl ? `منذ ${diffDay} أيام` : `${diffDay}d ago`;
  try {
    return parsed.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return isRtl ? 'الآن' : 'Just now';
  }
};

const ProfileSegmentedControl = React.memo(function ProfileSegmentedControl({
  activeTab,
  onTabChange,
  isRtl,
  isDarkMode,
}) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 40);
  const slideAnim = useRef(new Animated.Value(activeTab === 'my_posts' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === 'my_posts' ? 0 : 1,
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const pillWidth = containerWidth > 0 ? (containerWidth - 7) / 2 : 0;
  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isRtl ? [0, -pillWidth] : [0, pillWidth],
  });

  const forestGreen = isDarkMode ? '#4ADE80' : '#003514';
  const mutedGrey = isDarkMode ? '#8E9C93' : '#8A959E';

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 1) {
          setContainerWidth(w);
        }
      }}
      style={[
        profileSegmentedStyles.container,
        {
          backgroundColor: isDarkMode ? '#1E2621' : '#ECEEF0',
          borderColor: isDarkMode ? '#2D3A32' : '#E2E5E8',
        },
        isRtl && { flexDirection: 'row-reverse' },
      ]}
    >
      {/* Smooth animated sliding pill */}
      {pillWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            profileSegmentedStyles.slider,
            {
              width: pillWidth,
              backgroundColor: isDarkMode ? '#27352B' : '#FFFFFF',
              transform: [{ translateX: pillTranslateX }],
            },
            isRtl ? { right: 3.5, left: undefined } : { left: 3.5 },
          ]}
        />
      )}

      {/* Tab 1: My Posts */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onTabChange('my_posts')}
        style={[
          profileSegmentedStyles.tab,
          isRtl && { flexDirection: 'row-reverse' },
        ]}
      >
        <Ionicons
          name="grid"
          size={16}
          color={activeTab === 'my_posts' ? forestGreen : mutedGrey}
          style={isRtl ? { marginLeft: 7 } : { marginRight: 7 }}
        />
        <Text
          style={[
            profileSegmentedStyles.text,
            activeTab === 'my_posts'
              ? [profileSegmentedStyles.textActive, { color: forestGreen }]
              : [profileSegmentedStyles.textInactive, { color: mutedGrey }],
            isRtl && profileSegmentedStyles.textRtl,
          ]}
        >
          {isRtl ? 'منشوراتي' : 'My posts'}
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Liked Posts */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onTabChange('liked_posts')}
        style={[
          profileSegmentedStyles.tab,
          isRtl && { flexDirection: 'row-reverse' },
        ]}
      >
        <Ionicons
          name="heart-outline"
          size={17}
          color={activeTab === 'liked_posts' ? forestGreen : mutedGrey}
          style={isRtl ? { marginLeft: 7 } : { marginRight: 7 }}
        />
        <Text
          style={[
            profileSegmentedStyles.text,
            activeTab === 'liked_posts'
              ? [profileSegmentedStyles.textActive, { color: forestGreen }]
              : [profileSegmentedStyles.textInactive, { color: mutedGrey }],
            isRtl && profileSegmentedStyles.textRtl,
          ]}
        >
          {isRtl ? 'الإعجابات' : 'Liked posts'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const profileSegmentedStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 42,
    borderRadius: 21,
    padding: 3.5,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
  },
  slider: {
    position: 'absolute',
    top: 3.5,
    bottom: 3.5,
    borderRadius: 17.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tab: {
    flex: 1,
    height: '100%',
    borderRadius: 17.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  text: {
    fontSize: 13,
  },
  textActive: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  textInactive: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  textRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 12.5,
  },
});

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
  onOpenSignIn,
  onUpdateCurrentUser,
  scrollToTopTrigger,
  onToggleNavBar,
  onSelectSpecialist,
  pendingSharedSpecialist,
  onClearPendingSharedSpecialist,
  unreadChatsCount: propUnreadChatsCount,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [localUnreadChatsCount, setUnreadChatsCount] = useState(0);
  const unreadChatsCount = propUnreadChatsCount !== undefined ? propUnreadChatsCount : localUnreadChatsCount;
  const [chatInitialUser, setChatInitialUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRtl = selectedLanguage === 'Arabic';

  // Profile avatar & banner upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [myAvatarUrl, setMyAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.avatar || null);
  const [myBannerUrl, setMyBannerUrl] = useState(currentUser?.bannerUrl || null);
  const myAvatarTsRef = useRef(0);
  const myBannerTsRef = useRef(0);

  // Blank white search page state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Blank white create post page state
  const [isCreatePostActive, setIsCreatePostActive] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [attachedSpecialist, setAttachedSpecialist] = useState(null);
  const postImageUri = postImages[0] || null;
  const [isPosting, setIsPosting] = useState(false);
  const [isPickingPostImage, setIsPickingPostImage] = useState(false);
  const createPostInputRef = useRef(null);

  // Auto-attach specialist when triggered from "Share to feed"
  useEffect(() => {
    if (pendingSharedSpecialist) {
      setAttachedSpecialist(pendingSharedSpecialist);
      setIsCreatePostActive(true);
      if (typeof onClearPendingSharedSpecialist === 'function') {
        onClearPendingSharedSpecialist();
      }
    }
  }, [pendingSharedSpecialist]);

  // Dedicated other user profile page modal state
  const [viewingOtherUser, setViewingOtherUser] = useState(null);

  // Full-screen image preview state (for banner, avatar & posts - Same as Chat)
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  // Interactive Crop & Reposition Preview Modal State (for Avatar and Banner)
  const [cropConfig, setCropConfig] = useState({
    visible: false,
    uri: null,
    type: 'avatar', // 'avatar' | 'banner'
  });

  // Track expanded state for posts exceeding 120 characters limit
  const [expandedPosts, setExpandedPosts] = useState({});

  const handleOpenPostImage = (post, initialIdx = 0) => {
    if (!post) return;
    const img = post.postImage || post.image || post.media_url;
    if (!img) return;

    let imagesList = [];
    if (Array.isArray(post.images) && post.images.length > 0) {
      imagesList = post.images.map(item => (typeof item === 'string' ? item : (item.uri || item)));
    } else {
      const resolved = typeof img === 'string' ? img : (img.uri || img);
      imagesList = [resolved];
    }

    setViewerImages(imagesList);
    setViewerInitialIndex(initialIdx);
    setViewerVisible(true);
  };

  // Interactive Comments state & animations
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [commentInputText, setCommentInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, author }
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const commentsScrollRef = useRef(null);
  const commentInputRef = useRef(null);
  const isCommentsExpandedRef = useRef(false);
  const commentsHeightAnim = useRef(new Animated.Value(DEFAULT_COMMENTS_HEIGHT)).current;
  const commentsSlideAnim = useRef(new Animated.Value(0)).current;

  // 3-Dots Post Menu & Report State
  const [activeMenuPost, setActiveMenuPost] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 120, isAbove: true });
  const [reportModalPost, setReportModalPost] = useState(null);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [reportDetailText, setReportDetailText] = useState('');
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [notInterestedPostIds, setNotInterestedPostIds] = useState([]);
  const pendingLikesRef = useRef(new Set());

  useEffect(() => {
    const storageKey = currentUser?.id ? `@werash_not_interested_${currentUser.id}` : '@werash_not_interested_guest';
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            setNotInterestedPostIds(list);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, [currentUser?.id]);

  // Fast permission check without blocking main thread on repeat taps
  const ensureMediaPermissions = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status === 'granted') return true;
      if (status === 'undetermined' || !status) {
        const { status: reqStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return reqStatus === 'granted';
      }
      return true;
    } catch (_) {
      return true;
    }
  };

  // Pick images for new post (allows multiple selection, instant preview)
  const handlePickPostImage = async () => {
    try {
      setIsPickingPostImage(true);
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri).filter(Boolean);
        setPostImages(prev => [...prev, ...uris]);
      }
    } catch (err) {
      console.warn('handlePickPostImage error:', err);
    } finally {
      setIsPickingPostImage(false);
    }
  };

  // Hardware back button dismisses image preview, blank search & create post pages
  useEffect(() => {
    if (!isSearchActive && !isCreatePostActive && !previewImage) return;
    const backAction = () => {
      if (previewImage) {
        setPreviewImage(null);
        return true;
      }
      if (isCreatePostActive) {
        setIsCreatePostActive(false);
        setNewPostContent('');
        setPostImages([]);
        setAttachedSpecialist(null);
        return true;
      }
      if (isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery('');
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [previewImage, isSearchActive, isCreatePostActive]);

  useEffect(() => {
    if (currentUser?.id) {
      AsyncStorage.getItem(`@werash_user_avatar_ts_${currentUser.id}`).then((val) => {
        if (val) {
          const ts = parseInt(val, 10);
          if (ts > myAvatarTsRef.current) myAvatarTsRef.current = ts;
        }
      }).catch(() => {});
      AsyncStorage.getItem(`@werash_user_avatar_${currentUser.id}`).then((val) => {
        if (val) {
          setMyAvatarUrl(val);
        } else if (currentUser.avatarUrl || currentUser.avatar) {
          setMyAvatarUrl(currentUser.avatarUrl || currentUser.avatar);
        }
      }).catch(() => {
        if (currentUser.avatarUrl || currentUser.avatar) {
          setMyAvatarUrl(currentUser.avatarUrl || currentUser.avatar);
        }
      });
      AsyncStorage.getItem(`@werash_user_banner_ts_${currentUser.id}`).then((val) => {
        if (val) {
          const ts = parseInt(val, 10);
          if (ts > myBannerTsRef.current) myBannerTsRef.current = ts;
        }
      }).catch(() => {});
      AsyncStorage.getItem(`@werash_user_banner_${currentUser.id}`).then((val) => {
        if (val) {
          setMyBannerUrl(val);
        } else if (currentUser.bannerUrl) {
          setMyBannerUrl(currentUser.bannerUrl);
        }
      }).catch(() => {
        if (currentUser.bannerUrl) {
          setMyBannerUrl(currentUser.bannerUrl);
        }
      });
    } else {
      if (currentUser?.avatarUrl || currentUser?.avatar) {
        setMyAvatarUrl(currentUser.avatarUrl || currentUser.avatar);
      }
      if (currentUser?.bannerUrl) {
        setMyBannerUrl(currentUser.bannerUrl);
      }
    }
  }, [currentUser?.id, currentUser?.avatarUrl, currentUser?.avatar, currentUser?.bannerUrl]);

  // Profile Sub-tab state: 'my_posts' or 'liked_posts'
  const [profileSubTab, setProfileSubTab] = useState('my_posts');

  // Filter user posts for profile tab and scroll lock check
  const userPosts = posts.filter(p => {
    if (reportedPostIds.includes(p.id) || notInterestedPostIds.includes(p.id)) return false;
    if (currentUser?.id) {
      return p.userId === currentUser.id;
    }
    if (currentUser?.fullName) {
      return p.author === currentUser.fullName;
    }
    return false;
  });
  const userPostsCount = userPosts.length;

  // Filter posts liked by the user (synchronized in real-time)
  const likedPosts = posts.filter(p => {
    if (reportedPostIds.includes(p.id) || notInterestedPostIds.includes(p.id)) return false;
    return Boolean(p.liked);
  });
  const activeProfilePosts = profileSubTab === 'my_posts' ? userPosts : likedPosts;

  const scrollViewRef = useRef(null);
  const lastOffsetY = useRef(0);

  // Collapsible & Click-at-top Header state & animation
  const [headerHeight, setHeaderHeight] = useState(topInset + 115);
  const headerTranslateAnim = useRef(new Animated.Value(0)).current;
  const isHeaderHidden = useRef(false);
  const isNavHidden = useRef(false);

  useEffect(() => {
    if (scrollToTopTrigger) {
      handleScrollToTop();
    }
  }, [scrollToTopTrigger]);

  useEffect(() => {
    return () => {
      if (onToggleNavBar && isNavHidden.current) {
        isNavHidden.current = false;
        onToggleNavBar(false);
      }
    };
  }, [onToggleNavBar]);

  // Hide bottom navbar when viewing image in full-screen on main screen
  useEffect(() => {
    if (previewImage) {
      if (onToggleNavBar) onToggleNavBar(true);
    } else {
      if (onToggleNavBar && !isNavHidden.current) {
        onToggleNavBar(false);
      }
    }
  }, [previewImage, onToggleNavBar]);

  const onHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height && Math.abs(height - headerHeight) > 1) {
      setHeaderHeight(height);
    }
  };

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastOffsetY.current;

    // If on profile tab and has no posts, NEVER hide the header at the top
    if (activeTab === 'profile' && activeProfilePosts.length === 0) {
      if (isHeaderHidden.current) {
        isHeaderHidden.current = false;
        Animated.timing(headerTranslateAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
      if (onToggleNavBar && isNavHidden.current) {
        isNavHidden.current = false;
        onToggleNavBar(false);
      }
      lastOffsetY.current = currentY;
      return;
    }

    // When scrolling down past initial top zone: hide header off-screen & hide navbar
    if (currentY > 60 && diff > 8) {
      if (!isHeaderHidden.current) {
        isHeaderHidden.current = true;
        Animated.timing(headerTranslateAnim, {
          toValue: -headerHeight,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
      if (onToggleNavBar && !isNavHidden.current) {
        isNavHidden.current = true;
        onToggleNavBar(true);
      }
    }
    // When scrolling up (diff < -8) or at the top: immediately slide down and click header at the top & show navbar
    else if (diff < -8 || currentY <= 15) {
      if (isHeaderHidden.current || currentY <= 15) {
        isHeaderHidden.current = false;
        Animated.timing(headerTranslateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      if (onToggleNavBar && isNavHidden.current) {
        isNavHidden.current = false;
        onToggleNavBar(false);
      }
    }

    lastOffsetY.current = currentY;
  };

  const handleScrollToTop = () => {
    // Dock header at top
    isHeaderHidden.current = false;
    Animated.timing(headerTranslateAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (onToggleNavBar && isNavHidden.current) {
      isNavHidden.current = false;
      onToggleNavBar(false);
    }

    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const requireAuth = () => {
    if (!currentUser?.id) {
      if (typeof onOpenSignIn === 'function') {
        onOpenSignIn();
      } else {
        Alert.alert(
          isRtl ? 'تسجيل الدخول مطلوب' : 'Sign In Required',
          isRtl ? 'يرجى تسجيل الدخول لتحديث ملفك الشخصي.' : 'Please sign in to customize your profile.'
        );
      }
      return false;
    }
    return true;
  };

  // Helper to convert base64 to byte array for reliable storage upload
  const getUploadBytes = (base64Str) => {
    if (!base64Str) return null;
    try {
      const base64Js = require('base64-js');
      return base64Js.toByteArray(base64Str);
    } catch (_) {
      try {
        if (typeof atob === 'function') {
          const binaryStr = atob(base64Str);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return bytes;
        }
      } catch (_) {}
    }
    return null;
  };

  // Pick Avatar and open interactive crop preview
  const handlePickAndUploadAvatar = async () => {
    if (!requireAuth()) return;
    try {
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Reposition and crop handled in dedicated preview
        quality: 1.0,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setCropConfig({
        visible: true,
        uri: result.assets[0].uri,
        type: 'avatar',
      });
    } catch (err) {
      console.warn('handlePickAndUploadAvatar error:', err);
    }
  };

  // Pick Banner and open interactive crop preview
  const handlePickAndUploadBanner = async () => {
    if (!requireAuth()) return;
    try {
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Reposition and crop handled in dedicated preview
        quality: 1.0,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setCropConfig({
        visible: true,
        uri: result.assets[0].uri,
        type: 'banner',
      });
    } catch (err) {
      console.warn('handlePickAndUploadBanner error:', err);
    }
  };

  // Handle saving the crop-and-repositioned image
  const handleSaveCroppedImage = async (croppedUri, cropResult) => {
    const type = cropResult?.cropType || cropResult?.type || cropConfig.type || 'avatar';
    setCropConfig({ visible: false, uri: null, type: 'avatar' });

    if (!croppedUri) return;
    const now = Date.now();

    if (type === 'avatar') {
      myAvatarTsRef.current = now;
      // 1. Instant Optimistic UI Update & Local Persistence (0ms delay for user)
      setMyAvatarUrl(croppedUri);
      if (currentUser?.id) {
        try {
          await AsyncStorage.setItem(`@werash_user_avatar_${currentUser.id}`, croppedUri);
          await AsyncStorage.setItem(`@werash_user_avatar_ts_${currentUser.id}`, String(now));
        } catch (e) {}
      }

      if (typeof onUpdateCurrentUser === 'function') {
        onUpdateCurrentUser({
          ...currentUser,
          avatar: croppedUri,
          avatarUrl: croppedUri,
        });
      }
      setPosts(prev => prev.map(p => {
        if (p.userId === currentUser?.id || (currentUser?.fullName && p.author === currentUser.fullName)) {
          return { ...p, avatar: { uri: croppedUri } };
        }
        return p;
      }));

      // 2. Background Cloud Sync (resilient, non-blocking)
      setIsUploadingAvatar(true);
      (async () => {
        try {
          let authUserId = currentUser?.id;
          let activeSession = null;
          try {
            const sessionRes = await supabase.auth.getSession();
            activeSession = sessionRes?.data?.session;
            if (!activeSession) {
              const refreshRes = await supabase.auth.refreshSession().catch(() => null);
              activeSession = refreshRes?.data?.session;
            }
            if (activeSession?.user?.id) {
              authUserId = activeSession.user.id;
            }
          } catch (_) {}

          let uploadBody = null;
          if (cropResult?.base64) {
            try {
              uploadBody = toByteArray(cropResult.base64);
            } catch (convErr) {
              console.warn('Failed converting base64 to Uint8Array for avatar:', convErr);
            }
          }
          if (!uploadBody) {
            try {
              const response = await fetch(croppedUri);
              uploadBody = await response.blob();
            } catch (fetchErr) {
              console.warn('fetch blob failed for cropped avatar:', fetchErr);
            }
          }

          if (uploadBody && authUserId) {
            const fileName = `${authUserId}/avatar_${now}.jpg`;

            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('community-media')
              .upload(fileName, uploadBody, {
                contentType: 'image/jpeg',
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicData } = supabase.storage
                .from('community-media')
                .getPublicUrl(fileName);
              const publicUrl = publicData?.publicUrl;

              if (publicUrl) {
                const finishedTs = Date.now();
                myAvatarTsRef.current = finishedTs;
                setMyAvatarUrl(publicUrl);
                if (currentUser?.id) {
                  try {
                    await AsyncStorage.setItem(`@werash_user_avatar_${currentUser.id}`, publicUrl);
                    await AsyncStorage.setItem(`@werash_user_avatar_ts_${currentUser.id}`, String(finishedTs));
                  } catch (e) {}
                }
                if (typeof onUpdateCurrentUser === 'function') {
                  onUpdateCurrentUser({
                    ...currentUser,
                    avatar: publicUrl,
                    avatarUrl: publicUrl,
                  });
                }
                setPosts(prev => prev.map(p => {
                  if (p.userId === currentUser?.id || p.userId === authUserId || (currentUser?.fullName && p.author === currentUser.fullName)) {
                    return { ...p, avatar: { uri: publicUrl } };
                  }
                  return p;
                }));

                const targetId = authUserId || currentUser?.id;
                // Update profiles table
                await supabase
                  .from('profiles')
                  .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', targetId)
                  .catch(e => console.warn('Error updating profile avatar_url:', e));

                // Update community_posts table so everyone else sees the new avatar immediately!
                await supabase
                  .from('community_posts')
                  .update({ author_avatar: publicUrl })
                  .eq('user_id', targetId)
                  .catch(e => console.warn('Error updating community_posts avatar by user_id:', e));

                // Update conversations table
                supabase
                  .from('conversations')
                  .update({ participant_1_avatar: publicUrl })
                  .eq('participant_1', targetId)
                  .catch(() => {});
                supabase
                  .from('conversations')
                  .update({ participant_2_avatar: publicUrl })
                  .eq('participant_2', targetId)
                  .catch(() => {});

                // Update auth metadata
                supabase.auth
                  .updateUser({ data: { avatar_url: publicUrl } })
                  .catch(e => console.warn('Error updating auth metadata avatar_url:', e));
              }
            } else if (uploadErr) {
              console.warn('Supabase storage avatar upload warning (retaining local photo):', uploadErr.message || uploadErr);
            }
          }
        } catch (syncErr) {
          console.warn('Background avatar sync error:', syncErr);
        } finally {
          setIsUploadingAvatar(false);
        }
      })();
    } else if (type === 'banner') {
      myBannerTsRef.current = now;
      // 1. Instant Optimistic UI Update & Local Persistence (0ms delay for user)
      setMyBannerUrl(croppedUri);
      if (currentUser?.id) {
        try {
          await AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, croppedUri);
          await AsyncStorage.setItem(`@werash_user_banner_ts_${currentUser.id}`, String(now));
        } catch (e) {}
      }

      if (typeof onUpdateCurrentUser === 'function') {
        onUpdateCurrentUser({
          ...currentUser,
          bannerUrl: croppedUri,
        });
      }

      // 2. Background Cloud Sync (resilient, non-blocking)
      setIsUploadingBanner(true);
      (async () => {
        try {
          let authUserId = currentUser?.id;
          let activeSession = null;
          try {
            const sessionRes = await supabase.auth.getSession();
            activeSession = sessionRes?.data?.session;
            if (!activeSession) {
              const refreshRes = await supabase.auth.refreshSession().catch(() => null);
              activeSession = refreshRes?.data?.session;
            }
            if (activeSession?.user?.id) {
              authUserId = activeSession.user.id;
            }
          } catch (_) {}

          let uploadBody = null;
          if (cropResult?.base64) {
            try {
              uploadBody = toByteArray(cropResult.base64);
            } catch (convErr) {
              console.warn('Failed converting base64 to Uint8Array for banner:', convErr);
            }
          }
          if (!uploadBody) {
            try {
              const response = await fetch(croppedUri);
              uploadBody = await response.blob();
            } catch (fetchErr) {
              console.warn('fetch blob failed for cropped banner:', fetchErr);
            }
          }

          if (uploadBody && authUserId) {
            const fileName = `${authUserId}/banner_${now}.jpg`;

            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('community-media')
              .upload(fileName, uploadBody, {
                contentType: 'image/jpeg',
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicData } = supabase.storage
                .from('community-media')
                .getPublicUrl(fileName);
              const publicUrl = publicData?.publicUrl;

              if (publicUrl) {
                const finishedTs = Date.now();
                myBannerTsRef.current = finishedTs;
                setMyBannerUrl(publicUrl);
                if (currentUser?.id) {
                  try {
                    await AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, publicUrl);
                    await AsyncStorage.setItem(`@werash_user_banner_ts_${currentUser.id}`, String(finishedTs));
                  } catch (e) {}
                }
                if (typeof onUpdateCurrentUser === 'function') {
                  onUpdateCurrentUser({
                    ...currentUser,
                    bannerUrl: publicUrl,
                  });
                }

                const targetId = authUserId || currentUser?.id;
                // Update profiles table
                await supabase
                  .from('profiles')
                  .update({
                    banner_url: publicUrl,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', targetId)
                  .catch(e => console.warn('Error updating profile banner_url:', e));

                // Update auth metadata
                supabase.auth
                  .updateUser({ data: { banner_url: publicUrl } })
                  .catch(e => console.warn('Error updating auth metadata banner_url:', e));
              }
            } else if (uploadErr) {
              console.warn('Supabase storage banner upload warning (retaining local banner):', uploadErr.message || uploadErr);
            }
          }
        } catch (syncErr) {
          console.warn('Background banner sync error:', syncErr);
        } finally {
          setIsUploadingBanner(false);
        }
      })();
    }
  };

  // Fetch live posts from Supabase cloud
  const fetchCloudPosts = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      // 1. Fetch user profiles for avatars
      let profMap = {};
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, banner_url, updated_at');
        if (profs && Array.isArray(profs)) {
          setAllProfiles(profs);
          profs.forEach((pr) => {
            if (pr.id) profMap[pr.id] = pr;
          });
          if (currentUser?.id && profMap[currentUser.id]) {
            const myProf = profMap[currentUser.id];
            const cloudUpdatedAt = myProf.updated_at ? new Date(myProf.updated_at).getTime() : 0;
            // Only update local avatar if cloud is newer than our local edit timestamp
            if (cloudUpdatedAt > myAvatarTsRef.current && myProf.avatar_url && myProf.avatar_url.startsWith('http')) {
              myAvatarTsRef.current = cloudUpdatedAt;
              setMyAvatarUrl(myProf.avatar_url);
              AsyncStorage.setItem(`@werash_user_avatar_${currentUser.id}`, myProf.avatar_url).catch(() => {});
            } else if (myAvatarUrl && myAvatarUrl.startsWith('http') && myProf.avatar_url !== myAvatarUrl) {
              // Cloud has stale avatar: auto-sync local newest avatar up to Supabase in background
              supabase
                .from('profiles')
                .update({ avatar_url: myAvatarUrl, updated_at: new Date().toISOString() })
                .eq('id', currentUser.id)
                .catch(() => {});
              supabase
                .from('community_posts')
                .update({ author_avatar: myAvatarUrl })
                .eq('user_id', currentUser.id)
                .catch(() => {});
            }

            if (cloudUpdatedAt > myBannerTsRef.current && myProf.banner_url && myProf.banner_url.startsWith('http')) {
              myBannerTsRef.current = cloudUpdatedAt;
              setMyBannerUrl(myProf.banner_url);
              AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, myProf.banner_url).catch(() => {});
            } else if (myBannerUrl && myBannerUrl.startsWith('http') && myProf.banner_url !== myBannerUrl) {
              supabase
                .from('profiles')
                .update({ banner_url: myBannerUrl, updated_at: new Date().toISOString() })
                .eq('id', currentUser.id)
                .catch(() => {});
            }
          }
        }
      } catch (_) {}

      // 2. Fetch posts ordered by newest first
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.warn('Error fetching community posts:', postsError.message);
        return;
      }

      // 3. Fetch all likes from community_post_likes to compute accurate live like counts and liked status
      let likedPostIds = new Set();
      const likesCountMap = {};

      try {
        const { data: allLikesData } = await supabase
          .from('community_post_likes')
          .select('post_id, user_id');

        if (allLikesData && Array.isArray(allLikesData)) {
          allLikesData.forEach((l) => {
            if (l.post_id) {
              likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1;
              if (currentUser?.id && l.user_id === currentUser.id) {
                likedPostIds.add(l.post_id);
              }
            }
          });
        }
      } catch (_) {}

      // 4. Fetch real comments count directly from community_post_comments
      const commentsCountMap = {};
      try {
        const { data: allCommentsData } = await supabase
          .from('community_post_comments')
          .select('id, post_id');

        if (allCommentsData && Array.isArray(allCommentsData)) {
          allCommentsData.forEach((c) => {
            if (c.post_id) {
              commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
            }
          });
        }
      } catch (_) {}

      // Check locally cached user likes as backup
      if (currentUser?.id) {
        try {
          const cachedLikes = await AsyncStorage.getItem(`@werash_user_likes_${currentUser.id}`);
          if (cachedLikes) {
            const parsed = JSON.parse(cachedLikes);
            if (Array.isArray(parsed)) {
              parsed.forEach((id) => likedPostIds.add(id));
            }
          }
        } catch (_) {}
      }

      const mapped = (postsData || []).map(p => {
        const authorProf = p.user_id ? profMap[p.user_id] : null;
        let finalAvatarUrl = authorProf?.avatar_url || p.author_avatar;
        const isMyPost = Boolean(
          (currentUser?.id && p.user_id === currentUser.id) ||
          (currentUser?.fullName && p.author_name === currentUser.fullName)
        );
        if (isMyPost && myAvatarUrl) {
          finalAvatarUrl = myAvatarUrl;
        }
        const realLikesCount = likesCountMap[p.id];
        const isLikedByMe = likedPostIds.has(p.id);
        const resolvedLikes = realLikesCount !== undefined 
          ? realLikesCount 
          : (p.likes_count || (isLikedByMe ? 1 : 0));

        const realCommentsCount = commentsCountMap[p.id];
        const resolvedComments = realCommentsCount !== undefined
          ? realCommentsCount
          : (p.comments_count || 0);

        let parsedImages = null;
        let singlePostImage = null;
        let specialistObj = null;
        if (p.media_url) {
          if (typeof p.media_url === 'string' && p.media_url.trim().startsWith('{')) {
            try {
              const meta = JSON.parse(p.media_url);
              if (meta.specialist_id) {
                specialistObj = ALL_MECHANICS.find(m => m.id === meta.specialist_id) || meta.specialist_data || null;
              }
              if (meta.images && Array.isArray(meta.images)) {
                parsedImages = meta.images;
                singlePostImage = meta.images[0] ? { uri: meta.images[0] } : null;
              }
            } catch (_) {}
          } else if (typeof p.media_url === 'string' && p.media_url.trim().startsWith('[')) {
            try {
              const arr = JSON.parse(p.media_url);
              if (Array.isArray(arr) && arr.length > 0) {
                parsedImages = arr;
                singlePostImage = { uri: arr[0] };
              }
            } catch (_) {}
          }
          if (!parsedImages && !specialistObj) {
            parsedImages = [p.media_url];
            singlePostImage = { uri: p.media_url };
          }
        }

        return {
          id: p.id,
          userId: p.user_id,
          author: p.author_name || 'Community Member',
          handle: p.author_handle || `@${(p.author_name || 'user').toLowerCase().replace(/[\s\W]+/g, '')}`,
          avatar: finalAvatarUrl ? { uri: finalAvatarUrl } : null,
          time: formatTimeAgo(p.created_at, isRtl),
          content: p.content,
          postImage: singlePostImage,
          images: parsedImages,
          specialist: specialistObj,
          likes: resolvedLikes,
          comments: resolvedComments,
          liked: isLikedByMe,
          vehicle: p.vehicle || 'General',
          isMarketplace: Boolean(p.is_marketplace),
          title: p.title || (p.content ? p.content.split('\n')[0].trim() : (p.vehicle || null)),
          price: p.price || null,
          location: p.location || null,
        };
      });

      setPosts(mapped);
    } catch (err) {
      console.warn('fetchCloudPosts error:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCloudPosts();

    // Subscribe to realtime changes for new/deleted/updated posts and profile updates
    const channel = supabase
      .channel('community_posts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          fetchCloudPosts(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => {
          fetchCloudPosts(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_post_comments' },
        (payload) => {
          const targetPostId = payload.new?.post_id || payload.old?.post_id;
          if (targetPostId) {
            if (payload.eventType === 'INSERT') {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === targetPostId ? { ...p, comments: (p.comments || 0) + 1 } : p
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === targetPostId ? { ...p, comments: Math.max(0, (p.comments || 1) - 1) } : p
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isRtl]);

  // Fetch comments for a specific post from Supabase
  const fetchPostComments = async (postId) => {
    if (!postId) return;
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching comments:', error.message);
        setIsLoadingComments(false);
        return;
      }

      const commentMap = new Map();
      const topLevelList = [];

      (data || []).forEach((row) => {
        const item = {
          id: row.id,
          author: row.author_name || (isRtl ? 'مستخدم' : 'User'),
          handle: row.author_handle || '@user',
          avatar: row.author_avatar ? { uri: row.author_avatar } : null,
          time: formatTimeAgo(row.created_at, isRtl),
          content: row.content,
          likes: 0,
          liked: false,
          replies: [],
          parentId: row.parent_id || null,
        };
        commentMap.set(row.id, item);
        if (!row.parent_id) {
          topLevelList.push(item);
        }
      });

      (data || []).forEach((row) => {
        if (row.parent_id && commentMap.has(row.parent_id)) {
          const parent = commentMap.get(row.parent_id);
          const reply = commentMap.get(row.id);
          if (parent && reply && !parent.replies.some((r) => r.id === reply.id)) {
            parent.replies.push(reply);
          }
        }
      });

      setActiveCommentsPost((prev) => {
        if (!prev || prev.id !== postId) return prev;
        return {
          ...prev,
          commentsList: topLevelList,
          comments: (data || []).length,
        };
      });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: topLevelList,
              comments: (data || []).length,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.warn('fetchPostComments exception:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Realtime subscription for comments on the active post
  useEffect(() => {
    if (activeCommentsPost?.id) {
      isCommentsExpandedRef.current = false;
      commentsHeightAnim.setValue(DEFAULT_COMMENTS_HEIGHT);
      fetchPostComments(activeCommentsPost.id);

      const commentsChannel = supabase
        .channel(`comments_${activeCommentsPost.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_post_comments',
            filter: `post_id=eq.${activeCommentsPost.id}`,
          },
          (payload) => {
            if (payload.new) {
              fetchPostComments(activeCommentsPost.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsChannel);
      };
    }
  }, [activeCommentsPost?.id]);

  // Drag-to-expand / drag-to-dismiss gesture for comments bottom sheet
  const commentsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        commentsHeightAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const baseHeight = isCommentsExpandedRef.current ? EXPANDED_COMMENTS_HEIGHT : DEFAULT_COMMENTS_HEIGHT;
        const targetHeight = baseHeight - gestureState.dy;
        const clampedHeight = Math.max(140, Math.min(EXPANDED_COMMENTS_HEIGHT, targetHeight));
        commentsHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
          const nextExpanded = !isCommentsExpandedRef.current;
          isCommentsExpandedRef.current = nextExpanded;
          Animated.spring(commentsHeightAnim, {
            toValue: nextExpanded ? EXPANDED_COMMENTS_HEIGHT : DEFAULT_COMMENTS_HEIGHT,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
          }).start();
          return;
        }

        const isExpanded = isCommentsExpandedRef.current;
        if (!isExpanded) {
          if (gestureState.dy < -45 || gestureState.vy < -0.35) {
            isCommentsExpandedRef.current = true;
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else if (gestureState.dy > 80 || gestureState.vy > 0.6) {
            Animated.timing(commentsHeightAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: false,
            }).start(() => setActiveCommentsPost(null));
          } else {
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        } else {
          if (gestureState.dy > 50 || gestureState.vy > 0.35) {
            isCommentsExpandedRef.current = false;
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else {
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;

  const handleOpenComments = (post) => {
    const freshPost = posts.find(p => p.id === post.id) || post;
    commentsSlideAnim.setValue(500);
    isCommentsExpandedRef.current = false;
    commentsHeightAnim.setValue(DEFAULT_COMMENTS_HEIGHT);
    setActiveCommentsPost(freshPost);
    setCommentInputText('');
    setReplyingTo(null);
    Animated.spring(commentsSlideAnim, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    fetchPostComments(freshPost.id);
  };

  const handleStartReply = (comment, specificAuthor) => {
    const authorToReply = specificAuthor || comment.author;
    setReplyingTo({
      commentId: comment.id,
      author: authorToReply,
    });
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  const handleSubmitComment = async () => {
    if (!requireAuth()) return;
    if (!commentInputText.trim() || !activeCommentsPost) return;

    const currentAuthorName = currentUser?.fullName || (isRtl ? 'مستخدم' : 'Guest User');
    const currentHandle = currentUser?.fullName
      ? `@${currentUser.fullName.toLowerCase().replace(/[\s\W]+/g, '')}`
      : '@guest';
    const commentContent = commentInputText.trim();
    const postId = activeCommentsPost.id;
    const parentCommentId = replyingTo ? replyingTo.commentId : null;

    setCommentInputText('');
    setReplyingTo(null);

    const tempId = `temp_${Date.now()}`;
    const newCommentItem = {
      id: tempId,
      author: currentAuthorName,
      handle: currentHandle,
      avatar: currentUser?.avatarUrl ? { uri: currentUser.avatarUrl } : null,
      time: isRtl ? 'الآن' : 'Just now',
      content: commentContent,
      likes: 0,
      liked: false,
      replies: [],
      parentId: parentCommentId,
    };

    const updatePostState = (p) => {
      if (p.id !== postId) return p;
      let updatedComments = [...(p.commentsList || [])];

      if (parentCommentId) {
        updatedComments = updatedComments.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newCommentItem],
            };
          }
          return c;
        });
      } else {
        updatedComments.push(newCommentItem);
      }

      const totalCount = (p.comments || 0) + 1;
      return {
        ...p,
        commentsList: updatedComments,
        comments: totalCount,
      };
    };

    setPosts((prev) => prev.map(updatePostState));
    setActiveCommentsPost((prev) => (prev ? updatePostState(prev) : null));

    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollToEnd({ animated: true });
      }
    }, 120);

    if (currentUser?.id) {
      try {
        const payload = {
          post_id: postId,
          user_id: currentUser.id,
          author_name: currentAuthorName,
          author_handle: currentHandle,
          author_avatar: currentUser.avatarUrl || null,
          content: commentContent,
        };
        if (parentCommentId) {
          payload.parent_id = parentCommentId;
        }

        const { data: insertedComment, error: insertErr } = await supabase
          .from('community_post_comments')
          .insert(payload)
          .select()
          .single();

        if (!insertErr && insertedComment) {
          const replaceTempId = (p) => {
            if (p.id !== postId) return p;
            const updatedComments = (p.commentsList || []).map((c) => {
              if (c.id === tempId) {
                return { ...c, id: insertedComment.id };
              }
              if (c.replies && c.replies.length > 0) {
                const updatedReplies = c.replies.map((r) =>
                  r.id === tempId ? { ...r, id: insertedComment.id } : r
                );
                return { ...c, replies: updatedReplies };
              }
              return c;
            });
            return { ...p, commentsList: updatedComments };
          };

          setPosts((prev) => prev.map(replaceTempId));
          setActiveCommentsPost((prev) => (prev ? replaceTempId(prev) : null));

          // Query the exact, fresh count of comments for this post from Supabase
          const { count: freshCount } = await supabase
            .from('community_post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', postId);

          const finalCommentsCount = typeof freshCount === 'number' ? freshCount : (activeCommentsPost?.comments || 0) + 1;

          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments: finalCommentsCount } : p))
          );
          setActiveCommentsPost((prev) => (prev ? { ...prev, comments: finalCommentsCount } : null));

          supabase
            .from('community_posts')
            .update({ comments_count: finalCommentsCount })
            .eq('id', postId)
            .then(() => {})
            .catch(() => {});
        } else if (insertErr) {
          console.warn('Error saving comment to Supabase:', insertErr.message);
        }
      } catch (err) {
        console.warn('handleSubmitComment exception:', err);
      }
    }
  };

  const handleToggleCommentLike = (postId, commentId) => {
    const updatePostComments = (p) => {
      if (p.id !== postId) return p;
      const updatedList = (p.commentsList || []).map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.liked;
          return {
            ...c,
            liked: isLiked,
            likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 1) - 1),
          };
        }
        return c;
      });
      return { ...p, commentsList: updatedList };
    };

    setPosts((prev) => prev.map(updatePostComments));
    setActiveCommentsPost((prev) => (prev ? updatePostComments(prev) : null));
  };

  const handleToggleReplyLike = (postId, commentId, replyId) => {
    const updatePost = (p) => {
      if (p.id !== postId) return p;
      const updatedComments = (p.commentsList || []).map((c) => {
        if (c.id === commentId) {
          const updatedReplies = (c.replies || []).map((r) => {
            if (r.id === replyId) {
              const isLiked = !r.liked;
              return {
                ...r,
                liked: isLiked,
                likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 1) - 1),
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      });
      return { ...p, commentsList: updatedComments };
    };

    setPosts((prev) => prev.map(updatePost));
    setActiveCommentsPost((prev) => (prev ? updatePost(prev) : null));
  };

  const handleOpenPostMenu = (post, e) => {
    if (activeMenuPost?.id === post.id) {
      setActiveMenuPost(null);
      return;
    }
    const pageY = e?.nativeEvent?.pageY;
    const locationY = e?.nativeEvent?.locationY;

    // Invariant button bottom calculation: subtract touch offset inside button
    const buttonTop = (pageY !== undefined && locationY !== undefined)
      ? pageY - locationY
      : (pageY || 250);
    const buttonHeight = 32;
    const buttonBottom = buttonTop + buttonHeight;

    // Anchor precisely 6px below the bottom edge of the 3-dots button
    const top = buttonBottom + 6;

    setMenuPosition({
      top,
      isAbove: false,
    });
    setActiveMenuPost(post);
  };

  const handleDeletePost = (post) => {
    setActiveMenuPost(null);
    if (!post) return;
    Alert.alert(
      isRtl ? 'حذف المنشور' : 'Delete Post',
      isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا المنشور نهائياً؟' : 'Are you sure you want to permanently delete this post?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistically remove from state
            setPosts((prev) => prev.filter((p) => p.id !== post.id));

            try {
              const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', post.id);

              if (error) {
                console.warn('Error deleting post from Supabase:', error);
              }
            } catch (err) {
              console.warn('Error deleting post from Supabase:', err);
            }

            Alert.alert(
              isRtl ? 'تم الحذف' : 'Deleted',
              isRtl ? 'تم حذف المنشور بنجاح.' : 'Your post has been deleted.'
            );
          },
        },
      ]
    );
  };

  const handleNotInterested = (post) => {
    setActiveMenuPost(null);
    if (!post) return;
    const postId = post.id;
    setNotInterestedPostIds((prev) => [...prev, postId]);

    try {
      const storageKey = currentUser?.id ? `@werash_not_interested_${currentUser.id}` : '@werash_not_interested_guest';
      AsyncStorage.getItem(storageKey).then((raw) => {
        const list = raw ? JSON.parse(raw) : [];
        if (!list.includes(postId)) {
          list.push(postId);
          AsyncStorage.setItem(storageKey, JSON.stringify(list));
        }
      }).catch(() => {});
    } catch (_) {}

    Alert.alert(
      isRtl ? 'تم الإخفاء' : 'Post Hidden',
      isRtl ? 'تم إخفاء هذا المنشور من خلاصتك.' : 'This post has been hidden from your feed.'
    );
  };

  const handleOpenReportModal = (post) => {
    setReportModalPost(post);
    setSelectedReportReason(null);
    setReportDetailText('');
  };

  const handleSubmitReport = () => {
    if (!reportModalPost || !selectedReportReason) return;
    const reportedId = reportModalPost.id;
    setReportedPostIds((prev) => [...prev, reportedId]);
    setReportModalPost(null);
    setSelectedReportReason(null);
    setReportDetailText('');

    Alert.alert(
      isRtl ? 'تم إرسال البلاغ' : 'Report Submitted',
      isRtl
        ? 'شكراً لإبلاغنا. سيقوم فريق الإشراف بمراجعة هذا المنشور، وتم إخفاؤه من خلاصتك.'
        : 'Thank you for letting us know. Our moderation team will review this post, and it has been hidden from your feed.'
    );
  };

  const handleToggleLike = async (postId) => {
    if (!currentUser?.id) {
      Alert.alert(
        isRtl ? 'تسجيل الدخول مطلوب' : 'Sign In Required',
        isRtl
          ? 'يرجى تسجيل الدخول للتفاعل مع منشورات المجتمع.'
          : 'Please sign in to like posts and interact with the community.',
        [
          { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: isRtl ? 'تسجيل الدخول' : 'Sign In',
            onPress: () => {
              if (typeof onOpenSignIn === 'function') onOpenSignIn();
            },
          },
        ]
      );
      return;
    }

    if (pendingLikesRef.current.has(postId)) {
      return;
    }
    pendingLikesRef.current.add(postId);

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) {
      pendingLikesRef.current.delete(postId);
      return;
    }

    const willBeLiked = !targetPost.liked;
    const nextLikesCount = willBeLiked ? targetPost.likes + 1 : Math.max(0, targetPost.likes - 1);

    // 1. Instant 0ms optimistic UI update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: willBeLiked,
          likes: nextLikesCount,
        };
      }
      return post;
    }));

    // 2. Persist locally to AsyncStorage for immediate cache consistency
    const storageKey = `@werash_user_likes_${currentUser.id}`;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
        if (willBeLiked) {
          if (!list.includes(postId)) list.push(postId);
        } else {
          list = list.filter((id) => id !== postId);
        }
        return AsyncStorage.setItem(storageKey, JSON.stringify(list));
      })
      .catch(() => {});

    // 3. Background Cloud Sync to Supabase
    try {
      if (willBeLiked) {
        const { error: insErr } = await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });
        if (insErr && insErr.code !== '23505') {
          console.warn('Like insert error:', insErr.message);
        }
      } else {
        const { error: delErr } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        if (delErr) {
          console.warn('Like delete error:', delErr.message);
        }
      }
      // Also attempt to update community_posts table likes_count if permitted
      supabase
        .from('community_posts')
        .update({ likes_count: nextLikesCount })
        .eq('id', postId)
        .catch(() => {});
    } catch (err) {
      console.warn('Error syncing like to Supabase:', err);
    } finally {
      pendingLikesRef.current.delete(postId);
    }
  };

  // Tab switching handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    isHeaderHidden.current = false;
    Animated.timing(headerTranslateAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    if (onToggleNavBar && isNavHidden.current) {
      isNavHidden.current = false;
      onToggleNavBar(false);
    }
  };

  // Open another user's profile in dedicated page modal, or navigate to profile tab if self
  const handleOpenUserProfile = (authorData) => {
    if (!authorData) return;
    const authorName = authorData.author || authorData.author_name || authorData.fullName || authorData.name;
    if (!authorName) return;

    const currentAuthor = currentUser?.fullName || '';
    const userId = authorData.userId || authorData.user_id || null;
    const isSelf = (Boolean(currentUser?.id) && userId === currentUser.id) ||
                   (Boolean(currentUser?.fullName) && authorName === currentUser.fullName) ||
                   authorData.isSelf === true;

    if (isSelf) {
      if (isSearchActive) setIsSearchActive(false);
      setActiveCommentsPost(null);
      setViewingOtherUser(null);
      handleTabChange('profile');
      return;
    }

    // If already viewing this user's profile, nothing to do
    if (viewingOtherUser && (
      (userId && viewingOtherUser.userId === userId) ||
      viewingOtherUser.author === authorName
    )) {
      return;
    }

    const cachedProf = userId
      ? allProfiles.find(p => p.id === userId)
      : allProfiles.find(p => p.full_name === authorName);

    const authorPosts = posts.filter(p => (userId && p.userId === userId) || p.author === authorName);
    const resolvedAvatar = cachedProf?.avatar_url
      ? { uri: cachedProf.avatar_url }
      : (authorData.avatar || (authorPosts[0]?.avatar || null));
    const resolvedBanner = cachedProf?.banner_url || null;
    const resolvedVehicle = (authorData.vehicle && authorData.vehicle !== 'General')
      ? authorData.vehicle
      : (authorPosts.find(p => p.vehicle && p.vehicle !== 'General')?.vehicle || cachedProf?.vehicle || null);

    const otherUserData = {
      id: userId || authorName,
      userId: userId,
      author: authorName,
      handle: authorData.handle || `@${authorName.toLowerCase().replace(/[\s\W]+/g, '')}`,
      avatar: resolvedAvatar,
      banner: resolvedBanner,
      vehicle: resolvedVehicle,
    };

    if (isSearchActive) setIsSearchActive(false);
    setActiveCommentsPost(null);
    setViewingOtherUser(otherUserData);

    if (userId) {
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, banner_url, car_brand, car_model')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const veh = data.car_brand ? `${data.car_brand || ''} ${data.car_model || ''}`.trim() : null;
            setViewingOtherUser(prev => {
              if (!prev || (prev.userId && prev.userId !== userId)) return prev;
              return {
                ...prev,
                avatar: data.avatar_url ? { uri: data.avatar_url } : prev.avatar,
                banner: data.banner_url || prev.banner,
                vehicle: veh || prev.vehicle,
              };
            });
          }
        })
        .catch(() => {});
    }
  };

  const handleCloseOtherUserProfile = () => {
    setViewingOtherUser(null);
  };

  // Filter posts based on active tab
  const displayedPosts = posts.filter(post => {
    if (reportedPostIds.includes(post.id) || notInterestedPostIds.includes(post.id)) {
      return false;
    }
    if (activeTab === 'souq') {
      return post.isMarketplace;
    }
    // Default 'feed' shows general community posts
    return !post.isMarketplace;
  });

  // User likes count for profile stats
  const userLikesCount = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  // Other user posts and likes count for dedicated profile modal
  const otherUserPosts = viewingOtherUser
    ? posts.filter((p) => {
        if (reportedPostIds.includes(p.id) || notInterestedPostIds.includes(p.id)) return false;
        if (viewingOtherUser.userId && p.userId) {
          return p.userId === viewingOtherUser.userId;
        }
        return p.author === viewingOtherUser.author;
      })
    : [];
  const otherUserLikesCount = otherUserPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  const profileName = currentUser?.fullName || (isRtl ? 'حساب زائر' : 'Guest User');
  const profileHandle = currentUser?.email
    ? `@${currentUser.email.split('@')[0]}`
    : (currentUser?.fullName ? `@${currentUser.fullName.toLowerCase().replace(/[\s\W]+/g, '')}` : '@werash_driver');
  const resolvedAvatar = myAvatarUrl || currentUser?.avatarUrl || currentUser?.avatar || null;
  const resolvedBanner = myBannerUrl || currentUser?.bannerUrl || null;

  // Create new post in Supabase cloud (supports multiple images & attached specialist)
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && postImages.length === 0 && !attachedSpecialist) {
      Alert.alert(
        isRtl ? 'محتوى فارغ' : 'Empty Content',
        isRtl ? 'يرجى كتابة محتوى أو إضافة صورة أو فني للمنشور.' : 'Please enter some text, add an image, or attach a specialist before posting.'
      );
      return;
    }

    if (!currentUser?.id) {
      Alert.alert(
        isRtl ? 'تسجيل الدخول مطلوب' : 'Sign In Required',
        isRtl ? 'يرجى تسجيل الدخول لنشر تحديث في المجتمع.' : 'Please sign in to publish a post in the community.',
        [
          { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: isRtl ? 'تسجيل الدخول' : 'Sign In',
            onPress: () => {
              setIsCreatePostActive(false);
              setAttachedSpecialist(null);
              if (typeof onOpenSignIn === 'function') onOpenSignIn();
            },
          },
        ]
      );
      return;
    }

    try {
      setIsPosting(true);

      let uploadedMediaUrl = null;
      let uploadedUrls = [];
      if (postImages.length > 0) {
        for (let i = 0; i < postImages.length; i++) {
          const localUri = postImages[i];
          const response = await fetch(localUri);
          const blob = await response.blob();
          const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
          const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          const fileName = `${currentUser.id}/post_${Date.now()}_${i}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from('community-media')
            .upload(fileName, blob, {
              contentType,
              upsert: true,
            });

          if (uploadErr) {
            console.warn('Post image upload error:', uploadErr.message);
            throw uploadErr;
          }

          const { data: publicData } = supabase.storage
            .from('community-media')
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            uploadedUrls.push(publicData.publicUrl);
          }
        }
      }

      if (attachedSpecialist) {
        uploadedMediaUrl = JSON.stringify({
          specialist_id: attachedSpecialist.id,
          specialist_data: attachedSpecialist,
          images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        });
      } else if (uploadedUrls.length === 1) {
        uploadedMediaUrl = uploadedUrls[0];
      } else if (uploadedUrls.length > 1) {
        uploadedMediaUrl = JSON.stringify(uploadedUrls);
      }

      const postPayload = {
        user_id: currentUser.id,
        author_name: currentUser.fullName || (isRtl ? 'عضو في المجتمع' : 'Community Member'),
        author_handle: profileHandle,
        author_avatar: (typeof resolvedAvatar === 'string' ? resolvedAvatar : null),
        vehicle: currentUser.activeVehicleName || currentUser.vehicle || 'General',
        content: newPostContent.trim(),
        media_url: uploadedMediaUrl,
        media_type: attachedSpecialist ? 'specialist' : (uploadedMediaUrl ? 'image' : null),
        is_marketplace: false,
        likes_count: 0,
        comments_count: 0,
      };

      const { data: insertedPost, error: insertErr } = await supabase
        .from('community_posts')
        .insert([postPayload])
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      if (insertedPost) {
        let parsedImages = null;
        let singlePostImage = null;
        if (insertedPost.media_url) {
          if (typeof insertedPost.media_url === 'string' && insertedPost.media_url.trim().startsWith('{')) {
            try {
              const meta = JSON.parse(insertedPost.media_url);
              if (meta.images && Array.isArray(meta.images)) {
                parsedImages = meta.images;
                singlePostImage = meta.images[0] ? { uri: meta.images[0] } : null;
              }
            } catch (_) {}
          } else if (typeof insertedPost.media_url === 'string' && insertedPost.media_url.trim().startsWith('[')) {
            try {
              const arr = JSON.parse(insertedPost.media_url);
              if (Array.isArray(arr) && arr.length > 0) {
                parsedImages = arr;
                singlePostImage = { uri: arr[0] };
              }
            } catch (_) {}
          }
          if (!parsedImages) {
            parsedImages = [insertedPost.media_url];
            singlePostImage = { uri: insertedPost.media_url };
          }
        }

        const finalPost = {
          id: insertedPost.id,
          userId: insertedPost.user_id,
          author: insertedPost.author_name,
          handle: insertedPost.author_handle,
          avatar: insertedPost.author_avatar ? { uri: insertedPost.author_avatar } : null,
          time: formatTimeAgo(insertedPost.created_at, isRtl),
          content: insertedPost.content,
          postImage: singlePostImage,
          images: parsedImages,
          specialist: attachedSpecialist,
          likes: 0,
          comments: 0,
          liked: false,
          vehicle: insertedPost.vehicle || 'General',
          isMarketplace: false,
          price: null,
          location: null,
        };
        setPosts((prev) => [finalPost, ...prev]);
      }

      setAttachedSpecialist(null);
      setIsCreatePostActive(false);
      setNewPostContent('');
      setPostImages([]);

      // Re-fetch in background to ensure sync
      fetchCloudPosts();
    } catch (err) {
      console.warn('handleCreatePost error:', err);
      Alert.alert(
        isRtl ? 'خطأ في النشر' : 'Posting Failed',
        isRtl ? 'تعذر نشر المنشور. يرجى المحاولة مرة أخرى.' : 'Failed to publish post. Please try again.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Derive search matching people and content
  const trimmedSearchQuery = searchQuery.trim().toLowerCase();
  const searchKeywords = trimmedSearchQuery.split(/\s+/).filter(Boolean);

  // Derive unique people from current user, cloud profiles, and post authors
  const peopleMap = new Map();
  if (currentUser?.fullName) {
    peopleMap.set(currentUser.id || currentUser.fullName, {
      id: currentUser.id || 'current_user',
      name: currentUser.fullName,
      avatar: myAvatarUrl || currentUser.avatarUrl || currentUser.avatar || null,
      handle: currentUser.email ? `@${currentUser.email.split('@')[0]}` : null,
    });
  }
  allProfiles.forEach((prof) => {
    if (prof.full_name && !peopleMap.has(prof.id || prof.full_name)) {
      peopleMap.set(prof.id || prof.full_name, {
        id: prof.id,
        name: prof.full_name,
        avatar: prof.avatar_url || null,
        handle: null,
      });
    }
  });
  posts.forEach((p) => {
    const key = p.userId || p.author;
    if (key && !peopleMap.has(key)) {
      peopleMap.set(key, {
        id: key,
        name: p.author,
        avatar: p.avatar,
        handle: p.handle,
      });
    }
  });
  const allPeople = Array.from(peopleMap.values());

  const matchingPeople = trimmedSearchQuery.length === 0 ? [] : allPeople.filter((person) => {
    const name = (person.name || '').toLowerCase();
    const handle = (person.handle || '').toLowerCase();
    return searchKeywords.some((kw) => name.includes(kw) || handle.includes(kw));
  });

  const matchingPosts = trimmedSearchQuery.length === 0 ? [] : posts.filter((post) => {
    if (post.isMarketplace) {
      // For listings: only match based on the title of the listing alone (not description or anything else)
      const listingTitle = (
        post.title ||
        (post.content ? post.content.split('\n')[0].trim() : (post.vehicle || ''))
      ).toLowerCase();
      return searchKeywords.some((kw) => listingTitle.includes(kw));
    }
    // For regular community posts: only match based on the text on the post alone (not username or anything else)
    const postText = (post.content || '').toLowerCase();
    const postTextAr = (post.contentAr || '').toLowerCase();
    return searchKeywords.some((kw) => postText.includes(kw) || postTextAr.includes(kw));
  });


  // Render full-width listed marketplace item card matching Souq design (larger footprint)
  const renderSearchMarketplaceCard = (post) => {
    const itemTitle = post.title || (post.content ? post.content.split('\n')[0].trim() : (post.vehicle || (isRtl ? 'منتج للبيع' : 'Item for sale')));
    const hasImage = Boolean(post.postImage);
    const imageSource = typeof post.postImage === 'string' ? { uri: post.postImage } : post.postImage;

    return (
      <TouchableOpacity
        key={post.id}
        activeOpacity={hasImage ? 0.88 : 1}
        style={styles.searchMarketCardShadow}
        onPress={() => {
          if (hasImage) {
            handleOpenPostImage(post);
          }
        }}
      >
        <View style={styles.searchMarketCardSurface}>
          {/* Cover Image Container (Expanded for full-width post footprint) */}
          <TouchableOpacity 
            style={styles.searchMarketImageContainer}
            activeOpacity={hasImage ? 0.92 : 1}
            onPress={() => {
              if (hasImage) {
                handleOpenPostImage(post);
              }
            }}
          >
            {hasImage ? (
              <Image
                source={imageSource}
                style={styles.searchMarketImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.searchMarketPlaceholderContainer}>
                <Image
                  source={require('../../assets/car_side_profile.png')}
                  style={styles.searchMarketPlaceholderCar}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Item Details (Price, Title, Location) - Same Souq design, no likes or comments */}
          <View style={[styles.searchMarketDetails, isRtl && styles.searchMarketDetailsRtl]}>
            {Boolean(post.price) && (
              <Text style={[styles.searchMarketPrice, isRtl && styles.searchMarketPriceRtl]} numberOfLines={1}>
                {post.price}
              </Text>
            )}
            <Text style={[styles.searchMarketTitle, isRtl && styles.searchMarketTitleRtl]} numberOfLines={1}>
              {itemTitle}
            </Text>
            {Boolean(post.location) && (
              <View style={[styles.searchMarketLocationRow, isRtl && styles.searchMarketLocationRowRtl]}>
                <Ionicons
                  name="location-sharp"
                  size={12}
                  color="#8A959E"
                  style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }}
                />
                <Text style={[styles.searchMarketLocationText, isRtl && styles.searchMarketLocationTextRtl]} numberOfLines={1}>
                  {post.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  // Render single post card matching signature premium aesthetic
  const renderPostCard = (post) => (
    <View key={post.id} style={styles.postCardShadow}>
      <View style={styles.postCardSurface}>
        {/* Post Header: Avatar, Name, Handle, Time & 3-Dots */}
        <View style={[styles.postHeaderRow, isRtl && styles.postHeaderRowRtl]}>
          <TouchableOpacity
            style={[styles.postHeaderLeft, isRtl && styles.postHeaderLeftRtl]}
            activeOpacity={0.8}
            onPress={() => handleOpenUserProfile(post)}
          >
            {post.avatar ? (
              <Image
                source={typeof post.avatar === 'string' ? { uri: post.avatar } : post.avatar}
                style={styles.postAuthorAvatar}
              />
            ) : (
              <View style={styles.postAuthorAvatarPlaceholder}>
                <Ionicons name="person" size={18} color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.postAuthorMeta, isRtl && styles.postAuthorMetaRtl]}>
              <Text style={[styles.postAuthorName, isRtl && styles.postAuthorNameRtl]}>
                {post.author}
              </Text>
              <Text style={[styles.postAuthorHandle, isRtl && styles.postAuthorHandleRtl]}>
                {post.handle} • {isRtl ? (post.timeAr || post.time) : post.time}
              </Text>
            </View>
          </TouchableOpacity>

          {/* More 3-Dots Button */}
          <TouchableOpacity
            style={styles.moreOptionsButton}
            activeOpacity={0.7}
            onPress={(e) => handleOpenPostMenu(post, e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Marketplace Item Badges (Price & Location) */}
        {post.isMarketplace && (Boolean(post.price) || Boolean(post.location)) && (
          <View style={[styles.marketMetaRow, isRtl && styles.marketMetaRowRtl]}>
            {Boolean(post.price) && (
              <View style={styles.marketPriceBadge}>
                <Ionicons
                  name="pricetag"
                  size={13}
                  color={colors.activeHighlight}
                  style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }}
                />
                <Text style={[styles.marketPriceText, isRtl && styles.marketPriceTextRtl]}>
                  {post.price}
                </Text>
              </View>
            )}
            {Boolean(post.location) && (
              <View style={styles.marketLocationBadge}>
                <Ionicons
                  name="location-sharp"
                  size={13}
                  color={colors.secondaryText}
                  style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }}
                />
                <Text style={[styles.marketLocationText, isRtl && styles.marketLocationTextRtl]}>
                  {post.location}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Post Body Text (Per-paragraph directional detection, 120-char preview, Read more/less toggle) */}
        {Boolean(post.content) && (() => {
          const rawText = isRtl ? (post.contentAr || post.content) : post.content;
          const { isLong, truncated, full } = truncatePostText(rawText, 120);
          const isExpanded = Boolean(expandedPosts[post.id]);
          const textToRender = (isLong && !isExpanded) ? truncated : full;
          const paragraphs = textToRender.split('\n');

          return (
            <View style={styles.postBodyContainer}>
              {paragraphs.map((para, pIdx) => {
                const isLast = pIdx === paragraphs.length - 1;
                if (!para && !isLast) {
                  return <View key={`p_blank_${pIdx}`} style={styles.postParagraphSpacing} />;
                }

                const dir = getParagraphDirection(para, isRtl);
                const isParaRtl = dir === 'rtl';

                return (
                  <View
                    key={`p_${pIdx}`}
                    style={[
                      styles.paragraphRow,
                      isParaRtl ? styles.paragraphRowRtl : styles.paragraphRowLtr,
                      !isLast && { marginBottom: 6 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.postParagraph,
                        isParaRtl ? styles.postParagraphRtl : styles.postParagraphLtr,
                      ]}
                    >
                      {para}
                    </Text>
                    {isLast && isLong && (
                      <TouchableOpacity
                        activeOpacity={0.65}
                        onPress={() => {
                          setExpandedPosts(prev => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }));
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
                        style={[
                          styles.readMoreBtn,
                          isParaRtl ? styles.readMoreBtnRtl : styles.readMoreBtnLtr,
                        ]}
                      >
                        <Text style={styles.readMoreText}>
                          {isExpanded ? 'Read less' : 'Read more'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* Post Attached Media Images: Multi-Image Grid or Single Image */}
        {post.images && post.images.length > 1 ? (
          <View style={styles.postMultiImagesContainer}>
            <ChatImageGrid
              images={post.images}
              width={FEED_GRID_WIDTH}
              borderRadius={0}
              onImagePress={(tappedIndex) => handleOpenPostImage(post, tappedIndex)}
              isRTL={isRtl}
            />
          </View>
        ) : post.postImage ? (
          <TouchableOpacity
            style={styles.postImageContainer}
            activeOpacity={0.92}
            onPress={() => handleOpenPostImage(post, 0)}
          >
            <Image
              source={typeof post.postImage === 'string' ? { uri: post.postImage } : post.postImage}
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : null}

        {/* Attached Mechanic Preview Card */}
        {post.specialist && (
          <View style={styles.postSharedSpecialistWrapper}>
            <SharedSpecialistCard
              specialist={post.specialist}
              isRtl={isRtl}
              isDarkMode={isDarkMode}
              onPress={() => onSelectSpecialist && onSelectSpecialist(post.specialist)}
            />
          </View>
        )}

        {/* Post Engagement Footer: Likes & Comments */}
        <View style={[styles.postEngagementRow, isRtl && styles.postEngagementRowRtl]}>
          {/* Likes Counter */}
          <TouchableOpacity
            style={[styles.engagementItem, isRtl && styles.engagementItemRtl]}
            activeOpacity={0.7}
            onPress={() => handleToggleLike(post.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={post.liked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.liked ? '#E0245E' : '#8A959E'}
            />
            <Text style={[
              styles.engagementCount,
              post.liked && { color: '#E0245E', fontWeight: '700' },
              isRtl ? { marginRight: 6 } : { marginLeft: 6 }
            ]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

          {/* Comments Counter */}
          <TouchableOpacity
            style={[
              styles.engagementItem,
              isRtl ? { marginRight: 18 } : { marginLeft: 18 },
              isRtl && styles.engagementItemRtl,
            ]}
            activeOpacity={0.7}
            onPress={() => handleOpenComments(post)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={19} color={colors.secondaryText} />
            <Text style={[
              styles.engagementCount,
              isRtl ? { marginRight: 6 } : { marginLeft: 6 }
            ]}>
              {post.comments}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Scrollable Feed List with Non-Fixed Header & Tabs */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollListContent, { paddingTop: headerHeight + 8 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchCloudPosts(true);
            }}
            tintColor="#003514"
            colors={['#003514']}
            progressViewOffset={headerHeight}
          />
        }
      >
        {/* Feed Tab Content */}
        {activeTab === 'feed' && (
          <>
            {/* Post Creator Bar (Premium Card Style) */}
        <View style={styles.postBarWrapper}>
          <View style={styles.postBarShadow}>
            <View style={[styles.postBarSurface, isRtl && styles.postBarSurfaceRtl]}>
              {/* User Avatar - Tapping opens Profile section */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleTabChange('profile')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Go to Profile"
              >
                {resolvedAvatar ? (
                  <Image
                    source={
                      typeof resolvedAvatar === 'string'
                        ? { uri: resolvedAvatar }
                        : resolvedAvatar
                    }
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tappable Area to open Create Post Modal */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.postBarContentTouch, isRtl && styles.postBarContentTouchRtl]}
                onPress={() => {
                  setIsCreatePostActive(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Share a car update"
              >
                {/* Vertical Divider */}
                <View style={styles.postDivider} />

                {/* Input Placeholder Text */}
                <Text style={[styles.postInputPlaceholder, isRtl && styles.postInputPlaceholderRtl]}>
                  {isRtl ? 'شارك تحديثاً لسيارتك...' : 'Share a car update...'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && !isRefreshing && displayedPosts.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.activeHighlight} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && displayedPosts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={38} color="#A0AAB0" />
            <Text style={[styles.emptyTitle, isRtl && styles.emptyTitleRtl]}>
              {isRtl ? 'لا توجد منشورات حتى الآن' : 'No posts yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isRtl && styles.emptySubtitleRtl]}>
              {isRtl ? 'كن أول من يشارك تحديثاً مع المجتمع!' : 'Be the first to share an update with the community!'}
            </Text>
          </View>
        )}

        {/* Post Cards Feed */}
        <View style={styles.postsListWrapper}>
          {displayedPosts.map(renderPostCard)}
        </View>
        </>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <View style={styles.profileWrapper}>
            {/* Profile Summary Card (Signature Premium Card Style) */}
            <View style={styles.profileCardShadow}>
              <View style={styles.profileCardSurface}>
                {/* Banner Wallpaper behind avatar */}
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => {
                    const bannerSrc = resolvedBanner
                      ? (typeof resolvedBanner === 'string' ? { uri: resolvedBanner } : resolvedBanner)
                      : require('../../assets/Banner wallpaper.png');
                    setViewerImages([bannerSrc]);
                    setViewerInitialIndex(0);
                    setViewerVisible(true);
                  }}
                  style={styles.profileBannerContainer}
                >
                  <Image
                    source={
                      resolvedBanner
                        ? (typeof resolvedBanner === 'string' ? { uri: resolvedBanner } : resolvedBanner)
                        : require('../../assets/Banner wallpaper.png')
                    }
                    style={styles.profileBannerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.profileBannerOverlay} />

                  {/* Edit Banner Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.editBannerButton,
                      isRtl ? { left: 14 } : { right: 14 },
                    ]}
                    onPress={handlePickAndUploadBanner}
                    disabled={isUploadingBanner}
                    accessibilityRole="button"
                    accessibilityLabel="Edit Banner"
                  >
                    {isUploadingBanner ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={[styles.editBannerContent, isRtl && styles.editBannerContentRtl]}>
                        <Ionicons
                          name="camera"
                          size={14}
                          color="#FFFFFF"
                          style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
                        />
                        <Text style={[styles.editBannerText, isRtl && styles.editBannerTextRtl]}>
                          {isRtl ? 'تغيير الغلاف' : 'Edit Banner'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Overlapping Profile Picture with Edit Badge */}
                <View style={styles.profileAvatarOuter}>
                  <TouchableOpacity
                    activeOpacity={resolvedAvatar ? 0.85 : 1}
                    onPress={() => {
                      if (resolvedAvatar) {
                        const avatarSrc = typeof resolvedAvatar === 'string'
                          ? { uri: resolvedAvatar }
                          : resolvedAvatar;
                        setViewerImages([avatarSrc]);
                        setViewerInitialIndex(0);
                        setViewerVisible(true);
                      }
                    }}
                    style={styles.profileAvatarCircle}
                  >
                    {resolvedAvatar ? (
                      <Image
                        source={typeof resolvedAvatar === 'string' ? { uri: resolvedAvatar } : resolvedAvatar}
                        style={styles.profileAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.profileAvatarPlaceholder}>
                        <Ionicons name="person" size={40} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Edit Avatar Circular Badge */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.editAvatarBadge,
                      isRtl ? { left: 0 } : { right: 0 },
                    ]}
                    onPress={handlePickAndUploadAvatar}
                    disabled={isUploadingAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Edit Profile Photo"
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="camera" size={13} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Profile Name & Handle */}
                <View style={styles.profileMetaContainer}>
                  <Text style={[styles.profileName, isRtl && styles.profileNameRtl]}>
                    {profileName}
                  </Text>
                  <Text style={[styles.profileHandle, isRtl && styles.profileHandleRtl]}>
                    {profileHandle}
                  </Text>
                </View>

                {/* Profile Stats Row (Integrated seamlessly without a white box) */}
                <View style={[styles.profileStatsSeamlessRow, isRtl && styles.profileStatsSeamlessRowRtl]}>
                  {/* Number of Posts */}
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatNumber}>{userPostsCount}</Text>
                    <Text style={[styles.profileStatLabel, isRtl && styles.profileStatLabelRtl]}>
                      {isRtl ? 'منشورات' : 'Posts'}
                    </Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={styles.profileStatDivider} />

                  {/* Number of Likes */}
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatNumber}>{userLikesCount}</Text>
                    <Text style={[styles.profileStatLabel, isRtl && styles.profileStatLabelRtl]}>
                      {isRtl ? 'إعجابات' : 'Likes'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Compact Segmented Control (My posts / Liked posts) */}
            <ProfileSegmentedControl
              activeTab={profileSubTab}
              onTabChange={setProfileSubTab}
              isRtl={isRtl}
              isDarkMode={isDarkMode}
            />

            {/* Posts Feed for Profile */}
            {activeProfilePosts.length === 0 ? (
              <View style={styles.noPostsCardShadow}>
                <View style={styles.noPostsCardSurface}>
                  <View style={styles.noPostsIconCircle}>
                    <Ionicons
                      name={profileSubTab === 'my_posts' ? 'document-text-outline' : 'heart-outline'}
                      size={30}
                      color={colors.activeHighlight}
                    />
                  </View>
                  <Text style={[styles.noPostsCardTitle, isRtl && styles.noPostsCardTitleRtl]}>
                    {profileSubTab === 'my_posts'
                      ? (isRtl ? 'لا توجد منشورات' : 'No posts')
                      : (isRtl ? 'لا توجد إعجابات' : 'No liked posts')}
                  </Text>
                  <Text style={[styles.noPostsCardSubtitle, isRtl && styles.noPostsCardSubtitleRtl]}>
                    {profileSubTab === 'my_posts'
                      ? (isRtl ? 'لم تقم بنشر أي منشورات بعد' : "You haven't shared any posts yet")
                      : (isRtl ? 'لم تقم بالإعجاب بأي منشورات بعد' : "You haven't liked any posts yet")}
                  </Text>
                </View>
              </View>
            ) : (
              activeProfilePosts.map((post) =>
                post.isMarketplace
                  ? renderSearchMarketplaceCard(post)
                  : renderPostCard(post)
              )
            )}
          </View>
        )}

        {/* Souq Tab Content */}
        {activeTab === 'souq' && (
          <View style={styles.souqWrapper}>
            {/* Green List Item Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.listItemButton}
              onPress={() => {
                if (!requireAuth()) return;
                // Open list item modal/screen
              }}
              accessibilityRole="button"
              accessibilityLabel="List Item"
            >
              <View style={[styles.listItemButtonContent, isRtl && styles.listItemButtonContentRtl]}>
                <Ionicons
                  name="add"
                  size={22}
                  color="#FFFFFF"
                  style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }}
                />
                <Text style={[styles.listItemButtonText, isRtl && styles.listItemButtonTextRtl]}>
                  {isRtl ? 'عرض منتج' : 'List Item'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Loading Indicator */}
            {isLoading && !isRefreshing && displayedPosts.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.activeHighlight} />
              </View>
            )}

            {/* Empty State */}
            {!isLoading && displayedPosts.length === 0 && (
              <View style={styles.noPostsCardShadow}>
                <View style={styles.noPostsCardSurface}>
                  <View style={styles.noPostsIconCircle}>
                    <Ionicons name="pricetags-outline" size={30} color={colors.activeHighlight} />
                  </View>
                  <Text style={[styles.noPostsCardTitle, isRtl && styles.noPostsCardTitleRtl]}>
                    {isRtl ? 'لا توجد معروضات حتى الآن' : 'No items listed yet'}
                  </Text>
                  <Text style={[styles.noPostsCardSubtitle, isRtl && styles.noPostsCardSubtitleRtl]}>
                    {isRtl ? 'كن أول من يعرض منتجاً أو سيارة للبيع في السوق!' : 'Be the first to list an item or car for sale in Souq!'}
                  </Text>
                </View>
              </View>
            )}

            {/* 2-Card Grid for Souq Items */}
            {!isLoading && displayedPosts.length > 0 && (
              <View style={[styles.souqGridContainer, isRtl && styles.souqGridContainerRtl]}>
                {displayedPosts.map((post) => {
                  const itemTitle = post.title || (post.content ? post.content.split('\n')[0].trim() : (post.vehicle || (isRtl ? 'منتج للبيع' : 'Item for sale')));
                  const hasImage = Boolean(post.postImage);
                  const imageSource = typeof post.postImage === 'string' ? { uri: post.postImage } : post.postImage;

                  return (
                    <TouchableOpacity
                      key={post.id}
                      activeOpacity={0.88}
                      style={styles.souqGridCardShadow}
                      onPress={() => {
                        // Open item details if needed
                      }}
                    >
                      <View style={styles.souqGridCardSurface}>
                        {/* Cover Image Container */}
                        <View style={styles.souqGridImageContainer}>
                          {hasImage ? (
                            <Image
                              source={imageSource}
                              style={styles.souqGridImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.souqGridPlaceholderContainer}>
                              <Image
                                source={require('../../assets/car_side_profile.png')}
                                style={styles.souqGridPlaceholderCar}
                                resizeMode="contain"
                              />
                            </View>
                          )}
                        </View>

                        {/* Item Details (Price, Title, Location) - No likes or comments */}
                        <View style={[styles.souqGridDetails, isRtl && styles.souqGridDetailsRtl]}>
                          {Boolean(post.price) && (
                            <Text style={[styles.souqGridPrice, isRtl && styles.souqGridPriceRtl]} numberOfLines={1}>
                              {post.price}
                            </Text>
                          )}
                          <Text style={[styles.souqGridTitle, isRtl && styles.souqGridTitleRtl]} numberOfLines={1}>
                            {itemTitle}
                          </Text>
                          {Boolean(post.location) && (
                            <View style={[styles.souqGridLocationRow, isRtl && styles.souqGridLocationRowRtl]}>
                              <Ionicons
                                name="location-sharp"
                                size={11}
                                color="#8A959E"
                                style={isRtl ? { marginLeft: 2 } : { marginRight: 2 }}
                              />
                              <Text style={[styles.souqGridLocationText, isRtl && styles.souqGridLocationTextRtl]} numberOfLines={1}>
                                {post.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Dockable / Collapsible Header at Top */}
      <Animated.View
        onLayout={onHeaderLayout}
        style={[
          styles.floatingHeader,
          {
            paddingTop: topInset + 6,
            transform: [{ translateY: headerTranslateAnim }],
          },
        ]}
      >
        {/* Top Header Row with Logo & Wordmark on Left and Search & Message on Right */}
        <View style={[styles.headerRow, isRtl && styles.headerRowRtl]}>
          <View style={[styles.logoContainer, isRtl && styles.logoContainerRtl]}>
            <Image
              source={require('../../assets/logo.png')}
              style={[styles.logoImage, isRtl && styles.logoImageRtl]}
              resizeMode="contain"
            />
            {isRtl ? (
              <Text style={styles.brandNameArabic}>
                وِرَش
              </Text>
            ) : (
              <Image
                source={require('../../assets/Werash_wordmark.png')}
                style={styles.wordmarkImage}
                resizeMode="contain"
              />
            )}
          </View>
          <View style={styles.spacer} />
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => {
              setIsSearchActive(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search-outline" size={28} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 14, position: 'relative' }]}
            activeOpacity={0.7}
            onPress={() => setChatsVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primaryText} />
            {unreadChatsCount > 0 && (
              <View style={styles.chatBadgeContainer}>
                <Text style={styles.chatBadgeText}>
                  {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                </Text>
              </View>
            )}
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
                onPress={() => handleTabChange(tab.id)}
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
      </Animated.View>

      {/* Chats Drawer Modal */}
      <ChatsModal
        visible={chatsVisible}
        onClose={() => {
          setChatsVisible(false);
          setChatInitialUser(null);
        }}
        selectedLanguage={selectedLanguage}
        currentUser={currentUser}
        initialUser={chatInitialUser}
        onOpenProfile={handleOpenUserProfile}
        onSelectSpecialist={onSelectSpecialist}
        onUnreadCountChange={(count) => {
          setUnreadChatsCount(prev => (prev !== count ? count : prev));
        }}
      />

      {/* Dedicated User Profile Page Modal */}
      <OtherUserProfileModal
        visible={Boolean(viewingOtherUser)}
        userId={viewingOtherUser?.userId || viewingOtherUser?.id}
        user={viewingOtherUser}
        currentUser={currentUser}
        selectedLanguage={selectedLanguage}
        onClose={handleCloseOtherUserProfile}
        onOpenChat={(target) => {
          handleCloseOtherUserProfile();
          setChatInitialUser(target);
          setChatsVisible(true);
        }}
        onSelectSpecialist={onSelectSpecialist}
        initialPosts={otherUserPosts}
      />

      {/* Full-Screen Multi-Image Viewer Gallery (Same interface as Chat Messages) */}
      <ImageViewerModal
        visible={viewerVisible}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerVisible(false)}
        isRTL={isRtl}
        asModal={true}
      />

      {/* Interactive Crop & Reposition Preview Modal (Avatar & Banner) */}
      <ImageCropModal
        visible={cropConfig.visible}
        imageUri={cropConfig.uri}
        cropType={cropConfig.type}
        onSave={handleSaveCroppedImage}
        onCancel={() => setCropConfig({ visible: false, uri: null, type: 'avatar' })}
        isRtl={isRtl}
      />

      {/* Blank White Page Modal on Search Icon Click */}
      <Modal
        visible={isSearchActive}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setIsSearchActive(false)}
      >
        <View style={styles.blankPageContainer}>
          <View style={[styles.blankPageHeaderRow, { paddingTop: topInset + 6 }, isRtl && styles.blankPageHeaderRowRtl]}>
            {/* Arrow outside the card */}
            <TouchableOpacity
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.7}
              style={[styles.blankPageBackButton, isRtl ? { marginLeft: 10 } : { marginRight: 10 }]}
            >
              <Ionicons
                name={isRtl ? 'arrow-forward' : 'arrow-back'}
                size={26}
                color={colors.primaryText}
              />
            </TouchableOpacity>

            {/* Card containing Search TextInput */}
            <View style={styles.searchCardShadow}>
              <View style={[styles.searchCardSurface, isRtl && styles.searchCardSurfaceRtl]}>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, isRtl && styles.searchInputRtl]}
                  placeholder={isRtl ? 'ابحث في وِرَش' : 'Search Werash'}
                  placeholderTextColor="#8A959E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={isRtl ? { marginRight: 6 } : { marginLeft: 6 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#8A959E" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Relevant Search Content (Keywords and People) */}
          {trimmedSearchQuery.length > 0 && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.searchResultsScroll}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {/* If search brings up people: display side-by-side in horizontal scroll */}
              {matchingPeople.length > 0 && (
                <View style={styles.searchSectionPeople}>
                  <Text style={[styles.searchSectionHeading, styles.searchSectionHeadingPadded, isRtl && styles.searchSectionHeadingRtl]}>
                    {isRtl ? 'الأشخاص' : 'People'}
                  </Text>
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.peopleScrollContent,
                      isRtl && styles.peopleScrollContentRtl,
                    ]}
                  >
                    {matchingPeople.map((person) => (
                      <TouchableOpacity
                        key={person.id}
                        activeOpacity={0.8}
                        onPress={() => handleOpenUserProfile({
                          userId: person.id,
                          author: person.name,
                          handle: person.handle,
                          avatar: person.avatar,
                        })}
                        style={[
                          styles.personCardShadow,
                          isRtl ? styles.personCardShadowRtl : styles.personCardShadowLtr,
                        ]}
                      >
                        <View style={styles.personCardSurface}>
                          {person.avatar ? (
                            <Image
                              source={typeof person.avatar === 'string' ? { uri: person.avatar } : person.avatar}
                              style={styles.personAvatar}
                            />
                          ) : (
                            <View style={styles.personAvatarPlaceholder}>
                              <Ionicons name="person" size={20} color="#FFFFFF" />
                            </View>
                          )}
                          <Text style={[styles.personName, isRtl && styles.personNameRtl]} numberOfLines={1}>
                            {person.name}
                          </Text>
                          {Boolean(person.handle) && (
                            <Text style={[styles.personHandle, isRtl && styles.personHandleRtl]} numberOfLines={1}>
                              {person.handle}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Matching Posts and Listed Items appear together */}
              {matchingPosts.length > 0 && (
                <View style={styles.searchSection}>
                  {matchingPosts.map((post) =>
                    post.isMarketplace
                      ? renderSearchMarketplaceCard(post)
                      : renderPostCard(post)
                  )}
                </View>
              )}

              {/* No Results Found State */}
              {matchingPeople.length === 0 && matchingPosts.length === 0 && (
                <View style={styles.searchEmptyContainer}>
                  <Ionicons name="search-outline" size={42} color="#B5BDC2" />
                  <Text style={[styles.searchEmptyTitle, isRtl && styles.searchEmptyTitleRtl]}>
                    {isRtl ? `لا توجد نتائج لـ "${searchQuery}"` : `No results for "${searchQuery}"`}
                  </Text>
                  <Text style={[styles.searchEmptySubtitle, isRtl && styles.searchEmptySubtitleRtl]}>
                    {isRtl
                      ? 'تأكد من كتابة الكلمات بشكل صحيح أو ابحث عن موضوع آخر'
                      : 'Check for typos or try searching for a different keyword'}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Blank White Page Modal on Share Update Click */}
      <Modal
        visible={isCreatePostActive}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setIsCreatePostActive(false);
          setNewPostContent('');
          setPostImages([]);
          setAttachedSpecialist(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.blankPageContainer}
        >
          <View style={[styles.createPostHeaderRow, { paddingTop: topInset + 6 }, isRtl && styles.createPostHeaderRowRtl]}>
            <TouchableOpacity
              onPress={() => {
                setIsCreatePostActive(false);
                setNewPostContent('');
                setPostImages([]);
                setAttachedSpecialist(null);
              }}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.7}
              style={styles.blankPageBackButton}
            >
              <Ionicons
                name={isRtl ? 'arrow-forward' : 'arrow-back'}
                size={26}
                color={colors.primaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.createPostSubmitButton,
                (!newPostContent.trim() && postImages.length === 0 && !attachedSpecialist || isPosting) && styles.createPostSubmitButtonDisabled,
              ]}
              disabled={isPosting || (!newPostContent.trim() && postImages.length === 0 && !attachedSpecialist)}
              onPress={handleCreatePost}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.createPostSubmitButtonText, isRtl && styles.createPostSubmitButtonTextRtl]}>
                  {isRtl ? 'نشر' : 'Post'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Multiline Input to type in post */}
          <ScrollView
            style={styles.createPostInputScroll}
            contentContainerStyle={styles.createPostInputScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={createPostInputRef}
              style={[styles.createPostInput, isRtl && styles.createPostInputRtl]}
              placeholder={isRtl ? 'ماذا تريد أن تشارك...' : 'What do you wanna share...'}
              placeholderTextColor="#9EAAB2"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline={true}
              autoFocus={true}
              textAlignVertical="top"
            />

            {/* Attached Images Multi-Preview Dock */}
            {postImages.length > 0 && (
              <View style={[styles.createPostImagesPreviewDock, isRtl && { flexDirection: 'row-reverse' }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.createPostImagesScroll, isRtl && { flexDirection: 'row-reverse' }]}
                >
                  {postImages.map((uri, idx) => (
                    <View key={`post_img_preview_${idx}`} style={styles.createPostThumbItem}>
                      <Image source={{ uri }} style={styles.createPostThumbImg} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.createPostThumbRemoveBtn}
                        onPress={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={styles.createPostThumbBadge}>
                        <Text style={styles.createPostThumbBadgeText}>{idx + 1}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Add more images button */}
                  <TouchableOpacity
                    style={styles.createPostAddMoreBtn}
                    onPress={handlePickPostImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={24} color={colors.activeHighlight} />
                    <Text style={[styles.createPostAddMoreText, isRtl && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                      {isRtl ? 'إضافة' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Attached Mechanic Card Preview in Composer */}
            {attachedSpecialist && (
              <View style={styles.composerSpecialistWrapper}>
                <SharedSpecialistCard
                  specialist={attachedSpecialist}
                  isRtl={isRtl}
                  isDarkMode={isDarkMode}
                  showRemoveBtn={true}
                  onRemove={() => setAttachedSpecialist(null)}
                  onPress={() => onSelectSpecialist && onSelectSpecialist(attachedSpecialist)}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Bar: "Add to your post" on left, Image icon on right (moves with keyboard) */}
          <View
            style={[
              styles.createPostBottomBar,
              { paddingBottom: Math.max(insets?.bottom || 0, 12) },
              isRtl && styles.createPostBottomBarRtl,
            ]}
          >
            <Text style={[styles.createPostBottomBarText, isRtl && styles.createPostBottomBarTextRtl]}>
              {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.createPostImageIconBtn}
              onPress={handlePickPostImage}
              disabled={isPickingPostImage}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Add Image"
            >
              {isPickingPostImage ? (
                <ActivityIndicator size="small" color={colors.activeHighlight} />
              ) : (
                <Ionicons name="images-outline" size={24} color={colors.activeHighlight} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Interactive Comments Bottom Sheet Modal */}
      <Modal
        visible={Boolean(activeCommentsPost)}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setActiveCommentsPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.commentsBackdrop}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setActiveCommentsPost(null)}
          />

          <Animated.View 
            style={[
              styles.commentsSheetContainer, 
              { 
                height: commentsHeightAnim,
                transform: [{ translateY: commentsSlideAnim }]
              }
            ]}
          >
            {/* Draggable Handle Bar Area */}
            <View 
              style={styles.commentsHandleArea}
              {...commentsPanResponder.panHandlers}
            >
              <View style={styles.commentsHandleBar} />
            </View>

            {/* Header */}
            <View style={[styles.commentsHeader, isRtl && styles.commentsHeaderRtl]}>
              <View style={[styles.commentsHeaderTitleGroup, isRtl && styles.commentsHeaderTitleGroupRtl]}>
                <Text style={styles.commentsHeaderTitle}>
                  {isRtl ? 'التعليقات' : 'Comments'}
                </Text>
                <View style={[styles.commentsCountBadge, isRtl && styles.commentsCountBadgeRtl]}>
                  <Text style={styles.commentsCountBadgeText}>
                    {(activeCommentsPost?.commentsList || []).length}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.commentsCloseBtn} 
                onPress={() => setActiveCommentsPost(null)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            {/* Comments List Scroll */}
            <ScrollView 
              ref={commentsScrollRef}
              style={styles.commentsListScroll}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isLoadingComments && (activeCommentsPost?.commentsList || []).length === 0 ? (
                <View style={styles.emptyCommentsBox}>
                  <ActivityIndicator size="small" color={colors.activeHighlight} />
                  <Text style={[styles.emptyCommentsSubtitle, { marginTop: 12 }]}>
                    {isRtl ? 'جاري تحميل التعليقات...' : 'Loading comments...'}
                  </Text>
                </View>
              ) : (activeCommentsPost?.commentsList || []).length === 0 ? (
                <View style={styles.emptyCommentsBox}>
                  <Ionicons name="chatbubbles-outline" size={44} color={colors.mutedDecor} />
                  <Text style={styles.emptyCommentsTitle}>
                    {isRtl ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                  </Text>
                  <Text style={styles.emptyCommentsSubtitle}>
                    {isRtl ? 'كن أول من يشارك برأيه حول هذا المنشور!' : 'Be the first to share your thoughts on this post!'}
                  </Text>
                </View>
              ) : (
                (activeCommentsPost?.commentsList || []).map((c) => (
                  <View key={c.id} style={[styles.commentItemRow, isRtl && styles.commentItemRowRtl]}>
                    {/* Comment Avatar */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenUserProfile({
                        userId: c.user_id || c.userId,
                        author: c.author_name || c.author,
                        avatar: c.avatar,
                      })}
                    >
                      {c.avatar ? (
                        <Image source={c.avatar} style={styles.commentAvatar} />
                      ) : (
                        <View style={styles.commentAvatarIcon}>
                          <Ionicons name="person" size={15} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Comment Bubble & Meta */}
                    <View style={[styles.commentBubbleContainer, isRtl ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10 }]}>
                      <View style={styles.commentBubble}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleOpenUserProfile({
                            userId: c.user_id || c.userId,
                            author: c.author_name || c.author,
                            avatar: c.avatar,
                          })}
                        >
                          <Text style={[styles.commentAuthorName, isRtl && { textAlign: 'right' }]}>
                            {c.author}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.commentBodyText, isRtl && { textAlign: 'right' }]}>
                          {c.content}
                        </Text>
                      </View>

                      {/* Time, Reply & Like */}
                      <View style={[styles.commentMetaRow, isRtl && styles.commentMetaRowRtl]}>
                        <Text style={styles.commentTimeText}>{c.time}</Text>
                        <TouchableOpacity
                          style={styles.commentReplyBtn}
                          activeOpacity={0.7}
                          onPress={() => handleStartReply(c)}
                        >
                          <Text style={styles.commentReplyBtnText}>
                            {isRtl ? 'رد' : 'Reply'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.commentLikeBtn, isRtl && styles.commentLikeBtnRtl]}
                          activeOpacity={0.7}
                          onPress={() => handleToggleCommentLike(activeCommentsPost.id, c.id)}
                        >
                          <Ionicons
                            name={c.liked ? "heart" : "heart-outline"}
                            size={13}
                            color={c.liked ? '#E0245E' : colors.mutedDecor}
                          />
                          {(c.likes > 0) && (
                            <Text style={[styles.commentLikeCount, c.liked && { color: '#E0245E' }]}>
                              {c.likes}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Nested Replies */}
                      {c.replies && c.replies.length > 0 && (
                        <View style={[
                          styles.repliesListContainer, 
                          isRtl && styles.repliesListContainerRtl
                        ]}>
                          {c.replies.map((reply) => (
                            <View key={reply.id} style={[styles.replyItemRow, isRtl && styles.replyItemRowRtl]}>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleOpenUserProfile({
                                  userId: reply.user_id || reply.userId,
                                  author: reply.author_name || reply.author,
                                  avatar: reply.avatar,
                                })}
                              >
                                {reply.avatar ? (
                                  <Image source={reply.avatar} style={styles.replyAvatar} />
                                ) : (
                                  <View style={styles.replyAvatarIcon}>
                                    <Ionicons name="person" size={12} color="#FFFFFF" />
                                  </View>
                                )}
                              </TouchableOpacity>

                              <View style={[styles.replyBubbleContainer, isRtl ? { marginRight: 8, alignItems: 'flex-end' } : { marginLeft: 8 }]}>
                                <View style={styles.replyBubble}>
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handleOpenUserProfile({
                                      userId: reply.user_id || reply.userId,
                                      author: reply.author_name || reply.author,
                                      avatar: reply.avatar,
                                    })}
                                  >
                                    <Text style={[styles.replyAuthorName, isRtl && { textAlign: 'right' }]}>
                                      {reply.author}
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={[styles.replyBodyText, isRtl && { textAlign: 'right' }]}>
                                    {reply.content}
                                  </Text>
                                </View>

                                <View style={[styles.commentMetaRow, isRtl && styles.commentMetaRowRtl]}>
                                  <Text style={styles.commentTimeText}>{reply.time}</Text>
                                  <TouchableOpacity
                                    style={styles.commentReplyBtn}
                                    activeOpacity={0.7}
                                    onPress={() => handleStartReply(c, reply.author)}
                                  >
                                    <Text style={styles.commentReplyBtnText}>
                                      {isRtl ? 'رد' : 'Reply'}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.commentLikeBtn, isRtl && styles.commentLikeBtnRtl]}
                                    activeOpacity={0.7}
                                    onPress={() => handleToggleReplyLike(activeCommentsPost.id, c.id, reply.id)}
                                  >
                                    <Ionicons
                                      name={reply.liked ? "heart" : "heart-outline"}
                                      size={12}
                                      color={reply.liked ? '#E0245E' : colors.mutedDecor}
                                    />
                                    {(reply.likes > 0) && (
                                      <Text style={[styles.commentLikeCount, reply.liked && { color: '#E0245E' }]}>
                                        {reply.likes}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Replying To Banner */}
            {replyingTo && (
              <View style={[styles.replyingToBanner, isRtl && styles.replyingToBannerRtl]}>
                <View style={[styles.replyingToLeft, isRtl && styles.replyingToLeftRtl]}>
                  <Ionicons 
                    name="arrow-undo-outline" 
                    size={14} 
                    color={colors.activeHighlight} 
                    style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} 
                  />
                  <Text style={styles.replyingToText}>
                    {isRtl ? `الرد على ${replyingTo.author}` : `Replying to ${replyingTo.author}`}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setReplyingTo(null)} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.cancelReplyBtn}
                >
                  <Ionicons name="close-circle" size={17} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}

            {/* Comment Input Footer */}
            <View style={[
              styles.commentInputContainer, 
              { paddingBottom: Math.max(insets?.bottom || 0, Platform.OS === 'ios' ? 16 : 10) },
              isRtl && styles.commentInputContainerRtl
            ]}>
              {/* Current User Avatar */}
              {currentUser?.avatarUrl ? (
                <Image source={{ uri: currentUser.avatarUrl }} style={styles.commentInputUserAvatarImage} />
              ) : (
                <View style={styles.commentInputUserAvatar}>
                  <Ionicons name="person" size={14} color="#FFFFFF" />
                </View>
              )}

              <View style={[styles.commentInputWrapper, isRtl && styles.commentInputWrapperRtl]}>
                <TextInput
                  ref={commentInputRef}
                  style={[styles.commentTextInput, isRtl && { textAlign: 'right' }]}
                  placeholder={
                    replyingTo 
                      ? (isRtl ? `رد على ${replyingTo.author}...` : `Reply to ${replyingTo.author}...`)
                      : (isRtl ? 'اكتب تعليقاً...' : 'Add a comment...')
                  }
                  placeholderTextColor={colors.secondaryText}
                  value={commentInputText}
                  onChangeText={setCommentInputText}
                  multiline={true}
                  maxLength={400}
                />

                <TouchableOpacity
                  style={[
                    styles.commentSendBtn,
                    !commentInputText.trim() && styles.commentSendBtnDisabled,
                    isRtl && { marginLeft: 0, marginRight: 6 }
                  ]}
                  disabled={!commentInputText.trim()}
                  activeOpacity={0.8}
                  onPress={handleSubmitComment}
                >
                  <Ionicons
                    name="send"
                    size={14}
                    color={commentInputText.trim() ? '#FFFFFF' : colors.mutedDecor}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post Options Menu Bubble Popover */}
      <Modal
        visible={Boolean(activeMenuPost)}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setActiveMenuPost(null)}
      >
        <View style={styles.postMenuOverlay}>
          {/* Full-screen backdrop touch target: clicking anywhere outside closes the bubble */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveMenuPost(null)}
          />

          <View
            style={[
              styles.postMenuBubble,
              {
                top: menuPosition.top,
                [isRtl ? 'left' : 'right']: 20,
              },
            ]}
          >
            {/* Pointer Arrow */}
            <View
              style={[
                menuPosition.isAbove ? styles.postMenuArrowDown : styles.postMenuArrowUp,
                isRtl ? { left: 24 } : { right: 24 },
              ]}
            />

            {/* Option 1: Delete (Only if own post) */}
            {Boolean(
              activeMenuPost &&
              ((currentUser?.id && (activeMenuPost.userId === currentUser.id || activeMenuPost.user_id === currentUser.id)) ||
               (currentUser?.fullName && activeMenuPost.author === currentUser.fullName))
            ) && (
              <>
                <TouchableOpacity
                  style={[styles.postMenuItem, isRtl && { flexDirection: 'row-reverse' }]}
                  onPress={() => handleDeletePost(activeMenuPost)}
                  activeOpacity={0.65}
                >
                  <View style={[styles.postMenuIconWrap, isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}>
                    <Ionicons name="trash-outline" size={17} color="#E53935" />
                  </View>
                  <Text style={[styles.postMenuItemText, styles.postMenuDeleteText, isRtl && styles.arabicBoldText]}>
                    {isRtl ? 'حذف المنشور' : 'Delete'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.postMenuDivider} />
              </>
            )}

            {/* Option 2: Not Interested */}
            <TouchableOpacity
              style={[styles.postMenuItem, isRtl && { flexDirection: 'row-reverse' }]}
              onPress={() => handleNotInterested(activeMenuPost)}
              activeOpacity={0.65}
            >
              <View style={[styles.postMenuIconWrap, isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}>
                <Ionicons name="eye-off-outline" size={17} color={colors.primaryText} />
              </View>
              <Text style={[styles.postMenuItemText, isRtl && styles.arabicBoldText]}>
                {isRtl ? 'غير مهتم' : 'Not interested'}
              </Text>
            </TouchableOpacity>

            <View style={styles.postMenuDivider} />

            {/* Option 3: Report */}
            <TouchableOpacity
              style={[styles.postMenuItem, isRtl && { flexDirection: 'row-reverse' }]}
              onPress={() => {
                const post = activeMenuPost;
                setActiveMenuPost(null);
                handleOpenReportModal(post);
              }}
              activeOpacity={0.65}
            >
              <View style={[styles.postMenuIconWrap, isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}>
                <Ionicons name="flag-outline" size={17} color="#D97706" />
              </View>
              <Text style={[styles.postMenuItemText, styles.postMenuReportText, isRtl && styles.arabicBoldText]}>
                {isRtl ? 'إبلاغ عن المنشور' : 'Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report Post Modal */}
      <Modal
        visible={Boolean(reportModalPost)}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setReportModalPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.reportModalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setReportModalPost(null)}
          />

          <View style={[styles.reportModalContainer, isRtl && { alignItems: 'flex-end' }]}>
            {/* Header */}
            <View style={[styles.reportModalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                <View style={styles.reportIconCircle}>
                  <Ionicons name="warning" size={16} color="#E53935" />
                </View>
                <Text style={[styles.reportModalTitle, isRtl ? { marginRight: 8 } : { marginLeft: 8 }, isRtl && styles.arabicBoldText]}>
                  {isRtl ? 'إبلاغ عن المنشور' : 'Report Post'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModalPost(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.reportModalSubtitle, isRtl && { textAlign: 'right' }]}>
              {isRtl
                ? 'يرجى تحديد سبب الإبلاغ لمساعدتنا في الحفاظ على مجتمع آمن وموثوق.'
                : 'Please select a reason for reporting to help us keep the community safe and trustworthy.'}
            </Text>

            {/* Reasons List */}
            <ScrollView style={styles.reportReasonsList} showsVerticalScrollIndicator={false}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReportReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reportReasonItem,
                      isSelected && styles.reportReasonItemSelected,
                      isRtl && { flexDirection: 'row-reverse' },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedReportReason(reason.id)}
                  >
                    <View style={[
                      styles.reportRadioCircle,
                      isSelected && styles.reportRadioCircleSelected,
                      isRtl ? { marginLeft: 12 } : { marginRight: 12 }
                    ]}>
                      {isSelected && <View style={styles.reportRadioDot} />}
                    </View>
                    <Text style={[
                      styles.reportReasonText,
                      isSelected && styles.reportReasonTextSelected,
                      isRtl && { textAlign: 'right' },
                      isRtl && styles.arabicBoldText,
                    ]}>
                      {isRtl ? reason.ar : reason.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Optional Details Input */}
              <TextInput
                style={[styles.reportDetailInput, isRtl && { textAlign: 'right' }]}
                placeholder={
                  isRtl
                    ? 'تفاصيل إضافية (اختياري)...'
                    : 'Additional details (optional)...'
                }
                placeholderTextColor={colors.secondaryText}
                value={reportDetailText}
                onChangeText={setReportDetailText}
                multiline={true}
                maxLength={300}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.reportActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={() => setReportModalPost(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.reportCancelButtonText}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reportSubmitButton,
                  !selectedReportReason && styles.reportSubmitButtonDisabled,
                ]}
                disabled={!selectedReportReason}
                onPress={handleSubmitReport}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
                <Text style={styles.reportSubmitButtonText}>
                  {isRtl ? 'إرسال البلاغ' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.screenBg,
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  logoContainerRtl: {
    flexDirection: 'row-reverse',
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
    tintColor: '#37633B',
  },
  logoImageRtl: {
    marginRight: 0,
    marginLeft: 8,
  },
  wordmarkImage: {
    height: 28,
    width: 83,
    tintColor: '#37633B',
  },
  brandNameArabic: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 38,
    letterSpacing: 0,
    color: '#37633B',
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
  chatBadgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.screenBg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 2,
    elevation: 3,
  },
  chatBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 12,
  },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
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
    color: colors.secondaryText,
    paddingBottom: 10,
  },
  tabTextActive: {
    color: colors.activeHighlight,
    fontWeight: '800',
  },
  tabTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  tabIndicator: {
    width: '100%',
    height: 2.5,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  tabIndicatorActive: {
    backgroundColor: colors.activeHighlight,
  },
  scrollListContent: {
    paddingBottom: 110,
  },
  postBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  postsListWrapper: {
    paddingHorizontal: 20,
  },
  postBarShadow: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  postBarSurface: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  postBarSurfaceRtl: {
    flexDirection: 'row-reverse',
  },
  postBarContentTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  postBarContentTouchRtl: {
    flexDirection: 'row-reverse',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  postDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 12,
  },
  postInputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  postInputPlaceholderRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  postPlusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  postCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  postCardSurface: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  postHeaderRowRtl: {
    flexDirection: 'row-reverse',
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postHeaderLeftRtl: {
    flexDirection: 'row-reverse',
  },
  postAuthorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  postAuthorAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorMeta: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  postAuthorMetaRtl: {
    marginLeft: 0,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  postAuthorNameRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  postAuthorHandle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  postAuthorHandleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  moreOptionsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBodyContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  paragraphRow: {
    width: '100%',
  },
  paragraphRowRtl: {
    alignItems: 'flex-end',
  },
  paragraphRowLtr: {
    alignItems: 'flex-start',
  },
  postParagraph: {
    width: '100%',
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.primaryText,
    fontWeight: '600',
  },
  postParagraphRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  postParagraphLtr: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  postParagraphSpacing: {
    height: 8,
  },
  postBodyText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.primaryText,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  postBodyTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  readMoreBtn: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  readMoreBtnRtl: {
    alignSelf: 'flex-end',
  },
  readMoreBtnLtr: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: isDarkMode ? '#A3B0A7' : '#687076',
    letterSpacing: -0.1,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 1.33, // 4:3 standard social media / Facebook feed aspect ratio
    backgroundColor: colors.elevatedBg,
    marginBottom: 14,
    borderRadius: 0, // Sharp square edges (no rounded corners)
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
    paddingHorizontal: 16,
  },
  postEngagementRowRtl: {
    flexDirection: 'row-reverse',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementItemRtl: {
    flexDirection: 'row-reverse',
  },
  engagementCount: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 12,
  },
  emptyTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  emptySubtitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  // Profile Summary Card Styles
  profileWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  souqWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listItemButton: {
    width: '100%',
    backgroundColor: colors.forestGreen,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  listItemButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemButtonContentRtl: {
    flexDirection: 'row-reverse',
  },
  listItemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  listItemButtonTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 17,
  },
  marketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  marketMetaRowRtl: {
    flexDirection: 'row-reverse',
  },
  marketPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  marketPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.activeHighlight,
    letterSpacing: -0.2,
  },
  marketPriceTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  marketLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedBg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  marketLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  marketLocationTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  // Souq 2-Card Grid Styles
  souqGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  souqGridContainerRtl: {
    flexDirection: 'row-reverse',
  },
  souqGridCardShadow: {
    width: '48.2%',
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  souqGridCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  souqGridImageContainer: {
    width: '100%',
    height: 135,
    backgroundColor: colors.elevatedBg,
    overflow: 'hidden',
  },
  souqGridImage: {
    width: '100%',
    height: '100%',
  },
  souqGridPlaceholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevatedBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  souqGridPlaceholderCar: {
    width: '88%',
    height: '88%',
    opacity: 0.7,
  },
  souqGridDetails: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 11,
  },
  souqGridDetailsRtl: {
    alignItems: 'flex-end',
  },
  souqGridPrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.activeHighlight,
    letterSpacing: -0.2,
  },
  souqGridPriceRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  souqGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 2,
  },
  souqGridTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  souqGridLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  souqGridLocationRowRtl: {
    flexDirection: 'row-reverse',
  },
  souqGridLocationText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondaryText,
  },
  souqGridLocationTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  profileBannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.forestGreen,
    position: 'relative',
  },
  profileBannerImage: {
    width: '100%',
    height: '100%',
  },
  profileBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  editBannerButton: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    zIndex: 5,
  },
  editBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBannerContentRtl: {
    flexDirection: 'row-reverse',
  },
  editBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  editBannerTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileAvatarOuter: {
    alignSelf: 'center',
    marginTop: -40,
    width: 80,
    height: 80,
    position: 'relative',
  },
  profileAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.forestGreen,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMetaContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
  },
  profileNameRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileHandle: {
    fontSize: 12.5,
    color: colors.secondaryText,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  profileHandleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileStatsSeamlessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  profileStatsSeamlessRowRtl: {
    flexDirection: 'row-reverse',
  },
  profileStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  profileStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  profileStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  profileStatLabelRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    fontSize: 12,
  },
  profileStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.cardBorder,
  },
  // "No Posts" Card Styles (Premium card design)
  noPostsCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    marginBottom: 20,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  noPostsCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  noPostsIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(48, 87, 52, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noPostsCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
  },
  noPostsCardTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  noPostsCardSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  noPostsCardSubtitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  blankPageContainer: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  blankPageHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  blankPageHeaderRowRtl: {
    flexDirection: 'row-reverse',
  },
  blankPageBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCardShadow: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  searchCardSurfaceRtl: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.primaryText,
    paddingVertical: 0,
  },
  searchInputRtl: {
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  blankPageTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  blankPageTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchResultsScroll: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchSectionPeople: {
    marginBottom: 18,
  },
  searchSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchSectionHeadingPadded: {
    paddingHorizontal: 16,
  },
  searchSectionHeadingRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  peopleScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  peopleScrollContentRtl: {
    flexDirection: 'row-reverse',
  },
  personCardShadow: {
    width: 114,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  personCardShadowLtr: {
    marginRight: 10,
  },
  personCardShadowRtl: {
    marginLeft: 10,
  },
  personCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: 114,
    minHeight: 118,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevatedBg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  personAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  personName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  personNameRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  personHandle: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  personHandleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchEmptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  searchEmptyTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchEmptySubtitle: {
    fontSize: 13.5,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
  },
  searchEmptySubtitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchMarketCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchMarketCardSurface: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  searchMarketImageContainer: {
    width: '100%',
    height: 190,
    backgroundColor: colors.elevatedBg,
    overflow: 'hidden',
  },
  searchMarketImage: {
    width: '100%',
    height: '100%',
  },
  searchMarketPlaceholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevatedBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchMarketPlaceholderCar: {
    width: '80%',
    height: '80%',
    opacity: 0.7,
  },
  searchMarketDetails: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  searchMarketDetailsRtl: {
    alignItems: 'flex-end',
  },
  searchMarketPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.activeHighlight,
    letterSpacing: -0.2,
  },
  searchMarketPriceRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchMarketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 3,
  },
  searchMarketTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  searchMarketLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  searchMarketLocationRowRtl: {
    flexDirection: 'row-reverse',
  },
  searchMarketLocationText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.secondaryText,
  },
  searchMarketLocationTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  createPostPromptContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flex: 1,
  },
  createPostPromptContainerRtl: {
    alignItems: 'flex-end',
  },
  createPostInput: {
    fontSize: 18,
    color: colors.primaryText,
    lineHeight: 26,
    minHeight: 180,
    paddingTop: 0,
    paddingBottom: 0,
    width: '100%',
  },
  createPostInputRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  createPostPromptText: {
    fontSize: 18,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  createPostPromptTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  createPostHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createPostHeaderRowRtl: {
    flexDirection: 'row-reverse',
  },
  createPostSubmitButton: {
    backgroundColor: colors.forestGreen,
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostSubmitButtonDisabled: {
    opacity: 0.45,
  },
  createPostSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  createPostSubmitButtonTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  createPostInputScroll: {
    flex: 1,
  },
  createPostInputScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  createPostBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.elevatedBg,
  },
  createPostBottomBarRtl: {
    flexDirection: 'row-reverse',
  },
  createPostBottomBarText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  createPostBottomBarTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  createPostImageIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostImagePreviewContainer: {
    marginTop: 16,
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.elevatedBg,
  },
  createPostImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  createPostImageRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMultiImagesContainer: {
    width: '100%',
    marginBottom: 14,
    borderRadius: 0,
    overflow: 'hidden',
  },
  createPostImagesPreviewDock: {
    marginTop: 16,
    marginBottom: 8,
  },
  createPostImagesScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  createPostThumbItem: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.elevatedBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  createPostThumbImg: {
    width: '100%',
    height: '100%',
  },
  createPostThumbRemoveBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  createPostThumbBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostThumbBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  createPostAddMoreBtn: {
    width: 92,
    height: 92,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevatedBg,
    gap: 2,
  },
  createPostAddMoreText: {
    color: colors.activeHighlight,
    fontSize: 11,
    fontWeight: '700',
  },
  postSharedSpecialistWrapper: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  composerSpecialistWrapper: {
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  /* ── Interactive Comments Bottom Sheet Styles ── */
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  commentsSheetContainer: {
    width: '100%',
    backgroundColor: colors.elevatedBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: isDarkMode ? 0.35 : 0.12,
    shadowRadius: 14,
    elevation: 20,
    overflow: 'hidden',
  },
  commentsHandleArea: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsHandleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: isDarkMode ? 'rgba(242, 245, 242, 0.35)' : 'rgba(0, 0, 0, 0.22)',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  commentsHeaderRtl: {
    flexDirection: 'row-reverse',
  },
  commentsHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsHeaderTitleGroupRtl: {
    flexDirection: 'row-reverse',
  },
  commentsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  commentsCountBadge: {
    backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.35)' : 'rgba(55, 99, 59, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  commentsCountBadgeRtl: {
    marginLeft: 0,
    marginRight: 8,
  },
  commentsCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  commentsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsListScroll: {
    flex: 1,
  },
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 14,
  },
  emptyCommentsSubtitle: {
    fontSize: 12.5,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 240,
    lineHeight: 18,
  },
  commentItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  commentItemRowRtl: {
    flexDirection: 'row-reverse',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  commentAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubbleContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '95%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  commentAuthorName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 3,
  },
  commentBodyText: {
    fontSize: 13,
    color: colors.primaryText,
    lineHeight: 18,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 6,
    gap: 14,
  },
  commentMetaRowRtl: {
    flexDirection: 'row-reverse',
  },
  commentTimeText: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeBtnRtl: {
    flexDirection: 'row-reverse',
  },
  commentLikeCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  commentReplyBtn: {
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  commentReplyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  repliesListContainer: {
    marginTop: 10,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.cardBorder,
  },
  repliesListContainerRtl: {
    borderLeftWidth: 0,
    borderRightWidth: 1.5,
    paddingLeft: 0,
    paddingRight: 12,
    marginLeft: 0,
    marginRight: 8,
  },
  replyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  replyItemRowRtl: {
    flexDirection: 'row-reverse',
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  replyAvatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBubbleContainer: {
    flex: 1,
  },
  replyBubble: {
    backgroundColor: isDarkMode ? '#171E1A' : '#E8ECE9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '96%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  replyAuthorName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 2,
  },
  replyBodyText: {
    fontSize: 12.5,
    color: colors.primaryText,
    lineHeight: 17,
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.25)' : 'rgba(55, 99, 59, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  replyingToBannerRtl: {
    flexDirection: 'row-reverse',
  },
  replyingToLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingToLeftRtl: {
    flexDirection: 'row-reverse',
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  cancelReplyBtn: {
    padding: 3,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.elevatedBg,
  },
  commentInputContainerRtl: {
    flexDirection: 'row-reverse',
  },
  commentInputUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInputUserAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginLeft: 10,
  },
  commentInputWrapperRtl: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: 10,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.primaryText,
    maxHeight: 80,
    paddingVertical: 2,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  commentSendBtnDisabled: {
    backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.35)' : 'rgba(55, 99, 59, 0.20)',
  },

  /* ── Post Options Menu Bubble Styles ── */
  postMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  postMenuBubble: {
    position: 'absolute',
    width: 185,
    backgroundColor: colors.elevatedBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.45 : 0.15,
    shadowRadius: 14,
    elevation: 20,
    paddingVertical: 4,
    zIndex: 10000,
  },
  postMenuArrowDown: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.elevatedBg,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    transform: [{ rotate: '45deg' }],
  },
  postMenuArrowUp: {
    position: 'absolute',
    top: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.elevatedBg,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    transform: [{ rotate: '45deg' }],
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  postMenuIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMenuItemText: {
    fontSize: 13,
    color: colors.primaryText,
    fontWeight: '600',
  },
  postMenuDeleteText: {
    color: '#E53935',
  },
  postMenuReportText: {
    color: '#D97706',
  },
  postMenuDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 10,
  },

  /* ── Report Modal Styles ── */
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  reportModalContainer: {
    width: '100%',
    maxHeight: '78%',
    backgroundColor: colors.elevatedBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: isDarkMode ? 0.35 : 0.15,
    shadowRadius: 14,
    elevation: 20,
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  reportModalSubtitle: {
    fontSize: 12.5,
    color: colors.secondaryText,
    marginBottom: 14,
    lineHeight: 18,
  },
  reportReasonsList: {
    maxHeight: 300,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reportReasonItemSelected: {
    borderColor: colors.activeHighlight,
    backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.25)' : 'rgba(55, 99, 59, 0.08)',
  },
  reportRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportRadioCircleSelected: {
    borderColor: colors.activeHighlight,
  },
  reportRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.activeHighlight,
  },
  reportReasonText: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryText,
  },
  reportReasonTextSelected: {
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  reportDetailInput: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.primaryText,
    minHeight: 55,
    marginTop: 6,
    marginBottom: 10,
  },
  reportActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  reportCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  reportSubmitButton: {
    flex: 1.5,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  reportSubmitButtonDisabled: {
    backgroundColor: 'rgba(229, 57, 53, 0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  reportSubmitButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Dedicated Other User Profile Page styles
  otherProfileHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  otherProfileHeaderRowRtl: {
    flexDirection: 'row-reverse',
  },
  otherProfileBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherProfileHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  otherProfileHeaderTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  otherProfileHeaderSpacer: {
    width: 40,
    height: 40,
  },
  otherProfileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 60,
  },
  otherProfileVehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedBg,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  otherProfileVehicleBadgeRtl: {
    flexDirection: 'row-reverse',
  },
  otherProfileVehicleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  otherProfileVehicleTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  otherProfileMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forestGreen,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
    marginTop: 12,
  },
  otherProfileMessageBtnRtl: {
    flexDirection: 'row-reverse',
  },
  otherProfileMessageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  otherProfileMessageBtnTextRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  otherProfileSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  otherProfileSectionRowRtl: {
    flexDirection: 'row-reverse',
  },
  otherProfileSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  otherProfileSectionTitleRtl: {
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  otherProfileSectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryText,
    marginLeft: 6,
  },

  // Full-Screen Image Preview styles
  imageViewerAbsoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100000,
    elevation: 100000,
  },
  imageViewerHeaderRtl: {
    flexDirection: 'row-reverse',
  },
  imageViewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  imageViewerCenterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerFullImage: {
    width: '92%',
    height: '82%',
  },
});
