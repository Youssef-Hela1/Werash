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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatsModal from '../components/ChatsModal';
import { supabase } from '../services/supabase';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const TABS = [
  { id: 'feed', label: 'Feed', labelAr: 'الرئيسية' },
  { id: 'profile', label: 'Profile', labelAr: 'الملف' },
  { id: 'souq', label: 'Souq', labelAr: 'سوق' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.58);
const EXPANDED_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.94);

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

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
  onOpenSignIn,
  onUpdateCurrentUser,
  scrollToTopTrigger,
  onToggleNavBar,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
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

  // Blank white search page state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Blank white create post page state
  const [isCreatePostActive, setIsCreatePostActive] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImageUri, setPostImageUri] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isPickingPostImage, setIsPickingPostImage] = useState(false);
  const createPostInputRef = useRef(null);

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

  // Pick image for new post (instantaneous, no cropping freeze)
  const handlePickPostImage = async () => {
    try {
      setIsPickingPostImage(true);
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Bypasses heavy cropping activity for instant selection
        quality: 0.7,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPostImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('handlePickPostImage error:', err);
    } finally {
      setIsPickingPostImage(false);
    }
  };

  // Hardware back button dismisses blank search & create post pages
  useEffect(() => {
    if (!isSearchActive && !isCreatePostActive) return;
    const backAction = () => {
      if (isCreatePostActive) {
        setIsCreatePostActive(false);
        setNewPostContent('');
        setPostImageUri(null);
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
  }, [isSearchActive, isCreatePostActive]);

  useEffect(() => {
    if (currentUser?.avatarUrl || currentUser?.avatar) {
      setMyAvatarUrl(currentUser.avatarUrl || currentUser.avatar);
    }
    if (currentUser?.bannerUrl) {
      setMyBannerUrl(currentUser.bannerUrl);
    } else if (currentUser?.id) {
      AsyncStorage.getItem(`@werash_user_banner_${currentUser.id}`).then((val) => {
        if (val) setMyBannerUrl(val);
      }).catch(() => {});
    }
  }, [currentUser?.id, currentUser?.avatarUrl, currentUser?.avatar, currentUser?.bannerUrl]);

  // Filter user posts for profile tab and scroll lock check
  const userPosts = posts.filter(p => {
    if (currentUser?.id) {
      return p.userId === currentUser.id;
    }
    if (currentUser?.fullName) {
      return p.author === currentUser.fullName;
    }
    return false;
  });
  const userPostsCount = userPosts.length;

  // "Back to top" floating pill button state & animations
  const [showBackToTop, setShowBackToTop] = useState(false);
  const backToTopAnim = useRef(new Animated.Value(0)).current;
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
    if (activeTab === 'profile' && userPosts.length === 0) {
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

    // Show "Back to top" button when user is down (> 320px) and scrolls UP (diff < -8)
    if (currentY > 320 && diff < -8) {
      if (!showBackToTop) {
        setShowBackToTop(true);
        Animated.spring(backToTopAnim, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY <= 120 || diff > 15) {
      // Hide button if near top or scrolling down actively
      if (showBackToTop) {
        setShowBackToTop(false);
        Animated.timing(backToTopAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
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

    setShowBackToTop(false);
    Animated.timing(backToTopAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

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

  // Upload Avatar
  const handlePickAndUploadAvatar = async () => {
    if (!requireAuth()) return;
    try {
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Bypasses slow native cropping activity for instant selection
        quality: 0.6,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const localUri = result.assets[0].uri;

      // 1. Instant Optimistic UI Update (0ms delay for user)
      setMyAvatarUrl(localUri);
      if (typeof onUpdateCurrentUser === 'function') {
        onUpdateCurrentUser({
          ...currentUser,
          avatar: localUri,
          avatarUrl: localUri,
        });
      }
      setPosts(prev => prev.map(p => {
        if (p.userId === currentUser.id || p.author === currentUser.fullName) {
          return { ...p, avatar: { uri: localUri } };
        }
        return p;
      }));

      // 2. Background Cloud Sync
      setIsUploadingAvatar(true);

      const response = await fetch(localUri);
      const blob = await response.blob();
      const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${currentUser.id}/avatar_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('community-media')
        .upload(fileName, blob, {
          contentType,
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);
      const publicUrl = publicData?.publicUrl;

      if (publicUrl) {
        setMyAvatarUrl(publicUrl);
        if (typeof onUpdateCurrentUser === 'function') {
          onUpdateCurrentUser({
            ...currentUser,
            avatar: publicUrl,
            avatarUrl: publicUrl,
          });
        }
        setPosts(prev => prev.map(p => {
          if (p.userId === currentUser.id || p.author === currentUser.fullName) {
            return { ...p, avatar: { uri: publicUrl } };
          }
          return p;
        }));

        supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', currentUser.id)
          .catch(e => console.warn('Error updating profile avatar_url:', e));

        supabase.auth
          .updateUser({ data: { avatar_url: publicUrl } })
          .catch(e => console.warn('Error updating auth metadata avatar_url:', e));
      }
    } catch (err) {
      console.warn('handlePickAndUploadAvatar error:', err);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'تعذر رفع الصورة الشخصية. يرجى المحاولة مرة أخرى.' : 'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Upload Banner
  const handlePickAndUploadBanner = async () => {
    if (!requireAuth()) return;
    try {
      await ensureMediaPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Bypasses slow native cropping activity for instant selection
        quality: 0.6,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const localUri = result.assets[0].uri;

      // 1. Instant Optimistic UI Update (0ms delay for user)
      setMyBannerUrl(localUri);
      if (typeof onUpdateCurrentUser === 'function') {
        onUpdateCurrentUser({
          ...currentUser,
          bannerUrl: localUri,
        });
      }
      try {
        await AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, localUri);
      } catch (e) {}

      // 2. Background Cloud Sync
      setIsUploadingBanner(true);

      const response = await fetch(localUri);
      const blob = await response.blob();
      const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${currentUser.id}/banner_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('community-media')
        .upload(fileName, blob, {
          contentType,
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);
      const publicUrl = publicData?.publicUrl;

      if (publicUrl) {
        setMyBannerUrl(publicUrl);
        if (typeof onUpdateCurrentUser === 'function') {
          onUpdateCurrentUser({
            ...currentUser,
            bannerUrl: publicUrl,
          });
        }
        try {
          await AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, publicUrl);
        } catch (e) {}

        supabase
          .from('profiles')
          .update({ banner_url: publicUrl })
          .eq('id', currentUser.id)
          .catch(e => console.warn('Error updating profile banner_url:', e));

        supabase.auth
          .updateUser({ data: { banner_url: publicUrl } })
          .catch(e => console.warn('Error updating auth metadata banner_url:', e));
      }
    } catch (err) {
      console.warn('handlePickAndUploadBanner error:', err);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'تعذر رفع صورة الغلاف. يرجى المحاولة مرة أخرى.' : 'Failed to upload banner. Please try again.'
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Fetch live posts from Supabase cloud
  const fetchCloudPosts = async () => {
    try {
      // 1. Fetch user profiles for avatars
      let profMap = {};
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, banner_url');
        if (profs && Array.isArray(profs)) {
          setAllProfiles(profs);
          profs.forEach((pr) => {
            if (pr.id) profMap[pr.id] = pr;
          });
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

      // 3. Check likes by current user
      let likedPostIds = new Set();
      if (currentUser?.id) {
        try {
          const { data: likesData } = await supabase
            .from('community_post_likes')
            .select('post_id')
            .eq('user_id', currentUser.id);
          likedPostIds = new Set((likesData || []).map(l => l.post_id));
        } catch (_) {}
      }

      const mapped = (postsData || []).map(p => {
        const authorProf = p.user_id ? profMap[p.user_id] : null;
        const finalAvatarUrl = authorProf?.avatar_url || p.author_avatar;
        return {
          id: p.id,
          userId: p.user_id,
          author: p.author_name || 'Community Member',
          handle: p.author_handle || `@${(p.author_name || 'user').toLowerCase().replace(/[\s\W]+/g, '')}`,
          avatar: finalAvatarUrl ? { uri: finalAvatarUrl } : null,
          time: formatTimeAgo(p.created_at, isRtl),
          content: p.content,
          postImage: p.media_url ? { uri: p.media_url } : null,
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          liked: likedPostIds.has(p.id),
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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCloudPosts();

    // Subscribe to realtime changes in community_posts
    const channel = supabase
      .channel('community_posts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          fetchCloudPosts();
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

          await supabase
            .from('community_posts')
            .update({ comments_count: (activeCommentsPost.comments || 0) + 1 })
            .eq('id', postId);
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

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const willBeLiked = !targetPost.liked;
    const nextLikesCount = willBeLiked ? targetPost.likes + 1 : Math.max(0, targetPost.likes - 1);

    // Optimistic UI update
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

    try {
      if (willBeLiked) {
        await supabase.from('community_post_likes').insert({ post_id: postId, user_id: currentUser.id });
      } else {
        await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      }
      await supabase.from('community_posts').update({ likes_count: nextLikesCount }).eq('id', postId);
    } catch (err) {
      console.warn('Error syncing like to Supabase:', err);
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
    if (showBackToTop) {
      setShowBackToTop(false);
      backToTopAnim.setValue(0);
    }
  };

  // Filter posts based on active tab
  const displayedPosts = posts.filter(post => {
    if (activeTab === 'souq') {
      return post.isMarketplace;
    }
    // Default 'feed' shows general community posts
    return !post.isMarketplace;
  });

  // User likes count for profile stats
  const userLikesCount = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  const profileName = currentUser?.fullName || (isRtl ? 'حساب زائر' : 'Guest User');
  const profileHandle = currentUser?.email
    ? `@${currentUser.email.split('@')[0]}`
    : (currentUser?.fullName ? `@${currentUser.fullName.toLowerCase().replace(/[\s\W]+/g, '')}` : '@werash_driver');
  const resolvedAvatar = myAvatarUrl || currentUser?.avatarUrl || currentUser?.avatar || null;
  const resolvedBanner = myBannerUrl || currentUser?.bannerUrl || null;

  // Create new post in Supabase cloud
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postImageUri) {
      Alert.alert(
        isRtl ? 'محتوى فارغ' : 'Empty Content',
        isRtl ? 'يرجى كتابة محتوى أو إضافة صورة للمنشور.' : 'Please enter some text or add an image before posting.'
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
      if (postImageUri) {
        const response = await fetch(postImageUri);
        const blob = await response.blob();
        const ext = postImageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `${currentUser.id}/post_${Date.now()}.${ext}`;

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
        uploadedMediaUrl = publicData?.publicUrl || null;
      }

      const postPayload = {
        user_id: currentUser.id,
        author_name: currentUser.fullName || (isRtl ? 'عضو في المجتمع' : 'Community Member'),
        author_handle: profileHandle,
        author_avatar: (typeof resolvedAvatar === 'string' ? resolvedAvatar : null),
        vehicle: currentUser.activeVehicleName || currentUser.vehicle || 'General',
        content: newPostContent.trim(),
        media_url: uploadedMediaUrl,
        media_type: uploadedMediaUrl ? 'image' : null,
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
        const finalPost = {
          id: insertedPost.id,
          userId: insertedPost.user_id,
          author: insertedPost.author_name,
          handle: insertedPost.author_handle,
          avatar: insertedPost.author_avatar ? { uri: insertedPost.author_avatar } : null,
          time: formatTimeAgo(insertedPost.created_at, isRtl),
          content: insertedPost.content,
          postImage: insertedPost.media_url ? { uri: insertedPost.media_url } : null,
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

      setIsCreatePostActive(false);
      setNewPostContent('');
      setPostImageUri(null);

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
        activeOpacity={0.88}
        style={styles.searchMarketCardShadow}
        onPress={() => {
          // Open item details if needed
        }}
      >
        <View style={styles.searchMarketCardSurface}>
          {/* Cover Image Container (Expanded for full-width post footprint) */}
          <View style={styles.searchMarketImageContainer}>
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
          </View>

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
          <View style={[styles.postHeaderLeft, isRtl && styles.postHeaderLeftRtl]}>
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
          </View>

          {/* More 3-Dots Button */}
          <TouchableOpacity
            style={styles.moreOptionsButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#8A959E" />
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

        {/* Post Body Text */}
        {Boolean(post.content) && (
          <Text style={[styles.postBodyText, isRtl && styles.postBodyTextRtl]}>
            {isRtl ? (post.contentAr || post.content) : post.content}
          </Text>
        )}

        {/* Post Attached Media Image (Social media 4:3 ratio, unrounded edges) */}
        {post.postImage && (
          <View style={styles.postImageContainer}>
            <Image
              source={typeof post.postImage === 'string' ? { uri: post.postImage } : post.postImage}
              style={styles.postImage}
              resizeMode="cover"
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
              fetchCloudPosts();
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
        {isLoading && (
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
                <View style={styles.profileBannerContainer}>
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
                </View>

                {/* Overlapping Profile Picture with Edit Badge */}
                <View style={styles.profileAvatarOuter}>
                  <View style={styles.profileAvatarCircle}>
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
                  </View>

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

            {/* My Posts Section */}
            {userPosts.length === 0 ? (
              <View style={styles.noPostsCardShadow}>
                <View style={styles.noPostsCardSurface}>
                  <View style={styles.noPostsIconCircle}>
                    <Ionicons name="document-text-outline" size={30} color={colors.activeHighlight} />
                  </View>
                  <Text style={[styles.noPostsCardTitle, isRtl && styles.noPostsCardTitleRtl]}>
                    {isRtl ? 'لا توجد منشورات' : 'No posts'}
                  </Text>
                  <Text style={[styles.noPostsCardSubtitle, isRtl && styles.noPostsCardSubtitleRtl]}>
                    {isRtl ? 'لم تقم بنشر أي منشورات بعد' : "You haven't shared any posts yet"}
                  </Text>
                </View>
              </View>
            ) : (
              userPosts.map(renderPostCard)
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
            {isLoading && (
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
              source={require('../../assets/logo_green.png')}
              style={styles.logoImage}
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
            style={[styles.iconButton, { marginLeft: 14 }]}
            activeOpacity={0.7}
            onPress={() => setChatsVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primaryText} />
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

      {/* Floating "Back to top" Pill Button */}
      <Animated.View
        pointerEvents={showBackToTop ? 'auto' : 'none'}
        style={[
          styles.backToTopContainer,
          {
            top: headerHeight + 10,
            opacity: backToTopAnim,
            transform: [
              {
                translateY: backToTopAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 0],
                }),
              },
              {
                scale: backToTopAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backToTopButton}
          activeOpacity={0.88}
          onPress={handleScrollToTop}
        >
          <Ionicons name="arrow-up" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={[styles.backToTopText, isRtl && styles.backToTopTextRtl]}>
            {isRtl ? 'العودة للأعلى' : 'Back to top'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Chats Drawer Modal */}
      <ChatsModal
        visible={chatsVisible}
        onClose={() => setChatsVisible(false)}
        selectedLanguage={selectedLanguage}
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
                      <View
                        key={person.id}
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
                      </View>
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
          setPostImageUri(null);
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
                setPostImageUri(null);
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
                (!newPostContent.trim() && !postImageUri || isPosting) && styles.createPostSubmitButtonDisabled,
              ]}
              disabled={isPosting || (!newPostContent.trim() && !postImageUri)}
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

            {/* Attached Image Preview if selected */}
            {postImageUri && (
              <View style={styles.createPostImagePreviewContainer}>
                <Image source={{ uri: postImageUri }} style={styles.createPostImagePreview} />
                <TouchableOpacity
                  style={styles.createPostImageRemoveBtn}
                  onPress={() => setPostImageUri(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
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
                    {c.avatar ? (
                      <Image source={c.avatar} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarIcon}>
                        <Ionicons name="person" size={15} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Comment Bubble & Meta */}
                    <View style={[styles.commentBubbleContainer, isRtl ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10 }]}>
                      <View style={styles.commentBubble}>
                        <Text style={[styles.commentAuthorName, isRtl && { textAlign: 'right' }]}>
                          {c.author}
                        </Text>
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
                              {reply.avatar ? (
                                <Image source={reply.avatar} style={styles.replyAvatar} />
                              ) : (
                                <View style={styles.replyAvatarIcon}>
                                  <Ionicons name="person" size={12} color="#FFFFFF" />
                                </View>
                              )}

                              <View style={[styles.replyBubbleContainer, isRtl ? { marginRight: 8, alignItems: 'flex-end' } : { marginLeft: 8 }]}>
                                <View style={styles.replyBubble}>
                                  <Text style={[styles.replyAuthorName, isRtl && { textAlign: 'right' }]}>
                                    {reply.author}
                                  </Text>
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
  },
  wordmarkImage: {
    height: 28,
    width: 83,
    tintColor: colors.primaryText,
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 38,
    letterSpacing: 0,
    color: colors.primaryText,
    marginRight: 8,
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  postAuthorHandle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  postAuthorHandleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  moreOptionsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  emptySubtitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  backToTopContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  backToTopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forestGreen,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  backToTopText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  backToTopTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  souqGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 2,
  },
  souqGridTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  profileHandle: {
    fontSize: 12.5,
    color: colors.secondaryText,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  profileHandleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  noPostsCardSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  noPostsCardSubtitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  blankPageTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  blankPageTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  personHandle: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  personHandleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  searchEmptySubtitle: {
    fontSize: 13.5,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
  },
  searchEmptySubtitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  searchMarketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 3,
  },
  searchMarketTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
  },
  createPostPromptText: {
    fontSize: 18,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  createPostPromptTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsHandleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: colors.cardBorder,
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
});
