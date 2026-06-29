import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, ScrollView, StatusBar, Modal,
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const scrollViewRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto scroll to bottom when messages list opens or updates
  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeChatId, activeChat?.messages?.length]);

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

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastTime: isRTL ? 'Just now' : 'Just now',
          lastTimeAr: isRTL ? 'الآن' : 'Just now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setNewMessageText('');
  };

  // Filter threads by search query
  const filteredChats = chats.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameToSearch = isRTL ? c.nameAr : c.name;
    const lastMsg = c.messages[c.messages.length - 1];
    const msgText = isRTL ? lastMsg.textAr : lastMsg.text;
    return nameToSearch.toLowerCase().includes(query) || msgText.toLowerCase().includes(query);
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
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
      <View style={[styles.container, { backgroundColor: colors.bgCreamy }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgBrand} />

        {activeChatId ? (
          // CONVERSATION VIEW (Detail)
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Conversation Header */}
            <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={[styles.backBtn, isRTL && { flexDirection: 'row-reverse' }]} 
                onPress={() => setActiveChatId(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={18} color={colors.bgBrand} style={isRTL ? { marginLeft: 2 } : { marginRight: 2 }} />
                <Text style={styles.backBtnText}>
                  {isRTL ? 'الرسائل' : 'Chats'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.headerContactDetails, isRTL ? { marginRight: 12, alignItems: 'flex-end' } : { marginLeft: 12, alignItems: 'flex-start' }]}>
                <Text style={styles.headerContactName}>
                  {isRTL ? activeChat.nameAr : activeChat.name}
                </Text>
                <Text style={styles.headerStatusText}>
                  {isRTL ? 'نشط الآن' : 'Online'}
                </Text>
              </View>
              <View style={{ width: 60 }} />
            </View>

            {/* Conversation Messages Log */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesScrollContent}
            >
              {activeChat.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const msgText = isRTL ? msg.textAr : msg.text;

                return (
                  <View 
                    key={msg.id}
                    style={[
                      styles.msgBubbleRow, 
                      isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                      isRTL && { flexDirection: isUser ? 'row' : 'row-reverse' } // Matches RTL alignment
                    ]}
                  >
                    {!isUser && (
                      <Image source={activeChat.avatar} style={styles.msgAvatar} />
                    )}
                    <View style={[
                      styles.msgBubble,
                      isUser ? styles.userMsgBubble : styles.contactMsgBubble,
                      !isUser && (isRTL ? { marginRight: 8 } : { marginLeft: 8 })
                    ]}>
                      <Text style={[
                        styles.msgText,
                        isUser ? styles.userMsgText : styles.contactMsgText,
                        isRTL && { textAlign: 'right' }
                      ]}>
                        {msgText}
                      </Text>
                      <Text style={[
                        styles.msgTime,
                        isUser ? styles.userMsgTime : styles.contactMsgTime,
                        isRTL ? { textAlign: 'left' } : { textAlign: 'right' }
                      ]}>
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Send Bar */}
            <View style={[styles.inputBar, isRTL && { flexDirection: 'row-reverse' }]}>
              <TextInput
                style={[styles.inputField, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                placeholderTextColor="#ADADAD"
                value={newMessageText}
                onChangeText={setNewMessageText}
                multiline={true}
              />
              <TouchableOpacity 
                style={styles.sendBtn}
                onPress={handleSendMessage}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          // CHAT THREADS LIST VIEW (Inbox)
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={[styles.backBtn, isRTL && { flexDirection: 'row-reverse' }]} 
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={18} color={colors.bgBrand} style={isRTL ? { marginLeft: 2 } : { marginRight: 2 }} />
                <Text style={styles.backBtnText}>
                  {isRTL ? 'الرئيسية' : 'Home'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {isRTL ? 'الرسائل' : 'Messages'}
              </Text>
              <View style={{ width: 80 }} />
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchEntity, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
                  placeholder={isRTL ? 'ابحث في المحادثات...' : 'Search messages...'}
                  placeholderTextColor="#ADADAD"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
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
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color="rgba(77, 110, 79, 0.16)" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyInboxText}>
                    {isRTL ? 'لا توجد محادثات تطابق بحثك.' : 'No conversations found.'}
                  </Text>
                </View>
              ) : (
                filteredChats.map((chat) => {
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  const lastMsgText = isRTL ? lastMsg.textAr : lastMsg.text;
                  const timeText = isRTL ? chat.lastTimeAr : chat.lastTime;
                  const nameText = isRTL ? chat.nameAr : chat.name;

                  return (
                    <TouchableOpacity
                      key={chat.id}
                      style={[styles.chatCard, isRTL && { flexDirection: 'row-reverse' }]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenConversation(chat.id)}
                    >
                      {/* Contact Avatar */}
                      <Image source={chat.avatar} style={styles.chatAvatar} />

                      {/* Content Details */}
                      <View style={[styles.chatDetails, isRTL ? { marginRight: 12, alignItems: 'flex-end' } : { marginLeft: 12, alignItems: 'flex-start' }]}>
                        <View style={[styles.chatCardTop, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Text style={[styles.chatName, chat.unread && styles.unreadText]}>
                            {nameText}
                          </Text>
                          <Text style={styles.chatTime}>{timeText}</Text>
                        </View>
                        <Text 
                          style={[styles.chatSnippet, chat.unread && styles.unreadText, isRTL && { textAlign: 'right' }]} 
                          numberOfLines={1}
                        >
                          {lastMsgText}
                        </Text>
                      </View>

                      {/* Unread badge circle */}
                      {chat.unread && (
                        <View style={[styles.unreadBadge, isRTL ? { left: 0 } : { right: 0 }]} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  headerTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 24,
    color: colors.bgBrand,
    textAlign: 'center',
    marginTop: 2,
  },
  headerContactDetails: {
    flex: 1,
  },
  headerContactName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
  },
  headerStatusText: {
    fontSize: 11,
    color: colors.bgBrand,
    fontWeight: '700',
    marginTop: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  searchEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 12,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '500',
  },
  scrollListContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderGreen,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1.5,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  chatDetails: {
    flex: 1,
  },
  chatCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  chatTime: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  chatSnippet: {
    fontSize: 12.5,
    color: colors.textMuted,
    width: '90%',
  },
  unreadText: {
    fontWeight: '800',
    color: colors.textDark,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgBrand,
  },
  emptyInbox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyInboxText: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  msgBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  contactMsgBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderBottomLeftRadius: 3,
  },
  userMsgBubble: {
    backgroundColor: colors.bgBrand,
    borderBottomRightRadius: 3,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  contactMsgText: {
    color: colors.textDark,
  },
  userMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
  },
  contactMsgTime: {
    color: colors.textMuted,
  },
  userMsgTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1.2,
    borderTopColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13.5,
    color: colors.textDark,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 8,
  }
});
