import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, Animated, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Dimensions, Alert, SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const mockMessages = [
  { id: 'msg1', user: 'Ahmed Yassin', lastMessage: 'Is the BMW part still available?', time: '10:42 AM', unread: 2, avatarType: 'icon' },
  { id: 'msg2', user: 'Khaled Omar', lastMessage: 'Thanks for the tip on the oil change.', time: 'Yesterday', unread: 0, avatarType: 'icon' },
  { id: 'msg3', user: 'Mohamed Salah', lastMessage: 'Can you recommend a good mechanic?', time: 'Mon', unread: 0, avatarType: 'icon' },
];

const initialPosts = [
  {
    id: 'm1',
    author: 'Samir Fahmy',
    handle: '@samir_f',
    avatar: require('../../assets/expert_samir.png'),
    avatarType: 'image',
    time: '1h ago',
    content: "Finally finished swapping the gearbox on my e46 track car. Took all weekend but she shifts like butter now! 🏎️⚙️ Can't wait for the track day at Autodrome.",
    postImage: null,
    likes: 24,
    comments: 3,
    liked: false,
    vehicle: 'BMW E46',
  },
  {
    id: 'm2',
    author: 'Sarah Jenkins',
    handle: '@sarah_j',
    avatar: require('../../assets/expert_sarah.png'),
    avatarType: 'image',
    time: '3h ago',
    content: "Just detailed this gorgeous classic Porsche 911 Carrera. Paint correction, ceramic coating, and deep interior cleaning. That guards red paint is absolutely popping! 🔴✨ #detailersofinstagram #porsche #911",
    postImage: require('../../assets/modern_workshop_banner.png'),
    likes: 56,
    comments: 9,
    liked: false,
    vehicle: 'Porsche 911',
  },
  {
    id: 'm3',
    author: 'Michael Chang',
    handle: '@michael_c',
    avatar: require('../../assets/expert_michael.png'),
    avatarType: 'image',
    time: '6h ago',
    content: "Quick oil change and spark plug replacement on my daily driver. Pro tip: always check spark plug gaps before installing them, even if they claim to be pre-gapped! 🔧🔌",
    postImage: null,
    likes: 12,
    comments: 1,
    liked: false,
    vehicle: 'Hyundai Coupe',
  },
  {
    id: 'm4',
    author: 'Sherif Aly',
    handle: '@sherif_a',
    avatar: require('../../assets/expert_sherif.png'),
    avatarType: 'image',
    time: '12h ago',
    content: "Had a blast at the local car meet last night! So many amazing builds and great conversations. The car community here is truly unmatched. 🤝🚗 #carmeet #petrolheads",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 38,
    comments: 5,
    liked: false,
    vehicle: 'General',
  },
  {
    id: 'm5',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Carbon fiber hood installed on a client's GR Yaris today. Not only does it look mean, but it saved 6.5 kg of weight off the front end! Weight reduction is the best modification. ⚖️🏁",
    postImage: null,
    likes: 47,
    comments: 8,
    liked: false,
    vehicle: 'Toyota GR Yaris',
  },
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
  },
  {
    id: '6',
    author: 'Sherif Aly',
    handle: '@sherif_a',
    avatar: require('../../assets/expert_sherif.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Mishimoto Performance Intercooler for Honda Civic Type R (FK8). Excellent condition, used for only 5,000 km. Fits 2017-2021 models. Selling because I upgraded to a full race setup. ❄️🚗",
    postImage: null,
    likes: 12,
    comments: 2,
    liked: false,
    vehicle: 'Honda Civic',
    isMarketplace: true,
    price: '$450',
    location: 'Heliopolis',
  },
  {
    id: '7',
    author: 'Samir Fahmy',
    handle: '@samir_f',
    avatar: require('../../assets/expert_samir.png'),
    avatarType: 'image',
    time: '2d ago',
    content: "Selling a set of 4 Michelin Pilot Sport 4S tires (245/40/R18). 95% tread depth remaining, no punctures or sidewall repairs. Manufactured late 2024. Excellent track/street performance! 🛞💥",
    postImage: null,
    likes: 19,
    comments: 4,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$600',
    location: 'Sheikh Zayed',
  },
  {
    id: '8',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '3d ago',
    content: "Garrett GTX3071R Gen II Dual Ball Bearing Turbocharger. Brand new, in original packaging. Perfect for 350-650hp custom builds. Comes with T25 inlet flange and V-Band outlet. 🐌🔥",
    postImage: null,
    likes: 31,
    comments: 5,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$1,600',
    location: 'Maadi',
  },
  {
    id: '9',
    author: 'Tariq Mansour',
    handle: '@tariq',
    avatar: require('../../assets/expert_tariq.png'),
    avatarType: 'image',
    time: '3d ago',
    content: "Original carbon fiber trunk spoiler for BMW M3 (F80). Gloss finish, perfect weave, zero scratches. Easy double-sided tape install. Adds subtle aggression! 🏁💎",
    postImage: null,
    likes: 14,
    comments: 0,
    liked: false,
    vehicle: 'BMW M3',
    isMarketplace: true,
    price: '$350',
    location: 'New Cairo',
  },
  {
    id: '10',
    author: 'Kareem El-Sayed',
    handle: '@kareem',
    avatar: require('../../assets/expert_kareem.png'),
    avatarType: 'image',
    time: '4d ago',
    content: "Recaro Pole Position fiberglass bucket seat in black velour. FIA approved until 2028. Minimal wear on bolster, shell is pristine. Side mounts included! 💺✊",
    postImage: null,
    likes: 22,
    comments: 3,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$700',
    location: 'Sheikh Zayed',
  }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CommunityScreen({ currentUser, scrollToTopTrigger, selectedLanguage }) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const COLORS = colors; // Keep JSX compatibility with dynamic themes
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24));
  const isRtl = selectedLanguage === 'Arabic';
  const [feedPosts, setFeedPosts] = useState(initialPosts);
  const [statusText, setStatusText] = useState('');
  const [selectedFeed, setSelectedFeed] = useState('active'); // 'overall', 'active', 'marketplace'
  const [showProfile, setShowProfile] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  
  const [showListingPage, setShowListingPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);
  const [listingImageUri, setListingImageUri] = useState(null);
  const [listingTitle, setListingTitle] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingLocation, setListingLocation] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [marketSearch, setMarketSearch] = useState('');

  // Facebook post composer states
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollToTopTrigger > 0) {
      if (scrollViewRef.current) {
        if (typeof scrollViewRef.current.scrollTo === 'function') {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
          scrollViewRef.current.getNode().scrollTo({ y: 0, animated: true });
        }
      }
    }
  }, [scrollToTopTrigger]);

  useEffect(() => {
    if (scrollViewRef.current) {
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: 0, animated: false });
      }
    }
  }, [selectedFeed]);

  // In profile mode: header collapses on scroll by translating the whole header.
  // In feed mode: the collapsible header container stays static, and its children animate/compress.
  const headerTranslateY = showProfile
    ? scrollY.interpolate({
        inputRange: [0, 55],
        outputRange: [0, -55],
        extrapolate: 'clamp',
      })
    : new Animated.Value(0);

  const headerOpacity = showProfile
    ? scrollY.interpolate({
        inputRange: [0, 35],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : new Animated.Value(1);

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const shouldBeSticky = value > 22;
      if (shouldBeSticky !== isSticky) {
        setIsSticky(shouldBeSticky);
      }
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [isSticky]);

  // Child Translations and Opacities for Feed Mode
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });

  // Keep subtitle/title opacity connected to scroll
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const selectorTranslateY = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });

  const originalSelectorOpacity = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const stickyBarOpacity = scrollY.interpolate({
    inputRange: [5, 25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Composer Section translation and fade out
  const composerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const composerOpacity = scrollY.interpolate({
    inputRange: [0, 70],
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

  const pickPostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isRtl ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
        isRtl ? 'نحتاج إلى إذن للوصول إلى الصور لإرفاقها بالمنشور.' : 'We need permission to access your gallery to attach photos.'
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = () => {
    if (!statusText.trim() && !selectedImage) return;
    const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
    const currentHandle = currentUser ? `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '')}` : '@guest';
    const currentVehicle = currentUser && currentUser.carBrand ? `${currentUser.carBrand} ${currentUser.carModel}` : 'Hyundai Coupe';

    const newPost = {
      id: Date.now().toString(),
      author: currentAuthorName,
      handle: currentHandle,
      avatarType: 'icon',
      time: 'Just now',
      content: statusText.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      postImage: selectedImage,
      vehicle: currentVehicle,
      isMarketplace: selectedFeed === 'marketplace',
      price: selectedFeed === 'marketplace' ? 'Ask Price' : null,
      location: selectedFeed === 'marketplace' ? 'Cairo' : null,
    };
    setFeedPosts([newPost, ...feedPosts]);
    setStatusText('');
    setSelectedImage(null);
    setCreatePostModalVisible(false);
  };

  const handlePublishListing = () => {
    if (!listingTitle.trim() || !listingPrice.trim()) return;
    const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
    const currentHandle = currentUser ? `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '')}` : '@guest';
    const currentVehicle = currentUser && currentUser.carBrand ? `${currentUser.carBrand} ${currentUser.carModel}` : 'Hyundai Coupe';

    const newPost = {
      id: Date.now().toString(),
      author: currentAuthorName,
      handle: currentHandle,
      avatarType: 'icon',
      time: 'Just now',
      content: `${listingTitle.trim()}\n\n${listingDesc.trim()}`,
      likes: 0,
      comments: 0,
      liked: false,
      postImage: listingImageUri ? { uri: listingImageUri } : null,
      vehicle: currentVehicle,
      isMarketplace: true,
      price: listingPrice.trim(),
      location: listingLocation.trim() || 'Cairo',
    };
    setFeedPosts([newPost, ...feedPosts]);
    setListingTitle('');
    setListingPrice('');
    setListingLocation('');
    setListingDesc('');
    setListingImageUri(null);
    setShowListingPage(false);
  };

  const handlePickListingImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library to upload a product image.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setListingImageUri(result.assets[0].uri);
    }
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
  // Filter posts based on view state
  const filteredPosts = feedPosts.filter((post) => {
    if (showProfile) {
      return post.author === 'Guest User';
    }
    if (selectedFeed === 'messages') {
      return false;
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
  const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
  const myPosts = feedPosts.filter(p => p.author === currentAuthorName);
  const myPostsCount = myPosts.length;
  const myTotalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const expandedPost = feedPosts.find((p) => p.id === expandedPostId);

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 20)
    lines.push(
      <View
        key="top-solid-block"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 20, // Shifted up
          backgroundColor: COLORS.bgCreamy,
          zIndex: 3,
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 20 to y = 30
    const numLines = 20;
    const startY = 20; // Shifted up
    const endY = 30; // Shifted up
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
              { paddingTop: showProfile ? topInset + 55 : topInset + 175 }
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
                    <Text style={styles.profileSummaryName}>{currentAuthorName}</Text>
                    <Text style={styles.profileSummaryHandle}>
                      @{currentAuthorName.toLowerCase().replace(/\s+/g, '')}
                    </Text>
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
                top: topInset + 6,
                height: showProfile ? 55 : 180,
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
              <View style={{ position: 'relative' }} pointerEvents="box-none">
                {/* Original Header Content */}
                <Animated.View
                  style={{
                    opacity: originalSelectorOpacity,
                    transform: [{ translateY: titleTranslateY }],
                    width: '100%',
                  }}
                  pointerEvents={isSticky ? 'none' : 'auto'}
                >
                  {/* Feed Segmented Selector & Messages */}
                  <View style={styles.topHeaderRow}>
                    <View style={styles.selectorRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { setSelectedFeed('active'); setExpandedPostId(null); setMarketSearch(''); }}
                        style={[styles.selectorTab, selectedFeed === 'active' && styles.selectorTabActive]}
                      >
                        <Ionicons 
                          name={selectedFeed === 'active' ? 'car' : 'car-outline'} 
                          size={15} 
                          color={selectedFeed === 'active' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                          style={{ marginBottom: 3 }}
                        />
                        <Text style={[
                          styles.selectorText,
                          selectedFeed === 'active' ? styles.selectorTextSelected : styles.selectorTextUnselected
                        ]}>
                          My Car
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { setSelectedFeed('overall'); setExpandedPostId(null); setMarketSearch(''); }}
                        style={[styles.selectorTab, selectedFeed === 'overall' && styles.selectorTabActive]}
                      >
                        <Ionicons 
                          name={selectedFeed === 'overall' ? 'chatbubbles' : 'chatbubbles-outline'} 
                          size={15} 
                          color={selectedFeed === 'overall' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                          style={{ marginBottom: 3 }}
                        />
                        <Text style={[
                          styles.selectorText,
                          selectedFeed === 'overall' ? styles.selectorTextSelected : styles.selectorTextUnselected
                        ]}>
                          Feed
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { setSelectedFeed('marketplace'); setExpandedPostId(null); setMarketSearch(''); }}
                        style={[styles.selectorTab, selectedFeed === 'marketplace' && styles.selectorTabActive]}
                      >
                        <Ionicons 
                          name={selectedFeed === 'marketplace' ? 'pricetag' : 'pricetag-outline'} 
                          size={15} 
                          color={selectedFeed === 'marketplace' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                          style={{ marginBottom: 3 }}
                        />
                        <Text style={[
                          styles.selectorText,
                          selectedFeed === 'marketplace' ? styles.selectorTextSelected : styles.selectorTextUnselected
                        ]}>
                          Souq
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Messages Icon */}
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => setShowMessagesPage(true)}
                      style={styles.messagesHeaderIcon}
                    >
                      <Ionicons name="chatbox-ellipses-outline" size={22} color={COLORS.bgBrand} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Sticky Header Content */}
                <Animated.View
                  style={[
                    styles.stickyBar,
                    {
                      top: -(topInset + 6),
                      height: topInset + 50,
                      opacity: stickyBarOpacity,
                    }
                  ]}
                  pointerEvents={isSticky ? 'auto' : 'none'}
                >
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleShowProfile(true)}
                    style={styles.stickyProfileAvatar}
                  >
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.stickyTabsGroup}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => { setSelectedFeed('active'); setExpandedPostId(null); setMarketSearch(''); }}
                      style={[
                        styles.stickyTab,
                        selectedFeed === 'active' ? styles.stickyTabSelected : styles.stickyTabUnselected
                      ]}
                    >
                      <Ionicons 
                        name="car-outline" 
                        size={15} 
                        color={selectedFeed === 'active' ? '#FFFFFF' : COLORS.bgBrand} 
                      />
                    </TouchableOpacity>

                    <View style={styles.stickyDivider} />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => { setSelectedFeed('overall'); setExpandedPostId(null); setMarketSearch(''); }}
                      style={[
                        styles.stickyTab,
                        selectedFeed === 'overall' ? styles.stickyTabSelected : styles.stickyTabUnselected
                      ]}
                    >
                      <Ionicons 
                        name="chatbubbles-outline" 
                        size={15} 
                        color={selectedFeed === 'overall' ? '#FFFFFF' : COLORS.bgBrand} 
                      />
                    </TouchableOpacity>

                    <View style={styles.stickyDivider} />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => { setSelectedFeed('marketplace'); setExpandedPostId(null); setMarketSearch(''); }}
                      style={[
                        styles.stickyTab,
                        selectedFeed === 'marketplace' ? styles.stickyTabSelected : styles.stickyTabUnselected
                      ]}
                    >
                      <Ionicons 
                        name="pricetag-outline" 
                        size={15} 
                        color={selectedFeed === 'marketplace' ? '#FFFFFF' : COLORS.bgBrand} 
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            )}

            {/* Premium Post Composition Box / List Item Trigger */}
            {!showProfile && (
              <Animated.View style={{
                opacity: composerOpacity,
                transform: [{ translateY: composerTranslateY }],
                width: '100%',
              }}>
                {selectedFeed === 'marketplace' ? (
                  <View style={styles.marketControlsContainer}>
                    <View style={styles.marketSearchEntity}>
                      <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
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
                      style={styles.marketListEntityBtn}
                      onPress={() => setShowListingPage(true)}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.marketListEntityText}>LIST A NEW ITEM</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    <View style={styles.composerContainer}>
                      <View style={[styles.composerRow, isRtl && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => handleShowProfile(true)}
                          style={styles.composerAvatar}
                        >
                          <Ionicons name="person" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.postComposer}>

                          {/* Top Part: Input Area wrapped in Touchable to open Modal */}
                          <View style={[styles.composerTopRow, { position: 'relative' }]}>
                            <TextInput
                              style={[styles.composerInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                              placeholder={isRtl ? "شارك تحديث سيارتك الجديد..." : "Share your latest car update..."}
                              placeholderTextColor="#ADADAD"
                              value=""
                              editable={false}
                              multiline={true}
                            />
                            <TouchableOpacity 
                              activeOpacity={0.9}
                              onPress={() => setCreatePostModalVisible(true)}
                              style={StyleSheet.absoluteFill}
                            />
                          </View>
                          
                          {/* Bottom Part: Media attachments & POST button */}
                          <View style={[styles.composerBottomRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            {/* Attachment Icons */}
                            <View style={[styles.composerIconsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="videocam-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => {
                                  setCreatePostModalVisible(true);
                                  pickPostImage();
                                }}
                              >
                                <Ionicons name="image-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="link-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="location-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                            </View>

                            {/* Post Action */}
                            <TouchableOpacity 
                              style={styles.postButton} 
                              onPress={() => setCreatePostModalVisible(true)} 
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.postButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                                {isRtl ? 'نشر' : 'POST'}
                              </Text>
                            </TouchableOpacity>
                          </View>


                        </View>
                      </View>
                    </View>

                    {/* Facebook-style Create Post Modal */}
                    <Modal
                      visible={createPostModalVisible}
                      animationType="slide"
                      transparent={false}
                      onRequestClose={() => {
                        setCreatePostModalVisible(false);
                        setSelectedImage(null);
                        setStatusText('');
                      }}
                    >
                      <SafeAreaView style={[styles.fbModalContainer, { backgroundColor: COLORS.white }]}>
                        <KeyboardAvoidingView
                          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                          style={{ flex: 1 }}
                        >
                          {/* Header */}
                          <View style={[styles.fbModalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                              onPress={() => {
                                setCreatePostModalVisible(false);
                                setSelectedImage(null);
                                setStatusText('');
                              }}
                              style={styles.fbModalCloseBtn}
                            >
                              <Ionicons name="close" size={24} color={COLORS.bgBrand} />
                            </TouchableOpacity>
                            <Text style={[styles.fbModalTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                              {isRtl ? 'إنشاء منشور' : 'Create Post'}
                            </Text>
                            <TouchableOpacity
                              onPress={handleCreatePost}
                              disabled={!statusText.trim() && !selectedImage}
                              style={[
                                styles.fbModalPostBtn,
                                (!statusText.trim() && !selectedImage) && { backgroundColor: '#E0E0E0' }
                              ]}
                            >
                              <Text style={[
                                styles.fbModalPostBtnText,
                                (!statusText.trim() && !selectedImage) && { color: '#ADADAD' },
                                isRtl && { fontFamily: 'AlkhalilArabic-Bold' }
                              ]}>
                                {isRtl ? 'نشر' : 'Post'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* User Profile Info */}
                          <View style={[styles.fbModalUserInfoRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <View style={styles.fbComposerAvatarLarge}>
                              <Ionicons name="person" size={24} color="#FFFFFF" />
                            </View>
                            <View style={[styles.fbModalUserMeta, isRtl ? { alignItems: 'flex-end', marginRight: 12 } : { alignItems: 'flex-start', marginLeft: 12 }]}>
                              <Text style={[styles.fbModalUserName, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                                {currentUser ? currentUser.fullName : (isRtl ? 'مستخدم زائر' : 'Guest User')}
                              </Text>
                              <View style={[styles.fbModalPrivacyBadge, isRtl && { flexDirection: 'row-reverse' }]}>
                                <Ionicons name="globe-outline" size={11} color={COLORS.textMuted} />
                                <Text style={[styles.fbModalPrivacyText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', marginLeft: 0, marginRight: 4 }]}>
                                  {isRtl ? 'عام' : 'Public'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Input Box */}
                          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
                            <TextInput
                              style={[
                                styles.fbModalInput,
                                isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 17 }
                              ]}
                              placeholder={isRtl ? 'ماذا يدور في ذهنك؟' : "What's on your mind?"}
                              placeholderTextColor="#ADADAD"
                              value={statusText}
                              onChangeText={setStatusText}
                              multiline={true}
                              autoFocus={true}
                            />

                            {/* Preview Attached Image */}
                            {selectedImage && (
                              <View style={styles.fbImagePreviewContainer}>
                                <Image source={{ uri: selectedImage }} style={styles.fbImagePreview} />
                                <TouchableOpacity
                                  onPress={() => setSelectedImage(null)}
                                  style={styles.fbImagePreviewRemove}
                                >
                                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </ScrollView>

                          {/* Bottom Actions Row */}
                          <View style={[styles.fbModalBottomBar, isRtl && { flexDirection: 'row-reverse' }]}>
                            <Text style={[styles.fbAddPostText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                              {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
                            </Text>
                            <View style={[styles.fbModalToolbarIcons, isRtl && { flexDirection: 'row-reverse' }]}>
                              <TouchableOpacity
                                onPress={pickPostImage}
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="image" size={24} color="#4CAF50" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert(isRtl ? 'الموقع' : 'Location', isRtl ? 'ميزة تحديد الموقع ستتوفر قريباً!' : 'Location tagging coming soon!')}
                              >
                                <Ionicons name="location" size={24} color="#FF5722" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert(isRtl ? 'إشارة' : 'Tag', isRtl ? 'ميزة الإشارة إلى الأصدقاء ستتوفر قريباً!' : 'Friend tagging coming soon!')}
                              >
                                <Ionicons name="person-add" size={24} color="#1877F2" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </KeyboardAvoidingView>
                      </SafeAreaView>
                    </Modal>
                  </View>
                )}
              </Animated.View>
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
          <Modal
            visible={showListingPage}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={() => setShowListingPage(false)}
          >
            <View style={[styles.newPageContainer, { backgroundColor: COLORS.bgCreamy }]}>
              <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
              <View style={styles.newPageHeader}>
                <TouchableOpacity 
                  style={styles.newPageBackButton} 
                  onPress={() => setShowListingPage(false)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.bgBrand} style={{ marginRight: 2 }} />
                  <Text style={styles.newPageBackButtonText}>Souq</Text>
                </TouchableOpacity>
                <Text style={styles.newPageHeaderTitle}>List an Item</Text>
                <View style={{ width: 110 }} />
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.newPageFormContent}
                >
                  <View style={styles.newPageFormCard}>
                    <Text style={styles.newPageLabel}>Item Title</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. BBS LM rims, exhaust system..."
                      placeholderTextColor="#ADADAD"
                      value={listingTitle}
                      onChangeText={setListingTitle}
                    />

                    <Text style={styles.newPageLabel}>Price</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. $1,200 or EGP 15,000"
                      placeholderTextColor="#ADADAD"
                      value={listingPrice}
                      onChangeText={setListingPrice}
                    />

                    <Text style={styles.newPageLabel}>Location</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. Heliopolis, Maadi"
                      placeholderTextColor="#ADADAD"
                      value={listingLocation}
                      onChangeText={setListingLocation}
                    />

                    <Text style={styles.newPageLabel}>Item Image</Text>
                    <TouchableOpacity 
                      style={styles.imagePickerBtn}
                      onPress={handlePickListingImage}
                      activeOpacity={0.8}
                    >
                      {listingImageUri ? (
                        <View style={{ position: 'relative', width: '100%', height: 180, borderRadius: 10, overflow: 'hidden' }}>
                          <Image source={{ uri: listingImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          <TouchableOpacity 
                            style={styles.removeImagePill}
                            onPress={() => setListingImageUri(null)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.imagePickerPlaceholder}>
                          <Ionicons name="camera-outline" size={28} color={COLORS.bgBrand} />
                          <Text style={styles.imagePickerPlaceholderText}>Upload Product Image</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.newPageLabel}>Description</Text>
                    <TextInput
                      style={[styles.newPageInput, { height: 120, textAlignVertical: 'top', paddingVertical: 12 }]}
                      placeholder="Describe fitment, condition, age, defects, etc..."
                      placeholderTextColor="#ADADAD"
                      multiline={true}
                      numberOfLines={5}
                      value={listingDesc}
                      onChangeText={setListingDesc}
                    />

                    <TouchableOpacity 
                      style={styles.newPagePublishBtn} 
                      activeOpacity={0.8}
                      onPress={handlePublishListing}
                    >
                      <Text style={styles.newPagePublishBtnText}>Publish Listing</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          {/* Messages Page Modal */}
          <Modal
            visible={showMessagesPage}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={() => setShowMessagesPage(false)}
          >
            <View style={[styles.newPageContainer, { backgroundColor: COLORS.bgCreamy }]}>
              <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
              <View style={styles.newPageHeader}>
                <TouchableOpacity 
                  style={styles.newPageBackButton} 
                  onPress={() => setShowMessagesPage(false)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.bgBrand} style={{ marginRight: 2 }} />
                  <Text style={styles.newPageBackButtonText}>Community</Text>
                </TouchableOpacity>
                <Text style={styles.newPageHeaderTitle}>Inbox</Text>
                <View style={{ width: 100 }} />
              </View>

              <ScrollView style={{ flex: 1, padding: 20 }}>
                {mockMessages.map(msg => (
                  <TouchableOpacity key={msg.id} style={styles.messageRow} activeOpacity={0.8}>
                    <View style={styles.messageAvatar}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.messageContent}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageUser}>{msg.user}</Text>
                        <Text style={styles.messageTime}>{msg.time}</Text>
                      </View>
                      <Text style={[styles.messageSnippet, msg.unread > 0 && styles.messageSnippetUnread]} numberOfLines={1}>{msg.lastMessage}</Text>
                    </View>
                    {msg.unread > 0 && (
                      <View style={styles.messageBadge}>
                        <Text style={styles.messageBadgeText}>{msg.unread}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
  },
  collapsibleHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 245,
    backgroundColor: 'transparent',
    zIndex: 4,
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 20,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.bgBrand,
    letterSpacing: 0.3,
  },
  headerTitleContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
  },
  titleText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 2,
    zIndex: 5,
  },
  selectorRow: {
    flex: 1,
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    height: 48,
    position: 'relative',
    marginRight: 10,
  },
  messagesHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#1E2D1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderRadius: 12,
  },
  selectorTab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectorText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  selectorTextSelected: {
    color: colors.bgBrand,
  },
  selectorTextUnselected: {
    color: colors.textMuted,
  },
  composerContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    width: '100%',
  },
  composerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 6,
  },
  postComposer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 88,
    justifyContent: 'space-between',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  composerTopRow: {
    flex: 1,
    width: '100%',
  },
  composerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1.2,
    borderTopColor: colors.borderGreen,
    paddingTop: 6,
  },
  composerInput: {
    width: '100%',
    height: '100%',
    color: colors.textDark,
    fontSize: 12.5,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.bgBrand,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  composerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  composerIconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 187,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  profileSummaryCard: {
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
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
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryDetails: {
    marginLeft: 12,
  },
  profileSummaryName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textDark,
  },
  profileSummaryHandle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  carBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  carText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    paddingTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderGreen,
  },
  postCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
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
    backgroundColor: colors.bgBrandLight,
  },
  avatarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorDetails: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  authorHandle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  postText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 12,
  },
  postCardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.bgBrandLight,
    marginBottom: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
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
    color: colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  messagesListContainer: {
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    padding: 16,
    marginBottom: 12,
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 15,
    fontFamily: 'AlkhalilArabic-Bold',
    color: colors.textDark,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  messageSnippet: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  messageSnippetUnread: {
    color: colors.textDark,
    fontWeight: '600',
  },
  messageBadge: {
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    padding: 28,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: colors.bgBrand,
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
    backgroundColor: colors.bgBrandLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: colors.bgBrand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  saleBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: colors.gold,
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
    backgroundColor: colors.bgBrand,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  marketGridCard: {
    width: '48.2%',
    height: 240,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
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
    color: colors.textMuted,
    flex: 1,
    marginRight: 4,
  },
  marketGridBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: colors.gold,
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
    color: colors.textDark,
    lineHeight: 16,
    marginBottom: 6,
  },
  marketGridLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketGridLocation: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  marketGridDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
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
    color: colors.bgBrand,
  },
  marketGridContactPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
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
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
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
    color: colors.bgCreamy,
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
    color: colors.textDark,
  },
  expandedSellerHandle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  expandedPostDescription: {
    fontSize: 13,
    color: colors.textDark,
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
    borderColor: colors.bgBrand,
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
    backgroundColor: colors.bgBrand,
    gap: 6,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  marketControlsContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    width: '100%',
    gap: 10,
  },
  marketSearchEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 12,
    height: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  marketSearchInput: {
    flex: 1,
    height: '100%',
    color: colors.textDark,
    fontSize: 12.5,
    fontWeight: '500',
  },
  marketListEntityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  marketListEntityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    width: '100%',
    shadowColor: colors.bgBrand,
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
  newPageContainer: {
    flex: 1,
  },
  newPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.bgCreamy,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  newPageBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  newPageBackButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  newPageHeaderTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 24,
    color: colors.bgBrand,
    textAlign: 'center',
  },
  newPageFormContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  newPageFormCard: {
    backgroundColor: colors.bgCreamy,
    borderColor: colors.borderGreen,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  newPageLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.bgBrand,
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  newPageInput: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13.5,
    color: colors.textDark,
  },
  newPagePublishBtn: {
    backgroundColor: colors.bgBrand,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  newPagePublishBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imagePickerBtn: {
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 180,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: 4,
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerPlaceholderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  removeImagePill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(181, 77, 79, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: colors.bgCreamy,
    zIndex: 10,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  stickyProfileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    backgroundColor: colors.bgBrandLight,
  },
  stickyTab: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTabSelected: {
    backgroundColor: colors.bgBrand,
  },
  stickyTabUnselected: {
    backgroundColor: 'transparent',
  },
  stickyDivider: {
    width: 1.2,
    height: '100%',
    backgroundColor: colors.borderGreen,
  },
  fbComposerContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  fbComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fbComposerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbFakeInput: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fbFakeInputText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  fbPhotoIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  fbModalContainer: {
    flex: 1,
  },
  fbModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
  },
  fbModalCloseBtn: {
    padding: 4,
  },
  fbModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalPostBtn: {
    backgroundColor: colors.bgBrand,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  fbModalPostBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  fbModalUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fbComposerAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbModalUserMeta: {
    marginLeft: 12,
  },
  fbModalUserName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalPrivacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 3,
    borderWidth: 0.5,
    borderColor: colors.borderGreen,
  },
  fbModalPrivacyText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 4,
  },
  fbModalInput: {
    fontSize: 16.5,
    fontWeight: '500',
    color: colors.bgBrand,
    lineHeight: 24,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  fbImagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  fbImagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  fbImagePreviewRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 1,
  },
  fbModalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    backgroundColor: colors.bgBrandLight,
  },
  fbAddPostText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalToolbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fbToolbarIconButton: {
    padding: 6,
    marginLeft: 12,
  },
});
