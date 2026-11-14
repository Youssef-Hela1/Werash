import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STORAGE_KEY_NOTIFICATIONS_PREFIX = '@werash_notifications_data_';
const STORAGE_KEY_READ_IDS_PREFIX = '@werash_notifications_read_ids_';

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'message',
    title: 'New message',
    titleAr: 'رسالة جديدة',
    body: 'Ahmed sent you a message about your post.',
    bodyAr: 'أرسل لك أحمد رسالة بخصوص منشورك.',
    date: '5 min ago',
    dateAr: 'منذ 5 دقائق',
    read: false,
    section: 'today',
    targetTab: 'chat',
  },
  {
    id: 'n2',
    type: 'reply',
    title: 'New reply',
    titleAr: 'رد جديد',
    body: 'Omar replied to your question in Community.',
    bodyAr: 'رد عمر على سؤالك في المجتمع.',
    date: '24 min ago',
    dateAr: 'منذ 24 دقيقة',
    read: false,
    section: 'today',
    targetTab: 'community',
  },
  {
    id: 'n3',
    type: 'service',
    title: 'Service reminder',
    titleAr: 'تذكير بالصيانة',
    body: 'Check your saved engine oil service details.',
    bodyAr: 'تحقق من تفاصيل صيانة زيت المحرك المحفوظة.',
    date: '1 hr ago',
    dateAr: 'منذ ساعة',
    read: false,
    section: 'today',
    targetTab: 'garage',
  },
  {
    id: 'n4',
    type: 'welcome',
    title: 'Welcome to WERASH',
    titleAr: 'مرحباً بك في ورش',
    body: 'Your garage, specialists, and community in one place.',
    bodyAr: 'كراجك، الفنيين، والمجتمع في مكان واحد.',
    date: 'Yesterday',
    dateAr: 'أمس',
    read: true,
    section: 'earlier',
    targetTab: 'garage',
  },
  {
    id: 'n5',
    type: 'profile',
    title: 'Profile updated',
    titleAr: 'تم تحديث الملف الشخصي',
    body: 'Your profile changes have been saved.',
    bodyAr: 'تم حفظ تغييرات ملفك الشخصي بنجاح.',
    date: 'Yesterday',
    dateAr: 'أمس',
    read: true,
    section: 'earlier',
    targetTab: 'more',
  },
];

/**
 * Format relative time for notifications
 */
export function formatNotificationTime(timestamp, isRTL = false) {
  if (!timestamp) return isRTL ? 'الآن' : 'Just now';
  const now = Date.now();
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return isRTL ? 'الآن' : 'Just now';
  if (diffMin < 60) return isRTL ? `منذ ${diffMin} دقيقة` : `${diffMin} min ago`;
  if (diffHr < 24) return isRTL ? `منذ ${diffHr} ساعة` : `${diffHr} hr ago`;
  if (diffDay === 1) return isRTL ? 'أمس' : 'Yesterday';
  if (diffDay < 7) return isRTL ? `منذ ${diffDay} أيام` : `${diffDay}d ago`;
  return isRTL ? 'في وقت سابق' : 'Earlier';
}

/**
 * Load persisted notifications and read status
 */
