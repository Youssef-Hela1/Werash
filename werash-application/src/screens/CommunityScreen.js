import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatsModal from '../components/ChatsModal';

const TABS = [
  { id: 'feed', label: 'Feed', labelAr: 'الرئيسية' },
  { id: 'profile', label: 'Profile', labelAr: 'الملف' },
  { id: 'souq', label: 'Souq', labelAr: 'سوق' },
];

const INITIAL_SAMPLE_POSTS = [
  {
    id: 'post-aly',
    author: 'Aly Omar',
    handle: '@alyomar',
    time: '2d ago',
    timeAr: 'منذ يومين',
    avatar: require('../../assets/expert_samir.png'),
    content: 'WIP',
    contentAr: 'قيد العمل',
    postImage: require('../../assets/expert_samir.png'),
    likes: 0,
    comments: 2,
    liked: false,
  },
  {
    id: 'post-karim',
    author: 'Karim Hamed',
    handle: '@karimhamed',
    time: '2d ago',
    timeAr: 'منذ يومين',
    avatar: require('../../assets/expert_michael.png'),
    content: 'First official post\n4/11/2026',
    contentAr: 'أول منشور رسمي\n٤/١١/٢٠٢٦',
    postImage: null,
    likes: 0,
    comments: 0,
    liked: false,
  },
];

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState(INITIAL_SAMPLE_POSTS);
  const isRtl = selectedLanguage === 'Arabic';

  const handleToggleLike = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const nextLiked = !post.liked;
        return {
          ...post,
          liked: nextLiked,
          likes: nextLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      }
      return post;
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }]}>
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

      {/* Scrollable Feed List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollListContent}
      >
        {/* Post Creator Bar (Premium Card Style) */}
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

        {/* Post Cards Feed */}
        {posts.map((post) => (
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
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
    padding: 16,
    overflow: 'hidden',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  },
  postBodyTextRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
    textAlign: 'right',
  },
  postImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E8EA',
    marginBottom: 14,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
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
});
