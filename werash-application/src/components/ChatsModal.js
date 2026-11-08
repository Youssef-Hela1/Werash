import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, ScrollView, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Alert, Animated,
  Dimensions, PanResponder, ActivityIndicator, Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createAudioPlayer, 
  useAudioRecorder, 
  RecordingPresets, 
  requestRecordingPermissionsAsync, 
  setAudioModeAsync 
} from 'expo-audio';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { supabase } from '../services/supabase';
import ImageViewerModal from './ImageViewerModal';
import ChatImageGrid from './ChatImageGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WAVEFORM_HEIGHTS = [6, 12, 18, 12, 8, 16, 20, 14, 10, 18, 22, 16, 10, 16, 12, 6];

const parseDurationSeconds = (str) => {
  if (!str) return 10;
  const parts = String(str).split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Math.max(1, mins * 60 + secs);
  }
  const parsed = parseInt(str, 10);
  return isNaN(parsed) || parsed <= 0 ? 10 : parsed;
};

const formatSecondsToTime = (totalSecs) => {
  const secs = Math.max(1, Math.round(totalSecs || 0));
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
};

const sanitizeDuration = (dur) => {
  if (!dur) return '0:03';
  const str = String(dur).trim();
  const pureMatch = str.match(/^(\d{1,2}:\d{2})$/);
  if (pureMatch) {
    return (pureMatch[1] === '0:00' || pureMatch[1] === '00:00') ? '0:03' : pureMatch[1];
  }
  const parenMatch = str.match(/\((\d{1,2}:\d{2})\)/);
  if (parenMatch) {
    return (parenMatch[1] === '0:00' || parenMatch[1] === '00:00') ? '0:03' : parenMatch[1];
  }
  const anyMatch = str.match(/(\d{1,2}:\d{2})/);
  if (anyMatch) {
    return (anyMatch[1] === '0:00' || anyMatch[1] === '00:00') ? '0:03' : anyMatch[1];
  }
  const numSecs = parseInt(str, 10);
  if (!isNaN(numSecs) && numSecs > 0) {
    return formatSecondsToTime(numSecs);
  }
  return '0:03';
};

const extractDuration = (text, fallback) => {
  if (text) {
    const parenthesized = String(text).match(/\((\d+:\d+)\)/);
    if (parenthesized && parenthesized[1]) {
      const sanitized = sanitizeDuration(parenthesized[1]);
      if (sanitized) return sanitized;
    }
    const pureDuration = String(text).trim().match(/^(\d+:\d+)$/);
    if (pureDuration && pureDuration[1]) {
      const sanitized = sanitizeDuration(pureDuration[1]);
      if (sanitized) return sanitized;
    }
    const anyDuration = String(text).match(/(\d+:\d+)/);
    if (anyDuration && anyDuration[1]) {
      const sanitized = sanitizeDuration(anyDuration[1]);
      if (sanitized) return sanitized;
    }
  }
  return sanitizeDuration(fallback) || '0:03';
};

const cleanLastMessageText = (txt, isRtl) => {
  if (!txt) return isRtl ? 'لا توجد رسائل بعد' : 'No messages yet';
  const str = String(txt).trim();
  const lower = str.toLowerCase();
  if (
    lower.includes('voice message') ||
    str.includes('تسجيل صوتي') ||
    str.includes('رسالة صوتية')
  ) {
    return isRtl ? '🎙️ رسالة صوتية' : '🎙️ Voice message';
  }
  return str;
};

const getAvatarSource = (avatar) => {
  if (!avatar) return require('../../assets/expert_samir.png');
  if (typeof avatar === 'string') return { uri: avatar };
  if (avatar && avatar.uri) return avatar;
  return avatar;
};

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