export async function loadPersistedNotifications(userId) {
  try {
    const dataKey = `${STORAGE_KEY_NOTIFICATIONS_PREFIX}${userId || 'guest'}`;
    const readKey = `${STORAGE_KEY_READ_IDS_PREFIX}${userId || 'guest'}`;

    const [[, storedData], [, storedReadIds]] = await AsyncStorage.multiGet([dataKey, readKey]);

    let list = INITIAL_NOTIFICATIONS;
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch (_) {}
    }

    if (storedReadIds) {
      try {
        const readIds = JSON.parse(storedReadIds);
        if (Array.isArray(readIds)) {
          const readSet = new Set(readIds);
          list = list.map(item => ({
            ...item,
            read: readSet.has(item.id) ? true : item.read,
          }));
        }
      } catch (_) {}
    }

    return list;
  } catch (err) {
    console.warn('[NotificationManager] load error:', err);
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Save notifications list to storage
 */
export async function savePersistedNotifications(userId, list) {
  if (!Array.isArray(list)) return;
  try {
    const dataKey = `${STORAGE_KEY_NOTIFICATIONS_PREFIX}${userId || 'guest'}`;
    const readKey = `${STORAGE_KEY_READ_IDS_PREFIX}${userId || 'guest'}`;
    const readIds = list.filter(n => n.read).map(n => n.id);

    await AsyncStorage.multiSet([
      [dataKey, JSON.stringify(list)],
      [readKey, JSON.stringify(readIds)],
    ]);
  } catch (err) {
    console.warn('[NotificationManager] save error:', err);
  }
}

/**
 * Evaluate upcoming vehicle services from garage
 */
export async function getUpcomingVehicleServiceNotifications({
  userVehicles = [],
  currentUserId = 'guest',
  isRTL = false,
}) {
  if (!Array.isArray(userVehicles) || userVehicles.length === 0) return [];

  const readKey = `${STORAGE_KEY_READ_IDS_PREFIX}${currentUserId}`;
  let readIds = [];
  try {
    const raw = await AsyncStorage.getItem(readKey);
    if (raw) readIds = JSON.parse(raw) || [];
  } catch (_) {}

  const results = [];

  userVehicles.forEach((car) => {
    if (!car) return;
    const odoNum = car.odometer ? parseInt(car.odometer, 10) : 0;
    const services = car.services || {};

    // Check Engine Oil (supports nested services.engineOil and legacy flat fields)
    const engineOil = services.engineOil || {};
    const lastService = engineOil.lastService || (car.lastOil ? parseInt(car.lastOil, 10) : 0);
    const lifespan = engineOil.lifespan || (car.oilLife ? parseInt(car.oilLife, 10) : 10000);
    const nextDue = lastService + lifespan;
    const remainingKm = nextDue - odoNum;

    const carName = car.model ? `${car.brand || ''} ${car.model}`.trim() : (car.brand || 'Vehicle');

    // If service is due within 1000 km or overdue
    if (remainingKm <= 1000 && (lastService > 0 || odoNum > 0)) {
      const isOverdue = remainingKm <= 0;
      const notifId = `service_oil_${car.id || car.plateNumber || 'main'}`;
      const isRead = readIds.includes(notifId);

      results.push({
        id: notifId,
        type: 'service',
        title: isOverdue ? (isRTL ? 'صيانة متأخرة!' : 'Service overdue!') : (isRTL ? 'تذكير بالصيانة' : 'Service reminder'),
        titleAr: isOverdue ? 'صيانة متأخرة!' : 'تذكير بالصيانة',
        body: isOverdue 
          ? (isRTL ? `سيارتك ${carName} متأخرة عن موعد تغيير زيت المحرك.` : `Your ${carName} is overdue for engine oil replacement.`)
          : (isRTL ? `سيارتك ${carName} مستحقة لتغيير زيت المحرك خلال ${Math.max(0, remainingKm)} كم.` : `Your ${carName} is due for Engine Oil replacement in ${Math.max(0, remainingKm)} km.`),
        bodyAr: isOverdue
          ? `سيارتك ${carName} متأخرة عن موعد تغيير زيت المحرك.`
          : `سيارتك ${carName} مستحقة لتغيير زيت المحرك خلال ${Math.max(0, remainingKm)} كم.`,
        date: isRTL ? 'اليوم' : 'Today',
        dateAr: 'اليوم',
        read: isRead,
        section: 'today',
        targetTab: 'garage',
        data: { vehicleId: car.id },
      });
    }
  });

  return results;
}

/**
 * Fetch existing likes from database for current user's posts in parallel batches
 */
export async function getDatabaseLikesNotifications({
  currentUserId,
  isRTL = false,
}) {
  if (!currentUserId || currentUserId === 'guest') return [];

  try {
    const { data: posts, error: postsErr } = await supabase
      .from('community_posts')
      .select('id, user_id, content, likes_count')
      .eq('user_id', currentUserId);

    if (postsErr || !Array.isArray(posts) || posts.length === 0) return [];

    const readKey = `${STORAGE_KEY_READ_IDS_PREFIX}${currentUserId}`;
    let readIds = [];
    try {
      const raw = await AsyncStorage.getItem(readKey);
      if (raw) readIds = JSON.parse(raw) || [];
    } catch (_) {}

    const postIds = posts.map((p) => p.id);
    const { data: allLikesData } = await supabase
      .from('community_post_likes')
      .select('post_id, user_id, created_at')
      .in('post_id', postIds)
      .order('created_at', { ascending: false });

    if (!allLikesData || allLikesData.length === 0) return [];

    const likesByPost = {};
    const likerUserIds = new Set();
    allLikesData.forEach((l) => {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l);
      likerUserIds.add(l.user_id);
    });

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(likerUserIds));

    const profileMap = {};
    if (profilesData) {
      profilesData.forEach((p) => {
        profileMap[p.id] = p.full_name;
      });
    }

    const results = [];

    for (const p of posts) {
      const likesData = likesByPost[p.id];
      if (!likesData || likesData.length === 0) continue;

      const otherLikes = likesData.filter((l) => l.user_id !== currentUserId);
      const likersToUse = otherLikes.length > 0 ? otherLikes : likesData;

      const totalLikesCount = likersToUse.length;
      const newestLikerId = likersToUse[0].user_id;
      const newestCreatedAt = likersToUse[0].created_at;

      let newestName = isRTL ? 'شخص ما' : 'Someone';
      if (newestLikerId === currentUserId) {
        newestName = isRTL ? 'أنت' : 'You';
      } else if (profileMap[newestLikerId]?.trim()) {
        newestName = profileMap[newestLikerId].trim();
      }

      const othersCount = totalLikesCount - 1;
      let bodyEn = '';
      let bodyAr = '';

      if (othersCount === 0) {
        bodyEn = `${newestName} liked your post.`;
        bodyAr = `أعجب ${newestName} بمنشورك.`;
      } else if (othersCount === 1) {
        bodyEn = `${newestName} and 1 other liked your post.`;
        bodyAr = `أعجب ${newestName} وشخص آخر بمنشورك.`;
      } else {
        bodyEn = `${newestName} and ${othersCount} others liked your post.`;
        bodyAr = `أعجب ${newestName} و ${othersCount} آخرين بمنشورك.`;
      }

      const notifId = `like_post_${p.id}`;
      const isRead = readIds.includes(notifId);

      results.push({
        id: notifId,
        type: 'like',
        title: isRTL ? 'إعجاب بالمنشور' : 'Post liked',
        titleAr: 'إعجاب بالمنشور',
        body: isRTL ? bodyAr : bodyEn,
        bodyAr: bodyAr,
        date: formatNotificationTime(newestCreatedAt, isRTL),
        dateAr: formatNotificationTime(newestCreatedAt, true),
        read: isRead,
        section: 'today',
        targetTab: 'community',
        data: {
          postId: p.id,
          totalLikesCount,
          newestLikerName: newestName,
        },
      });
    }

    return results;
  } catch (err) {
    console.warn('[NotificationManager] getDatabaseLikesNotifications error:', err);
    return [];
  }
}

