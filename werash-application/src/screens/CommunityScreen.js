import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Platform, ActivityIndicator, Alert, RefreshControl, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatsModal from '../components/ChatsModal';
import { supabase } from '../services/supabase';

const TABS = [
  { id: 'feed', label: 'Feed', labelAr: 'الرئيسية' },
  { id: 'profile', label: 'Profile', labelAr: 'الملف' },
  { id: 'souq', label: 'Souq', labelAr: 'سوق' },
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

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
  onOpenSignIn,
  onUpdateCurrentUser,
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRtl = selectedLanguage === 'Arabic';

  // Profile avatar & banner upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [myAvatarUrl, setMyAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.avatar || null);
  const [myBannerUrl, setMyBannerUrl] = useState(currentUser?.bannerUrl || null);

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
      lastOffsetY.current = currentY;
      return;
    }

    // When scrolling down past initial top zone: hide header off-screen
    if (currentY > 60 && diff > 8) {
      if (!isHeaderHidden.current) {
        isHeaderHidden.current = true;
        Animated.timing(headerTranslateAnim, {
          toValue: -headerHeight,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    }
    // When scrolling up (diff < -8) or at the top: immediately slide down and click header at the top
    else if (diff < -8 || currentY <= 15) {
      if (isHeaderHidden.current || currentY <= 15) {
        isHeaderHidden.current = false;
        Animated.timing(headerTranslateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
          isRtl ? 'نحتاج إلى إذن للوصول إلى معرض الصور لتحديث صورتك الشخصية.' : 'We need permission to access your gallery to update your profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
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
          try {
            await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', currentUser.id);
          } catch (e) {
            console.warn('Error updating profile avatar_url:', e);
          }

          try {
            await supabase.auth.updateUser({
              data: { avatar_url: publicUrl }
            });
          } catch (e) {
            console.warn('Error updating auth metadata avatar_url:', e);
          }

          if (typeof onUpdateCurrentUser === 'function') {
            onUpdateCurrentUser({
              ...currentUser,
              avatar: publicUrl,
              avatarUrl: publicUrl,
            });
          }

          setMyAvatarUrl(publicUrl);

          setPosts(prev => prev.map(p => {
            if (p.userId === currentUser.id || p.author === currentUser.fullName) {
              return { ...p, avatar: { uri: publicUrl } };
            }
            return p;
          }));

          Alert.alert(
            isRtl ? 'تم بنجاح' : 'Success',
            isRtl ? 'تم تحديث الصورة الشخصية بنجاح.' : 'Profile picture updated successfully.'
          );
        }
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
          isRtl ? 'نحتاج إلى إذن للوصول إلى الصور لتحديث صورة الغلاف.' : 'We need permission to access your gallery to update your banner.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
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
          try {
            await supabase
              .from('profiles')
              .update({ banner_url: publicUrl })
              .eq('id', currentUser.id);
          } catch (e) {
            console.warn('Error updating profile banner_url:', e);
          }

          try {
            await supabase.auth.updateUser({
              data: { banner_url: publicUrl }
            });
          } catch (e) {
            console.warn('Error updating auth metadata banner_url:', e);
          }

          try {
            await AsyncStorage.setItem(`@werash_user_banner_${currentUser.id}`, publicUrl);
          } catch (e) {
            console.warn('Error saving banner to storage:', e);
          }

          if (typeof onUpdateCurrentUser === 'function') {
            onUpdateCurrentUser({
              ...currentUser,
              bannerUrl: publicUrl,
            });
          }

          setMyBannerUrl(publicUrl);

          Alert.alert(
            isRtl ? 'تم بنجاح' : 'Success',
            isRtl ? 'تم تحديث صورة الغلاف بنجاح.' : 'Banner updated successfully.'
          );
        }
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
                  color="#003514"
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
                  color="#5C6A72"
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={19} color="#8A959E" />
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
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.postBarShadow}
            onPress={() => {
              // Open post creation modal/screen
            }}
          >
            <View style={[styles.postBarSurface, isRtl && styles.postBarSurfaceRtl]}>
              {/* User Avatar */}
              {currentUser && (currentUser.avatarUrl || currentUser.avatar) ? (
                <Image
                  source={
                    typeof (currentUser.avatarUrl || currentUser.avatar) === 'string'
                      ? { uri: currentUser.avatarUrl || currentUser.avatar }
                      : (currentUser.avatarUrl || currentUser.avatar)
                  }
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
              )}

              {/* Vertical Divider */}
              <View style={styles.postDivider} />

              {/* Input Placeholder Text */}
              <Text style={[styles.postInputPlaceholder, isRtl && styles.postInputPlaceholderRtl]}>
                {isRtl ? 'شارك تحديثاً لسيارتك...' : 'Share a car update...'}
              </Text>

              {/* Plus Circular Button */}
              <View style={styles.postPlusButton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#003514" />
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
                    <Ionicons name="document-text-outline" size={30} color="#003514" />
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
                <ActivityIndicator size="small" color="#003514" />
              </View>
            )}

            {/* Empty State */}
            {!isLoading && displayedPosts.length === 0 && (
              <View style={styles.noPostsCardShadow}>
                <View style={styles.noPostsCardSurface}>
                  <View style={styles.noPostsIconCircle}>
                    <Ionicons name="pricetags-outline" size={30} color="#003514" />
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

            {/* 2-Card Grid for Souq Items (Just the Image, Social Media Aspect Ratio) */}
            {!isLoading && displayedPosts.length > 0 && (
              <View style={[styles.souqGridContainer, isRtl && styles.souqGridContainerRtl]}>
                {displayedPosts.map((post) => {
                  const itemImage = post.postImage
                    ? (typeof post.postImage === 'string' ? { uri: post.postImage } : post.postImage)
                    : require('../../assets/modern_workshop_banner.png');
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
                        <Image
                          source={itemImage}
                          style={styles.souqGridImage}
                          resizeMode="cover"
                        />
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
              // Search handler
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search-outline" size={28} color="#003514" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 14 }]}
            activeOpacity={0.7}
            onPress={() => setChatsVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#003514" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
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
    tintColor: '#003514',
  },
  brandNameArabic: {
    fontFamily: 'ZafranArabic-Bold',
    fontSize: 38,
    letterSpacing: 0,
    color: '#003514',
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
    borderBottomColor: '#EDEDED',
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
    color: '#8E9990',
    paddingBottom: 10,
  },
  tabTextActive: {
    color: '#003514',
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
    backgroundColor: '#003514',
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
    backgroundColor: '#F2F4F5',
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
      },
      android: {
        elevation: 2.8,
      },
    }),
  },
  postBarSurface: {
    width: '100%',
    backgroundColor: '#F2F4F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  postBarSurfaceRtl: {
    flexDirection: 'row-reverse',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#37633B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  postDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 12,
  },
  postInputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#8A959E',
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
    backgroundColor: '#003514',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  postCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F2F4F5',
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
      },
      android: {
        elevation: 2.8,
      },
    }),
  },
  postCardSurface: {
    width: '100%',
    backgroundColor: '#F2F4F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    borderColor: '#FFFFFF',
  },
  postAuthorAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#37633B',
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
    color: '#1A211B',
    letterSpacing: -0.2,
  },
  postAuthorNameRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  postAuthorHandle: {
    fontSize: 12,
    color: '#8A959E',
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
    color: '#1E2D1F',
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
    backgroundColor: '#E5E8EA',
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
    color: '#8A959E',
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
    color: '#4B5563',
    marginTop: 12,
  },
  emptyTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A959E',
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
    backgroundColor: '#003514',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    backgroundColor: '#003514',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#003514',
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
    backgroundColor: 'rgba(0, 53, 20, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  marketPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#003514',
    letterSpacing: -0.2,
  },
  marketPriceTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  marketLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEFF2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  marketLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C6A72',
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
    borderRadius: 18,
    backgroundColor: '#F2F4F5',
    marginBottom: 14,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4.5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  souqGridCardSurface: {
    backgroundColor: '#F2F4F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  souqGridImage: {
    width: '100%',
    aspectRatio: 1.33, // 4:3 social media feed aspect ratio
    backgroundColor: '#E5E8EA',
  },
  profileCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F2F4F5',
    marginBottom: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.08,
        shadowRadius: 5.5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileCardSurface: {
    backgroundColor: '#F2F4F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  profileBannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#003514',
    position: 'relative',
  },
  profileBannerImage: {
    width: '100%',
    height: '100%',
  },
  profileBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  editBannerButton: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#003514',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
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
    backgroundColor: '#003514',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#003514',
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
    color: '#003514',
    textAlign: 'center',
  },
  profileNameRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  profileHandle: {
    fontSize: 12.5,
    color: '#7E8B93',
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
    color: '#003514',
  },
  profileStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A959E',
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
    backgroundColor: '#D7DEE2',
  },
  // "No Posts" Card Styles (Premium card design)
  noPostsCardShadow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F2F4F5',
    marginBottom: 20,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.08,
        shadowRadius: 5.5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  noPostsCardSurface: {
    backgroundColor: '#F2F4F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  noPostsIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 53, 20, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noPostsCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#003514',
    textAlign: 'center',
  },
  noPostsCardTitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  noPostsCardSubtitle: {
    fontSize: 13,
    color: '#7E8B93',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  noPostsCardSubtitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
});
