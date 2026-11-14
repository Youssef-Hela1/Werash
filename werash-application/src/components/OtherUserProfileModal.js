import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity,
  Image, ScrollView, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, TextInput, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewerModal from './ImageViewerModal';
import PostCommentsModal from './PostCommentsModal';
import ChatImageGrid from './ChatImageGrid';
import SharedSpecialistCard from './SharedSpecialistCard';
import { ALL_MECHANICS } from '../data/mechanicsData';
import { truncatePostText, getParagraphDirection } from '../screens/CommunityScreen';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { supabase } from '../services/supabase';
import {
  getProfile,
  fetchLatestProfile,
  resolveUserAvatar,
  resolveUserBanner,
  subscribeProfileUpdates,
} from '../services/userProfileCache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_GRID_WIDTH = Math.round(SCREEN_WIDTH - 32);

function formatPostTime(dateString, isRtl) {
  if (!dateString) return isRtl ? 'الآن' : 'Just now';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return isRtl ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    if (diffHours > 0) return isRtl ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    if (diffMin > 0) return isRtl ? `منذ ${diffMin} د` : `${diffMin}m ago`;
    return isRtl ? 'الآن' : 'Just now';
  } catch (_) {
    return isRtl ? 'الآن' : 'Just now';
  }
}