export default function ChatsModal({
  visible,
  onClose,
  selectedLanguage,
  currentUser,
  initialUser,
  onOpenProfile,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : 24);
  const isRTL = selectedLanguage === 'Arabic';

  const [activeUser, setActiveUser] = useState(currentUser || null);
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageText, setNewMessageText] = useState('');

  // Real-time user presence tracking
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [viewingProfileUser, setViewingProfileUser] = useState(null);
  const [profilePreviewImage, setProfilePreviewImage] = useState(null);

  // Real audio recording and playback via expo-audio
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const activePlayerRef = useRef(null);
  const activePlayerMsgIdRef = useRef(null);

  const stopCurrentPlayer = () => {
    if (activePlayerRef.current) {
      try {
        activePlayerRef.current.pause();
        activePlayerRef.current.remove?.();
      } catch (_) {}
      activePlayerRef.current = null;
      activePlayerMsgIdRef.current = null;
    }
  };

  // Menus and simulation states
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  
  // Voice playback states
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});
  const [audioDurations, setAudioDurations] = useState({});

  // Message selection & deletion states
  const [selectedMessages, setSelectedMessages] = useState({});
  const selectedCount = Object.keys(selectedMessages).length;
  const isSelectionMode = selectedCount > 0;

  const [deletedForMeIds, setDeletedForMeIds] = useState(new Set());
  const deletedForMeIdsRef = useRef(new Set());
  deletedForMeIdsRef.current = deletedForMeIds;

  const loadPersistedDeletedIds = async () => {
    try {
      const keys = ['@werash_deleted_messages_all'];
      if (activeUser?.id) {
        keys.push(`@werash_deleted_messages_${activeUser.id}`);
      }
      const values = await AsyncStorage.multiGet(keys);
      const combined = new Set(deletedForMeIdsRef.current);
      values.forEach(([_, val]) => {
        if (val) {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              arr.forEach((id) => combined.add(id));
            }
          } catch (_) {}
        }
      });
      deletedForMeIdsRef.current = combined;
      setDeletedForMeIds(combined);
      return combined;
    } catch (_) {
      return deletedForMeIdsRef.current;
    }
  };

  useEffect(() => {
    loadPersistedDeletedIds();
  }, [activeUser?.id]);

  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;
  const isRecordingLockedRef = useRef(false);
  isRecordingLockedRef.current = isRecordingLocked;
  const pressStartTimeRef = useRef(0);
  const hasPermissionRef = useRef(false);
  const voiceDragY = useRef(new Animated.Value(0)).current;
  const voiceDragX = useRef(new Animated.Value(0)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const isRTLRef = useRef(isRTL);
  isRTLRef.current = isRTL;
  const handleSendVoiceRef = useRef(null);
  const cancelVoiceRecordingRef = useRef(null);
  const startVoiceRecordingRef = useRef(null);

  // Pre-request recording permissions on mount for instant mic readiness
  useEffect(() => {
    requestRecordingPermissionsAsync().then(({ granted }) => {
      hasPermissionRef.current = Boolean(granted);
    }).catch(() => {});
  }, []);

  // 60fps Native Waveform Animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [isRecording, waveAnim]);

  const scrollViewRef = useRef(null);
  const recordingInterval = useRef(null);
  const recordStartTimeRef = useRef(0);
  const voicePlayIntervals = useRef({});
  const waveformPressTimer = useRef(null);
  const trackWidthsRef = useRef({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup voice playback and recording on unmount
  useEffect(() => {
    return () => {
      stopCurrentPlayer();
      if (waveformPressTimer.current) clearTimeout(waveformPressTimer.current);
      Object.values(voicePlayIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      try {
        if (recorder?.isRecording) {
          recorder.stop().catch(() => {});
        }
      } catch (_) {}
    };
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId);
  const otherUserId = activeChat?.otherUserId;
  const isOtherUserOnline = Boolean(
    (otherUserId && onlineUsers.has(otherUserId)) ||
    (onlineUsers.size === 0 && Boolean(activeChat?.isOnline))
  );

  // 1. Global User Presence Channel
  useEffect(() => {
    if (!visible || !activeUser?.id) return;

    const presenceChannel = supabase.channel('global_user_presence', {
      config: {
        presence: { key: activeUser.id },
      },
    });

    const updatePresenceState = () => {
      const state = presenceChannel.presenceState();
      const onlineSet = new Set();
      Object.keys(state).forEach((key) => {
        onlineSet.add(key);
        const list = state[key] || [];
        list.forEach((item) => {
          if (item?.user_id) onlineSet.add(item.user_id);
        });
      });
      setOnlineUsers(onlineSet);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await presenceChannel.track({
              user_id: activeUser.id,
              online_at: new Date().toISOString(),
            });
          } catch (_) {}
        }
      });

    return () => {
      try {
        presenceChannel.untrack?.();
        supabase.removeChannel(presenceChannel);
      } catch (_) {}
    };
  }, [visible, activeUser?.id]);

  // 2. Active Chat Room Presence Channel
  useEffect(() => {
    if (!visible || !activeChatId || !activeUser?.id) return;

    const chatChannel = supabase.channel(`chat_room_presence_${activeChatId}`, {
      config: {
        presence: { key: activeUser.id },
      },
    });

    const updateChatPresence = () => {
      const state = chatChannel.presenceState();
      setOnlineUsers(prev => {
        const next = new Set(prev);
        Object.keys(state).forEach((k) => {
          next.add(k);
          const list = state[k] || [];
          list.forEach(item => {
            if (item?.user_id) next.add(item.user_id);
          });
        });
        return next;
      });
    };

    chatChannel
      .on('presence', { event: 'sync' }, updateChatPresence)
      .on('presence', { event: 'join' }, updateChatPresence)
      .on('presence', { event: 'leave' }, updateChatPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await chatChannel.track({
              user_id: activeUser.id,
              chat_id: activeChatId,
              online_at: new Date().toISOString(),
            });
          } catch (_) {}
        }
      });

    return () => {
      try {
        chatChannel.untrack?.();
        supabase.removeChannel(chatChannel);
      } catch (_) {}
    };
  }, [visible, activeChatId, activeUser?.id]);

  const handleOpenUserProfileFromHeader = async () => {
    if (!activeChat) return;
    const targetUserId = activeChat.otherUserId;
    const targetName = isRTL ? (activeChat.nameAr || activeChat.name) : (activeChat.name || activeChat.nameAr);

    if (typeof onOpenProfile === 'function') {
      onOpenProfile({
        id: targetUserId || activeChat.id,
        userId: targetUserId,
        author: targetName,
        fullName: targetName,
        name: targetName,
        avatar: activeChat.avatar,
      });
      return;
    }

    const initialData = {
      id: targetUserId || activeChat.id,
      userId: targetUserId,
      author: targetName,
      fullName: targetName,
      name: targetName,
      handle: `@${String(targetName || 'user').toLowerCase().replace(/[\s\W]+/g, '')}`,
      avatar: activeChat.avatar,
      banner: null,
      vehicle: null,
      posts: [],
      likesCount: 0,
      isOnline: isOtherUserOnline,
    };

    setViewingProfileUser(initialData);

    if (targetUserId) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (prof) {
          const resolvedAv = prof.avatar_url ? { uri: prof.avatar_url } : activeChat.avatar;
          const resolvedVeh = prof.vehicle || (prof.car_brand ? `${prof.car_brand || ''} ${prof.car_model || ''}`.trim() : null);
          setViewingProfileUser(prev => prev ? {
            ...prev,
            avatar: resolvedAv,
            banner: prof.banner_url || null,
            vehicle: resolvedVeh,
            fullName: prof.full_name || prev.fullName,
            author: prof.full_name || prev.author,
          } : null);
        }

        const { data: userPosts } = await supabase
          .from('community_posts')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (userPosts) {
          const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0);
          setViewingProfileUser(prev => prev ? {
            ...prev,
            posts: userPosts,
            likesCount: totalLikes,
          } : null);
        }
      } catch (err) {
        console.warn('Error fetching profile details for header:', err);
      }
    }
  };

  // Sync activeUser
  useEffect(() => {
    if (currentUser?.id) {
      setActiveUser(currentUser);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setActiveUser(user);
        }
      }).catch(() => {});
    }
  }, [currentUser]);

  // Fetch all user conversations from Supabase
  const fetchConversations = async () => {
    if (!activeUser?.id) return;
    try {
      setIsLoadingChats(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${activeUser.id},participant_2.eq.${activeUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.warn('Error fetching cloud conversations:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map((c) => {
          const isP1 = c.participant_1 === activeUser.id;
          const otherUserId = isP1 ? c.participant_2 : c.participant_1;
          const otherName = isP1 ? (c.participant_2_name || 'User') : (c.participant_1_name || 'User');
          const otherAvatar = isP1 ? c.participant_2_avatar : c.participant_1_avatar;
          const resolvedAvatar = getAvatarSource(otherAvatar);

          const lastTime = formatTimeAgo(c.last_message_at, false);
          const lastTimeAr = formatTimeAgo(c.last_message_at, true);
          const isUnread = Boolean(c.last_sender_id && c.last_sender_id !== activeUser.id);

          return {
            id: c.id,
            otherUserId,
            name: otherName,
            nameAr: otherName,
            avatar: resolvedAvatar,
            unread: isUnread,
            lastTime,
            lastTimeAr,
            lastMessageText: cleanLastMessageText(c.last_message_text, isRTL),
            messages: [],
          };
        });

        setChats(prev => {
          return mapped.map(newC => {
            const existing = prev.find(p => p.id === newC.id);
            return {
              ...newC,
              messages: existing?.messages?.length ? existing.messages : [],
            };
          });
        });
      } else {
        setChats([]);
      }
    } catch (err) {
      console.warn('fetchConversations error:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessagesForConversation = async (convId) => {
    if (!convId) return;
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching direct_messages from cloud:', error.message);
        return;
      }

      const deletedIds = await loadPersistedDeletedIds();

      const formatted = (data || [])
        .filter((m) => {
          if (deletedIds.has(m.id)) return false;
          // Filter out any empty/corrupted voice recording placeholder that has no audio file
          const rawText = String(m.text || '').toLowerCase().trim();
          if (rawText.includes('voice message') || rawText.includes('تسجيل صوتي') || rawText.includes('رسالة صوتية')) {
            if (!m.media_url && m.media_type !== 'audio') return false;
          }
          return true;
        })
        .map((m) => {
          const isUser = activeUser?.id ? m.sender_id === activeUser.id : m.sender === 'user';
          const textLower = String(m.text || '').toLowerCase();
          const isAudio = m.media_type === 'audio' 
            || Boolean(m.voice_duration)
            || (m.media_url && (m.media_url.includes('/voice/') || m.media_url.endsWith('.m4a') || m.media_url.endsWith('.wav') || m.media_url.endsWith('.mp3')))
            || textLower.includes('voice message')
            || textLower.includes('تسجيل صوتي')
            || textLower.includes('رسالة صوتية');
          
          let audioDuration = null;
          if (isAudio) {
            audioDuration = extractDuration(m.text, m.voice_duration);
          }

          let msgImages = null;
          const isMediaImage = m.media_type === 'images' || m.media_type === 'image'
            || (m.media_url && !isAudio && (
              (typeof m.media_url === 'string' && m.media_url.trim().startsWith('[')) ||
              m.media_url.includes('community-media') ||
              m.media_url.includes('.jpg') ||
              m.media_url.includes('.jpeg') ||
              m.media_url.includes('.png') ||
              m.media_url.includes('.webp')
            ));

          if (isMediaImage && m.media_url) {
            if (typeof m.media_url === 'string' && m.media_url.trim().startsWith('[') && m.media_url.trim().endsWith(']')) {
              try {
                const parsed = JSON.parse(m.media_url);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  msgImages = parsed;
                }
              } catch (_) {}
            }
            if (!msgImages) {
              msgImages = [m.media_url];
            }
          }

          return {
            id: m.id,
            sender: isUser ? 'user' : 'contact',
            text: isAudio ? '' : (m.text || ''),
            textAr: isAudio ? '' : (m.text || ''),
            image: msgImages ? msgImages[0] : null,
            images: msgImages,
            voiceDuration: audioDuration,
            audioUri: isAudio ? m.media_url : null,
            time: formatTimeAgo(m.created_at, isRTL),
            created_at: m.created_at,
          };
        });

      setChats(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            unread: false,
            messages: formatted,
          };
        }
        return c;
      }));
    } catch (err) {
      console.warn('fetchMessagesForConversation error:', err);
    }
  };

  // Realtime subscription for conversations list
  useEffect(() => {
    if (!visible || !activeUser?.id) return;
    fetchConversations();

    const convChannel = supabase
      .channel(`conversations_realtime_${activeUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [visible, activeUser?.id]);

  // Realtime subscription for active conversation messages
  useEffect(() => {
    if (!activeChatId || !activeUser?.id) return;

    fetchMessagesForConversation(activeChatId);

    const dmChannel = supabase
      .channel(`dm_realtime_${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeChatId}`,
        },
        (payload) => {
          if (payload?.new) {
            const m = payload.new;
            if (deletedForMeIdsRef.current.has(m.id)) return;
            const rawText = String(m.text || '').toLowerCase().trim();
            if (rawText.includes('voice message') || rawText.includes('تسجيل صوتي') || rawText.includes('رسالة صوتية')) {
              if (!m.media_url && m.media_type !== 'audio') return;
            }

            const isUser = m.sender_id === activeUser.id;
            const textLower = String(m.text || '').toLowerCase();
            const isAudio = m.media_type === 'audio'
              || Boolean(m.voice_duration)
              || (m.media_url && (m.media_url.includes('/voice/') || m.media_url.endsWith('.m4a') || m.media_url.endsWith('.wav') || m.media_url.endsWith('.mp3')))
              || textLower.includes('voice message')
              || textLower.includes('تسجيل صوتي')
              || textLower.includes('رسالة صوتية');
            
            let audioDuration = null;
            if (isAudio) {
              audioDuration = extractDuration(m.text, m.voice_duration);
            }

            let msgImages = null;
            const isMediaImage = m.media_type === 'images' || m.media_type === 'image'
              || (m.media_url && !isAudio && (
                (typeof m.media_url === 'string' && m.media_url.trim().startsWith('[')) ||
                m.media_url.includes('community-media') ||
                m.media_url.includes('.jpg') ||
                m.media_url.includes('.jpeg') ||
                m.media_url.includes('.png') ||
                m.media_url.includes('.webp')
              ));

            if (isMediaImage && m.media_url) {
              if (typeof m.media_url === 'string' && m.media_url.trim().startsWith('[') && m.media_url.trim().endsWith(']')) {
                try {
                  const parsed = JSON.parse(m.media_url);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    msgImages = parsed;
                  }
                } catch (_) {}
              }
              if (!msgImages) {
                msgImages = [m.media_url];
              }
            }

            const newMsg = {
              id: m.id,
              sender: isUser ? 'user' : 'contact',
              text: isAudio ? '' : (m.text || ''),
              textAr: isAudio ? '' : (m.text || ''),
              image: msgImages ? msgImages[0] : null,
              images: msgImages,
              voiceDuration: audioDuration,
              audioUri: isAudio ? m.media_url : null,
              time: formatTimeAgo(m.created_at, isRTL),
              created_at: m.created_at,
            };

            setChats(prev => prev.map(c => {
              if (c.id === activeChatId) {
                if (c.messages.some(existing => existing.id === m.id)) {
                  return c;
                }
                return {
                  ...c,
                  messages: [...c.messages, newMsg],
                };
              }
              return c;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeChatId}`,
        },
        (payload) => {
          if (payload?.old?.id) {
            const deletedId = payload.old.id;
            setChats(prev => prev.map(c => {
              if (c.id === activeChatId) {
                return {
                  ...c,
                  messages: (c.messages || []).filter(existing => existing.id !== deletedId),
                };
              }
              return c;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
    };
  }, [activeChatId, activeUser?.id, isRTL]);

  // Handle initial user passed from user profile page
  useEffect(() => {
    if (visible && initialUser && activeUser?.id) {
      handleOpenOrStartChatWithUser(initialUser);
    }
  }, [visible, initialUser, activeUser?.id]);

  const handleOpenOrStartChatWithUser = async (targetUser) => {
    if (!targetUser || !activeUser?.id) return;
    const theirId = targetUser.userId || targetUser.user_id || targetUser.id;
    if (!theirId || theirId === activeUser.id) return;

    const existingInState = chats.find(c => c.otherUserId === theirId);
    if (existingInState) {
      setActiveChatId(existingInState.id);
      fetchMessagesForConversation(existingInState.id);
      return;
    }

    try {
      const myId = activeUser.id;
      const [p1, p2] = [myId, theirId].sort();
      const isP1 = myId === p1;

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .maybeSingle();

      let conv = existingConv;
      if (!conv) {
        const myName = activeUser.fullName || activeUser.name || 'User';
        const myHandle = `@${myName.toLowerCase().replace(/[\s\W]+/g, '')}`;
        const myAvatar = activeUser.avatarUrl || activeUser.avatar || null;

        const theirName = targetUser.author || targetUser.fullName || targetUser.name || 'User';
        const theirHandle = targetUser.handle || `@${theirName.toLowerCase().replace(/[\s\W]+/g, '')}`;
        const theirAvatar = typeof targetUser.avatar === 'string' ? targetUser.avatar : (targetUser.avatar?.uri || null);

        const newRow = {
          participant_1: p1,
          participant_2: p2,
          participant_1_name: isP1 ? myName : theirName,
          participant_1_handle: isP1 ? myHandle : theirHandle,
          participant_1_avatar: isP1 ? myAvatar : theirAvatar,
          participant_2_name: isP1 ? theirName : myName,
          participant_2_handle: isP1 ? theirHandle : myHandle,
          participant_2_avatar: isP1 ? theirAvatar : myAvatar,
          last_message_text: '',
          last_message_at: new Date().toISOString(),
          last_sender_id: myId,
        };

        const { data: createdConv, error: createErr } = await supabase
          .from('conversations')
          .insert([newRow])
          .select()
          .single();

        if (!createErr && createdConv) {
          conv = createdConv;
        }
      }

      if (conv) {
        await fetchConversations();
        setActiveChatId(conv.id);
        fetchMessagesForConversation(conv.id);
      }
    } catch (err) {
      console.warn('handleOpenOrStartChatWithUser error:', err);
    }
  };

  // Pulse animation for recording mic icon
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Record timer handler
  useEffect(() => {
    if (isRecording) {
      setRecordTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  // Clean up voice note intervals on unmount
  useEffect(() => {
    const currentIntervals = voicePlayIntervals.current;
    return () => {
      Object.values(currentIntervals).forEach(interval => clearInterval(interval));
    };
  }, []);

  // Auto scroll to bottom when messages list opens or updates
  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [activeChatId, activeChat?.messages?.length]);

  const formatRecordTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleOpenConversation = (id) => {
    stopCurrentPlayer();
    setSelectedMessages({});
    setActiveChatId(id);
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
    if (activeUser?.id) {
      fetchMessagesForConversation(id);
    }
  };

  const handleToggleSelectMessage = (msg) => {
    if (!msg || !msg.id) return;
    setSelectedMessages((prev) => {
      const next = { ...prev };
      if (next[msg.id]) {
        delete next[msg.id];
      } else {
        next[msg.id] = msg;
      }
      return next;
    });
  };

  const handleLongPressMessage = (msg) => {
    if (!msg || !msg.id) return;
    handleToggleSelectMessage(msg);
  };

  const handleDeleteSelectedMessages = async () => {
    const messagesToDelete = Object.values(selectedMessages);
    if (messagesToDelete.length === 0 || !activeChatId) return;

    const targetChat = chats.find(c => c.id === activeChatId);

    // Clear selection mode immediately
    setSelectedMessages({});

    // Stop audio playback if any deleted message is playing
    if (playingVoiceId && messagesToDelete.some(m => m.id === playingVoiceId)) {
      stopCurrentPlayer();
      setPlayingVoiceId(null);
    }

    const deleteIdsSet = new Set(messagesToDelete.map(m => m.id));

    // Optimistically remove all selected messages from active chat in state
    let newLastText = '';
    let newLastTime = '';
    let newLastAt = new Date().toISOString();
    let newLastSenderId = null;

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        const currentList = c.messages || [];
        const updatedList = currentList.filter(m => !deleteIdsSet.has(m.id));

        const lastMsg = updatedList.length > 0 ? updatedList[updatedList.length - 1] : null;
        if (lastMsg) {
          const hasImages = (lastMsg?.images && lastMsg.images.length > 0) || Boolean(lastMsg?.image);
          newLastText = (lastMsg.voiceDuration || lastMsg.audioUri) 
            ? (isRTL ? '🎙️ رسالة صوتية' : '🎙️ Voice message') 
            : (hasImages
                ? (lastMsg?.images && lastMsg.images.length > 1
                    ? (isRTL ? `📷 ${lastMsg.images.length} صور` : `📷 ${lastMsg.images.length} Photos`)
                    : (isRTL ? '📷 صورة' : '📷 Photo')) 
                : cleanLastMessageText(lastMsg.text, isRTL));
          newLastTime = lastMsg.time || 'Just now';
          newLastAt = lastMsg.created_at || new Date().toISOString();
          newLastSenderId = lastMsg.sender === 'user' ? activeUser?.id : targetChat?.otherUserId;
        }

        return {
          ...c,
          messages: updatedList,
          lastMessageText: newLastText,
          lastTime: newLastTime,
          lastTimeAr: isRTL ? 'الآن' : 'Just now',
        };
      }
      return c;
    }));

    // Partition IDs: Sent by ME vs Sent by the OTHER USER
    const myMessageIds = messagesToDelete
      .filter(m => m.sender === 'user')
      .map(m => m.id);

    const allDeletedIds = messagesToDelete.map(m => m.id);

    // Persist deleted message IDs locally (so deleted messages never reappear on reload)
    try {
      const updatedSet = new Set(deletedForMeIdsRef.current);
      allDeletedIds.forEach(id => updatedSet.add(id));
      setDeletedForMeIds(updatedSet);
      deletedForMeIdsRef.current = updatedSet;

      const serialized = JSON.stringify(Array.from(updatedSet));
      await AsyncStorage.setItem('@werash_deleted_messages_all', serialized);
      if (activeUser?.id) {
        await AsyncStorage.setItem(`@werash_deleted_messages_${activeUser.id}`, serialized);
      }
    } catch (err) {
      console.warn('handleDeleteSelectedMessages persistence error:', err);
    }

    // 1. Messages sent by ME -> Delete from Supabase for everyone
    if (myMessageIds.length > 0) {
      try {
        const { error: delError } = await supabase
          .from('direct_messages')
          .delete()
          .in('id', myMessageIds);

        if (delError) {
          console.warn('Error deleting my messages from Supabase:', delError.message);
        }
      } catch (err) {
        console.warn('handleDeleteSelectedMessages cloud delete error:', err);
      }
    }

    // 2. Update conversation's last message in Supabase
    if (activeChatId) {
      try {
        await supabase
          .from('conversations')
          .update({
            last_message_text: newLastText,
            last_message_at: newLastAt,
            last_sender_id: newLastSenderId,
          })
          .eq('id', activeChatId);
      } catch (convErr) {
        console.warn('Error updating conversation after message deletion:', convErr);
      }
    }
  };

  const handleSendMessage = async () => {
    if (selectedImages.length > 0) {
      handleSendImages(selectedImages, newMessageText);
      return;
    }

    if (!newMessageText.trim() || !activeChatId) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    const targetChat = chats.find(c => c.id === activeChatId);
    const tempId = `m_${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'user',
      text: text,
      textAr: text,
      time: isRTL ? 'الآن' : 'Just now',
      created_at: new Date().toISOString(),
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastTime: 'Just now',
          lastTimeAr: 'الآن',
          messages: [...(c.messages || []), newMsg]
        };
      }
      return c;
    }));

    if (activeUser?.id && targetChat?.otherUserId) {
      try {
        const { data: insertedMsg } = await supabase
          .from('direct_messages')
          .insert([{
            conversation_id: activeChatId,
            sender_id: activeUser.id,
            receiver_id: targetChat.otherUserId,
            text: text,
            media_type: 'text'
          }])
          .select()
          .single();

        if (insertedMsg) {
          setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
              return {
                ...c,
                messages: (c.messages || []).map(m => m.id === tempId ? { ...m, id: insertedMsg.id } : m)
              };
            }
            return c;
          }));
        }

        await supabase
          .from('conversations')
          .update({
            last_message_text: text,
            last_message_at: new Date().toISOString(),
            last_sender_id: activeUser.id,
          })
          .eq('id', activeChatId);
      } catch (err) {
        console.warn('handleSendMessage cloud error:', err);
      }
    }
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRTL ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
          isRTL 
            ? 'نحتاج إلى إذن للوصول إلى معرض الصور الخاص بك لإرسال الصور.' 
            : 'We need permission to access your gallery to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri).filter(Boolean);
        setSelectedImages(prev => [...prev, ...uris]);
      }
    } catch (err) {
      console.warn('handlePickImages error:', err);
    }
  };

  const handleSendImages = async (imagesToSend, captionText = '') => {
    if (!imagesToSend || imagesToSend.length === 0 || !activeChatId) return;
    const targetChat = chats.find(c => c.id === activeChatId);
    const tempId = `m_${Date.now()}`;
    const count = imagesToSend.length;
    const caption = captionText ? captionText.trim() : '';

    const newMsg = {
      id: tempId,
      sender: 'user',
      text: caption,
      textAr: caption,
      images: [...imagesToSend],
      image: imagesToSend[0],
      time: isRTL ? 'الآن' : 'Just now',
      created_at: new Date().toISOString(),
      uploading: true,
      uploadProgress: 0,
      uploadError: false,
    };

    // Reset composer state immediately
    setSelectedImages([]);
    setNewMessageText('');

    const snippet = count > 1 
      ? (isRTL ? `📷 ${count} صور` : `📷 ${count} Photos`)
      : (isRTL ? '📷 صورة' : '📷 Photo');

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessageText: snippet,
          lastTime: 'Just now',
          lastTimeAr: 'الآن',
          messages: [...(c.messages || []), newMsg],
        };
      }
      return c;
    }));

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    performUpload(tempId, imagesToSend, caption, targetChat?.otherUserId);
  };

  const performUpload = async (msgId, imagesToUpload, caption, otherUserId) => {
    if (!activeUser?.id || !activeChatId) return;

    // Ensure recipient ID is resolved
    let targetRecipientId = otherUserId;
    if (!targetRecipientId) {
      const targetChat = chats.find(c => c.id === activeChatId);
      targetRecipientId = targetChat?.otherUserId;
    }
    if (!targetRecipientId) {
      try {
        const { data: convData } = await supabase
          .from('conversations')
          .select('participant_1, participant_2')
          .eq('id', activeChatId)
          .maybeSingle();
        if (convData) {
          targetRecipientId = convData.participant_1 === activeUser.id ? convData.participant_2 : convData.participant_1;
        }
      } catch (_) {}
    }

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: (c.messages || []).map(m => m.id === msgId ? { ...m, uploading: true, uploadError: false, uploadProgress: 5 } : m)
        };
      }
      return c;
    }));

    try {
      const uploadedUrls = [];
      for (let i = 0; i < imagesToUpload.length; i++) {
        const localUri = imagesToUpload[i];
        if (typeof localUri === 'string' && (localUri.startsWith('http://') || localUri.startsWith('https://'))) {
          uploadedUrls.push(localUri);
          continue;
        }

        const response = await fetch(localUri);
        const blob = await response.blob();
        const ext = (typeof localUri === 'string' ? localUri.split('.').pop()?.split('?')[0]?.toLowerCase() : null) || 'jpg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `${activeUser.id}/chat_${activeChatId}_${Date.now()}_${i}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('community-media')
          .upload(fileName, blob, {
            contentType,
            upsert: true,
          });

        if (uploadErr) {
          console.warn('Storage upload error for image:', uploadErr.message);
          throw uploadErr;
        }

        const { data: publicData } = supabase.storage
          .from('community-media')
          .getPublicUrl(fileName);

        const publicUrl = publicData?.publicUrl || localUri;
        uploadedUrls.push(publicUrl);

        const progress = Math.round(((i + 1) / imagesToUpload.length) * 100);
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: (c.messages || []).map(m => m.id === msgId ? { ...m, uploadProgress: progress } : m)
            };
          }
          return c;
        }));
      }

      const mediaUrlPayload = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls);

      const { data: insertedMsg, error: insertErr } = await supabase
        .from('direct_messages')
        .insert([{
          conversation_id: activeChatId,
          sender_id: activeUser.id,
          receiver_id: targetRecipientId || null,
          text: caption || null,
          media_url: mediaUrlPayload,
          media_type: 'image',
        }])
        .select()
        .single();

      if (insertErr) {
        console.warn('direct_messages insert error:', insertErr.message);
        throw insertErr;
      }

      if (insertedMsg) {
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: (c.messages || []).map(m => m.id === msgId ? {
                ...m,
                id: insertedMsg.id,
                images: uploadedUrls,
                image: uploadedUrls[0],
                uploading: false,
                uploadProgress: 100,
                uploadError: false,
              } : m)
            };
          }
          return c;
        }));
      }

      const count = uploadedUrls.length;
      const snippet = count > 1 
        ? (isRTL ? `📷 ${count} صور` : `📷 ${count} Photos`)
        : (isRTL ? '📷 صورة' : '📷 Photo');

      await supabase
        .from('conversations')
        .update({
          last_message_text: snippet,
          last_message_at: new Date().toISOString(),
          last_sender_id: activeUser.id,
        })
        .eq('id', activeChatId);

    } catch (err) {
      console.warn('performUpload error:', err);
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: (c.messages || []).map(m => m.id === msgId ? {
              ...m,
              uploading: false,
              uploadError: true,
            } : m)
          };
        }
        return c;
      }));
    }
  };

  const startVoiceRecording = async () => {
    try { Keyboard.dismiss(); } catch (_) {}
    setAttachmentMenuVisible(false);
    recordStartTimeRef.current = Date.now();
    try {
      if (!hasPermissionRef.current) {
        const { granted } = await requestRecordingPermissionsAsync();
        hasPermissionRef.current = Boolean(granted);
        if (!granted) {
          Alert.alert(
            isRTL ? 'مطلوب إذن الميكروفون' : 'Microphone Permission Required',
            isRTL ? 'يرجى تفعيل إذن الميكروفون لتسجيل وإرسال الرسائل الصوتية.' : 'Please allow microphone access to record and send voice messages.'
          );
          isRecordingRef.current = false;
          setIsRecording(false);
          return;
        }
      }
      setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      }).catch(() => {});
      await recorder.prepareToRecordAsync();
      recordStartTimeRef.current = Date.now();
      recorder.record();
    } catch (err) {
      console.warn('startVoiceRecording error:', err);
    }
  };

  const cancelVoiceRecording = async () => {
    isRecordingRef.current = false;
    isRecordingLockedRef.current = false;
    setIsRecording(false);
    setIsRecordingLocked(false);
    setRecordTime(0);
    recordStartTimeRef.current = 0;
    voiceDragY.setValue(0);
    Animated.spring(voiceDragX, { toValue: 0, friction: 6, useNativeDriver: true }).start();
    Animated.spring(micScaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    try {
      if (recorder?.isRecording) {
        await recorder.stop();
      }
    } catch (_) {}
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  };

  const handleSendVoice = async () => {
    const elapsedMs = recordStartTimeRef.current > 0 ? (Date.now() - recordStartTimeRef.current) : (recordTime * 1000);
    const durationSec = Math.max(1, Math.round(elapsedMs / 1000));
    const durationStr = sanitizeDuration(formatRecordTime(durationSec)) || '0:03';

    isRecordingRef.current = false;
    isRecordingLockedRef.current = false;
    setIsRecording(false);
    setIsRecordingLocked(false);
    setRecordTime(0);
    recordStartTimeRef.current = 0;
    voiceDragY.setValue(0);
    voiceDragX.setValue(0);
    Animated.spring(micScaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();

    let recordedUri = null;
    try {
      if (recorder?.isRecording) {
        await recorder.stop();
        recordedUri = recorder.uri;
      }
    } catch (err) {
      console.warn('recorder.stop error:', err);
    }

    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

    const targetChat = chats.find(c => c.id === activeChatId);
    const tempId = `m_${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'user',
      audioUri: recordedUri,
      voiceDuration: durationStr,
      time: isRTL ? 'الآن' : 'Just now',
      created_at: new Date().toISOString(),
    };

    setAudioDurations(prev => ({ ...prev, [tempId]: durationStr }));

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastTime: 'Just now',
          lastTimeAr: 'الآن',
          messages: [...(c.messages || []), newMsg]
        };
      }
      return c;
    }));

    if (activeUser?.id && activeChatId) {
      try {
        let publicAudioUrl = recordedUri;
        if (recordedUri) {
          try {
            const response = await fetch(recordedUri);
            const blob = await response.blob();
            const fileName = `voice/${activeChatId}/${activeUser.id}_${Date.now()}.m4a`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('community-media')
              .upload(fileName, blob, {
                contentType: 'audio/m4a',
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicData } = supabase.storage
                .from('community-media')
                .getPublicUrl(fileName);
              publicAudioUrl = publicData?.publicUrl || recordedUri;
            }
          } catch (uploadEx) {
            console.warn('Audio upload exception:', uploadEx);
          }
        }

        const { data: insertedMsg, error: insertErr } = await supabase
          .from('direct_messages')
          .insert([{
            conversation_id: activeChatId,
            sender_id: activeUser.id,
            receiver_id: targetChat?.otherUserId,
            text: durationStr,
            media_url: publicAudioUrl,
            media_type: 'audio',
          }])
          .select()
          .single();

        if (insertErr) {
          console.warn('direct_messages insert audio error:', insertErr.message);
        }

        if (insertedMsg) {
          setAudioDurations(prev => ({ ...prev, [insertedMsg.id]: durationStr }));
          setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
              return {
                ...c,
                messages: (c.messages || []).map(m => m.id === tempId ? { ...m, id: insertedMsg.id, audioUri: publicAudioUrl || recordedUri } : m)
              };
            }
            return c;
          }));
        }

        await supabase
          .from('conversations')
          .update({
            last_message_text: isRTL ? '🎙️ رسالة صوتية' : '🎙️ Voice message',
            last_message_at: new Date().toISOString(),
            last_sender_id: activeUser.id,
          })
          .eq('id', activeChatId);
      } catch (voiceErr) {
        console.warn('handleSendVoice cloud error:', voiceErr);
      }
    }
  };

  handleSendVoiceRef.current = handleSendVoice;
  cancelVoiceRecordingRef.current = cancelVoiceRecording;
  startVoiceRecordingRef.current = startVoiceRecording;

  const voicePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (isRecordingRef.current && isRecordingLockedRef.current) return;

        pressStartTimeRef.current = Date.now();
        isRecordingRef.current = true;
        isRecordingLockedRef.current = false;
        setIsRecording(true);
        setIsRecordingLocked(false);
        setRecordTime(0);

        if (startVoiceRecordingRef.current) {
          startVoiceRecordingRef.current();
        }

        Animated.spring(micScaleAnim, {
          toValue: 1.28,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }).start();

        voiceDragY.setValue(0);
        voiceDragX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isRecordingRef.current || isRecordingLockedRef.current) return;

        // 1. Drag up to lock: dy < -40
        if (gestureState.dy < -40) {
          isRecordingLockedRef.current = true;
          setIsRecordingLocked(true);
          Animated.spring(voiceDragY, {
            toValue: -50,
            friction: 6,
            useNativeDriver: true,
          }).start();
          Animated.spring(voiceDragX, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }).start();
          Animated.spring(micScaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Live visual drag toward lock bubble
        if (gestureState.dy < 0 && gestureState.dy >= -40) {
          voiceDragY.setValue(gestureState.dy);
        } else if (gestureState.dy >= 0) {
          voiceDragY.setValue(0);
        }

        // 2. Drag mic horizontally to cancel
        const rtlActive = isRTLRef.current;
        const slideDistance = rtlActive ? gestureState.dx : -gestureState.dx;

        if (rtlActive) {
          voiceDragX.setValue(Math.max(0, Math.min(gestureState.dx, 120)));
        } else {
          voiceDragX.setValue(Math.min(0, Math.max(gestureState.dx, -120)));
        }

        if (slideDistance > 90) {
          if (cancelVoiceRecordingRef.current) {
            cancelVoiceRecordingRef.current();
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isRecordingRef.current) return;

        // If locked hands-free, releasing finger should NOT stop or send
        if (isRecordingLockedRef.current) {
          return;
        }

        // If released while dragged into cancel zone (> 50px), cancel
        const rtlActive = isRTLRef.current;
        const slideDistance = rtlActive ? gestureState.dx : -gestureState.dx;
        if (slideDistance > 50) {
          if (cancelVoiceRecordingRef.current) {
            cancelVoiceRecordingRef.current();
          }
          return;
        }

        // Quick click / tap (< 280ms): lock into hands-free mode
        const pressDuration = Date.now() - pressStartTimeRef.current;
        if (pressDuration < 280) {
          isRecordingLockedRef.current = true;
          setIsRecordingLocked(true);
          Animated.spring(micScaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }).start();
          voiceDragY.setValue(0);
          voiceDragX.setValue(0);
          return;
        }

        // Release after holding sends voice note automatically!
        if (handleSendVoiceRef.current) {
          handleSendVoiceRef.current();
        }
      },
      onPanResponderTerminate: () => {
        if (!isRecordingRef.current) return;
        if (!isRecordingLockedRef.current) {
          if (handleSendVoiceRef.current) {
            handleSendVoiceRef.current();
          }
        }
      },
    })
  ).current;

  const handleSeek = (msgId, durationStr, localX, audioUri) => {
    const w = trackWidthsRef.current[msgId] || 180;
    const clampedX = Math.max(0, Math.min(localX, w));
    const newProgress = clampedX / w;
    setVoiceProgress(prev => ({ ...prev, [msgId]: newProgress }));

    const resolvedDurationStr = sanitizeDuration(audioDurations[msgId] || durationStr) || '0:03';
    const totalSecs = parseDurationSeconds(resolvedDurationStr);
    const seekSecs = newProgress * totalSecs;

    if (activePlayerRef.current && activePlayerMsgIdRef.current === msgId) {
      try {
        activePlayerRef.current.seekTo(seekSecs);
      } catch (_) {}
    }

    if (playingVoiceId === msgId) {
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }
      const stepIntervalMs = 100;
      let tempProgress = newProgress;

      voicePlayIntervals.current[msgId] = setInterval(() => {
        const player = activePlayerRef.current;
        const actualSecs = (player && player.duration > 0) ? player.duration : totalSecs;
        const stepProgress = stepIntervalMs / (actualSecs * 1000);

        tempProgress += stepProgress;
        if (tempProgress >= 1.0) {
          tempProgress = 1.0;
          clearInterval(voicePlayIntervals.current[msgId]);
          stopCurrentPlayer();
          setPlayingVoiceId(null);
        }
        setVoiceProgress(prev => ({ ...prev, [msgId]: tempProgress }));
      }, stepIntervalMs);
    }
  };

  const handleTogglePlayVoice = async (msgId, durationStr, audioUri) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
      stopCurrentPlayer();
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }
    } else {
      // Stop previous audio playback
      stopCurrentPlayer();
      if (playingVoiceId && voicePlayIntervals.current[playingVoiceId]) {
        clearInterval(voicePlayIntervals.current[playingVoiceId]);
      }
      setPlayingVoiceId(msgId);

      const resolvedDurationStr = sanitizeDuration(audioDurations[msgId] || durationStr) || '0:03';
      const totalSecs = parseDurationSeconds(resolvedDurationStr);
      const stepIntervalMs = 100;

      const currentProgress = voiceProgress[msgId] || 0;
      let tempProgress = currentProgress >= 1.0 ? 0 : currentProgress;
      setVoiceProgress(prev => ({ ...prev, [msgId]: tempProgress }));

      // Resolve audio source (real recorded audio file, cloud audio URL, or embedded sample sound)
      const audioSource = audioUri 
        ? (typeof audioUri === 'string' ? { uri: audioUri } : audioUri) 
        : require('../../assets/voice_sample.wav');

      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        const player = createAudioPlayer(audioSource);
        activePlayerRef.current = player;
        activePlayerMsgIdRef.current = msgId;

        if (player.addListener) {
          player.addListener('playbackStatusUpdate', (status) => {
            if (status && status.duration && status.duration > 0) {
              const formatted = sanitizeDuration(formatSecondsToTime(status.duration));
              if (formatted) {
                setAudioDurations(prev => {
                  if (prev[msgId] === formatted) return prev;
                  return { ...prev, [msgId]: formatted };
                });
              }
            }
          });
        }

        const startSeconds = tempProgress * totalSecs;
        if (startSeconds > 0) {
          try { await player.seekTo(startSeconds); } catch (_) {}
        }
        player.play();

        if (player.duration && player.duration > 0) {
          const formatted = sanitizeDuration(formatSecondsToTime(player.duration));
          if (formatted) {
            setAudioDurations(prev => ({ ...prev, [msgId]: formatted }));
          }
        }
      } catch (audioEx) {
        console.warn('Audio playback error:', audioEx);
      }

      voicePlayIntervals.current[msgId] = setInterval(() => {
        const player = activePlayerRef.current;
        const actualSecs = (player && player.duration > 0) ? player.duration : totalSecs;
        const stepProgress = stepIntervalMs / (actualSecs * 1000);

        tempProgress += stepProgress;
        if (tempProgress >= 1.0) {
          tempProgress = 1.0;
          clearInterval(voicePlayIntervals.current[msgId]);
          stopCurrentPlayer();
          setPlayingVoiceId(null);
        }
        setVoiceProgress(prev => ({ ...prev, [msgId]: tempProgress }));
      }, stepIntervalMs);
    }
  };

  const handleMockCall = (name) => {
    Alert.alert(
      isRTL ? 'اتصال صوتي' : 'Voice Call',
      isRTL ? `اتصال صوتي مع ${name} غير مدعوم في هذا الإصدار التجريبي.` : `Calling ${name} is not supported in this beta version.`
    );
  };

  // Filter threads by search query
  const filteredChats = (chats || []).filter(c => {
    if (!c) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameToSearch = isRTL ? (c.nameAr || c.name || '') : (c.name || c.nameAr || '');
    const lastMsg = (Array.isArray(c.messages) && c.messages.length > 0) ? c.messages[c.messages.length - 1] : null;
    const hasImages = (lastMsg?.images && lastMsg.images.length > 0) || Boolean(lastMsg?.image);
    const lastMsgText = lastMsg 
      ? (hasImages 
          ? (lastMsg?.images && lastMsg.images.length > 1
              ? (isRTL ? `📷 ${lastMsg.images.length} صور` : `📷 ${lastMsg.images.length} Photos`)
              : (isRTL ? '📷 صورة' : '📷 Photo')) 
          : (lastMsg?.voiceDuration || lastMsg?.audioUri) 
            ? (isRTL ? 'رسالة صوتية' : 'Voice message') 
            : cleanLastMessageText(lastMsg?.text, isRTL)) 
      : cleanLastMessageText(c.lastMessageText, isRTL);
    return nameToSearch.toLowerCase().includes(query) || lastMsgText.toLowerCase().includes(query);
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => {
        stopCurrentPlayer();
        if (isSelectionMode) {
          setSelectedMessages({});
          return;
        }
        if (activeChatId) {
          setActiveChatId(null);
        } else {
          onClose();
        }
      }}
    >
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.screenBg} />

        {activeChatId ? (
          // CONVERSATION VIEW (Detail)
          <View style={{ flex: 1 }}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
            {/* Conversation Header */}
            <View style={[styles.header, { paddingTop: topInset + 8 }, isRTL && { flexDirection: 'row-reverse' }]}>
              {isSelectionMode ? (
                <View style={[styles.dmHeaderSelectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  {/* Left: Close selection / cancel button */}
                  <TouchableOpacity
                    style={[styles.dmHeaderCloseSelectBtn, isRTL && { flexDirection: 'row-reverse' }]}
                    onPress={() => setSelectedMessages({})}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={24} color={colors.primaryText} />
                    <Text style={[
                      styles.dmHeaderSelectCountText, 
                      { color: colors.primaryText },
                      isRTL ? { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5, marginLeft: 0, marginRight: 8 } : { marginLeft: 8 }
                    ]}>
                      {isRTL ? `${selectedCount} محددة` : `${selectedCount} selected`}
                    </Text>
                  </TouchableOpacity>

                  {/* Right: Red Delete Button */}
                  <TouchableOpacity
                    style={[styles.dmHeaderDeleteBtn, isRTL && { flexDirection: 'row-reverse' }]}
                    onPress={handleDeleteSelectedMessages}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
                    <Text style={[styles.dmHeaderDeleteBtnText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}>
                      {isRTL ? `حذف (${selectedCount})` : `Delete (${selectedCount})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Left: Back Button */}
                  <TouchableOpacity 
                    style={styles.backBtn} 
                    onPress={() => {
                      stopCurrentPlayer();
                      setActiveChatId(null);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.primaryText} />
                  </TouchableOpacity>

                  {/* Center: User's Name and Online/Offline Status */}
                  <View style={styles.headerCenterContent}>
                    <Text 
                      style={[
                        styles.headerCenterName, 
                        { color: colors.primaryText },
                        isRTL && { fontFamily: 'AlkhalilArabic-Bold' }
                      ]}
                      numberOfLines={1}
                    >
                      {isRTL ? (activeChat?.nameAr || activeChat?.name || '') : (activeChat?.name || activeChat?.nameAr || '')}
                    </Text>
                    <View style={[styles.headerStatusRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View 
                        style={[
                          styles.headerPresenceDot, 
                          { backgroundColor: isOtherUserOnline ? '#4CAF50' : (isDarkMode ? '#757575' : '#9E9E9E') }
                        ]} 
                      />
                      <Text 
                        style={[
                          styles.headerStatusText, 
                          { color: isOtherUserOnline ? '#4CAF50' : colors.secondaryText },
                          isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }
                        ]}
                      >
                        {isOtherUserOnline 
                          ? (isRTL ? 'نشط الآن' : 'Online') 
                          : (isRTL ? 'غير متصل' : 'Offline')}
                      </Text>
                    </View>
                  </View>

                  {/* Right: User's Profile Picture (Tapping opens Profile Page) */}
                  <TouchableOpacity 
                    style={styles.headerProfileBtn} 
                    onPress={handleOpenUserProfileFromHeader}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View style={styles.headerAvatarContainer}>
                      <Image 
                        source={getAvatarSource(activeChat?.avatar)} 
                        style={styles.headerProfileAvatar} 
                      />
                      <View 
                        style={[
                          styles.headerAvatarOnlineBadge,
                          { backgroundColor: isOtherUserOnline ? '#4CAF50' : (isDarkMode ? '#757575' : '#9E9E9E') }
                        ]} 
                      />
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Conversation Messages Log */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesScrollContent}
              style={{ backgroundColor: colors.screenBg }}
            >
              {(activeChat?.messages || []).length === 0 ? (
                <View style={styles.emptyMessagesContainer}>
                  <Ionicons name="chatbubbles-outline" size={42} color={colors.secondaryText} style={{ marginBottom: 12, opacity: 0.6 }} />
                  <Text style={[styles.emptyMessagesText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.5 }]}>
                    {isRTL ? 'لا توجد رسائل بعد. أرسل رسالة لبدء المحادثة!' : 'No messages yet. Send a message to start chatting!'}
                  </Text>
                </View>
              ) : (
                (activeChat?.messages || []).map((msg, index) => {
                  if (!msg) return null;
                  const isUser = msg?.sender === 'user';
                  const rawMsgText = isRTL ? (msg?.textAr || msg?.text) : (msg?.text || msg?.textAr);
                  const msgText = (rawMsgText && (rawMsgText.includes('Voice message') || rawMsgText.includes('voice message') || rawMsgText.includes('تسجيل صوتي') || rawMsgText.includes('رسالة صوتية')))
                    ? ''
                    : rawMsgText;
                  const isAudioMsg = Boolean(msg?.voiceDuration || msg?.audioUri || (rawMsgText && (rawMsgText.includes('Voice message') || rawMsgText.includes('voice message') || rawMsgText.includes('تسجيل صوتي') || rawMsgText.includes('رسالة صوتية'))));
                  const effectiveVoiceDuration = sanitizeDuration(audioDurations[msg?.id]) || sanitizeDuration(msg?.voiceDuration) || '0:03';
                  const isSelected = Boolean(selectedMessages[msg?.id]);

                  return (
                    <View 
                      key={msg?.id || index}
                      style={[
                        styles.msgBubbleRow, 
                        isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                        isRTL && { flexDirection: isUser ? 'row-reverse' : 'row' }
                      ]}
                    >
                      {!isUser && (
                        <Image source={getAvatarSource(activeChat?.avatar)} style={styles.msgAvatar} />
                      )}
                    
                    <TouchableOpacity
                      activeOpacity={isSelectionMode ? 0.75 : 1}
                      delayLongPress={300}
                      disabled={!isSelectionMode && Boolean((msg?.images && msg.images.length > 0) || msg?.image)}
                      onPress={() => {
                        if (isSelectionMode) {
                          handleToggleSelectMessage(msg);
                        }
                      }}
                      onLongPress={() => handleLongPressMessage(msg)}
                      style={[
                        styles.msgBubble,
                        isUser ? styles.userMsgBubble : styles.contactMsgBubble,
                        ((msg?.images && msg.images.length > 0) || msg?.image) && styles.imageMsgBubble,
                        isAudioMsg && styles.voiceMsgBubble,
                        isSelected && styles.msgBubbleSelected,
                        !isUser && (isRTL ? { marginRight: 8 } : { marginLeft: 8 })
                      ]}
                    >
                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <View style={[styles.msgSelectCheckBadge, isUser ? styles.msgSelectCheckBadgeMe : styles.msgSelectCheckBadgeThem]}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        </View>
                      )}
                      
                      {((msg?.images && msg.images.length > 0) || msg?.image) ? (
                        /* Render Multi-Image Grid */
                        <View style={{ position: 'relative' }}>
                          <ChatImageGrid
                            images={msg.images || [msg.image]}
                            onImagePress={(tappedIndex) => {
                              if (isSelectionMode) {
                                handleToggleSelectMessage(msg);
                                return;
                              }
                              const imagesList = msg.images || [msg.image];
                              setViewerImages(imagesList);
                              setViewerInitialIndex(tappedIndex);
                              setViewerVisible(true);
                            }}
                            onLongPress={() => handleLongPressMessage(msg)}
                            isRTL={isRTL}
                            uploading={Boolean(msg.uploading)}
                            uploadProgress={msg.uploadProgress || 0}
                            uploadError={Boolean(msg.uploadError)}
                            onRetry={() => performUpload(msg.id, msg.images || [msg.image], msg.text, targetChat?.otherUserId)}
                          />
                          {Boolean(msg?.text) && (
                            <TouchableOpacity
                              activeOpacity={0.88}
                              onPress={() => {
                                if (isSelectionMode) {
                                  handleToggleSelectMessage(msg);
                                }
                              }}
                              onLongPress={() => handleLongPressMessage(msg)}
                              delayLongPress={280}
                            >
                              <Text style={[
                                styles.msgText,
                                isUser ? styles.userMsgText : styles.contactMsgText,
                                { marginTop: 6, marginHorizontal: 4 },
                                isRTL && { fontFamily: 'AlkhalilArabic-Regular', fontSize: 13.0, textAlign: 'right' }
                              ]}>
                                {msg.text}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : isAudioMsg ? (
                        /* Render Voice Record Player Message with Interactive Touch/Drag Scrubber */
                        <View style={[styles.voicePlayerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <TouchableOpacity
                            style={[styles.voicePlayBtn, isUser ? styles.userVoicePlayBtn : styles.contactVoicePlayBtn]}
                            delayLongPress={300}
                            onLongPress={() => handleLongPressMessage(msg)}
                            onPress={() => {
                              if (isSelectionMode) {
                                handleToggleSelectMessage(msg);
                                return;
                              }
                              handleTogglePlayVoice(msg.id, effectiveVoiceDuration, msg.audioUri || msg.media_url);
                            }}
                            activeOpacity={0.8}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons 
                              name={playingVoiceId === msg.id ? "pause" : "play"} 
                              size={16} 
                              color={isUser ? colors.forestGreen : '#FFFFFF'} 
                            />
                          </TouchableOpacity>

                          <View style={styles.voiceProgressWrapper}>
                            {/* Interactive Waveform Track with Drag & Tap Scrubbing */}
                            <View 
                              style={styles.waveformTouchArea}
                              onLayout={(e) => {
                                const w = e.nativeEvent.layout.width;
                                if (w > 0) {
                                  trackWidthsRef.current[msg.id] = w;
                                }
                              }}
                              onStartShouldSetResponder={() => !isSelectionMode}
                              onMoveShouldSetResponder={() => !isSelectionMode}
                              onResponderGrant={(e) => {
                                if (isSelectionMode) {
                                  handleToggleSelectMessage(msg);
                                  return;
                                }
                                if (waveformPressTimer.current) clearTimeout(waveformPressTimer.current);
                                waveformPressTimer.current = setTimeout(() => {
                                  handleLongPressMessage(msg);
                                }, 350);
                                handleSeek(msg.id, effectiveVoiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url);
                              }}
                              onResponderMove={(e) => {
                                if (waveformPressTimer.current) {
                                  clearTimeout(waveformPressTimer.current);
                                  waveformPressTimer.current = null;
                                }
                                if (isSelectionMode) return;
                                handleSeek(msg.id, effectiveVoiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url);
                              }}
                              onResponderRelease={(e) => {
                                if (waveformPressTimer.current) {
                                  clearTimeout(waveformPressTimer.current);
                                  waveformPressTimer.current = null;
                                }
                                if (isSelectionMode) return;
                                handleSeek(msg.id, effectiveVoiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url);
                              }}
                            >
                              <View style={styles.waveformContainer}>
                                {WAVEFORM_HEIGHTS.map((height, i) => {
                                  const progress = voiceProgress[msg.id] || 0;
                                  const barFraction = i / (WAVEFORM_HEIGHTS.length - 1);
                                  const isPassed = barFraction <= progress;
                                  return (
                                    <View
                                      key={i}
                                      style={[
                                        styles.waveformBar,
                                        { height },
                                        isUser 
                                          ? { backgroundColor: isPassed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)' }
                                          : { backgroundColor: isPassed ? colors.forestGreen : (isDarkMode ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 53, 20, 0.22)') }
                                      ]}
                                    />
                                  );
                                })}
                              </View>

                              {/* Scrubbing Thumb Indicator */}
                              <View 
                                pointerEvents="none"
                                style={[
                                  styles.scrubThumb,
                                  isUser ? styles.userScrubThumb : styles.contactScrubThumb,
                                  {
                                    left: `${Math.min(100, Math.max(0, (voiceProgress[msg.id] || 0) * 100))}%`
                                  }
                                ]} 
                              />
                            </View>

                            {/* Voice Duration */}
                            <View style={[styles.voiceTimeRow, isRTL && { flexDirection: 'row-reverse' }]}>
                              <Text style={[styles.voiceDurationText, isUser ? styles.userVoiceTime : styles.contactVoiceTime]}>
                                {effectiveVoiceDuration}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        /* Render Standard Text Message */
                        <Text style={[
                          styles.msgText,
                          isUser ? styles.userMsgText : styles.contactMsgText,
                          isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0, lineHeight: 20 }
                        ]}>
                          {msgText}
                        </Text>
                      )}

                      <Text style={[
                        styles.msgTime,
                        isUser ? styles.userMsgTime : styles.contactMsgTime,
                        isRTL ? { textAlign: 'left' } : { textAlign: 'right' },
                        ((msg?.images && msg.images.length > 0) || msg?.image) && styles.imageMsgTime,
                        isAudioMsg && styles.voiceMsgTime
                      ]}>
                        {msg?.time}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }))}
            </ScrollView>

            {/* Selected Images Preview Dock */}
            {selectedImages.length > 0 && (
              <View style={[styles.imagePreviewDock, isRTL && { flexDirection: 'row-reverse' }]}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.imagePreviewScroll, isRTL && { flexDirection: 'row-reverse' }]}
                >
                  {selectedImages.map((uri, idx) => (
                    <View key={`preview_${idx}`} style={styles.imagePreviewThumbContainer}>
                      <Image source={{ uri }} style={styles.imagePreviewThumb} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.imagePreviewRemoveBtn}
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                        activeOpacity={0.8}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="close" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add more button */}
                  <TouchableOpacity
                    style={styles.imagePreviewAddBtn}
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.forestGreen} />
                    <Text style={[styles.imagePreviewAddText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11 }]}>
                      {isRTL ? 'إضافة' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Clear all button */}
                <TouchableOpacity
                  style={styles.imagePreviewClearBtn}
                  onPress={() => setSelectedImages([])}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            )}

            {/* Input Bar (Universal: Standard Composer + Voice Recording Controller) */}
            <View style={[styles.inputBar, isRTL && { flexDirection: 'row-reverse' }]}>
              {isRecording ? (
                /* Left & Middle during Recording (Both Locked and Holding: Trash button + Waveform container) */
                <>
                  <TouchableOpacity 
                    style={styles.trashBtn} 
                    onPress={cancelVoiceRecording}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>

                  <View style={[styles.recordingWaveformWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.recordingTimer, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}>
                      {formatRecordTime(recordTime)}
                    </Text>

                    {/* 60fps Native Waveform Animation */}
                    <View style={[styles.waveformContainerMini, isRTL && { flexDirection: 'row-reverse' }, !isRecordingLocked && { marginHorizontal: 6 }]}>
                      {[0.35, 0.75, 1.0, 0.5, 0.85, 0.4, 0.9, 1.0, 0.65, 0.35].map((factor, idx) => {
                        const scale = waveAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.35 + factor * 0.2, factor, 0.35 + (1 - factor) * 0.4],
                        });
                        return (
                          <Animated.View 
                            key={idx} 
                            style={[
                              styles.waveformBarMini, 
                              { 
                                height: 18, 
                                transform: [{ scaleY: scale }],
                                backgroundColor: colors.forestGreen,
                              }
                            ]} 
                          />
                        );
                      })}
                    </View>

                    {/* Slide to Cancel Text & Chevron (visible during long-press holding) */}
                    {!isRecordingLocked && (
                      <Animated.View 
                        style={[
                          styles.slideToCancelGroup, 
                          isRTL && { flexDirection: 'row-reverse' },
                          {
                            opacity: voiceDragX.interpolate({
                              inputRange: isRTL ? [0, 20] : [-20, 0],
                              outputRange: isRTL ? [0, 1] : [1, 0],
                              extrapolate: 'clamp',
                            }),
                            transform: [
                              {
                                translateX: voiceDragX.interpolate({
                                  inputRange: isRTL ? [0, 60] : [-60, 0],
                                  outputRange: isRTL ? [16, 0] : [-16, 0],
                                  extrapolate: 'clamp',
                                })
                              }
                            ]
                          }
                        ]}
                      >
                        <Ionicons
                          name={isRTL ? "chevron-forward" : "chevron-back"}
                          size={15}
                          color={colors.forestGreen}
                        />
                        <Text style={[styles.slideToCancelText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                          {isRTL ? "اسحب للإلغاء" : "Slide to cancel"}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                </>
              ) : (
                /* Standard Composer Field (Attach button + TextInput) */
                <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={styles.attachBtn} 
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="images-outline" size={23} color={colors.primaryText} />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={[styles.inputField, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                    placeholder={
                      selectedImages.length > 0
                        ? (isRTL ? 'أضف تعليقاً...' : 'Add a caption...')
                        : (isRTL ? 'اكتب رسالة...' : 'Type a message...')
                    }
                    placeholderTextColor={colors.secondaryText}
                    value={newMessageText}
                    onChangeText={setNewMessageText}
                    multiline={true}
                    editable={!isRecording}
                  />
                </View>
              )}
              
              {/* Right Button: Locked checkmark, Send button, or Mic with PanResponder */}
              {isRecording && isRecordingLocked ? (
                <TouchableOpacity 
                  style={styles.sendRecordBtn}
                  onPress={handleSendVoice}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (newMessageText.trim().length > 0 || selectedImages.length > 0) ? (
                <TouchableOpacity 
                  style={styles.sendBtn}
                  onPress={handleSendMessage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" style={isRTL && { transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ) : (
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                  {/* Floating Lock indicator: ONLY VISIBLE WHILE ACTIVELY HOLDING */}
                  {isRecording && !isRecordingLocked && (
                    <Animated.View
                      style={[
                        styles.lockIndicatorContainer,
                        { transform: [{ translateY: voiceDragY }] }
                      ]}
                      pointerEvents="none"
                    >
                      <View style={styles.lockBubble}>
                        <Ionicons name="lock-closed" size={16} color={colors.forestGreen} />
                        <Ionicons name="chevron-up" size={13} color={colors.forestGreen} style={{ marginTop: 2, opacity: 0.7 }} />
                      </View>
                    </Animated.View>
                  )}

                  {/* Mic Button with panHandlers for Hold-to-Record, Release-to-Send, and Tap-to-Lock */}
                  <Animated.View
                    {...voicePanResponder.panHandlers}
                    style={[
                      styles.sendBtn,
                      isRecording && styles.micBtnActive,
                      {
                        transform: [
                          { scale: micScaleAnim },
                          { translateX: voiceDragX },
                        ]
                      }
                    ]}
                  >
                    <Ionicons
                      name="mic"
                      size={19}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
          </View>
        ) : (
          // CHAT THREADS LIST VIEW (Inbox)
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={[styles.header, { paddingTop: topInset + 8 }, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => {
                  stopCurrentPlayer();
                  onClose();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.primaryText} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 18.0 }]}>
                {isRTL ? 'الرسائل' : 'Messages'}
              </Text>
              
              <View style={{ width: 36 }} />
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchEntity, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="search" size={18} color={colors.secondaryText} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                  placeholder={isRTL ? 'ابحث في المحادثات...' : 'Search messages...'}
                  placeholderTextColor={colors.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Chats Scroll List */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollListContent}
            >
              {isLoadingChats ? (
                <View style={styles.emptyInbox}>
                  <ActivityIndicator size="large" color={colors.forestGreen} />
                </View>
              ) : filteredChats.length === 0 ? (
                <View style={styles.emptyInbox}>
                  <View style={styles.emptyBadgeContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={colors.forestGreen} />
                  </View>
                  <Text style={[styles.emptyInboxText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
                    {searchQuery.trim().length > 0 
                      ? (isRTL ? 'لا توجد محادثات تطابق بحثك.' : 'No conversations found.')
                      : (isRTL ? 'لا توجد محادثات بعد.' : 'No conversations yet.')}
                  </Text>
                </View>
              ) : (
                filteredChats.map((chat) => {
                  if (!chat) return null;
                  const lastMsg = (Array.isArray(chat?.messages) && chat.messages.length > 0) 
                    ? chat.messages[chat.messages.length - 1] 
                    : null;
                  const hasImages = (lastMsg?.images && lastMsg.images.length > 0) || Boolean(lastMsg?.image);
                  const isLastAudio = Boolean(lastMsg?.voiceDuration || lastMsg?.audioUri);
                  const lastMsgText = lastMsg 
                    ? (hasImages 
                        ? (lastMsg?.images && lastMsg.images.length > 1
                            ? (isRTL ? `📷 ${lastMsg.images.length} صور` : `📷 ${lastMsg.images.length} Photos`)
                            : (isRTL ? '📷 أرسل صورة' : '📷 Sent a photo')) 
                        : isLastAudio 
                          ? (isRTL ? '🎵 رسالة صوتية' : '🎵 Voice message') 
                          : cleanLastMessageText(isRTL ? (lastMsg?.textAr || lastMsg?.text) : (lastMsg?.text || lastMsg?.textAr), isRTL))
                    : cleanLastMessageText(chat?.lastMessageText, isRTL);
                  const timeText = isRTL ? (chat?.lastTimeAr || chat?.lastTime || '') : (chat?.lastTime || chat?.lastTimeAr || '');
                  const nameText = isRTL ? (chat?.nameAr || chat?.name || 'مستخدم') : (chat?.name || chat?.nameAr || 'User');

                  return (
                    <TouchableOpacity
                      key={chat.id}
                      style={[
                        styles.chatCard, 
                        isRTL && { flexDirection: 'row-reverse' },
                        chat.unread && { 
                          backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.16)' : '#F0F6F1', 
                          borderColor: isDarkMode ? '#305734' : 'rgba(0, 53, 20, 0.22)' 
                        }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenConversation(chat.id)}
                    >
                      {/* Contact Avatar Wrapper */}
                      <View style={styles.avatarWrapper}>
                        <Image source={getAvatarSource(chat.avatar)} style={styles.chatAvatar} />
                        <View style={styles.onlineDot} />
                      </View>

                      {/* Content Details */}
                      <View style={[styles.chatDetails, isRTL ? { marginRight: 14, alignItems: 'flex-end' } : { marginLeft: 14, alignItems: 'flex-start' }]}>
                        <View style={[styles.chatCardTop, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Text style={[
                            styles.chatName, 
                            chat.unread && styles.unreadText,
                            isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5 }
                          ]}>
                            {nameText}
                          </Text>
                          <Text style={[styles.chatTime, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }]}>
                            {timeText}
                          </Text>
                        </View>
                        
                        <View style={[styles.snippetContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Text 
                            style={[
                              styles.chatSnippet, 
                              chat.unread && styles.unreadSnippetText, 
                              isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 12.0 }
                            ]} 
                            numberOfLines={1}
                          >
                            {lastMsgText}
                          </Text>
                          
                          {/* Unread badge circle */}
                          {chat.unread && (
                            <View style={styles.unreadBadgePill}>
                              <Text style={styles.unreadBadgeText}>1</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* Attachment Bottom Option Sheet */}
        {attachmentMenuVisible && (
          <View style={styles.alertOverlay}>
            <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAttachmentMenuVisible(false)} activeOpacity={1} />
            </BlurView>

            <View style={styles.bottomSheetCard}>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.dragBar} />
                <Text style={[styles.bottomSheetTitle, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 15.0 }]}>
                  {isRTL ? 'إرفاق محتوى' : 'Attach File'}
                </Text>
              </View>

              <View style={[styles.bottomSheetContent, isRTL && { flexDirection: 'row-reverse' }]}>
                {/* Photo Library Option */}
                <TouchableOpacity
                  style={styles.sheetOptionBtn}
                  onPress={() => {
                    setAttachmentMenuVisible(false);
                    handlePickImages();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.sheetIconCircle, { backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.25)' : '#E8F5E9' }]}>
                    <Ionicons name="image" size={24} color={colors.forestGreen} />
                  </View>
                  <Text style={[styles.sheetOptionText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 12.5 }]}>
                    {isRTL ? 'معرض الصور' : 'Photo Gallery'}
                  </Text>
                </TouchableOpacity>

                {/* Voice Note Option */}
                <TouchableOpacity
                  style={styles.sheetOptionBtn}
                  onPress={() => {
                    setAttachmentMenuVisible(false);
                    isRecordingRef.current = true;
                    isRecordingLockedRef.current = true;
                    setIsRecording(true);
                    setIsRecordingLocked(true);
                    if (startVoiceRecordingRef.current) {
                      startVoiceRecordingRef.current();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.sheetIconCircle, { backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.2)' : '#FFEBEE' }]}>
                    <Ionicons name="mic" size={24} color="#D32F2F" />
                  </View>
                  <Text style={[styles.sheetOptionText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 12.5 }]}>
                    {isRTL ? 'تسجيل صوتي' : 'Voice Record'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setAttachmentMenuVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetCancelText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dedicated Other User Profile Page View */}
        {Boolean(viewingProfileUser) && (
          <View style={[styles.profilePageOverlay, { paddingTop: topInset }]}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={colors.screenBg}
            />

            {/* Profile Header */}
            <View style={[styles.profileHeaderRow, isRTL && styles.profileHeaderRowRtl]}>
              <TouchableOpacity
                onPress={() => setViewingProfileUser(null)}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                activeOpacity={0.7}
                style={styles.profileBackButton}
              >
                <Ionicons
                  name={isRTL ? 'arrow-forward' : 'arrow-back'}
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>

              <Text style={[styles.profileHeaderTitle, { color: colors.primaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]} numberOfLines={1}>
                {viewingProfileUser.author || viewingProfileUser.fullName || viewingProfileUser.name}
              </Text>

              <View style={{ width: 40, height: 40 }} />
            </View>

            {/* Scrollable Profile Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.profileScrollContent}
            >
              {/* Profile Card */}
              <View style={[styles.profileCardSurface, { backgroundColor: colors.cardBg, borderColor: isDarkMode ? colors.cardBorder : '#EDF0F2' }]}>
                {/* Banner */}
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => {
                    const bannerSrc = viewingProfileUser.banner
                      ? (typeof viewingProfileUser.banner === 'string' ? { uri: viewingProfileUser.banner } : viewingProfileUser.banner)
                      : require('../../assets/Banner wallpaper.png');
                    setProfilePreviewImage(bannerSrc);
                  }}
                  style={styles.profileBannerContainer}
                >
                  <Image
                    source={
                      viewingProfileUser.banner
                        ? (typeof viewingProfileUser.banner === 'string' ? { uri: viewingProfileUser.banner } : viewingProfileUser.banner)
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
                    activeOpacity={viewingProfileUser.avatar ? 0.85 : 1}
                    onPress={() => {
                      if (viewingProfileUser.avatar) {
                        const avatarSrc = typeof viewingProfileUser.avatar === 'string'
                          ? { uri: viewingProfileUser.avatar }
                          : viewingProfileUser.avatar;
                        setProfilePreviewImage(avatarSrc);
                      }
                    }}
                    style={[styles.profileAvatarCircle, { borderColor: colors.screenBg }]}
                  >
                    <Image
                      source={getAvatarSource(viewingProfileUser.avatar)}
                      style={styles.profileAvatarImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </View>

                {/* Meta details */}
                <View style={styles.profileMetaContainer}>
                  <Text style={[styles.profileNameText, { color: colors.primaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                    {viewingProfileUser.author || viewingProfileUser.fullName || viewingProfileUser.name}
                  </Text>
                  <Text style={[styles.profileHandleText, { color: colors.secondaryText }]}>
                    {viewingProfileUser.handle}
                  </Text>

                  {/* Presence Status Pill Badge */}
                  <View style={[
                    styles.profilePresencePill, 
                    { backgroundColor: isOtherUserOnline ? 'rgba(76, 175, 80, 0.12)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') },
                    isRTL && { flexDirection: 'row-reverse' }
                  ]}>
                    <View style={[styles.profilePillDot, { backgroundColor: isOtherUserOnline ? '#4CAF50' : '#9E9E9E' }]} />
                    <Text style={[styles.profilePillText, { color: isOtherUserOnline ? '#4CAF50' : colors.secondaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                      {isOtherUserOnline ? (isRTL ? 'نشط الآن' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                    </Text>
                  </View>

                  {/* Vehicle Tag if present */}
                  {Boolean(viewingProfileUser.vehicle) && (
                    <View style={[styles.profileVehiclePill, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="car-sport" size={14} color={colors.forestGreen} style={{ marginHorizontal: 4 }} />
                      <Text style={[styles.profileVehicleText, { color: colors.forestGreen }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                        {viewingProfileUser.vehicle}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Stats Row */}
                <View style={[styles.profileStatsRow, { borderTopColor: isDarkMode ? colors.cardBorder : '#F0F2F4' }, isRTL && styles.profileStatsRowRtl]}>
                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatNumber, { color: colors.primaryText }]}>
                      {(viewingProfileUser.posts || []).length}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.secondaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                      {isRTL ? 'منشورات' : 'Posts'}
                    </Text>
                  </View>

                  <View style={[styles.profileStatDivider, { backgroundColor: isDarkMode ? colors.cardBorder : '#E0E0E0' }]} />

                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatNumber, { color: colors.primaryText }]}>
                      {viewingProfileUser.likesCount || 0}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.secondaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                      {isRTL ? 'إعجابات' : 'Likes'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* User Posts Section */}
              <View style={[styles.profilePostsHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.profilePostsHeaderTitle, { color: colors.primaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                  {isRTL ? 'المنشورات' : 'Posts'}
                </Text>
                <Text style={[styles.profilePostsCount, { color: colors.secondaryText }]}>
                  ({(viewingProfileUser.posts || []).length})
                </Text>
              </View>

              {(viewingProfileUser.posts || []).length === 0 ? (
                <View style={[styles.noPostsCard, { backgroundColor: colors.cardBg, borderColor: isDarkMode ? colors.cardBorder : '#EDF0F2' }]}>
                  <Ionicons name="document-text-outline" size={32} color={colors.secondaryText} style={{ opacity: 0.6, marginBottom: 8 }} />
                  <Text style={[styles.noPostsTitle, { color: colors.primaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                    {isRTL ? 'لا توجد منشورات' : 'No posts'}
                  </Text>
                  <Text style={[styles.noPostsSubtitle, { color: colors.secondaryText }, isRTL && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                    {isRTL ? 'لم يقم هذا المستخدم بنشر أي منشورات بعد' : 'This user has not shared any posts yet'}
                  </Text>
                </View>
              ) : (
                viewingProfileUser.posts.map((post, pIdx) => (
                  <View key={`prof_post_${post.id || pIdx}`} style={[styles.userPostCard, { backgroundColor: colors.cardBg, borderColor: isDarkMode ? colors.cardBorder : '#EDF0F2' }]}>
                    <Text style={[styles.userPostContent, { color: colors.primaryText }, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Regular' }]}>
                      {post.content}
                    </Text>
                    {Boolean(post.media_url) && (
                      <Image
                        source={{ uri: post.media_url }}
                        style={styles.userPostImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={[styles.userPostFooter, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.postStatBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="heart" size={14} color="#E91E63" />
                        <Text style={[styles.postStatText, { color: colors.secondaryText }]}>
                          {post.likes_count || 0}
                        </Text>
                      </View>
                      <View style={[styles.postStatBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="chatbubble" size={13} color={colors.secondaryText} />
                        <Text style={[styles.postStatText, { color: colors.secondaryText }]}>
                          {post.comments_count || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Image Preview Overlay for Profile Modal */}
            {Boolean(profilePreviewImage) && (
              <View style={styles.profileImagePreviewOverlay}>
                <TouchableOpacity
                  style={styles.profilePreviewCloseBtn}
                  onPress={() => setProfilePreviewImage(null)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Image
                  source={profilePreviewImage}
                  style={styles.profilePreviewFullImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        {/* Full-Screen Multi-Image Viewer Gallery */}
        <ImageViewerModal
          visible={viewerVisible}
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerVisible(false)}
          isRTL={isRTL}
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.cardBorder : '#EDF0F2',
    backgroundColor: colors.screenBg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnRound: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.primaryText,
  },
  headerCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerCenterName: {
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerPresenceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerProfileBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarContainer: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  headerProfileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
  },
  headerAvatarOnlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: colors.screenBg,
  },
  // Dedicated Profile Page Overlay styles
  profilePageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.screenBg,
    zIndex: 99999,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.cardBorder : '#EDF0F2',
  },
  profileHeaderRowRtl: {
    flexDirection: 'row-reverse',
  },
  profileBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCardSurface: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  profileBannerContainer: {
    width: '100%',
    height: 120,
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
    alignItems: 'center',
    marginTop: -42,
  },
  profileAvatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileMetaContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  profileHandleText: {
    fontSize: 13,
    marginBottom: 8,
  },
  profilePresencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  profilePillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  profilePillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  profileVehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  profileVehicleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  profileStatsRowRtl: {
    flexDirection: 'row-reverse',
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  profileStatLabel: {
    fontSize: 11.5,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 24,
  },
  profilePostsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  profilePostsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  profilePostsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  noPostsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPostsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  noPostsSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  userPostCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  userPostContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  userPostImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  userPostFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  postStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileImagePreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePreviewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  profilePreviewFullImage: {
    width: '100%',
    height: '80%',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.screenBg,
  },
  searchEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.primaryText,
    fontSize: 13.5,
    fontWeight: '600',
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    backgroundColor: colors.screenBg,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.elevatedBg : '#FFFFFF',
    borderColor: isDarkMode ? colors.cardBorder : '#ECEEF0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.25 : 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  avatarWrapper: {
    position: 'relative',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: isDarkMode ? colors.elevatedBg : '#FFFFFF',
  },
  chatDetails: {
    flex: 1,
  },
  chatCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 3,
  },
  chatName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  chatTime: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  snippetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  chatSnippet: {
    flex: 1,
    fontSize: 12.5,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  unreadSnippetText: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  unreadText: {
    fontWeight: '800',
    color: colors.primaryText,
  },
  unreadBadgePill: {
    backgroundColor: colors.forestGreen,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyInbox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyBadgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyInboxText: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyMessagesText: {
    fontSize: 13.5,
    color: colors.secondaryText,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: colors.screenBg,
  },
  msgBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDarkMode ? 0.2 : 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  imageMsgBubble: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  voiceMsgBubble: {
    width: Math.min(SCREEN_WIDTH * 0.58, 220),
    maxWidth: '72%',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  contactMsgBubble: {
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E5E8EB',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  userMsgBubble: {
    backgroundColor: colors.forestGreen,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.forestGreen,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  contactMsgText: {
    color: colors.primaryText,
  },
  userMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 5,
    fontWeight: '600',
  },
  contactMsgTime: {
    color: colors.secondaryText,
  },
  userMsgTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  imageMsgTime: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  imageMsgContainer: {
    width: 220,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
  },
  imageMsgContent: {
    width: '100%',
    height: '100%',
  },
  voicePlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.14,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userVoicePlayBtn: {
    backgroundColor: '#FFFFFF',
  },
  contactVoicePlayBtn: {
    backgroundColor: colors.forestGreen,
  },
  voiceProgressWrapper: {
    flex: 1,
    marginLeft: 10,
    marginRight: 4,
    justifyContent: 'center',
  },
  waveformTouchArea: {
    width: '100%',
    paddingVertical: 4,
    justifyContent: 'center',
    position: 'relative',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 22,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.25,
  },
  scrubThumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -4,
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userScrubThumb: {
    backgroundColor: '#FFFFFF',
  },
  contactScrubThumb: {
    backgroundColor: colors.forestGreen,
  },
  voiceTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  voiceDurationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  voiceTotalDurationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userVoiceTime: {
    color: '#FFFFFF',
  },
  userVoiceTotalTime: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  contactVoiceTime: {
    color: colors.forestGreen,
  },
  contactVoiceTotalTime: {
    color: colors.secondaryText,
  },
  voiceMsgTime: {
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  imagePreviewDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: isDarkMode ? colors.cardBg : '#F4F7F5',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    gap: 10,
  },
  imagePreviewScroll: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 6,
  },
  imagePreviewThumbContainer: {
    position: 'relative',
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: 'visible',
  },
  imagePreviewThumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: isDarkMode ? colors.surface : '#EFEFEF',
  },
  imagePreviewRemoveBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  imagePreviewAddBtn: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.forestGreen,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? 'rgba(0, 53, 20, 0.25)' : 'rgba(0, 53, 20, 0.06)',
  },
  imagePreviewAddText: {
    color: colors.forestGreen,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  imagePreviewClearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.2)' : '#FFEBEE',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? colors.cardBorder : '#EDF0F2',
    backgroundColor: colors.screenBg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: isDarkMode ? colors.cardBg : '#F7F8F9',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.primaryText,
    maxHeight: 100,
    fontWeight: '600',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.forestGreen,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.18)' : '#FFEBEE',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordingWaveformWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F5F3',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : 'rgba(0, 53, 20, 0.12)',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
  },
  recordingTimer: {
    fontSize: 13,
    color: isDarkMode ? colors.primaryText : colors.forestGreen,
    fontWeight: '700',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
  waveformContainerMini: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginHorizontal: 12,
    height: 22,
  },
  waveformBarMini: {
    width: 2.5,
    borderRadius: 1.25,
  },
  sendRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.forestGreen,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  slideToCancelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  slideToCancelText: {
    fontSize: 12.0,
    fontWeight: '700',
    color: colors.secondaryText,
    marginHorizontal: 3,
  },
  lockIndicatorContainer: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
    zIndex: 9999,
  },
  lockBubble: {
    backgroundColor: isDarkMode ? colors.cardBg : '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : 'rgba(0, 53, 20, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  micBtnActive: {
    backgroundColor: colors.forestGreen,
    ...Platform.select({
      ios: {
        shadowColor: colors.forestGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: colors.screenBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#EDF0F2',
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dragBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.secondaryText + '40',
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
  },
  bottomSheetContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  sheetOptionBtn: {
    alignItems: 'center',
    width: 100,
  },
  sheetIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
  },
  sheetOptionText: {
    fontSize: 12.5,
    color: colors.primaryText,
    fontWeight: '700',
  },
  sheetCancelBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  dmHeaderSelectionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dmHeaderCloseSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dmHeaderSelectCountText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginLeft: 8,
  },
  dmHeaderDeleteBtn: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    height: 36,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dmHeaderDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  msgBubbleSelected: {
    borderWidth: 2,
    borderColor: '#FF3B30',
    ...Platform.select({
      ios: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  msgSelectCheckBadge: {
    position: 'absolute',
    top: -6,
    zIndex: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  msgSelectCheckBadgeMe: {
    left: -6,
  },
  msgSelectCheckBadgeThem: {
    right: -6,
  },
});
