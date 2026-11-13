import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Configure foreground notification behavior safely
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('[NotificationService] setNotificationHandler note:', e?.message);
}

const EXPO_PROJECT_ID = '5feaa8e4-c7b3-4ae8-86b2-dac97e3c9fed';
const PUSH_TOKEN_CACHE_KEY = '@werash_cached_push_token';

/**
 * Request notification permissions and register the device for push notifications.
 * Returns the Expo Push Token string or null if unavailable / not granted.
 */
export async function registerForPushNotificationsAsync(userId) {
  try {
    if (!Device.isDevice) {
      console.log('[NotificationService] Push notifications require a physical device');
      return null;
    }

    // Android channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Werash Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003514',
        sound: 'default',
      });
    }

    // Permission check
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Notification permissions not granted');
      return null;
    }

    // Get the Expo Push Token
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    const pushToken = tokenResult?.data;

    if (!pushToken) {
      console.warn('[NotificationService] Failed to obtain push token');
      return null;
    }

    console.log('[NotificationService] Registered push token:', pushToken);
    await AsyncStorage.setItem(PUSH_TOKEN_CACHE_KEY, pushToken);

    // Save token to Supabase for the user
    if (userId) {
      await savePushTokenToCloud(userId, pushToken);
    }

    return pushToken;
  } catch (err) {
    console.warn('[NotificationService] registerForPushNotificationsAsync error:', err);
    return null;
  }
}

/**
 * Persist the push token in Supabase user_push_tokens and profiles
 */
export async function savePushTokenToCloud(userId, pushToken) {
  if (!userId || !pushToken) return;

  try {
    // 1. Try upserting to user_push_tokens table
    const { error: tokenTableError } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: userId,
          expo_push_token: pushToken,
          platform: Platform.OS,
          device_name: Device.modelName || Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      );

    if (tokenTableError) {
      // Table may not exist yet if migration hasn't been executed
      console.log('[NotificationService] Note on user_push_tokens upsert:', tokenTableError.message);
    }

    // 2. Also try saving into profiles.expo_push_token as convenience
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ expo_push_token: pushToken })
      .eq('id', userId);

    if (profileError) {
      // Column may not exist yet
      console.log('[NotificationService] Note on profiles.expo_push_token update:', profileError.message);
    }
  } catch (err) {
    console.warn('[NotificationService] savePushTokenToCloud error:', err);
  }
}

/**
 * Retrieve push token(s) for a recipient user
 */
export async function getRecipientPushTokens(recipientId) {
  if (!recipientId) return [];

  const tokens = new Set();

  try {
    // Try user_push_tokens table
    const { data: userTokens } = await supabase
      .from('user_push_tokens')
      .select('expo_push_token')
      .eq('user_id', recipientId);

    if (userTokens && userTokens.length > 0) {
      userTokens.forEach((row) => {
        if (row.expo_push_token && isValidExpoPushToken(row.expo_push_token)) {
          tokens.add(row.expo_push_token);
        }
      });
    }
  } catch (_) {}

  // Fallback to profiles.expo_push_token if none found
  if (tokens.size === 0) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', recipientId)
        .maybeSingle();

      if (prof?.expo_push_token && isValidExpoPushToken(prof.expo_push_token)) {
        tokens.add(prof.expo_push_token);
      }
    } catch (_) {}
  }

  return Array.from(tokens);
}

/**
 * Send an Expo Push Notification to a recipient user
 */
export async function sendChatMessagePushNotification({
  recipientId,
  senderName,
  senderId,
  conversationId,
  messageText,
  mediaType,
  unreadCount,
}) {
  if (!recipientId) return false;

  try {
    const tokens = await getRecipientPushTokens(recipientId);
    if (!tokens || tokens.length === 0) {
      console.log('[NotificationService] No push tokens found for recipient:', recipientId);
      return false;
    }

    const title = senderName || 'Werash';
    let body = `${senderName || 'Someone'} sent you a new message`;

    if (mediaType === 'audio') {
      body = `🎤 ${senderName || 'User'} sent you a voice message`;
    } else if (mediaType === 'images' || mediaType === 'image') {
      body = `📷 ${senderName || 'User'} sent you photos`;
    } else if (mediaType === 'specialist') {
      body = `🔧 ${senderName || 'User'} shared a specialist card`;
    } else if (messageText && typeof messageText === 'string' && messageText.trim().length > 0) {
      const trimmed = messageText.trim();
      body = trimmed.length > 100 ? `${trimmed.substring(0, 97)}...` : trimmed;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: {
        type: 'chat_message',
        conversationId: conversationId || null,
        senderId: senderId || null,
        senderName: senderName || null,
      },
      badge: typeof unreadCount === 'number' ? unreadCount : undefined,
      priority: 'high',
      channelId: 'default',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('[NotificationService] Push notification response:', result);
    return true;
  } catch (err) {
    console.warn('[NotificationService] sendChatMessagePushNotification error:', err);
    return false;
  }
}

/**
 * Validate standard Expo push token pattern
 */
function isValidExpoPushToken(token) {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}
