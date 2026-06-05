import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, Animated, StatusBar, Modal,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

const initialPosts = [
  {
    id: '1',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '2h ago',
    content: "Just finalized the ECU calibration on a twin-turbo Golf R. The torque curve is absolutely linear now! 📈💻 Ready for track season. #ecu #tuning #golf-r",
    postImage: require('../../assets/modern_workshop_banner.png'),
    likes: 42,
    comments: 7,
    liked: false,
    vehicle: 'Golf R',
  },
  {
    id: '2',
    author: 'Kareem El-Sayed',
    handle: '@kareem',
    avatar: require('../../assets/expert_kareem.png'),
    avatarType: 'image',
    time: '4h ago',
    content: "Diagnosed a weird tapping sound in a customer's engine bay. Turned out to be a loose heat shield. Quick fix but saved them a major headache! 🛠️ Always double check the basics first.",
    postImage: null,
    likes: 18,
    comments: 2,
    liked: false,
    vehicle: 'General',
  },
  {
    id: '3',
    author: 'Tariq Mansour',
    handle: '@tariq',
    avatar: require('../../assets/expert_tariq.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Brembo Big Brake Kit upgrade completed for a client's track car. Stop power is immense now! Don't skimp on safety. 🛑 #brakes #trackday #safetyfirst",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 29,
    comments: 4,
    liked: false,
    vehicle: 'Hyundai Coupe',
  },
  {
    id: '4',
    author: 'Michael Chang',
    handle: '@michael_c',
    avatar: require('../../assets/expert_michael.png'),
    avatarType: 'image',
    time: '3h ago',
    content: "Selling my lightly used set of 18\" BBS LM Replica rims. Perfect fitment for Golf R or Audi S3. Zero curb rash, wrapped in Hankook Ventus V12 tires with 80% tread left. DM if interested! 🏎️💨",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 15,
    comments: 3,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$1,200',
    location: 'New Cairo',
  },
  {
    id: '5',
    author: 'Sarah Jenkins',
    handle: '@sarah_j',
    avatar: require('../../assets/expert_sarah.png'),
    avatarType: 'image',
    time: '5h ago',
    content: "Looking to sell a brand new OMP Racing Steering Wheel. Leather grip, yellow centering stripe. Bought it for a project car but went a different direction. Box opened only for photos. 📦🏁",
    postImage: null,
    likes: 8,
    comments: 1,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$250',
    location: 'Maadi',
  }
];

export default function CommunityScreen() {
  const [feedPosts, setFeedPosts] = useState(initialPosts);
  const [statusText, setStatusText] = useState('');
  const [selectedFeed, setSelectedFeed] = useState('overall'); // 'overall' or 'active'
  const [showProfile, setShowProfile] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  
  const [listingOverlayVisible, setListingOverlayVisible] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingLocation, setListingLocation] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [marketSearch, setMarketSearch] = useState('');
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const maxScroll = showProfile ? 55 : 175;
  const opacityScroll = showProfile ? 35 : 110;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, -maxScroll],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, opacityScroll],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleShowProfile = (val) => {
    setShowProfile(val);
    setExpandedPostId(null);
    scrollY.setValue(0);
    if (scrollViewRef.current) {
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: 0, animated: false });
      }
    }
  };

  const getSubtitleText = () => {
    switch (selectedFeed) {
      case 'active':
        return 'Updates and logs for your active Hyundai Coupe';
      case 'marketplace':
        return 'Buy & sell car parts, tools, and custom accessories';
      case 'overall':
      default:
        return 'Share updates and tips with local car fans';
    }
  };

  const handleCreatePost = () => {
    if (!statusText.trim()) return;
    const newPost = {
      id: Date.now().toString(),
      author: 'Guest User',
      handle: '@guest',
      avatarType: 'icon',
      time: 'Just now',
      content: statusText.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      postImage: null,
      vehicle: 'Hyundai Coupe', // Default to active vehicle
      isMarketplace: selectedFeed === 'marketplace',
      price: selectedFeed === 'marketplace' ? 'Ask Price' : null,
      location: selectedFeed === 'marketplace' ? 'Cairo' : null,
    };
    setFeedPosts([newPost, ...feedPosts]);
    setStatusText('');
  };

  const handlePublishListing = () => {
    if (!listingTitle.trim() || !listingPrice.trim()) return;
    const newPost = {
      id: Date.now().toString(),
      author: 'Guest User',
      handle: '@guest',
      avatarType: 'icon',
      time: 'Just now',
      content: `${listingTitle.trim()}\n\n${listingDesc.trim()}`,
      likes: 0,
      comments: 0,
      liked: false,
      postImage: null,
      vehicle: 'Hyundai Coupe',
      isMarketplace: true,
      price: listingPrice.trim(),
      location: listingLocation.trim() || 'Cairo',
    };
    setFeedPosts([newPost, ...feedPosts]);
    setListingTitle('');
    setListingPrice('');
    setListingLocation('');
    setListingDesc('');
    setListingOverlayVisible(false);
  };

  const handleLike = (id) => {
    setFeedPosts(feedPosts.map((post) => {
      if (post.id === id) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  // Filter posts based on view state
  const filteredPosts = feedPosts.filter((post) => {
    if (showProfile) {
      return post.author === 'Guest User';
    }
    if (selectedFeed === 'marketplace') {
      const isMarket = post.isMarketplace === true;
      if (!isMarket) return false;
      if (!marketSearch.trim()) return true;
      const query = marketSearch.toLowerCase().trim();
      const titleMatches = post.content && post.content.toLowerCase().includes(query);
      const authorMatches = post.author && post.author.toLowerCase().includes(query);
      const locationMatches = post.location && post.location.toLowerCase().includes(query);
      return titleMatches || authorMatches || locationMatches;
    }
    // Exclude marketplace items from standard feeds
    if (post.isMarketplace) return false;
    
    if (selectedFeed === 'overall') return true;
    return post.vehicle === 'Hyundai Coupe' || post.vehicle === 'General' || post.author === 'Guest User';
  });

  // Calculate user stats for profile card
  const myPosts = feedPosts.filter(p => p.author === 'Guest User');
  const myPostsCount = myPosts.length;
  const myTotalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const expandedPost = feedPosts.find((p) => p.id === expandedPostId);

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 80)
    lines.push(
      <View
        key="top-solid-block"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: COLORS.bgCreamy,
          zIndex: 3,
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 80 to y = 90
    const numLines = 20;
    const startY = 80;
    const endY = 90;
    const step = (endY - startY) / numLines; // 0.5px steps
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: COLORS.bgCreamy,
            opacity: opacity,
            zIndex: 3,
          }}
        />
      );
    }
    return lines;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Top Fade Gradient Overlay */}
          {renderGradientOverlay()}

          {/* Feed Post List */}
          <Animated.ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: showProfile ? 135 : 255 }
            ]}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          >
            {/* User Profile Summary Card (Inside scroll content so it collapses on scroll) */}
            {showProfile && (
              <View style={styles.profileSummaryCard}>
                <View style={styles.profileSummaryHeader}>
                  <View style={styles.avatarLarge}>
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.profileSummaryDetails}>
                    <Text style={styles.profileSummaryName}>Guest User</Text>
                    <Text style={styles.profileSummaryHandle}>@guest</Text>
                  </View>
                </View>
                
                <View style={styles.carBadge}>
                  <Ionicons name="car-outline" size={14} color={COLORS.bgBrand} style={{ marginRight: 6 }} />
                  <Text style={styles.carText}>Active: Hyundai Coupe (2005)</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{myPostsCount}</Text>
                    <Text style={styles.statLabel}>POSTS</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{myTotalLikes}</Text>
                    <Text style={styles.statLabel}>LIKES RECEIVED</Text>
                  </View>
                </View>
              </View>
            )}

            {filteredPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color="rgba(77, 110, 79, 0.18)" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>
                  {showProfile 
                    ? "You haven't posted anything yet. Share your first status update on the feed!" 
                    : "No posts found in this feed."}
                </Text>
                {showProfile && (
                  <TouchableOpacity 
                    style={styles.emptyButton} 
                    onPress={() => handleShowProfile(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyButtonText}>Back to Feed</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : selectedFeed === 'marketplace' && !showProfile ? (
              // 2x2 Grid Layout for Marketplace (structured like Mechanics Screen)
              <View style={styles.gridContainer}>
                {filteredPosts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.marketGridCard} 
                    activeOpacity={0.85}
                    onPress={() => setExpandedPostId(post.id)}
                  >
                    {/* Cover Image fallback */}
                    <Image 
                      source={post.postImage || require('../../assets/modern_workshop_banner.png')} 
                      style={styles.marketGridCover} 
                    />

                    {/* Card Content Area */}
                    <View style={styles.marketGridDetails}>
                      {/* Top Info Area */}
                      <View>
                        {/* Seller & Badge */}
                        <View style={styles.marketGridAuthorRow}>
                          <Text style={styles.marketGridAuthor} numberOfLines={1}>{post.author}</Text>
                          <View style={styles.marketGridBadge}>
                            <Text style={styles.marketGridBadgeText}>FOR SALE</Text>
                          </View>
                        </View>

                        {/* Title (content truncated) */}
                        <Text style={styles.marketGridTitle} numberOfLines={2}>{post.content}</Text>

                        {/* Location */}
                        <View style={styles.marketGridLocationRow}>
                          <Ionicons name="location-sharp" size={11} color={COLORS.textMuted} style={{ marginRight: 2 }} />
                          <Text style={styles.marketGridLocation} numberOfLines={1}>{post.location || 'Cairo'}</Text>
                        </View>
                      </View>

                      {/* Bottom Info Area */}
                      <View>
                        <View style={styles.marketGridDivider} />
                        <View style={styles.marketGridPriceRow}>
                          <Text style={styles.marketGridPrice}>{post.price || 'Ask Price'}</Text>
                          <View style={styles.marketGridContactPill}>
                            <Ionicons name="chatbubble-ellipses" size={10} color="#FFFFFF" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Standard Post list (Feed or Profile Mode)
              filteredPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {/* Author Info */}
                  <View style={styles.authorRow}>
                    <View style={styles.authorLeft}>
                      {post.avatarType === 'image' ? (
                        <Image source={post.avatar} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatarIcon}>
                          <Ionicons name="person" size={16} color="#FFFFFF" />
                        </View>
                      )}
                      <View style={styles.authorDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.authorName}>{post.author}</Text>
                          {post.isMarketplace && (
                            <View style={styles.saleBadge}>
                              <Text style={styles.saleBadgeText}>FOR SALE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.authorHandle}>
                          {post.handle} • {post.time}
                          {post.location && ` • 📍 ${post.location}`}
                        </Text>
                      </View>
                    </View>
                    {post.isMarketplace ? (
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>{post.price}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity activeOpacity={0.6}>
                        <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Content text */}
                  <Text style={styles.postText}>{post.content}</Text>

                  {/* Optional Image */}
                  {post.postImage && (
                    <Image source={post.postImage} style={styles.postCardImage} resizeMode="cover" />
                  )}

                  {/* Actions Row */}
                  <View style={styles.actionDivider} />
                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      activeOpacity={0.7}
                      onPress={() => handleLike(post.id)}
                    >
                      <Ionicons 
                        name={post.liked ? "heart" : "heart-outline"} 
                        size={20} 
                        color={post.liked ? COLORS.accentRed : COLORS.textMuted} 
                      />
                      <Text style={[
                        styles.actionText,
                        post.liked && { color: COLORS.accentRed, fontWeight: '700' }
                      ]}>
                        {post.likes}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={19} color={COLORS.textMuted} />
                      <Text style={styles.actionText}>{post.comments}</Text>
                    </View>

                    {post.isMarketplace ? (
                      <TouchableOpacity style={styles.contactSellerButton} activeOpacity={0.8}>
                        <Ionicons name="chatbubble-ellipses" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.contactSellerText}>Message Seller</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.actionButton}>
                        <Ionicons name="paper-plane-outline" size={19} color={COLORS.textMuted} />
                        <Text style={styles.actionText}>Share</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </Animated.ScrollView>

          {/* Collapsible Header Group */}
          <Animated.View 
            pointerEvents="box-none"
            style={[
              styles.collapsibleHeader,
              {
                height: showProfile ? 55 : 175,
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
                justifyContent: showProfile ? 'center' : 'flex-start',
              }
            ]}
          >
            {showProfile ? (
              // Profile Mode Header
              <TouchableOpacity 
                onPress={() => handleShowProfile(false)} 
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              >
                <Ionicons name="arrow-back-outline" size={13} color={COLORS.bgBrand} style={{ marginRight: 4 }} />
                <Text style={styles.backButtonText}>Back to Feed</Text>
              </TouchableOpacity>
            ) : (
              // Feed Mode Header
              <>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.titleText}>Community Feed</Text>
                  <Text style={styles.subtitleText}>{getSubtitleText()}</Text>
                </View>

                {/* Feed Segmented Selector */}
                <View style={styles.selectorRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('overall'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[
                      styles.selectorTab,
                      selectedFeed === 'overall' ? styles.selectorTabSelected : styles.selectorTabUnselected
                    ]}
                  >
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'overall' ? styles.selectorTextSelected : styles.selectorTextUnselected
                    ]}>
                      Overall Feed
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('active'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[
                      styles.selectorTab,
                      selectedFeed === 'active' ? styles.selectorTabSelected : styles.selectorTabUnselected
                    ]}
                  >
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'active' ? styles.selectorTextSelected : styles.selectorTextUnselected
                    ]}>
                      Active Vehicle
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('marketplace'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[
                      styles.selectorTab,
                      selectedFeed === 'marketplace' ? styles.selectorTabSelected : styles.selectorTabUnselected
                    ]}
                  >
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'marketplace' ? styles.selectorTextSelected : styles.selectorTextUnselected
                    ]}>
                      Marketplace
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Premium Post Composition Box / List Item Trigger */}
            {!showProfile && (
              selectedFeed === 'marketplace' ? (
                <View style={styles.marketBarRow}>
                  <View style={styles.marketSearchContainer}>
                    <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.marketSearchInput}
                      placeholder="Search items, location, sellers..."
                      placeholderTextColor="#ADADAD"
                      value={marketSearch}
                      onChangeText={setMarketSearch}
                    />
                    {marketSearch.trim().length > 0 && (
                      <TouchableOpacity onPress={() => setMarketSearch('')}>
                        <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.marketListBtn}
                    onPress={() => setListingOverlayVisible(true)}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.composerRow}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleShowProfile(true)}
                    style={styles.composerAvatar}
                  >
                    <Ionicons name="person" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.postComposer}>
                    <TextInput
                      style={styles.composerInput}
                      placeholder="Share your latest car update..."
                      placeholderTextColor="#ADADAD"
                      value={statusText}
                      onChangeText={setStatusText}
                      maxLength={280}
                    />
                    <TouchableOpacity style={styles.postButton} onPress={handleCreatePost} activeOpacity={0.8}>
                      <Text style={styles.postButtonText}>POST</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </Animated.View>

          {/* Expanded Post Overlay (styled like Mechanics details) */}
          {expandedPost && (
            <Animated.View style={styles.overlayContainer}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bgCreamy }]}>
                <View style={styles.overlayCardContainer}>
                  <View style={styles.expandedCard}>
                    {/* Close Button X */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.closeButton}
                      onPress={() => setExpandedPostId(null)}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Cover Image */}
                    <Image 
                      source={expandedPost.postImage || require('../../assets/modern_workshop_banner.png')} 
                      style={styles.expandedCover} 
                    />

                    {/* Price Tag Badge */}
                    <View style={styles.expandedPriceBadge}>
                      <Text style={styles.expandedPriceBadgeText}>{expandedPost.price || 'Ask Price'}</Text>
                    </View>

                    {/* Content Area */}
                    <View style={styles.expandedDetails}>
                      {/* Seller Info */}
                      <View style={styles.expandedSellerHeader}>
                        <View style={styles.avatarLarge}>
                          <Ionicons name="person" size={24} color="#FFFFFF" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.expandedSellerName}>{expandedPost.author}</Text>
                          <Text style={styles.expandedSellerHandle}>
                            {expandedPost.handle} • {expandedPost.time}
                            {expandedPost.location && ` • 📍 ${expandedPost.location}`}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text style={styles.expandedPostDescription}>
                        {expandedPost.content}
                      </Text>

                      {/* Bottom Section */}
                      <View style={styles.expandedBottomContainer}>
                        <View style={styles.cardDivider} />
                        
                        {/* Actions Row */}
                        <View style={styles.expandedActionsRow}>
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            style={styles.expandedActionButtonOutline}
                            onPress={() => handleLike(expandedPost.id)}
                          >
                            <Ionicons 
                              name={expandedPost.liked ? "heart" : "heart-outline"} 
                              size={20} 
                              color={expandedPost.liked ? COLORS.accentRed : COLORS.bgBrand} 
                            />
                            <Text style={[styles.actionButtonLabel, expandedPost.liked && { color: COLORS.accentRed }]}>
                              {expandedPost.liked ? 'Saved' : 'Save'} ({expandedPost.likes})
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            style={styles.expandedActionButtonSolid}
                            onPress={() => console.log('Message seller for ' + expandedPost.id)}
                          >
                            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                            <Text style={styles.actionButtonLabelSolid}>Message Seller</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Create Listing Overlay Modal */}
          <Modal
            visible={listingOverlayVisible}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={() => setListingOverlayVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={styles.listingModalOverlay}>
                {/* Backdrop blur covering background */}
                <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill}>
                  {/* Tapping backdrop closes the modal */}
                  <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    activeOpacity={1}
                    onPress={() => setListingOverlayVisible(false)}
                  />
                </BlurView>
                
                <View style={styles.listingOverlayCardContainer}>
                  <View style={styles.listingFormCard}>
                    {/* Header */}
                    <View style={styles.listingFormHeader}>
                      <Text style={styles.listingFormTitle}>List an Item</Text>
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setListingOverlayVisible(false)}
                        style={styles.formCloseButton}
                      >
                        <Ionicons name="close" size={22} color={COLORS.textDark} />
                      </TouchableOpacity>
                    </View>

                    {/* Scrollable Form */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
                      <Text style={styles.formLabel}>Item Title</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. BBS LM rims, exhaust system..."
                        placeholderTextColor="#ADADAD"
                        value={listingTitle}
                        onChangeText={setListingTitle}
                      />

                      <Text style={styles.formLabel}>Price</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. $1,200 or EGP 15,000"
                        placeholderTextColor="#ADADAD"
                        value={listingPrice}
                        onChangeText={setListingPrice}
                      />

                      <Text style={styles.formLabel}>Location</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. Heliopolis, Maadi"
                        placeholderTextColor="#ADADAD"
                        value={listingLocation}
                        onChangeText={setListingLocation}
                      />

                      <Text style={styles.formLabel}>Description</Text>
                      <TextInput
                        style={[styles.formInput, { height: 100, textAlignVertical: 'top', paddingVertical: 12 }]}
                        placeholder="Describe fitment, condition, age, defects, etc..."
                        placeholderTextColor="#ADADAD"
                        multiline={true}
                        numberOfLines={4}
                        value={listingDesc}
                        onChangeText={setListingDesc}
                      />

                      {/* Publish Button */}
                      <TouchableOpacity 
                        style={styles.publishBtn} 
                        activeOpacity={0.8}
                        onPress={handlePublishListing}
                      >
                        <Text style={styles.publishBtnText}>Publish Listing</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCreamy,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 175,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 4,
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.bgBrand,
    letterSpacing: 0.3,
  },
  headerTitleContainer: {
    marginTop: 4,
  },
  titleText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 22,
    color: COLORS.bgBrand,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  selectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(77, 110, 79, 0.05)',
    borderRadius: 10,
    padding: 2.5,
    marginTop: 8,
  },
  selectorTab: {
    flex: 1,
    paddingVertical: 5.5,
    alignItems: 'center',
    borderRadius: 7.5,
  },
  selectorTabSelected: {
    backgroundColor: COLORS.bgBrand,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  selectorTabUnselected: {
    backgroundColor: 'transparent',
  },
  selectorText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectorTextSelected: {
    color: '#FFFFFF',
  },
  selectorTextUnselected: {
    color: COLORS.textMuted,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  composerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  postComposer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.08)',
    paddingHorizontal: 10,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  composerInput: {
    flex: 1,
    height: '100%',
    color: COLORS.textDark,
    fontSize: 12.5,
    fontWeight: '500',
  },
  postButton: {
    backgroundColor: COLORS.bgBrand,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    marginLeft: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingTop: 255, // 80px app header + 175px collapsible header
    paddingHorizontal: 20,
    paddingBottom: 110, // snug above bottom navigation bar
  },
  profileSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.05)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryDetails: {
    marginLeft: 12,
  },
  profileSummaryName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  profileSummaryHandle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  carBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  carText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 110, 79, 0.04)',
    paddingTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.bgBrand,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(77, 110, 79, 0.08)',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.05)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
  },
  avatarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorDetails: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  authorHandle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  postText: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 12,
  },
  postCardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(77, 110, 79, 0.04)',
    marginBottom: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(77, 110, 79, 0.04)',
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.05)',
    padding: 28,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.bgBrand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceContainer: {
    backgroundColor: 'rgba(77, 110, 79, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: COLORS.bgBrand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  saleBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 8,
  },
  saleBadgeText: {
    color: '#B57A3D',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  contactSellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgBrand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  contactSellerText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },

  // Marketplace 2x2 Grid Styles (structured like Mechanics Screen)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  marketGridCard: {
    width: '48.2%', // leaves 3.6% gap space in between
    height: 240,    // fixed height to make all boxes identical
    backgroundColor: '#EFECE6',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(77, 110, 79, 0.08)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#4D6E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  marketGridCover: {
    width: '100%',
    height: 100,
  },
  marketGridDetails: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  marketGridAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  marketGridAuthor: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    flex: 1,
    marginRight: 4,
  },
  marketGridBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  marketGridBadgeText: {
    color: '#B57A3D',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  marketGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 16,
    marginBottom: 6,
  },
  marketGridLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketGridLocation: {
    fontSize: 10.5,
    color: 'rgba(77, 110, 79, 0.65)',
    fontWeight: '500',
  },
  marketGridDivider: {
    height: 1,
    backgroundColor: 'rgba(77, 110, 79, 0.08)',
    marginBottom: 8,
  },
  marketGridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketGridPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.bgBrand,
  },
  marketGridContactPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Marketplace Card Detailed Overlay (styled like Mechanics details overlay)
  overlayContainer: {
    position: 'absolute',
    top: 0, // start at top of screen container (below persistent header)
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  overlayCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedCard: {
    width: '100%',
    backgroundColor: '#EFECE6',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(77, 110, 79, 0.08)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 45, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedCover: {
    width: '100%',
    height: 160,
  },
  expandedPriceBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 45, 31, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    zIndex: 8,
  },
  expandedPriceBadgeText: {
    color: COLORS.bgCreamy,
    fontSize: 11,
    fontWeight: '800',
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  expandedSellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedSellerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  expandedSellerHandle: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  expandedPostDescription: {
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 19,
    marginBottom: 10,
    fontWeight: '500',
  },
  expandedBottomContainer: {
    marginTop: 8,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  expandedActionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.bgBrand,
    backgroundColor: 'transparent',
    gap: 6,
  },
  expandedActionButtonSolid: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.bgBrand,
    gap: 6,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Listing Form Overlay Styles
  marketBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    height: 44,
  },
  marketSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 110, 79, 0.08)',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 8,
  },
  marketSearchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.textDark,
    fontSize: 12.5,
    fontWeight: '500',
  },
  marketListBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgBrand,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    width: '100%',
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  listingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingOverlayCardContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  listingFormCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: COLORS.bgCreamy,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(77, 110, 79, 0.16)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  listingFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(77, 110, 79, 0.08)',
    paddingBottom: 14,
  },
  listingFormTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 24,
    color: COLORS.bgBrand,
  },
  formCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(77, 110, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScrollContent: {
    paddingBottom: 16,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.bgBrand,
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(77, 110, 79, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 18,
  },
  publishBtn: {
    backgroundColor: COLORS.bgBrand,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
