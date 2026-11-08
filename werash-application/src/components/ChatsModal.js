import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, ScrollView, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Alert, Animated,
  Dimensions, PanResponder, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import { supabase } from '../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Keep a ref of activeChatId to prevent stale closure in PanResponder
  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const chatPanX = useRef(new Animated.Value(0)).current;

  const chatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return activeChatIdRef.current !== null && gestureState.x0 < 50 && gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          chatPanX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120 || gestureState.vx > 0.5) {
          Animated.timing(chatPanX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true
          }).start(() => {
            setActiveChatId(null);
            chatPanX.setValue(0);
          });
        } else {
          Animated.spring(chatPanX, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  // Menus and simulation states
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  
  // Voice playback simulation states
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});

  const scrollViewRef = useRef(null);
  const recordingInterval = useRef(null);
  const voicePlayIntervals = useRef({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeChat = chats.find(c => c.id === activeChatId);

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
            lastMessageText: c.last_message_text || '',
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

      const formatted = (data || []).map((m) => {
        const isUser = activeUser?.id ? m.sender_id === activeUser.id : m.sender === 'user';
        return {
          id: m.id,
          sender: isUser ? 'user' : 'contact',
          text: m.text || '',
          textAr: m.text || '',
          image: m.media_type === 'image' ? m.media_url : null,
          voiceDuration: m.media_type === 'audio' ? (m.voice_duration || '0:05') : null,
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
            const isUser = m.sender_id === activeUser.id;
            const newMsg = {
              id: m.id,
              sender: isUser ? 'user' : 'contact',
              text: m.text || '',
              textAr: m.text || '',
              image: m.media_type === 'image' ? m.media_url : null,
              voiceDuration: m.media_type === 'audio' ? (m.voice_duration || '0:05') : null,
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
    setActiveChatId(id);
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
    if (activeUser?.id) {
      fetchMessagesForConversation(id);
    }
  };

  const handleSendMessage = async () => {
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

  const handlePickImage = async () => {
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

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      const targetChat = chats.find(c => c.id === activeChatId);
      const tempId = `m_${Date.now()}`;
      const newMsg = {
        id: tempId,
        sender: 'user',
        image: selectedImageUri,
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
      setAttachmentMenuVisible(false);

      if (activeUser?.id && activeChatId) {
        try {
          const response = await fetch(selectedImageUri);
          const blob = await response.blob();
          const ext = selectedImageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
          const fileName = `messages/${activeChatId}/${activeUser.id}_${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('community-media')
            .upload(fileName, blob, {
              contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
              upsert: true,
            });

          let publicUrl = selectedImageUri;
          if (!uploadErr && uploadData) {
            const { data: publicData } = supabase.storage
              .from('community-media')
              .getPublicUrl(fileName);
            publicUrl = publicData?.publicUrl || selectedImageUri;
          }

          const { data: insertedMsg } = await supabase
            .from('direct_messages')
            .insert([{
              conversation_id: activeChatId,
              sender_id: activeUser.id,
              receiver_id: targetChat?.otherUserId,
              text: null,
              media_url: publicUrl,
              media_type: 'image',
            }])
            .select()
            .single();

          if (insertedMsg) {
            setChats(prev => prev.map(c => {
              if (c.id === activeChatId) {
                return {
                  ...c,
                  messages: (c.messages || []).map(m => m.id === tempId ? { ...m, id: insertedMsg.id, image: publicUrl } : m)
                };
              }
              return c;
            }));
          }

          await supabase
            .from('conversations')
            .update({
              last_message_text: isRTL ? '📷 صورة' : '📷 Image',
              last_message_at: new Date().toISOString(),
              last_sender_id: activeUser.id,
            })
            .eq('id', activeChatId);
        } catch (mediaErr) {
          console.warn('handlePickImage cloud error:', mediaErr);
        }
      }
    }
  };

  const startVoiceRecording = () => {
    setAttachmentMenuVisible(false);
    setIsRecording(true);
  };

  const cancelVoiceRecording = () => {
    setIsRecording(false);
    setRecordTime(0);
  };

  const handleSendVoice = async () => {
    const durationStr = formatRecordTime(recordTime === 0 ? 3 : recordTime);
    cancelVoiceRecording();

    const targetChat = chats.find(c => c.id === activeChatId);
    const tempId = `m_${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'user',
      voiceDuration: durationStr,
      time: isRTL ? 'الآن' : 'Just now'
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

    if (activeUser?.id && activeChatId) {
      try {
        const { data: insertedMsg } = await supabase
          .from('direct_messages')
          .insert([{
            conversation_id: activeChatId,
            sender_id: activeUser.id,
            receiver_id: targetChat?.otherUserId,
            text: null,
            media_type: 'audio',
            voice_duration: durationStr,
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

  const handleTogglePlayVoice = (msgId) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }
    } else {
      setPlayingVoiceId(msgId);
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }

      const currentProgress = voiceProgress[msgId] || 0;
      let tempProgress = currentProgress >= 1 ? 0 : currentProgress;
      setVoiceProgress(prev => ({ ...prev, [msgId]: tempProgress }));

      voicePlayIntervals.current[msgId] = setInterval(() => {
        tempProgress += 0.05;
        if (tempProgress >= 1.0) {
          tempProgress = 1.0;
          clearInterval(voicePlayIntervals.current[msgId]);
          setPlayingVoiceId(null);
        }
        setVoiceProgress(prev => ({ ...prev, [msgId]: tempProgress }));
      }, 100);
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
    const lastMsgText = lastMsg ? (lastMsg?.image ? (isRTL ? 'صورة' : 'Photo') : lastMsg?.voiceDuration ? (isRTL ? 'رسالة صوتية' : 'Voice message') : (lastMsg?.text || '')) : (c.lastMessageText || '');
    return nameToSearch.toLowerCase().includes(query) || lastMsgText.toLowerCase().includes(query);
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => {
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
          <Animated.View 
            style={{ flex: 1, transform: [{ translateX: chatPanX }] }}
            {...chatPanResponder.panHandlers}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
            {/* Conversation Header */}
            <View style={[styles.header, { paddingTop: topInset + 8 }, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => setActiveChatId(null)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.primaryText} />
              </TouchableOpacity>

              <View style={[styles.headerContactInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={styles.avatarWrapperMini}>
                  <Image source={getAvatarSource(activeChat?.avatar)} style={styles.headerContactAvatar} />
                  <View style={styles.onlineDotMini} />
                </View>
                <View style={[styles.headerContactDetails, isRTL ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10, alignItems: 'flex-start' }]}>
                  <Text style={[styles.headerContactName, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5 }]}>
                    {isRTL ? (activeChat?.nameAr || activeChat?.name || '') : (activeChat?.name || activeChat?.nameAr || '')}
                  </Text>
                  <Text style={[styles.headerStatusText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }]}>
                    {isRTL ? 'نشط الآن' : 'Online'}
                  </Text>
                </View>
              </View>

              <View style={[styles.headerActions, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  style={styles.actionIconBtn} 
                  onPress={() => handleMockCall(isRTL ? (activeChat?.nameAr || activeChat?.name) : activeChat?.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={18} color={colors.forestGreen} />
                </TouchableOpacity>
              </View>
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
                  const msgText = isRTL ? (msg?.textAr || msg?.text) : (msg?.text || msg?.textAr);

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
                    
                    <View style={[
                      styles.msgBubble,
                      isUser ? styles.userMsgBubble : styles.contactMsgBubble,
                      msg?.image && styles.imageMsgBubble,
                      !isUser && (isRTL ? { marginRight: 8 } : { marginLeft: 8 })
                    ]}>
                      
                      {msg?.image ? (
                        /* Render Image Message */
                        <View style={styles.imageMsgContainer}>
                          <Image 
                            source={typeof msg.image === 'string' ? { uri: msg.image } : msg.image} 
                            style={styles.imageMsgContent} 
                            resizeMode="cover" 
                          />
                        </View>
                      ) : msg?.voiceDuration ? (
                        /* Render Voice Record Player Message */
                        <View style={[styles.voicePlayerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <TouchableOpacity
                            style={[styles.voicePlayBtn, isUser ? styles.userVoicePlayBtn : styles.contactVoicePlayBtn]}
                            onPress={() => handleTogglePlayVoice(msg.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons 
                              name={playingVoiceId === msg.id ? "pause" : "play"} 
                              size={16} 
                              color={isUser ? colors.forestGreen : '#FFFFFF'} 
                            />
                          </TouchableOpacity>

                          <View style={styles.voiceProgressWrapper}>
                            {/* Animated progress bar and waveform tracks */}
                            <View style={styles.waveformContainer}>
                              {[...Array(12)].map((_, i) => {
                                const progress = voiceProgress[msg.id] || 0;
                                const isPassed = (i / 12) <= progress;
                                return (
                                  <View
                                    key={i}
                                    style={[
                                      styles.waveformBar,
                                      { height: 8 + (Math.sin(i * 0.8) * 12) },
                                      isUser 
                                        ? { backgroundColor: isPassed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)' }
                                        : { backgroundColor: isPassed ? colors.forestGreen : (isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 53, 20, 0.18)') }
                                    ]}
                                  />
                                );
                              })}
                            </View>
                            <Text style={[styles.voiceDurationText, isUser ? styles.userVoiceTime : styles.contactVoiceTime]}>
                              {msg.voiceDuration}
                            </Text>
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
                        msg?.image && styles.imageMsgTime
                      ]}>
                        {msg?.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Send Bar / Voice Recording Bar */}
            {isRecording ? (
              /* Voice Recording Controller Panel */
              <View style={[styles.inputBar, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  style={styles.trashBtn} 
                  onPress={cancelVoiceRecording}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>

                <View style={[styles.recordingWaveformWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="mic" size={16} color="#D32F2F" />
                  </Animated.View>
                  
                  <Text style={[styles.recordingTimer, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}>
                    {isRTL ? `تسجيل: ${formatRecordTime(recordTime)}` : `Recording: ${formatRecordTime(recordTime)}`}
                  </Text>

                  {/* Pulsing Visual Waveform Animation */}
                  <View style={[styles.waveformContainerMini, isRTL && { flexDirection: 'row-reverse' }]}>
                    {[...Array(6)].map((_, i) => {
                      const waveHeight = 4 + (Math.random() * 12);
                      return (
                        <View 
                          key={i} 
                          style={[styles.waveformBarMini, { height: waveHeight }]} 
                        />
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.sendRecordBtn}
                  onPress={handleSendVoice}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              /* Standard Input Bar */
              <View style={[styles.inputBar, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  style={styles.attachBtn} 
                  onPress={() => setAttachmentMenuVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color={colors.primaryText} />
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.inputField, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                  placeholderTextColor={colors.secondaryText}
                  value={newMessageText}
                  onChangeText={setNewMessageText}
                  multiline={true}
                />
                
                {newMessageText.trim().length > 0 ? (
                  <TouchableOpacity 
                    style={styles.sendBtn}
                    onPress={handleSendMessage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="send" size={16} color="#FFFFFF" style={isRTL && { transform: [{ rotate: '180deg' }] }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.sendBtn}
                    onPress={startVoiceRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </KeyboardAvoidingView>
          </Animated.View>
        ) : (
          // CHAT THREADS LIST VIEW (Inbox)
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={[styles.header, { paddingTop: topInset + 8 }, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={onClose}
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
                  const lastMsgText = lastMsg 
                    ? (lastMsg?.image 
                        ? (isRTL ? '📷 أرسل صورة' : '📷 Sent a photo') 
                        : lastMsg?.voiceDuration 
                          ? (isRTL ? '🎵 رسالة صوتية' : '🎵 Voice message') 
                          : (isRTL ? (lastMsg?.textAr || lastMsg?.text) : (lastMsg?.text || lastMsg?.textAr)))
                    : (chat?.lastMessageText || (isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'));
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
                  onPress={handlePickImage}
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
                  onPress={startVoiceRecording}
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnRound: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.primaryText,
  },
  headerContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  avatarWrapperMini: {
    position: 'relative',
  },
  headerContactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.forestGreen,
  },
  onlineDotMini: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: colors.screenBg,
  },
  headerContactDetails: {
    justifyContent: 'center',
  },
  headerContactName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primaryText,
  },
  headerStatusText: {
    fontSize: 10.5,
    color: colors.forestGreen,
    fontWeight: '700',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDarkMode ? colors.cardBg : '#F2F4F5',
    borderWidth: 1,
    borderColor: isDarkMode ? colors.cardBorder : '#E2E6E9',
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 160,
    paddingVertical: 2,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 10,
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
    marginBottom: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDurationText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  userVoiceTime: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  contactVoiceTime: {
    color: colors.secondaryText,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.2)' : '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordingWaveformWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#281719' : '#FFF5F5',
    borderWidth: 1,
    borderColor: isDarkMode ? '#4D2428' : 'rgba(211, 47, 47, 0.2)',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 40,
  },
  recordingTimer: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '700',
    marginLeft: 8,
  },
  waveformContainerMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 12,
  },
  waveformBarMini: {
    width: 2.5,
    backgroundColor: '#D32F2F',
    borderRadius: 1,
  },
  sendRecordBtn: {
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
  }
});
