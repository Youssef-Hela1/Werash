import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, ScrollView, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Alert, Animated,
  Dimensions, PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

const initialChats = [
  {
    id: 'c1',
    name: 'Samir Fahmy',
    nameAr: 'سمير فهمي',
    avatar: require('../../assets/expert_samir.png'),
    unread: true,
    lastTime: '2h ago',
    lastTimeAr: 'منذ ساعتين',
    messages: [
      { id: 'm1_1', sender: 'contact', text: 'Is the price negotiable for the BBS LM rims?', textAr: 'هل السعر قابل للتفاوض لجنوط BBS LM؟', time: 'Yesterday' },
      { id: 'm1_2', sender: 'user', text: 'I can lower it slightly if you can pick them up this week.', textAr: 'يمكنني تخفيضه قليلاً إذا تمكنت من استلامها هذا الأسبوع.', time: 'Yesterday' },
      { id: 'm1_3', sender: 'contact', text: 'Great! Let me check my schedule and get back to you.', textAr: 'رائع! دعني أتحقق من جدولي وأعود إليك.', time: '2h ago' }
    ]
  },
  {
    id: 'c2',
    name: 'Elena Rostova',
    nameAr: 'إيلينا روستوفا',
    avatar: require('../../assets/expert_elena.png'),
    unread: false,
    lastTime: '2d ago',
    lastTimeAr: 'منذ يومين',
    messages: [
      { id: 'm2_1', sender: 'user', text: 'Hi Elena, when is the electrical check finished?', textAr: 'مرحباً إيلينا، متى ينتهي فحص الكهرباء؟', time: '3d ago' },
      { id: 'm2_2', sender: 'contact', text: 'All diagnostics are complete. The alternator is charging correctly now.', textAr: 'جميع الفحوصات اكتملت. الدينامو يشحن بشكل صحيح الآن.', time: '3d ago' },
      { id: 'm2_3', sender: 'user', text: 'Awesome, I will come pick up the car tomorrow.', textAr: 'رائع، سآتي لاستلام السيارة غداً.', time: '2d ago' }
    ]
  },
  {
    id: 'c3',
    name: 'Michael Chang',
    nameAr: 'مايكل تشانغ',
    avatar: require('../../assets/expert_michael.png'),
    unread: false,
    lastTime: '4d ago',
    lastTimeAr: 'منذ ٤ أيام',
    messages: [
      { id: 'm3_1', sender: 'contact', text: 'Did you notice any noise after the strut installation?', textAr: 'هل لاحظت أي صوت بعد تركيب المساعدين؟', time: '5d ago' },
      { id: 'm3_2', sender: 'user', text: 'No, it feels very solid and quiet now. Thank you!', textAr: 'لا، إنها تبدو قوية وهادئة جداً الآن. شكراً لك!', time: '4d ago' }
    ]
  }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatsModal({
  visible,
  onClose,
  selectedLanguage
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRTL = selectedLanguage === 'Arabic';

  const [chats, setChats] = useState(initialChats);
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
        // Only trigger swipe-to-go-back if the drag starts near the left edge
        // and is primarily dragging horizontally to the right
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
  const [voiceProgress, setVoiceProgress] = useState({}); // { [msgId]: value between 0 and 1 }

  const scrollViewRef = useRef(null);
  const recordingInterval = useRef(null);
  const voicePlayIntervals = useRef({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeChat = chats.find(c => c.id === activeChatId);

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
    // Mark as read
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
  };

  const handleSendMessage = () => {
    if (!newMessageText.trim() || !activeChatId) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: newMessageText.trim(),
      textAr: newMessageText.trim(),
      time: isRTL ? 'الآن' : 'Just now'
    };

    appendMsg(newMsg);
    setNewMessageText('');
  };

  const appendMsg = (newMsg) => {
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastTime: 'Just now',
          lastTimeAr: 'الآن',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
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
      const newMsg = {
        id: `m_${Date.now()}`,
        sender: 'user',
        image: selectedImageUri,
        time: isRTL ? 'الآن' : 'Just now'
      };
      appendMsg(newMsg);
      setAttachmentMenuVisible(false);
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

  const handleSendVoice = () => {
    const durationStr = formatRecordTime(recordTime === 0 ? 3 : recordTime);
    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'user',
      voiceDuration: durationStr,
      time: isRTL ? 'الآن' : 'Just now'
    };
    appendMsg(newMsg);
    setIsRecording(false);
    setRecordTime(0);
  };

  const handleTogglePlayVoice = (msgId) => {
    if (playingVoiceId === msgId) {
      // Pause
      setPlayingVoiceId(null);
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }
    } else {
      // Play
      setPlayingVoiceId(msgId);
      
      // Clear previous interval if any
      if (voicePlayIntervals.current[msgId]) {
        clearInterval(voicePlayIntervals.current[msgId]);
      }

      // Initialize progress to 0 if starting fresh or keep current
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
  const filteredChats = chats.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameToSearch = isRTL ? c.nameAr : c.name;
    const lastMsg = c.messages[c.messages.length - 1];
    const lastMsgText = lastMsg.image ? (isRTL ? 'صورة' : 'Photo') : lastMsg.voiceDuration ? (isRTL ? 'رسالة صوتية' : 'Voice message') : lastMsg.text;
    const msgText = isRTL ? (lastMsg.textAr || lastMsgText) : (lastMsg.text || lastMsgText);
    return nameToSearch.toLowerCase().includes(query) || msgText.toLowerCase().includes(query);
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
        <StatusBar barStyle="dark-content" backgroundColor={colors.bgCreamy} />

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
            <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.backBtnRound} 
                onPress={() => setActiveChatId(null)}
                activeOpacity={0.7}
              >
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={colors.textDark} />
              </TouchableOpacity>

              <View style={[styles.headerContactInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={styles.avatarWrapperMini}>
                  <Image source={activeChat.avatar} style={styles.headerContactAvatar} />
                  <View style={styles.onlineDotMini} />
                </View>
                <View style={[styles.headerContactDetails, isRTL ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10, alignItems: 'flex-start' }]}>
                  <Text style={[styles.headerContactName, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5 }]}>
                    {isRTL ? activeChat.nameAr : activeChat.name}
                  </Text>
                  <Text style={[styles.headerStatusText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 10.5 }]}>
                    {isRTL ? 'نشط الآن' : 'Online'}
                  </Text>
                </View>
              </View>

              <View style={[styles.headerActions, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity 
                  style={styles.actionIconBtn} 
                  onPress={() => handleMockCall(isRTL ? activeChat.nameAr : activeChat.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={18} color={colors.bgBrand} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Conversation Messages Log */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesScrollContent}
              style={{ backgroundColor: colors.bgCreamy }}
            >
              {activeChat.messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const msgText = isRTL ? msg.textAr : msg.text;

                return (
                  <View 
                    key={msg.id || index}
                    style={[
                      styles.msgBubbleRow, 
                      isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                      isRTL && { flexDirection: isUser ? 'row-reverse' : 'row' }
                    ]}
                  >
                    {!isUser && (
                      <Image source={activeChat.avatar} style={styles.msgAvatar} />
                    )}
                    
                    <View style={[
                      styles.msgBubble,
                      isUser ? styles.userMsgBubble : styles.contactMsgBubble,
                      msg.image && styles.imageMsgBubble,
                      !isUser && (isRTL ? { marginRight: 8 } : { marginLeft: 8 })
                    ]}>
                      
                      {msg.image ? (
                        /* Render Image Message */
                        <View style={styles.imageMsgContainer}>
                          <Image source={{ uri: msg.image }} style={styles.imageMsgContent} resizeMode="cover" />
                        </View>
                      ) : msg.voiceDuration ? (
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
                              color={isUser ? colors.bgBrand : colors.white} 
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
                                        ? { backgroundColor: isPassed ? colors.textCream : 'rgba(247, 245, 240, 0.35)' }
                                        : { backgroundColor: isPassed ? colors.bgBrand : 'rgba(77, 110, 79, 0.2)' }
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
                        msg.image && styles.imageMsgTime
                      ]}>
                        {msg.time}
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
                  <Ionicons name="checkmark" size={18} color={colors.textCream} />
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
                  <Ionicons name="add" size={24} color={colors.bgBrand} />
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.inputField, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                  placeholderTextColor={colors.textMuted + '60'}
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
                    <Ionicons name="send" size={16} color={colors.textCream} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.sendBtn}
                    onPress={startVoiceRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={18} color={colors.textCream} />
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
            <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.backBtnRound} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={colors.textDark} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 18.0 }]}>
                {isRTL ? 'الرسائل والمحادثات' : 'Messages & Chat'}
              </Text>
              
              <View style={{ width: 36 }} />
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchEntity, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="search" size={18} color={colors.bgBrand} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, isRTL && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}
                  placeholder={isRTL ? 'ابحث في المحادثات...' : 'Search messages...'}
                  placeholderTextColor={colors.textMuted + '60'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Chats Scroll List */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollListContent}
            >
              {filteredChats.length === 0 ? (
                <View style={styles.emptyInbox}>
                  <View style={styles.emptyBadgeContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={colors.bgBrand} />
                  </View>
                  <Text style={[styles.emptyInboxText, isRTL && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
                    {isRTL ? 'لا توجد محادثات تطابق بحثك.' : 'No conversations found.'}
                  </Text>
                </View>
              ) : (
                filteredChats.map((chat) => {
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  const lastMsgText = lastMsg.image 
                    ? (isRTL ? '📷 أرسل صورة' : '📷 Sent a photo') 
                    : lastMsg.voiceDuration 
                      ? (isRTL ? '🎵 رسالة صوتية' : '🎵 Voice message') 
                      : (isRTL ? lastMsg.textAr : lastMsg.text);
                  const timeText = isRTL ? chat.lastTimeAr : chat.lastTime;
                  const nameText = isRTL ? chat.nameAr : chat.name;

                  return (
                    <TouchableOpacity
                      key={chat.id}
                      style={[
                        styles.chatCard, 
                        isRTL && { flexDirection: 'row-reverse' },
                        chat.unread && { backgroundColor: colors.bgBrandLight, borderColor: colors.bgBrand + '30' }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenConversation(chat.id)}
                    >
                      {/* Contact Avatar Wrapper */}
                      <View style={styles.avatarWrapper}>
                        <Image source={chat.avatar} style={styles.chatAvatar} />
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
                  <View style={[styles.sheetIconCircle, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="image" size={24} color={colors.bgBrand} />
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
                  <View style={[styles.sheetIconCircle, { backgroundColor: '#FFEBEE' }]}>
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
  },
  backBtnRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textDark,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
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
    borderColor: colors.bgCreamy,
  },
  headerContactDetails: {
    justifyContent: 'center',
  },
  headerContactName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textDark,
  },
  headerStatusText: {
    fontSize: 10.5,
    color: colors.bgBrand,
    fontWeight: '700',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textDark,
    fontSize: 13.5,
    fontWeight: '600',
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderGreen + '20',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  avatarWrapper: {
    position: 'relative',
  },
  chatAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
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
    borderColor: colors.white,
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
    color: colors.textDark,
  },
  chatTime: {
    fontSize: 11,
    color: colors.textMuted,
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
    color: colors.textMuted,
    fontWeight: '500',
  },
  unreadSnippetText: {
    color: colors.textDark,
    fontWeight: '700',
  },
  unreadText: {
    fontWeight: '800',
    color: colors.textDark,
  },
  unreadBadgePill: {
    backgroundColor: colors.bgBrand,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: colors.textCream,
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
    backgroundColor: colors.bgBrandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyInboxText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
    borderColor: colors.borderGreen,
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  imageMsgBubble: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  contactMsgBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen + '30',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  userMsgBubble: {
    backgroundColor: colors.bgBrand,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  contactMsgText: {
    color: colors.textDark,
  },
  userMsgText: {
    color: colors.textCream,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 5,
    fontWeight: '600',
  },
  contactMsgTime: {
    color: colors.textMuted,
  },
  userMsgTime: {
    color: 'rgba(247, 245, 240, 0.7)',
  },
  imageMsgTime: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    backgroundColor: colors.white,
  },
  contactVoicePlayBtn: {
    backgroundColor: colors.bgBrand,
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
    color: 'rgba(247, 245, 240, 0.85)',
  },
  contactVoiceTime: {
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1.2,
    borderTopColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textDark,
    maxHeight: 100,
    fontWeight: '600',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  trashBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordingWaveformWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
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
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: colors.bgCreamy,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
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
    backgroundColor: colors.textMuted + '30',
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
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
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sheetOptionText: {
    fontSize: 12.5,
    color: colors.textDark,
    fontWeight: '700',
  },
  sheetCancelBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  }
});