/**
 * Instant atomic pull-to-refresh sync for all notifications
 */
export async function syncAllNotifications({
  currentUser,
  userVehicles = [],
  setNotifications,
  isRTL = false,
}) {
  const currentUserId = currentUser?.id || 'guest';

  // 1. Gather all notifications in parallel in memory
  const [serviceItems, likeItems] = await Promise.all([
    getUpcomingVehicleServiceNotifications({ userVehicles, currentUserId, isRTL }),
    getDatabaseLikesNotifications({ currentUserId, isRTL }),
  ]);

  const itemsToMerge = [...serviceItems, ...likeItems];
  if (itemsToMerge.length === 0) return;

  // 2. Perform a single batch update to React state and AsyncStorage (instant, no card-by-card updating)
  setNotifications((prev) => {
    let nextList = [...prev];

    for (const newItem of itemsToMerge) {
      const idx = nextList.findIndex((n) => n.id === newItem.id);
      if (idx !== -1) {
        nextList[idx] = {
          ...nextList[idx],
          ...newItem,
          read: newItem.read !== undefined ? newItem.read : nextList[idx].read,
        };
      } else {
        nextList.unshift(newItem);
      }
    }

    savePersistedNotifications(currentUserId, nextList);
    return nextList;
  });
}

/**
 * Set up realtime listeners for incoming messages, comments, likes, and service reminders
 */
