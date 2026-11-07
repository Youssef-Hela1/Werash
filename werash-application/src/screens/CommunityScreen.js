import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRtl = selectedLanguage === 'Arabic';

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

  // Filter posts based on active tab
  const displayedPosts = posts.filter(post => {
    if (activeTab === 'souq') {
      return post.isMarketplace;
    }
    if (activeTab === 'profile') {
      return currentUser?.id ? post.userId === currentUser.id : false;
    }
    // Default 'feed' shows general community posts
    return !post.isMarketplace;
  });

  return (
    <View style={styles.container}>
      {/* Scrollable Feed List with Non-Fixed Header & Tabs */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollListContent, { paddingTop: topInset + 6 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchCloudPosts();
            }}
            tintColor="#003514"
            colors={['#003514']}
          />
        }
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
                onPress={() => setActiveTab(tab.id)}
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
          {displayedPosts.map((post) => (
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

                {/* Post Body Text */}
                {Boolean(post.content) && (
                  <Text style={[styles.postBodyText, isRtl && styles.postBodyTextRtl]}>
                    {isRtl ? (post.contentAr || post.content) : post.content}
                  </Text>
                )}

                {/* Post Attached Media Image (16:9 rounded banner) */}
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
          ))}
        </View>
      </ScrollView>

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
    paddingTop: 16,
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
});
