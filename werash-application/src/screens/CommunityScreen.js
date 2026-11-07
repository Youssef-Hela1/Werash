import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatsModal from '../components/ChatsModal';

export default function CommunityScreen({
  currentUser,
  selectedLanguage,
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 48 : 24);
  const [chatsVisible, setChatsVisible] = useState(false);
  const isRtl = selectedLanguage === 'Arabic';

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }]}>
      {/* Top Header Row with Right-Aligned Message Icon */}
      <View style={[styles.headerRow, isRtl && styles.headerRowRtl]}>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => setChatsVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#555555" />
        </TouchableOpacity>
      </View>

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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    height: 44,
  },
  headerRowRtl: {
    flexDirection: 'row-reverse',
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
});
