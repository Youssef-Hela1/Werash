import { supabase, getUserProfile } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessagePushNotification } from './notificationService';

const STORAGE_KEY_DELETED_TIMESTAMPS = '@werash_deleted_conv_timestamps_';

/**
 * Returns canonically sorted participants where p1 < p2.
 */
export function getCanonicalParticipants(userAId, userBId) {
  if (!userAId || !userBId) return null;
  const [p1, p2] = [String(userAId), String(userBId)].sort();
  return {
    p1,
    p2,
    isP1: String(userAId) === p1,
  };
}

/**
 * Retrieves the single canonical conversation between two users, or creates one if it doesn't exist.
 */
export async function getOrCreateConversation(currentUser, targetUser) {
  if (!currentUser?.id) throw new Error('Current user is required');
  const targetId = targetUser?.userId || targetUser?.user_id || targetUser?.id;
  if (!targetId || targetId === currentUser.id) throw new Error('Valid distinct target user is required');

  const canon = getCanonicalParticipants(currentUser.id, targetId);
  if (!canon) throw new Error('Could not resolve canonical participants');
  const { p1, p2, isP1 } = canon;

  // 1. Look up existing conversation
  const { data: existing, error: selectErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // 2. Need to create a new conversation row. Ensure profile names are available.
  let myName = currentUser.fullName || currentUser.name;
  let myAvatar = currentUser.avatarUrl || currentUser.avatar;
  if (!myName) {
    const myProfile = await getUserProfile(currentUser.id);
    myName = myProfile?.full_name || 'User';
    myAvatar = myProfile?.avatar_url || myAvatar;
  }
  const myHandle = `@${String(myName).toLowerCase().replace(/[\s\W]+/g, '')}`;

  let theirName = targetUser?.author || targetUser?.fullName || targetUser?.name;
  let theirAvatar = typeof targetUser?.avatar === 'string' ? targetUser.avatar : targetUser?.avatar?.uri;
  if (!theirName) {
    const theirProfile = await getUserProfile(targetId);
    theirName = theirProfile?.full_name || 'User';
    theirAvatar = theirProfile?.avatar_url || theirAvatar;
  }
  const theirHandle = `@${String(theirName).toLowerCase().replace(/[\s\W]+/g, '')}`;

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
    last_sender_id: currentUser.id,
  };

  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert([newRow])
    .select()
    .single();

  if (createErr) {
    // If concurrent insert created it, fetch again
    const { data: retry } = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle();
    if (retry) return retry;
    throw createErr;
  }

  return created;
}

/**
 * Inserts a direct message. The database trigger automatically updates conversations table.
 */
export async function sendDirectMessage({
  conversationId,
  senderId,
  receiverId,
  text = '',
  mediaType = 'text',
  mediaUrl = null,
  metadata = null,
  voiceDuration = null,
  senderName = null,
}) {
  if (!conversationId || !senderId || !receiverId) {
    throw new Error('conversationId, senderId, and receiverId are required to send a message');
  }

  const newMsgRow = {
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    text: text || '',
    media_type: mediaType,
    media_url: mediaUrl,
    metadata: metadata,
    voice_duration: voiceDuration,
    is_read: false,
  };

  const { data, error } = await supabase
    .from('direct_messages')
    .insert([newMsgRow])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Dispatch native push notification to recipient asynchronously
  sendChatMessagePushNotification({
    recipientId: receiverId,
    senderName: senderName || 'User',
    senderId,
    conversationId,
    messageText: text,
    mediaType,
  }).catch((pushErr) => {
    console.log('[chatService] Push notification dispatch note:', pushErr?.message);
  });

  return data;
}

/**
 * Marks messages in a conversation as read for the receiver.
 */
export async function markConversationMessagesRead(conversationId, currentUserId) {
  if (!conversationId || !currentUserId) return;
  try {
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
  } catch (err) {
    console.warn('markConversationMessagesRead error:', err);
  }
}

/**
 * Records local deletion timestamp for a conversation so only messages after this time appear.
 */
export async function recordConversationDeletedLocally(conversationId, currentUserId) {
  if (!conversationId || !currentUserId) return;
  try {
    const key = `${STORAGE_KEY_DELETED_TIMESTAMPS}${currentUserId}`;
    const raw = await AsyncStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    map[conversationId] = Date.now();
    await AsyncStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.warn('recordConversationDeletedLocally error:', e);
  }
}

/**
 * Retrieves the local deletion timestamp map for a user.
 */
export async function getLocalDeletedTimestamps(currentUserId) {
  if (!currentUserId) return {};
  try {
    const key = `${STORAGE_KEY_DELETED_TIMESTAMPS}${currentUserId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}
