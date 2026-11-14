import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, SUPABASE_URL } from './supabase';

const STORAGE_KEY_PROFILES_CACHE = '@werash_profiles_cache_v3';

// In-memory cache for ultra-fast (0ms) synchronous access
const profilesCache = new Map(); // userId -> Profile object
const nameIndex = new Map();     // normalized fullName -> userId
const listeners = new Set();     // (userId, profile) => void
let isInitialized = false;
let realtimeSubscription = null;

const normalizeName = (name) => {
  if (!name) return '';
  return String(name).trim().toLowerCase();
};

const notifyListeners = (userId, profile) => {
  listeners.forEach((fn) => {
    try {
      fn(userId, profile);
    } catch (e) {
      console.warn('userProfileCache listener exception:', e);
    }
  });
};

const persistCache = async () => {
  try {
    const list = Array.from(profilesCache.values());
    await AsyncStorage.setItem(STORAGE_KEY_PROFILES_CACHE, JSON.stringify(list));
  } catch (err) {
    console.warn('userProfileCache persist error:', err);
  }
};

/**
 * Scan Supabase storage community-media folder for the newest avatar and banner
 * uploaded by a user, even if the Postgres profiles table is stale.
 */
export async function resolveStorageAssetsForUser(userId) {
  if (!userId || typeof userId !== 'string' || userId.length < 10) {
    return null;
  }
  try {
    const { data: files, error } = await supabase.storage
      .from('community-media')
      .list(userId);

    if (error || !Array.isArray(files) || files.length === 0) {
      return null;
    }

    const avatars = files
      .filter(f => f.name && f.name.startsWith('avatar_'))
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    const banners = files
      .filter(f => f.name && f.name.startsWith('banner_'))
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    const latestAvatarFile = avatars[0]?.name || null;
    const latestBannerFile = banners[0]?.name || null;

    const latestAvatarUrl = latestAvatarFile
      ? `${SUPABASE_URL}/storage/v1/object/public/community-media/${userId}/${latestAvatarFile}`
      : null;

    const latestBannerUrl = latestBannerFile
      ? `${SUPABASE_URL}/storage/v1/object/public/community-media/${userId}/${latestBannerFile}`
      : null;

    return {
      latestAvatarUrl,
      latestBannerUrl,
      avatarUpdatedAt: avatars[0]?.updated_at || null,
      bannerUpdatedAt: banners[0]?.updated_at || null,
    };
  } catch (err) {
    console.warn('resolveStorageAssetsForUser error:', err);
    return null;
  }
}

/**
 * Synchronous lookup for a profile by user ID or author name.
 */
export function getProfile(userId, authorName = null) {
  if (userId && profilesCache.has(userId)) {
    return profilesCache.get(userId);
  }
  if (authorName) {
    const norm = normalizeName(authorName);
    const mappedId = nameIndex.get(norm);
    if (mappedId && profilesCache.has(mappedId)) {
      return profilesCache.get(mappedId);
    }
    for (const p of profilesCache.values()) {
      if (normalizeName(p.fullName) === norm) {
        return p;
      }
    }
  }
  return null;
}

/**
 * Synchronously resolve the freshest avatar source for an author.
 * Always returns a valid React Native Image source object or null.
 */
export function resolveUserAvatar(userId, fallbackAvatar = null, authorName = null) {
  const prof = getProfile(userId, authorName);
  if (prof?.avatarUrl && typeof prof.avatarUrl === 'string' && prof.avatarUrl.startsWith('http')) {
    return { uri: prof.avatarUrl };
  }

  // Fallback check
  if (fallbackAvatar) {
    if (typeof fallbackAvatar === 'string' && fallbackAvatar.trim().length > 0) {
      return { uri: fallbackAvatar.trim() };
    }
    if (typeof fallbackAvatar === 'object' && fallbackAvatar.uri) {
      return fallbackAvatar;
    }
    if (typeof fallbackAvatar === 'number') {
      return fallbackAvatar;
    }
  }
  return null;
}

/**
 * Synchronously resolve the freshest banner URL for an author.
 */
export function resolveUserBanner(userId, fallbackBanner = null, authorName = null) {
  const prof = getProfile(userId, authorName);
  if (prof?.bannerUrl && typeof prof.bannerUrl === 'string' && prof.bannerUrl.startsWith('http')) {
    return prof.bannerUrl;
  }

  if (fallbackBanner) {
    if (typeof fallbackBanner === 'string' && fallbackBanner.trim().length > 0) {
      return fallbackBanner.trim();
    }
    if (typeof fallbackBanner === 'object' && fallbackBanner.uri) {
      return fallbackBanner.uri;
    }
  }
  return null;
}