export function setupRealtimeNotifications({
  currentUser,
  userVehicles = [],
  setNotifications,
  isRTL = false,
}) {
  const currentUserId = currentUser?.id || 'guest';

  // Helper to add or clump a notification item
  const upsertNotification = (newItem) => {
    setNotifications((prev) => {
      const idx = prev.findIndex((n) => n.id === newItem.id);
      let updated;
      if (idx !== -1) {
        // Clump/update existing notification into a single updated card
        const existing = prev[idx];
        const merged = {
          ...existing,
          ...newItem,
          read: newItem.read !== undefined ? newItem.read : false,
        };
        const withoutOld = prev.filter((_, i) => i !== idx);
        updated = [merged, ...withoutOld];
      } else {
        updated = [newItem, ...prev];
      }
      savePersistedNotifications(currentUserId, updated);
      return updated;
    });
  };

  const pushNotification = upsertNotification;

  // Run initial sync on mount
  syncAllNotifications({ currentUser, userVehicles, setNotifications, isRTL }).catch(() => {});

  if (!currentUser?.id) {
    return () => {};
  }

  // 2. Direct Messages Realtime Listener
  const dmChannel = supabase
    .channel(`notif_dms_${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${currentUserId}`,
      },
      async (payload) => {
        const msg = payload.new;
        if (!msg || msg.sender_id === currentUserId) return;

        // Fetch sender name
        let senderName = isRTL ? 'مستخدم' : 'User';
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .maybeSingle();
          if (prof?.full_name) senderName = prof.full_name;
        } catch (_) {}

        let bodyText = msg.text || '';
        if (msg.media_type === 'audio') {
          bodyText = isRTL ? 'أرسل لك تسجيلاً صوتياً' : 'sent you a voice message.';
        } else if (msg.media_type === 'image' || msg.media_type === 'images') {
          bodyText = isRTL ? 'أرسل لك صوراً' : 'sent you photos.';
        } else if (msg.media_type === 'specialist') {
          bodyText = isRTL ? 'شارك معك بطاقة فني' : 'shared a specialist card.';
        } else {
          bodyText = isRTL 
            ? `أرسل لك رسالة: "${bodyText.substring(0, 45)}"` 
            : `sent you a message: "${bodyText.substring(0, 45)}"`;
        }

        pushNotification({
          id: `msg_${msg.id}`,
          type: 'message',
          title: isRTL ? 'رسالة جديدة' : 'New message',
          titleAr: 'رسالة جديدة',
          body: `${senderName} ${bodyText}`,
          bodyAr: `${senderName} ${bodyText}`,
          date: formatNotificationTime(msg.created_at, isRTL),
          dateAr: formatNotificationTime(msg.created_at, true),
          read: false,
          section: 'today',
          targetTab: 'chat',
          data: {
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            senderName,
          },
        });
      }
    )
    .subscribe();

  // 3. Post Comments & Replies Realtime Listener
  const commentsChannel = supabase
    .channel(`notif_comments_${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_post_comments',
      },
      async (payload) => {
        const c = payload.new;
        if (!c || c.user_id === currentUserId) return;

        try {
          // Check if the comment is on a post owned by currentUser, or is a reply to currentUser's comment
          let isReplyToMe = false;
          let isCommentOnMyPost = false;

          if (c.parent_id) {
            const { data: parentComment } = await supabase
              .from('community_post_comments')
              .select('user_id')
              .eq('id', c.parent_id)
              .maybeSingle();
            if (parentComment?.user_id === currentUserId) {
              isReplyToMe = true;
            }
          }

          if (!isReplyToMe && c.post_id) {
            const { data: post } = await supabase
              .from('community_posts')
              .select('user_id')
              .eq('id', c.post_id)
              .maybeSingle();
            if (post?.user_id === currentUserId) {
              isCommentOnMyPost = true;
            }
          }

          const commenterName = c.author_name || (isRTL ? 'مستخدم' : 'Someone');

          if (isReplyToMe) {
            pushNotification({
              id: `reply_${c.id}`,
              type: 'reply',
              title: isRTL ? 'رد جديد' : 'New reply',
              titleAr: 'رد جديد',
              body: isRTL 
                ? `رد ${commenterName} على سؤالك في المجتمع.`
                : `${commenterName} replied to your question in Community.`,
              bodyAr: `رد ${commenterName} على سؤالك في المجتمع.`,
              date: formatNotificationTime(c.created_at, isRTL),
              dateAr: formatNotificationTime(c.created_at, true),
              read: false,
              section: 'today',
              targetTab: 'community',
              data: { postId: c.post_id, commentId: c.id },
            });
          } else if (isCommentOnMyPost) {
            const snippet = (c.content || '').substring(0, 50);
            pushNotification({
              id: `comment_${c.id}`,
              type: 'comment',
              title: isRTL ? 'تعليق جديد' : 'New comment',
              titleAr: 'تعليق جديد',
              body: isRTL 
                ? `علّق ${commenterName} على منشورك: "${snippet}"`
                : `${commenterName} commented on your post: "${snippet}"`,
              bodyAr: `علّق ${commenterName} على منشورك: "${snippet}"`,
              date: formatNotificationTime(c.created_at, isRTL),
              dateAr: formatNotificationTime(c.created_at, true),
              read: false,
              section: 'today',
              targetTab: 'community',
              data: { postId: c.post_id, commentId: c.id },
            });
          }
        } catch (err) {
          console.warn('[NotificationManager] comments check error:', err);
        }
      }
    )
    .subscribe();

  // 4. Post Likes Handler with Clumping/Aggregation
  const handlePostLiked = async (postId, fallbackLikerId = null) => {
    if (!postId || !currentUserId || currentUserId === 'guest') return;

    try {
      // 1. Fetch post to ensure currentUser is the author
      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .select('id, user_id, content')
        .eq('id', postId)
        .maybeSingle();

      if (postErr || !post || post.user_id !== currentUserId) {
        return; // Not authored by current user
      }

      // 2. Query all likes on this post
      const { data: likesData } = await supabase
        .from('community_post_likes')
        .select('user_id, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      // Filter out self-likes if other users have liked, otherwise fall back to all likers
      const otherLikes = (likesData || []).filter((l) => l.user_id !== currentUserId);
      const likersToUse = otherLikes.length > 0 ? otherLikes : (likesData || []);

      let likerIds = likersToUse.map((l) => l.user_id);
      if (fallbackLikerId && !likerIds.includes(fallbackLikerId)) {
        likerIds = [fallbackLikerId, ...likerIds];
      }

      if (likerIds.length === 0) return;

      const totalLikesCount = likerIds.length;
      const newestLikerId = likerIds[0];

      // 3. Fetch newest liker's profile name
      let newestName = isRTL ? 'شخص ما' : 'Someone';
      if (newestLikerId === currentUserId) {
        newestName = isRTL ? 'أنت' : 'You';
      } else {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newestLikerId)
            .maybeSingle();
          if (prof?.full_name && prof.full_name.trim()) {
            newestName = prof.full_name.trim();
          }
        } catch (_) {}
      }

      // 4. Format clumped wording
      const othersCount = totalLikesCount - 1;
      let bodyEn = '';
      let bodyAr = '';

      if (othersCount === 0) {
        bodyEn = `${newestName} liked your post.`;
        bodyAr = `أعجب ${newestName} بمنشورك.`;
      } else if (othersCount === 1) {
        bodyEn = `${newestName} and 1 other liked your post.`;
        bodyAr = `أعجب ${newestName} وشخص آخر بمنشورك.`;
      } else {
        bodyEn = `${newestName} and ${othersCount} others liked your post.`;
        bodyAr = `أعجب ${newestName} و ${othersCount} آخرين بمنشورك.`;
      }

      const notifId = `like_post_${postId}`;

      upsertNotification({
        id: notifId,
        type: 'like',
        title: isRTL ? 'إعجاب بالمنشور' : 'Post liked',
        titleAr: 'إعجاب بالمنشور',
        body: isRTL ? bodyAr : bodyEn,
        bodyAr: bodyAr,
        date: isRTL ? 'الآن' : 'Just now',
        dateAr: 'الآن',
        read: false,
        section: 'today',
        targetTab: 'community',
        data: {
          postId,
          totalLikesCount,
          newestLikerName: newestName,
        },
      });
    } catch (err) {
      console.warn('[NotificationManager] handlePostLiked error:', err);
    }
  };

  // Listen to both community_post_likes (INSERT) and community_posts (UPDATE on likes_count)
  const likesChannel = supabase
    .channel(`notif_likes_${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_post_likes',
      },
      (payload) => {
        const like = payload.new;
        if (!like) return;
        handlePostLiked(like.post_id, like.user_id);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_posts',
        filter: `user_id=eq.${currentUserId}`,
      },
      (payload) => {
        const post = payload.new;
        const oldPost = payload.old;
        if (!post) return;
        const newLikes = parseInt(post.likes_count, 10) || 0;
        const oldLikes = parseInt(oldPost?.likes_count, 10) || 0;
        if (newLikes > oldLikes) {
          handlePostLiked(post.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(dmChannel);
    supabase.removeChannel(commentsChannel);
    supabase.removeChannel(likesChannel);
  };
}
