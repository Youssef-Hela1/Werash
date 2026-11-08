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
  const secs = Math.max(0, Math.floor(totalSecs));
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  
  // Voice playback states
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});

  const scrollViewRef = useRef(null);
  const recordingInterval = useRef(null);
  const voicePlayIntervals = useRef({});
  const trackWidthsRef = useRef({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup voice playback and recording on unmount
  useEffect(() => {
    return () => {
      stopCurrentPlayer();
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
          audioUri: m.media_type === 'audio' ? m.media_url : null,
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
              audioUri: m.media_type === 'audio' ? m.media_url : null,
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

  const startVoiceRecording = async () => {
    setAttachmentMenuVisible(false);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          isRTL ? 'مطلوب إذن الميكروفون' : 'Microphone Permission Required',
          isRTL ? 'يرجى تفعيل إذن الميكروفون لتسجيل وإرسال الرسائل الصوتية.' : 'Please allow microphone access to record and send voice messages.'
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.warn('startVoiceRecording error:', err);
    }
    setIsRecording(true);
  };

  const cancelVoiceRecording = async () => {
    setIsRecording(false);
    setRecordTime(0);
    try {
      if (recorder?.isRecording) {
        await recorder.stop();
      }
    } catch (_) {}
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  };

  const handleSendVoice = async () => {
    const durationSec = recordTime === 0 ? 3 : recordTime;
    const durationStr = formatRecordTime(durationSec);

    let recordedUri = null;
    try {
      if (recorder?.isRecording) {
        await recorder.stop();
        recordedUri = recorder.uri;
      }
    } catch (err) {
      console.warn('recorder.stop error:', err);
    }

    cancelVoiceRecording();

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

    // Reset audio mode for clean speaker output
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

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

        const { data: insertedMsg } = await supabase
          .from('direct_messages')
          .insert([{
            conversation_id: activeChatId,
            sender_id: activeUser.id,
            receiver_id: targetChat?.otherUserId,
            text: null,
            media_url: publicAudioUrl,
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

  const handleSeek = (msgId, durationStr, localX, audioUri) => {
    const w = trackWidthsRef.current[msgId] || 180;
    const clampedX = Math.max(0, Math.min(localX, w));
    const newProgress = clampedX / w;
    setVoiceProgress(prev => ({ ...prev, [msgId]: newProgress }));

    const totalSecs = parseDurationSeconds(durationStr || '0:10');
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
      const stepProgress = stepIntervalMs / (totalSecs * 1000);
      let tempProgress = newProgress;

      voicePlayIntervals.current[msgId] = setInterval(() => {
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

      const totalSecs = parseDurationSeconds(durationStr || '0:10');
      const stepIntervalMs = 100;
      const stepProgress = stepIntervalMs / (totalSecs * 1000);

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

        const startSeconds = tempProgress * totalSecs;
        if (startSeconds > 0) {
          try { await player.seekTo(startSeconds); } catch (_) {}
        }
        player.play();
      } catch (audioEx) {
        console.warn('Audio playback error:', audioEx);
      }

      voicePlayIntervals.current[msgId] = setInterval(() => {
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
        stopCurrentPlayer();
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
                      msg?.voiceDuration && styles.voiceMsgBubble,
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
                        /* Render Voice Record Player Message with Interactive Touch/Drag Scrubber */
                        <View style={[styles.voicePlayerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <TouchableOpacity
                            style={[styles.voicePlayBtn, isUser ? styles.userVoicePlayBtn : styles.contactVoicePlayBtn]}
                            onPress={() => handleTogglePlayVoice(msg.id, msg.voiceDuration, msg.audioUri || msg.media_url)}
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
                              onStartShouldSetResponder={() => true}
                              onMoveShouldSetResponder={() => true}
                              onResponderGrant={(e) => handleSeek(msg.id, msg.voiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url)}
                              onResponderMove={(e) => handleSeek(msg.id, msg.voiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url)}
                              onResponderRelease={(e) => handleSeek(msg.id, msg.voiceDuration, e.nativeEvent.locationX, msg.audioUri || msg.media_url)}
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

                            {/* Time counter: Current Second / Total Duration */}
                            <View style={[styles.voiceTimeRow, isRTL && { flexDirection: 'row-reverse' }]}>
                              <Text style={[styles.voiceDurationText, isUser ? styles.userVoiceTime : styles.contactVoiceTime]}>
                                {formatSecondsToTime((voiceProgress[msg.id] || 0) * parseDurationSeconds(msg.voiceDuration))}
                              </Text>
                              <Text style={[styles.voiceTotalDurationText, isUser ? styles.userVoiceTotalTime : styles.contactVoiceTotalTime]}>
                                {msg.voiceDuration}
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
                        msg?.image && styles.imageMsgTime,
                        msg?.voiceDuration && styles.voiceMsgTime
                      ]}>
                        {msg?.time}
                      </Text>
                    </View>
                  </View>
                );
              }))}
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
    justifyContent: 'space-between',
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