/**
 * Update a profile in local cache and broadcast to all listeners immediately.
 */
export function updateProfileInCache(userId, updates) {
  if (!userId) return null;
  const existing = profilesCache.get(userId) || { id: userId };
  const merged = {
    ...existing,
    ...updates,
    id: userId,
    updatedAt: updates.updatedAt || new Date().toISOString(),
  };

  profilesCache.set(userId, merged);
  if (merged.fullName) {
    nameIndex.set(normalizeName(merged.fullName), userId);
  }

  notifyListeners(userId, merged);
  persistCache();
  return merged;
}

/**
 * Asynchronously fetch and refresh a user's latest profile from Supabase and Storage.
 */
export async function fetchLatestProfile(userId, authorName = null) {
  if (!userId && !authorName) return null;

  try {
    let dbProf = null;
    if (userId && typeof userId === 'string' && userId.length > 10) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      dbProf = data;
    }

    if (!dbProf && authorName) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', authorName)
        .maybeSingle();
      dbProf = data;
    }

    const resolvedUserId = dbProf?.id || userId;
    const storageAssets = resolvedUserId ? await resolveStorageAssetsForUser(resolvedUserId) : null;

    let finalAvatar = dbProf?.avatar_url || null;
    let finalBanner = dbProf?.banner_url || null;

    // If storage has a newer or available file, prioritize it over null/stale db entries
    if (storageAssets?.latestAvatarUrl) {
      if (!finalAvatar || finalAvatar !== storageAssets.latestAvatarUrl) {
        finalAvatar = storageAssets.latestAvatarUrl;
      }
    }
    if (storageAssets?.latestBannerUrl) {
      if (!finalBanner || finalBanner !== storageAssets.latestBannerUrl) {
        finalBanner = storageAssets.latestBannerUrl;
      }
    }

    const profileObj = {
      id: resolvedUserId,
      fullName: dbProf?.full_name || authorName || 'User',
      avatarUrl: finalAvatar,
      bannerUrl: finalBanner,
      vehicle: dbProf?.car_brand ? `${dbProf.car_brand} ${dbProf.car_model || ''}`.trim() : null,
      updatedAt: dbProf?.updated_at || new Date().toISOString(),
    };

    if (resolvedUserId) {
      updateProfileInCache(resolvedUserId, profileObj);
    }
    return profileObj;
  } catch (err) {
    console.warn('fetchLatestProfile error:', err);
    return getProfile(userId, authorName);
  }
}

/**
 * Initialize the profile cache from AsyncStorage and sync with Supabase profiles + storage.
 */