export default function OtherUserProfileModal({
  visible,
  userId,
  user,
  currentUser,
  selectedLanguage,
  onClose,
  onOpenChat,
  onSelectSpecialist,
  asModal = true,
  initialPosts = null,
  onPostCommentCountChange = null,
  onPostLikeChange = null,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isRtl = selectedLanguage === 'Arabic';
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});

  // Full-Screen Image Viewer Gallery (Same as Chat Messages)
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

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

  // Interactive Comments state
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  // Sync and fetch target user's current data from Supabase
  useEffect(() => {
    if (!visible) return;

    const targetId = userId || user?.userId || user?.id || null;
    const authorName = user?.author || user?.fullName || user?.name || 'User';
    const initialHandle = user?.handle || `@${String(authorName).toLowerCase().replace(/[\s\W]+/g, '')}`;

    // 0ms instant cached resolution: never flash empty placeholders
    const cachedProf = getProfile(targetId, authorName);
    const initialAvatar = resolveUserAvatar(targetId, user?.avatar, authorName);
    const initialBanner = resolveUserBanner(targetId, user?.banner, authorName);

    const initialObj = {
      userId: targetId,
      id: targetId || user?.id,
      author: cachedProf?.fullName || authorName,
      handle: initialHandle,
      avatar: initialAvatar,
      banner: initialBanner,
      vehicle: cachedProf?.vehicle || user?.vehicle || null,
    };
    setProfileData(initialObj);

    // If initial posts were passed, use them initially with normalized counts
    if (Array.isArray(initialPosts) && initialPosts.length > 0) {
      const formatted = initialPosts.map(p => ({
        ...p,
        commentsCount: p.commentsCount !== undefined ? p.commentsCount : (p.comments || 0),
        likes: p.likes !== undefined ? p.likes : (p.likes_count || 0),
      }));
      setUserPosts(formatted);
      const totalLikes = formatted.reduce((sum, p) => sum + (p.likes || 0), 0);
      setLikesCount(totalLikes);
    }

    let isMounted = true;
    setIsLoading(true);

    // 1. Fetch live user profile details (checks Supabase profiles AND storage fallback)
    fetchLatestProfile(targetId, authorName)
      .then((freshProf) => {
        if (!isMounted || !freshProf) return;
        setProfileData(prev => {
          if (!prev) return prev;
          const freshAvatar = freshProf.avatarUrl ? { uri: freshProf.avatarUrl } : prev.avatar;
          return {
            ...prev,
            author: freshProf.fullName || prev.author,
            avatar: freshAvatar || prev.avatar,
            banner: freshProf.bannerUrl || prev.banner,
            vehicle: freshProf.vehicle || prev.vehicle,
          };
        });
      })
      .catch(() => {});

    // Live subscription: update smoothly if target user updates their picture/banner while modal is open
    const unsubscribeProfile = subscribeProfileUpdates((updatedId, updatedProf) => {
      if (!isMounted || !updatedProf) return;
      if (updatedId === targetId || (authorName && updatedProf.fullName === authorName)) {
        setProfileData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            author: updatedProf.fullName || prev.author,
            avatar: updatedProf.avatarUrl ? { uri: updatedProf.avatarUrl } : prev.avatar,
            banner: updatedProf.bannerUrl || prev.banner,
            vehicle: updatedProf.vehicle || prev.vehicle,
          };
        });
      }
    });

    // 2. Fetch live user posts and resolve current user's liked status
    (async () => {
      // Check which posts the current user has liked
      const userLikedSet = new Set();
      if (currentUser?.id) {
        try {
          const raw = await AsyncStorage.getItem(`@werash_user_likes_${currentUser.id}`);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) arr.forEach(id => userLikedSet.add(id));
          }
        } catch (_) {}

        try {
          const { data: cloudLikes } = await supabase
            .from('community_post_likes')
            .select('post_id')
            .eq('user_id', currentUser.id);
          if (cloudLikes) {
            cloudLikes.forEach(l => userLikedSet.add(l.post_id));
          }
        } catch (_) {}
      }

      const { data: cloudPosts, error: postsErr } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (!isMounted || postsErr || !cloudPosts) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // Fetch accurate comments count directly from community_post_comments
      const postCommentsMap = {};
      try {
        const { data: allCommentsData } = await supabase
          .from('community_post_comments')
          .select('id, post_id');
        if (allCommentsData && Array.isArray(allCommentsData)) {
          allCommentsData.forEach(c => {
            if (c.post_id) {
              postCommentsMap[c.post_id] = (postCommentsMap[c.post_id] || 0) + 1;
            }
          });
        }
      } catch (_) {}

      const formattedPosts = cloudPosts.map(p => {
        let parsedImg = null;
        let parsedImages = null;
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
                parsedImg = meta.images[0];
              }
            } catch (_) {}
          } else if (typeof p.media_url === 'string' && p.media_url.trim().startsWith('[')) {
            try {
              const arr = JSON.parse(p.media_url);
              if (Array.isArray(arr) && arr.length > 0) {
                parsedImages = arr;
                parsedImg = arr[0];
              }
            } catch (_) {}
          }
          if (!parsedImages && !specialistObj) {
            parsedImages = [p.media_url];
            parsedImg = p.media_url;
          }
        }

        const realComments = postCommentsMap[p.id] !== undefined
          ? postCommentsMap[p.id]
          : (p.comments_count || 0);

        return {
          id: p.id,
          userId: p.user_id,
          author: p.author_name || authorName,
          handle: initialHandle,
          avatar: resolveUserAvatar(p.user_id, p.author_avatar, p.author_name) || initialAvatar,
          time: formatPostTime(p.created_at, false),
          timeAr: formatPostTime(p.created_at, true),
          content: p.content || '',
          contentAr: p.content || '',
          postImage: parsedImg,
          images: parsedImages,
          specialist: specialistObj,
          likes: p.likes_count || 0,
          liked: userLikedSet.has(p.id),
          commentsCount: realComments,
          isMarketplace: Boolean(p.is_marketplace),
          price: p.price || null,
          location: p.location || null,
        };
      });

      setUserPosts(formattedPosts);
      const total = formattedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
      setLikesCount(total);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
      if (typeof unsubscribeProfile === 'function') unsubscribeProfile();
    };
  }, [visible, userId, user, currentUser?.id]);

  // Open comments bottom sheet
  const handleOpenComments = (post) => {
    setActiveCommentsPost(post);
  };

  // Toggle Like on a Post
  const handleToggleLike = useCallback(async (postId) => {
    let willBeLiked = false;
    let nextLikes = 0;

    setUserPosts(prev => prev.map(p => {
      if (p.id === postId) {
        willBeLiked = !p.liked;
        nextLikes = willBeLiked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1);
        return {
          ...p,
          liked: willBeLiked,
          likes: nextLikes,
        };
      }
      return p;
    }));

    // Update total likesCount in profile header
    setLikesCount(prev => willBeLiked ? prev + 1 : Math.max(0, prev - 1));

    if (onPostLikeChange) {
      onPostLikeChange(postId, willBeLiked, nextLikes);
    }

    // Persist in local storage
    if (currentUser?.id) {
      const storageKey = `@werash_user_likes_${currentUser.id}`;
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
        if (willBeLiked) {
          if (!list.includes(postId)) list.push(postId);
        } else {
          list = list.filter(id => id !== postId);
        }
        await AsyncStorage.setItem(storageKey, JSON.stringify(list));
      } catch (_) {}

      // Sync with Supabase cloud
      try {
        if (willBeLiked) {
          await supabase
            .from('community_post_likes')
            .insert({ post_id: postId, user_id: currentUser.id });
        } else {
          await supabase
            .from('community_post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', currentUser.id);
        }
        await supabase
          .from('community_posts')
          .update({ likes_count: nextLikes })
          .eq('id', postId);
      } catch (cloudErr) {
        console.warn('Like sync error:', cloudErr);
      }
    }
  }, [currentUser?.id, onPostLikeChange]);

  // Real-time spontaneous registration of likes and comments on this profile
  useEffect(() => {
    if (!visible) return;
    const targetId = userId || user?.userId || user?.id;

    const channel = supabase
      .channel(`profile_spontaneous_rt_${targetId || 'user'}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_post_likes' },
        async (payload) => {
          const targetPostId = payload.new?.post_id || payload.old?.post_id;
          if (!targetPostId) return;

          const { count } = await supabase
            .from('community_post_likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', targetPostId);

          if (typeof count === 'number') {
            setUserPosts(prev => {
              const updated = prev.map(p => p.id === targetPostId ? { ...p, likes: count } : p);
              const total = updated.reduce((sum, p) => sum + (p.likes || 0), 0);
              setLikesCount(total);
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_post_comments' },
        async (payload) => {
          const targetPostId = payload.new?.post_id || payload.old?.post_id;
          if (!targetPostId) return;

          const { count } = await supabase
            .from('community_post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', targetPostId);

          if (typeof count === 'number') {
            setUserPosts(prev =>
              prev.map(p => p.id === targetPostId ? { ...p, commentsCount: count, comments: count } : p)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, userId, user?.userId, user?.id]);

  const handleBack = () => {
    if (viewerVisible) {
      setViewerVisible(false);
    } else if (previewImage) {
      setPreviewImage(null);
    } else if (activeCommentsPost) {
      setActiveCommentsPost(null);
    } else {
      onClose?.();
    }
  };

  if (!visible) return null;

  const currentAuthorName = profileData?.author || user?.author || user?.fullName || user?.name || 'User';
  const currentHandle = profileData?.handle || user?.handle || `@${String(currentAuthorName).toLowerCase().replace(/[\s\W]+/g, '')}`;
  const resolvedAvatar = profileData?.avatar || user?.avatar || null;
  const resolvedBanner = profileData?.banner || user?.banner || null;
  const resolvedVehicle = profileData?.vehicle || user?.vehicle || null;

  const content = (
    <View style={styles.blankPageContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.screenBg}
      />

      {/* Top Bar Header (Hidden when previewing full image) */}
      {!previewImage && (
        <View style={[styles.otherProfileHeaderRow, { paddingTop: topInset + 6 }, isRtl && styles.otherProfileHeaderRowRtl]}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.7}
            style={styles.otherProfileBackButton}
          >
            <Ionicons
              name={isRtl ? 'arrow-forward' : 'arrow-back'}
              size={26}
              color={colors.primaryText}
            />
          </TouchableOpacity>

          <Text style={[styles.otherProfileHeaderTitle, isRtl && styles.otherProfileHeaderTitleRtl]} numberOfLines={1}>
            {currentAuthorName}
          </Text>

          {/* Balance spacer */}
          <View style={styles.otherProfileHeaderSpacer} />
        </View>
      )}

      {/* Scrollable Profile Details & Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.otherProfileScrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCardShadow}>
          <View style={styles.profileCardSurface}>
            {/* Banner */}
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
            </TouchableOpacity>

            {/* Circular Avatar */}
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
            </View>

            {/* Name & Handle */}
            <View style={styles.profileMetaContainer}>
              <Text style={[styles.profileName, isRtl && styles.profileNameRtl]}>
                {currentAuthorName}
              </Text>
              <Text style={[styles.profileHandle, isRtl && styles.profileHandleRtl]}>
                {currentHandle}
              </Text>

              {/* Vehicle Badge if present */}
              {Boolean(resolvedVehicle) && (
                <View style={[styles.otherProfileVehicleBadge, isRtl && styles.otherProfileVehicleBadgeRtl]}>
                  <Ionicons
                    name="car-sport"
                    size={14}
                    color={colors.forestGreen}
                    style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }}
                  />
                  <Text style={[styles.otherProfileVehicleText, isRtl && styles.otherProfileVehicleTextRtl]}>
                    {resolvedVehicle}
                  </Text>
                </View>
              )}

              {/* Direct Message Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.otherProfileMessageBtn, isRtl && styles.otherProfileMessageBtnRtl]}
                onPress={() => {
                  if (typeof onOpenChat === 'function') {
                    onOpenChat(profileData || user);
                  }
                }}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={15}
                  color="#FFFFFF"
                  style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }}
                />
                <Text style={[styles.otherProfileMessageBtnText, isRtl && styles.otherProfileMessageBtnTextRtl]}>
                  {isRtl ? 'مراسلة' : 'Message'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={[styles.profileStatsSeamlessRow, isRtl && styles.profileStatsSeamlessRowRtl]}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>
                  {userPosts.length}
                </Text>
                <Text style={[styles.profileStatLabel, isRtl && styles.profileStatLabelRtl]}>
                  {isRtl ? 'منشورات' : 'Posts'}
                </Text>
              </View>

              <View style={styles.profileStatDivider} />

              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>
                  {likesCount}
                </Text>
                <Text style={[styles.profileStatLabel, isRtl && styles.profileStatLabelRtl]}>
                  {isRtl ? 'إعجابات' : 'Likes'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Posts Section Header */}
        <View style={[styles.otherProfileSectionRow, isRtl && styles.otherProfileSectionRowRtl]}>
          <Text style={[styles.otherProfileSectionTitle, isRtl && styles.otherProfileSectionTitleRtl]}>
            {isRtl ? 'المنشورات' : 'Posts'}
          </Text>
          <Text style={styles.otherProfileSectionCount}>
            ({userPosts.length})
          </Text>
        </View>

        {/* Posts List or Empty State */}
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
                {isRtl ? 'لم يقم هذا المستخدم بنشر أي منشورات بعد' : 'This user has not shared any posts yet'}
              </Text>
            </View>
          </View>
        ) : (
          userPosts.map((post) => (
            <View key={post.id} style={styles.postCardShadow}>
              <View style={styles.postCardSurface}>
                {/* Post Header */}
                <View style={[styles.postHeaderRow, isRtl && styles.postHeaderRowRtl]}>
                  <View style={[styles.postHeaderLeft, isRtl && styles.postHeaderLeftRtl]}>
                    {post.avatar || resolvedAvatar ? (
                      <Image
                        source={
                          post.avatar
                            ? (typeof post.avatar === 'string' ? { uri: post.avatar } : post.avatar)
                            : (typeof resolvedAvatar === 'string' ? { uri: resolvedAvatar } : resolvedAvatar)
                        }
                        style={styles.postAuthorAvatar}
                      />
                    ) : (
                      <View style={styles.postAuthorAvatarPlaceholder}>
                        <Ionicons name="person" size={18} color="#FFFFFF" />
                      </View>
                    )}
                    <View style={[styles.postAuthorMeta, isRtl && styles.postAuthorMetaRtl]}>
                      <Text style={[styles.postAuthorName, isRtl && styles.postAuthorNameRtl]}>
                        {post.author || currentAuthorName}
                      </Text>
                      <Text style={[styles.postAuthorHandle, isRtl && styles.postAuthorHandleRtl]}>
                        {post.handle || currentHandle} • {isRtl ? (post.timeAr || post.time) : post.time}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Marketplace badges if marketplace item */}
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

                {/* Post Body Content (Per-paragraph directional detection, 120-char preview, Read more/less toggle) */}
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

                {/* Attached media images: Multi-Image Grid or Single Image */}
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
                ) : Boolean(post.postImage) ? (
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => handleOpenPostImage(post, 0)}
                    style={styles.postImageContainer}
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

                {/* Engagement row: Like & Comment buttons */}
                <View style={[styles.postEngagementRow, isRtl && styles.postEngagementRowRtl]}>
                  {/* Like Button */}
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
                      {post.likes !== undefined ? post.likes : (post.likes_count || 0)}
                    </Text>
                  </TouchableOpacity>

                  {/* Comment Button */}
                  <TouchableOpacity
                    style={[styles.engagementItem, isRtl && styles.engagementItemRtl]}
                    activeOpacity={0.7}
                    onPress={() => handleOpenComments(post)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chatbubble-outline" size={19} color={colors.secondaryText} />
                    <Text style={[styles.engagementCount, isRtl ? { marginRight: 6 } : { marginLeft: 6 }]}>
                      {post.commentsCount !== undefined ? post.commentsCount : (post.comments || 0)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Full-Screen Multi-Image Viewer Gallery (Same interface as Chat Messages) */}
      <ImageViewerModal
        visible={viewerVisible}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerVisible(false)}
        isRTL={isRtl}
        asModal={false}
      />

      {/* Interactive Comments Bottom Sheet Shared Component */}
      <PostCommentsModal
        visible={Boolean(activeCommentsPost)}
        post={activeCommentsPost}
        currentUser={currentUser}
        selectedLanguage={selectedLanguage}
        onClose={() => setActiveCommentsPost(null)}
        onOpenUserProfile={(targetUser) => {
          // Keep profile viewing or update
        }}
        onCommentCountChange={(targetPostId, count) => {
          setUserPosts(prev => prev.map(p => p.id === targetPostId ? { ...p, commentsCount: count } : p));
          setActiveCommentsPost(prev => prev && prev.id === targetPostId ? { ...prev, commentsCount: count, comments: count } : prev);
          if (onPostCommentCountChange) {
            onPostCommentCountChange(targetPostId, count);
          }
        }}
        asModal={false}
        requireAuth={() => true}
      />



    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={handleBack}
    >
      {content}
    </Modal>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  blankPageContainer: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
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
    fontFamily: 'AlkhalilArabic-Bold',
  },
  otherProfileSectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryText,
    marginLeft: 6,
  },
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
    marginTop: 4,
    textAlign: 'center',
  },
  noPostsCardSubtitleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
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
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
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
    marginLeft: 10,
    flex: 1,
  },
  postAuthorMetaRtl: {
    marginRight: 10,
    marginLeft: 0,
    alignItems: 'flex-end',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  postAuthorNameRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
  },
  postAuthorHandle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  postAuthorHandleRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
  },
  marketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  marketMetaRowRtl: {
    flexDirection: 'row-reverse',
  },
  marketPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  marketPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  marketPriceTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  marketLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  marketLocationText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  marketLocationTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  postBodyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    fontSize: 14,
    lineHeight: 21,
    color: colors.primaryText,
  },
  postParagraphRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'AlkhalilArabic-Regular',
  },
  postParagraphLtr: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  postParagraphSpacing: {
    height: 8,
  },
  postBodyText: {
    fontSize: 14,
    color: colors.primaryText,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 21,
  },
  postBodyTextRtl: {
    textAlign: 'right',
    fontFamily: 'AlkhalilArabic-Regular',
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
    aspectRatio: 4 / 3,
    backgroundColor: '#000000',
  },
  postSharedSpecialistWrapper: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  postMultiImagesContainer: {
    width: '100%',
    marginBottom: 14,
    borderRadius: 0,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  postEngagementRowRtl: {
    flexDirection: 'row-reverse',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  engagementItemRtl: {
    flexDirection: 'row-reverse',
    marginRight: 0,
    marginLeft: 20,
  },
  engagementCount: {
    fontSize: 13,
    color: '#8A959E',
    fontWeight: '600',
  },
  imageViewerAbsoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 10,
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

  // Comments Bottom Sheet Styles
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
    justifyContent: 'flex-end',
  },
  commentsSheetContainer: {
    width: '100%',
    height: '75%',
    backgroundColor: colors.elevatedBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  commentsHandleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  commentsHandleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.secondaryText + '50',
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
  },
  commentsCountBadgeRtl: {
    marginLeft: 0,
    marginRight: 8,
  },
  commentsCountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.activeHighlight,
  },
  commentsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  commentsListScroll: {
    flex: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubbleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  commentBubbleContainerRtl: {
    flex: 1,
    marginRight: 10,
    marginLeft: 0,
    alignItems: 'flex-end',
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
    fontWeight: '800',
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
    marginTop: 4,
    paddingHorizontal: 4,
  },
  commentMetaRowRtl: {
    flexDirection: 'row-reverse',
  },
  commentTimeText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginRight: 14,
  },
  commentReplyBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginRight: 14,
  },
  commentReplyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.activeHighlight,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  commentLikeBtnRtl: {
    flexDirection: 'row-reverse',
  },
  commentLikeCount: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondaryText,
    marginLeft: 3,
  },
  repliesListContainer: {
    marginTop: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.cardBorder,
    paddingLeft: 10,
  },
  repliesListContainerRtl: {
    marginTop: 8,
    borderLeftWidth: 0,
    borderRightWidth: 1.5,
    borderRightColor: colors.cardBorder,
    paddingLeft: 0,
    paddingRight: 10,
  },
  replyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  replyItemRowRtl: {
    flexDirection: 'row-reverse',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  replyAvatarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  replyingToBannerRtl: {
    flexDirection: 'row-reverse',
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  replyingToTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    marginLeft: 6,
  },
  commentSendBtnDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.4,
  },
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 12,
  },
  emptyCommentsSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
});
