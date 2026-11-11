import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { supabase } from '../services/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChatRecipientPickerModal({
  visible,
  onClose,
  specialist,
  currentUser,
  selectedLanguage,
  onSelectRecipient,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isRtl = selectedLanguage === 'Arabic';

  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const translateYAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardLiftAnim = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  // Smooth keyboard tracking using native driver
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardLiftAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardLiftAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardLiftAnim]);

  // Entrance & exit sheet animation
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setSearchQuery('');
      Animated.spring(translateYAnim, {
        toValue: 0,
        damping: 26,
        stiffness: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateYAnim]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Keyboard.dismiss();
    Animated.timing(translateYAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose && onClose();
      isClosingRef.current = false;
    });
  };

  // Fetch actual existing conversations ordered by latest message
  useEffect(() => {
    if (!visible || !currentUser?.id) return;
    let isMounted = true;

    const fetchUserConversations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
          .order('last_message_at', { ascending: false });

        if (error || !data) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const mapped = data.map((c) => {
          const isP1 = c.participant_1 === currentUser.id;
          const otherUserId = isP1 ? c.participant_2 : c.participant_1;
          const otherName = isP1 ? (c.participant_2_name || 'User') : (c.participant_1_name || 'User');
          const otherAvatar = isP1 ? c.participant_2_avatar : c.participant_1_avatar;
          const cleanName = (otherName || '').trim();
          const username = `@${cleanName.toLowerCase().replace(/\s+/g, '')}`;

          return {
            id: c.id,
            otherUserId,
            name: cleanName,
            username: username,
            avatar: otherAvatar && typeof otherAvatar === 'string' && otherAvatar.startsWith('http') ? otherAvatar : null,
            lastMessageAt: c.last_message_at ? new Date(c.last_message_at).getTime() : 0,
          };
        });

        // Deduplicate conversations: avoid duplicate users, keep the most recent conversation
        const seen = new Set();
        const deduplicated = [];
        for (const conv of mapped) {
          if (!conv.otherUserId || seen.has(conv.otherUserId)) continue;
          seen.add(conv.otherUserId);
          deduplicated.push(conv);
        }

        if (isMounted) {
          setConversations(deduplicated);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserConversations();

    return () => {
      isMounted = false;
    };
  }, [visible, currentUser?.id]);

  // Search ONLY users already having a conversation with, matching name or username
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const username = (c.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [conversations, searchQuery]);

  const specialistName = specialist
    ? (isRtl ? (specialist.nameAr || specialist.name) : specialist.name) || ''
    : '';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Softly dimmed blurred backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.45)' }]} />
        </TouchableOpacity>

        {/* Upward Expanded Animated Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [
                {
                  translateY: Animated.add(
                    translateYAnim,
                    Animated.multiply(keyboardLiftAnim, -1)
                  ),
                },
              ],
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sheet Header */}
          <View style={[styles.headerRow, isRtl && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.headerTitles, isRtl && { alignItems: 'flex-end' }]}>
              <Text style={[styles.sheetTitle, isRtl && styles.sheetTitleRtl]}>
                {isRtl ? 'إرسال في رسالة' : 'Share in message'}
              </Text>
              {specialistName ? (
                <Text
                  style={[styles.sheetSubtitle, isRtl && styles.sheetSubtitleRtl]}
                  numberOfLines={1}
                >
                  {isRtl ? `مشاركة: ${specialistName}` : `Sharing: ${specialistName}`}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={isDarkMode ? '#CAD8CE' : '#5E6E62'} />
            </TouchableOpacity>
          </View>

          {/* 1. Search Bar at the Top: "Search conversations" */}
          <View style={styles.searchBoxWrapper}>
            <View style={[styles.searchBox, isRtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons
                name="search"
                size={18}
                color={isDarkMode ? '#8E9C92' : '#7F9484'}
                style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, isRtl && styles.searchInputRtl]}
                placeholder={isRtl ? 'البحث في المحادثات' : 'Search conversations'}
                placeholderTextColor={isDarkMode ? '#76857A' : '#8A9E8D'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color={isDarkMode ? '#8E9C92' : '#8A9E8D'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 2. "Recent conversations" Heading */}
          <View style={[styles.sectionHeaderRow, isRtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.sectionTitle, isRtl && styles.sectionTitleRtl]}>
              {searchQuery.trim().length > 0
                ? (isRtl ? 'نتائج البحث' : 'Matching conversations')
                : (isRtl ? 'المحادثات الأخيرة' : 'Recent conversations')}
            </Text>
          </View>

          {/* 3. Horizontally Scrollable Row of Circular Profile Pictures with Centered Names */}
          <ScrollView
            style={styles.resultsScrollArea}
            contentContainerStyle={styles.resultsScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={isDarkMode ? '#4ADE80' : '#003514'} />
              </View>
            ) : filteredConversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={38}
                  color={isDarkMode ? '#526956' : '#94A396'}
                />
                <Text style={[styles.emptyText, isRtl && styles.emptyTextRtl]}>
                  {searchQuery.trim().length > 0
                    ? (isRtl ? 'لم يتم العثور على محادثات' : 'No conversations found')
                    : (isRtl ? 'لا توجد محادثات سابقة' : 'No recent conversations')}
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.horizontalAvatarRow,
                  isRtl && { flexDirection: 'row-reverse' },
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {filteredConversations.map((chat) => (
                  <TouchableOpacity
                    key={`conv_${chat.id}`}
                    style={styles.avatarItemContainer}
                    activeOpacity={0.75}
                    onPress={() => {
                      handleClose();
                      onSelectRecipient && onSelectRecipient({
                        type: 'conversation',
                        conversationId: chat.id,
                        otherUserId: chat.otherUserId,
                        name: chat.name,
                        avatar: chat.avatar,
                      });
                    }}
                  >
                    {/* Circular Profile Picture */}
                    <View style={styles.avatarCircleWrapper}>
                      {chat.avatar ? (
                        <Image source={{ uri: chat.avatar }} style={styles.avatarCircle} />
                      ) : (
                        <View style={[styles.avatarCircle, styles.noImagePlaceholder]}>
                          <Ionicons
                            name="image-outline"
                            size={22}
                            color={isDarkMode ? '#526956' : '#94A396'}
                          />
                        </View>
                      )}
                    </View>

                    {/* Centered Name Underneath */}
                    <Text
                      style={[styles.avatarNameText, isRtl && styles.avatarNameTextRtl]}
                      numberOfLines={1}
                    >
                      {chat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      width: '100%',
      minHeight: 380,
      maxHeight: SCREEN_HEIGHT * 0.88,
      backgroundColor: isDarkMode ? '#172019' : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2EBE3',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 20,
      overflow: 'hidden',
    },
    dragHandleContainer: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 8,
    },
    dragHandle: {
      width: 42,
      height: 4.5,
      borderRadius: 2.5,
      backgroundColor: isDarkMode ? '#3A4D3E' : '#D1DDD3',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingBottom: 14,
    },
    headerTitles: {
      flex: 1,
      paddingRight: 10,
    },
    sheetTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: isDarkMode ? '#4ADE80' : '#003514',
      letterSpacing: -0.2,
      fontFamily: 'PlusJakartaSans-Bold',
    },
    sheetTitleRtl: {
      fontFamily: 'IBMPlexSansArabic-Bold',
      fontSize: 18,
    },
    sheetSubtitle: {
      fontSize: 12.5,
      color: isDarkMode ? '#9CAAA0' : '#6A7D6E',
      marginTop: 2,
      fontFamily: 'PlusJakartaSans-Medium',
    },
    sheetSubtitleRtl: {
      fontFamily: 'IBMPlexSansArabic-Medium',
      fontSize: 12,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#243427' : '#EFF4F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBoxWrapper: {
      paddingHorizontal: 22,
      marginBottom: 16,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E2B20' : '#F1F5F2',
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 46,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E0E8E1',
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? '#FFFFFF' : '#102213',
      fontFamily: 'PlusJakartaSans-Regular',
    },
    searchInputRtl: {
      fontFamily: 'IBMPlexSansArabic-Regular',
      textAlign: 'right',
      fontSize: 13.5,
    },
    sectionHeaderRow: {
      paddingHorizontal: 22,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11.5,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: isDarkMode ? '#8E9C92' : '#6A7D6E',
      textTransform: 'uppercase',
      fontFamily: 'PlusJakartaSans-Bold',
    },
    sectionTitleRtl: {
      fontFamily: 'IBMPlexSansArabic-Bold',
      fontSize: 11.5,
      textAlign: 'right',
    },
    resultsScrollArea: {
      flex: 1,
    },
    resultsScrollContent: {
      paddingBottom: 16,
    },
    horizontalAvatarRow: {
      paddingHorizontal: 22,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatarItemContainer: {
      alignItems: 'center',
      width: 72,
      marginRight: 14,
    },
    avatarCircleWrapper: {
      width: 58,
      height: 58,
      borderRadius: 29,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    avatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      borderColor: isDarkMode ? 'rgba(74, 222, 128, 0.25)' : '#E2EBE3',
      backgroundColor: isDarkMode ? '#223425' : '#E8EFEA',
    },
    noImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarNameText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#D4E2D7' : '#142E18',
      textAlign: 'center',
      width: 70,
      marginTop: 7,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    avatarNameTextRtl: {
      fontFamily: 'IBMPlexSansArabic-Bold',
      fontSize: 11.5,
    },
    loadingContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingVertical: 36,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 13,
      color: isDarkMode ? '#8E9C92' : '#738678',
      marginTop: 10,
      fontFamily: 'PlusJakartaSans-Regular',
      textAlign: 'center',
    },
    emptyTextRtl: {
      fontFamily: 'IBMPlexSansArabic-Regular',
      fontSize: 13,
    },
  });