export async function initUserProfileCache() {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Instant load from local storage
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILES_CACHE);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((p) => {
          if (p.id) {
            profilesCache.set(p.id, p);
            if (p.fullName) {
              nameIndex.set(normalizeName(p.fullName), p.id);
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading profiles cache from storage:', e);
  }

  // 2. Fetch all profiles from Supabase in background
  try {
    const { data: profs, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, banner_url, car_brand, car_model, updated_at');

    if (!error && Array.isArray(profs)) {
      for (const pr of profs) {
        if (!pr.id) continue;
        const existing = profilesCache.get(pr.id);

        let finalAvatar = pr.avatar_url || existing?.avatarUrl || null;
        let finalBanner = pr.banner_url || existing?.bannerUrl || null;

        // If banner or avatar is missing or potentially stale, probe storage
        if (!finalBanner || !finalAvatar) {
          const assets = await resolveStorageAssetsForUser(pr.id);
          if (assets?.latestAvatarUrl && !finalAvatar) {
            finalAvatar = assets.latestAvatarUrl;
          }
          if (assets?.latestBannerUrl && !finalBanner) {
            finalBanner = assets.latestBannerUrl;
          }
        }

        const veh = pr.car_brand ? `${pr.car_brand} ${pr.car_model || ''}`.trim() : existing?.vehicle || null;

        const merged = {
          id: pr.id,
          fullName: pr.full_name || existing?.fullName || 'User',
          avatarUrl: finalAvatar,
          bannerUrl: finalBanner,
          vehicle: veh,
          updatedAt: pr.updated_at || existing?.updatedAt || new Date().toISOString(),
        };

        profilesCache.set(pr.id, merged);
        if (merged.fullName) {
          nameIndex.set(normalizeName(merged.fullName), pr.id);
        }
      }
      persistCache();
      notifyListeners(null, null);
    }
  } catch (err) {
    console.warn('Error fetching all profiles from Supabase:', err);
  }

  // 3. Listen to realtime changes on profiles table
  try {
    if (!realtimeSubscription) {
      realtimeSubscription = supabase
        .channel('public_profiles_cache_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            const row = payload.new;
            if (row && row.id) {
              const veh = row.car_brand ? `${row.car_brand} ${row.car_model || ''}`.trim() : null;
              updateProfileInCache(row.id, {
                id: row.id,
                fullName: row.full_name,
                avatarUrl: row.avatar_url,
                bannerUrl: row.banner_url,
                vehicle: veh,
                updatedAt: row.updated_at || new Date().toISOString(),
              });
            }
          }
        )
        .subscribe();
    }
  } catch (realtimeErr) {
    console.warn('Realtime subscription error for profiles cache:', realtimeErr);
  }
}

/**
 * Subscribe to profile updates across the app.
 */
export function subscribeProfileUpdates(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }
  return () => {};
}

/**
 * Auto-healing background sync for the current authenticated user:
 * Synchronizes their latest uploaded storage avatar/banner up to Supabase Postgres tables.
 */
export async function syncCurrentUserProfile(currentUser) {
  if (!currentUser?.id || typeof currentUser.id !== 'string' || currentUser.id.length < 10) {
    return;
  }

  try {
    const userId = currentUser.id;
    const storageAssets = await resolveStorageAssetsForUser(userId);
    const cachedAvatar = await AsyncStorage.getItem(`@werash_user_avatar_${userId}`).catch(() => null);
    const cachedBanner = await AsyncStorage.getItem(`@werash_user_banner_${userId}`).catch(() => null);

    let bestAvatar = storageAssets?.latestAvatarUrl || (cachedAvatar && cachedAvatar.startsWith('http') ? cachedAvatar : null) || currentUser.avatarUrl || currentUser.avatar || null;
    let bestBanner = storageAssets?.latestBannerUrl || (cachedBanner && cachedBanner.startsWith('http') ? cachedBanner : null) || currentUser.bannerUrl || null;

    if (typeof bestAvatar === 'object' && bestAvatar?.uri) {
      bestAvatar = bestAvatar.uri;
    }

    if (bestAvatar || bestBanner) {
      updateProfileInCache(userId, {
        avatarUrl: bestAvatar,
        bannerUrl: bestBanner,
        fullName: currentUser.fullName,
      });

      // Update profiles table in Supabase
      const updates = {
        updated_at: new Date().toISOString(),
      };
      if (bestAvatar && bestAvatar.startsWith('http')) updates.avatar_url = bestAvatar;
      if (bestBanner && bestBanner.startsWith('http')) updates.banner_url = bestBanner;

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .catch(() => {});

      // Sync across all posts by this author
      if (bestAvatar && bestAvatar.startsWith('http')) {
        supabase
          .from('community_posts')
          .update({ author_avatar: bestAvatar })
          .eq('user_id', userId)
          .catch(() => {});

        if (currentUser.fullName) {
          supabase
            .from('community_posts')
            .update({ author_avatar: bestAvatar })
            .eq('author_name', currentUser.fullName)
            .catch(() => {});
        }

        supabase
          .from('community_post_comments')
          .update({ author_avatar: bestAvatar })
          .eq('user_id', userId)
          .catch(() => {});

        if (currentUser.fullName) {
          supabase
            .from('community_post_comments')
            .update({ author_avatar: bestAvatar })
            .eq('author_name', currentUser.fullName)
            .catch(() => {});
        }

        supabase
          .from('conversations')
          .update({ participant_1_avatar: bestAvatar })
          .eq('participant_1', userId)
          .catch(() => {});

        supabase
          .from('conversations')
          .update({ participant_2_avatar: bestAvatar })
          .eq('participant_2', userId)
          .catch(() => {});
      }

      supabase.auth
        .updateUser({
          data: {
            avatar_url: bestAvatar,
            banner_url: bestBanner,
          },
        })
        .catch(() => {});
    }
  } catch (err) {
    console.warn('syncCurrentUserProfile error:', err);
  }
}
